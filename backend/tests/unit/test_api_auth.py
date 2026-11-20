"""Real signature validation and authentication before HTTP side effects."""
import time
from types import SimpleNamespace
from unittest.mock import Mock
import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric import rsa
from fastapi import FastAPI, HTTPException, Request
from fastapi.testclient import TestClient
from jwt.exceptions import PyJWKClientConnectionError
from app.core import keycloak_auth
from app.core.api_auth import APIAuthenticationMiddleware

@pytest.fixture
def signing(monkeypatch):
    private = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    client = Mock()
    client.get_signing_key_from_jwt.return_value = SimpleNamespace(key=private.public_key())
    monkeypatch.setattr(keycloak_auth, '_jwks_client', lambda url: client)
    monkeypatch.setenv('KEYCLOAK_URL', 'http://localhost/auth')
    monkeypatch.setenv('KEYCLOAK_REALM', 'platform')
    monkeypatch.setenv('KEYCLOAK_CLIENT_ID', 'platform')
    monkeypatch.delenv('KEYCLOAK_ISSUER', raising=False)
    monkeypatch.delenv('KEYCLOAK_AUDIENCE', raising=False)
    def token(**changes):
        claims = dict(iss='http://localhost/auth/realms/platform', sub='test-user',
                      iat=int(time.time())-1, exp=int(time.time())+120,
                      azp='platform', typ='Bearer', aud='account', preferred_username='engineer')
        claims.update(changes)
        return jwt.encode(claims, private, algorithm='RS256', headers={'kid': 'test-key'})
    return private, client, token

@pytest.fixture
def protected_app():
    app = FastAPI()
    calls = []
    def handler(request: Request):
        calls.append(request.url.path)
        return {'subject': request.state.user['id']}
    for path in ['/api/vacancies', '/api/candidates', '/api/documents', '/api/ai/chat', '/api/sse/stats', '/api/sse/notifications']:
        app.add_api_route(path, handler, methods=['GET', 'POST', 'DELETE'])
    @app.get('/api/auth/keycloak-config')
    def config(): return {'clientId': 'platform'}
    @app.get('/health')
    def health(): return {'status': 'ok'}
    app.add_middleware(APIAuthenticationMiddleware)
    return TestClient(app), calls

def test_valid_keycloak_access_token(signing):
    assert keycloak_auth.verify_keycloak_token(signing[2]())['sub'] == 'test-user'

@pytest.mark.parametrize('changes', [{'exp':1}, {'iss':'http://attacker'}, {'azp':'other'}, {'typ':'ID'}, {'sub':''}, {'iat':int(time.time())+3600}])
def test_rejects_invalid_claims(signing, changes):
    with pytest.raises(HTTPException) as error: keycloak_auth.verify_keycloak_token(signing[2](**changes))
    assert error.value.status_code == 401

def test_rejects_forgery_and_missing_expiration(signing):
    private, _, token = signing
    claims = jwt.decode(token(), options={'verify_signature': False})
    other = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    with pytest.raises(HTTPException): keycloak_auth.verify_keycloak_token(jwt.encode(claims, other, algorithm='RS256'))
    del claims['exp']
    with pytest.raises(HTTPException): keycloak_auth.verify_keycloak_token(jwt.encode(claims, private, algorithm='RS256'))

def test_no_secret_fallback_when_keycloak_is_offline(signing):
    _, client, token = signing
    client.get_signing_key_from_jwt.side_effect = PyJWKClientConnectionError('offline')
    with pytest.raises(HTTPException) as error: keycloak_auth.verify_keycloak_token(token())
    assert error.value.status_code == 503
    with pytest.raises(HTTPException) as error: keycloak_auth.verify_keycloak_token(jwt.encode({'sub':'admin'}, 'dev-secret'*4, algorithm='HS256'))
    assert error.value.status_code == 401

def test_dedicated_audience_when_configured(signing, monkeypatch):
    monkeypatch.setenv('KEYCLOAK_AUDIENCE', 'hr-api')
    with pytest.raises(HTTPException): keycloak_auth.verify_keycloak_token(signing[2]())
    assert keycloak_auth.verify_keycloak_token(signing[2](aud='hr-api'))['sub'] == 'test-user'

@pytest.mark.parametrize('path', ['/api/vacancies', '/api/candidates', '/api/documents', '/api/ai/chat', '/api/sse/stats'])
@pytest.mark.parametrize('method', ['GET','POST','DELETE'])
def test_anonymous_requests_never_reach_handlers(protected_app, path, method):
    client, calls = protected_app
    response = client.request(method, path+'?user_login=admin&token=fake')
    assert response.status_code == 401
    assert response.headers['www-authenticate'] == 'Bearer'
    assert not calls

def test_verified_identity_and_private_cache(signing, protected_app):
    client, calls = protected_app
    response = client.get('/api/candidates', headers={'Authorization':'Bearer '+signing[2]()})
    assert response.status_code == 200
    assert response.json() == {'subject':'test-user'}
    assert response.headers['cache-control'] == 'private, no-store'
    assert calls == ['/api/candidates']

def test_stream_compatibility_and_public_bootstrap(signing, protected_app):
    client, _ = protected_app
    assert client.get('/health').status_code == 200
    assert client.get('/api/auth/keycloak-config').status_code == 200
    assert client.get('/api/sse/notifications').status_code == 401
    assert client.get('/api/sse/notifications', params={'token':signing[2]()} ).status_code == 200

def test_explicit_local_public_port_matches_issuer(signing, monkeypatch):
    monkeypatch.setenv('KEYCLOAK_URL', 'http://127.0.0.1:18080/auth')
    token = signing[2](iss='http://127.0.0.1:18080/auth/realms/platform')
    assert keycloak_auth.verify_keycloak_token(token)['sub'] == 'test-user'
