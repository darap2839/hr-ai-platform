"""Validate Keycloak access tokens against trusted, cached signing keys."""
import os
from functools import lru_cache
from typing import Any

import jwt
from fastapi import HTTPException
from jwt import PyJWKClient
from jwt.exceptions import PyJWKClientConnectionError, PyJWTError

KEYCLOAK_URL = os.getenv('KEYCLOAK_URL', 'http://localhost:8080/auth').rstrip('/')
KEYCLOAK_REALM = os.getenv('KEYCLOAK_REALM', 'hr-ai')
KEYCLOAK_CLIENT_ID = os.getenv('KEYCLOAK_CLIENT_ID', 'hr-ai-frontend')
APP_BASE_URL = os.getenv('APP_BASE_URL', 'http://localhost:80')


@lru_cache(maxsize=8)
def _jwks_client(url: str) -> PyJWKClient:
    """Cache the trusted realm JWKS with bounded network time and rotation refresh."""
    return PyJWKClient(url, cache_jwk_set=True, lifespan=300, timeout=5)


def verify_keycloak_token(token: str) -> dict[str, Any]:
    """Require a signed, current Bearer token issued for the configured client.

    KEYCLOAK_URL is the external issuer base; KEYCLOAK_INTERNAL_URL is used only
    to fetch keys over the container network. Never discover keys from token data.
    Existing realm access tokens use azp for client binding. When a dedicated API
    audience is configured, validate that audience as well.
    """
    external = os.getenv('KEYCLOAK_URL', KEYCLOAK_URL).rstrip('/')
    realm = os.getenv('KEYCLOAK_REALM', KEYCLOAK_REALM)
    client_id = os.getenv('KEYCLOAK_CLIENT_ID', KEYCLOAK_CLIENT_ID)
    issuer = os.getenv('KEYCLOAK_ISSUER', external + '/realms/' + realm)
    internal = os.getenv('KEYCLOAK_INTERNAL_URL', 'http://keycloak:8080/auth').rstrip('/')
    keys_url = os.getenv('KEYCLOAK_JWKS_URL', internal + '/realms/' + realm + '/protocol/openid-connect/certs')
    audience = os.getenv('KEYCLOAK_AUDIENCE') or None
    try:
        if not token or len(token) > 16384 or jwt.get_unverified_header(token).get('alg') != 'RS256':
            raise jwt.InvalidTokenError('Unsupported token')
        key = _jwks_client(keys_url).get_signing_key_from_jwt(token).key
        claims = jwt.decode(token, key, algorithms=['RS256'], issuer=issuer,
                            audience=audience, options={
                                'require': ['exp', 'iat', 'iss', 'sub', 'azp', 'typ'],
                                'verify_aud': bool(audience),
                            })
        if claims['typ'] != 'Bearer' or claims['azp'] != client_id or not isinstance(claims['sub'], str) or not claims['sub']:
            raise jwt.InvalidTokenError('Not a client access token')
        return claims
    except PyJWKClientConnectionError as error:
        raise HTTPException(503, 'Authentication service unavailable') from error
    except (PyJWTError, ValueError, TypeError) as error:
        raise HTTPException(401, 'Invalid or expired access token', headers={'WWW-Authenticate': 'Bearer'}) from error


def extract_user_from_token(token: str) -> dict[str, Any]:
    """Map only verified identity claims to the user representation."""
    payload = verify_keycloak_token(token)
    return {
        'id': payload['sub'],
        'username': payload.get('preferred_username'),
        'email': payload.get('email'),
        'name': payload.get('name') or ' '.join(filter(None, [payload.get('given_name'), payload.get('family_name')])),
        'roles': payload.get('roles', []),
        'realm_access': payload.get('realm_access', {}),
        'resource_access': payload.get('resource_access', {}),
    }
