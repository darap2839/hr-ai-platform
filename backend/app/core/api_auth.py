"""Authenticate protected HTTP routes before database or file operations."""
from fastapi import HTTPException
from starlette.concurrency import run_in_threadpool
from starlette.requests import Request
from starlette.responses import JSONResponse

from app.core.keycloak_auth import extract_user_from_token

PUBLIC_PATHS = frozenset({
    '/api/auth/keycloak-config', '/api/auth/login-url',
    '/api/oidc/login-url', '/api/oidc/callback',
})


class APIAuthenticationMiddleware:
    """Fail closed for all API routes; keep only explicit login bootstrap public."""

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope['type'] != 'http':
            return await self.app(scope, receive, send)
        path = scope['path'].rstrip('/') or '/'
        protected = (path == '/api' or path.startswith('/api/') or path.startswith('/sse/')) and path not in PUBLIC_PATHS
        if not protected or scope['method'] == 'OPTIONS':
            return await self.app(scope, receive, send)
        request = Request(scope, receive)
        authorization = request.headers.get('authorization', '')
        parts = authorization.split()
        token = parts[1] if len(parts) == 2 and parts[0].lower() == 'bearer' else None
        # Legacy EventSource cannot send Authorization. Accept its token only on
        # this exact streaming endpoint, never on CRUD or ordinary API routes.
        if not authorization and path == '/api/sse/notifications':
            token = request.query_params.get('token')
        try:
            if not token:
                raise HTTPException(401, 'Authentication required', headers={'WWW-Authenticate': 'Bearer'})
            user = await run_in_threadpool(extract_user_from_token, token)
            scope.setdefault('state', {})['user'] = user
        except HTTPException as error:
            response = JSONResponse({'detail': error.detail}, status_code=error.status_code,
                                    headers={**(error.headers or {}), 'Cache-Control': 'no-store'})
            return await response(scope, receive, send)

        async def private_send(message):
            if message['type'] == 'http.response.start':
                headers = [(k, v) for k, v in message.get('headers', []) if k.lower() not in {b'cache-control', b'pragma'}]
                message['headers'] = headers + [(b'cache-control', b'private, no-store'), (b'pragma', b'no-cache')]
            await send(message)
        return await self.app(scope, receive, private_send)
