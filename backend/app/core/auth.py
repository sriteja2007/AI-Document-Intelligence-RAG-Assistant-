from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from supabase import Client, create_client

from app.core.config import settings
from app.core.supabase import get_supabase_client
from app.models.user import UserResponse

# HTTPBearer scheme configured not to raise automatic 403 on missing credentials,
# allowing us to return an explicit 401 Unauthorized per project requirements.
security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> UserResponse:
    """FastAPI dependency to extract and verify the Supabase JWT Bearer token.

    Verifies the token via:
      1. Local HS256 JWT signature verification using SUPABASE_JWT_SECRET.
      2. If local verification fails (e.g. newer asymmetric ES256/RS256 keys),
         verifies with Supabase Auth API using get_user(token).

    Returns UserResponse with user ID and email.
    Raises 401 Unauthorized for missing, invalid, or expired tokens.
    """
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials.strip()
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Empty Authorization token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 1. Attempt local symmetric verification with SUPABASE_JWT_SECRET (HS256)
    if settings.SUPABASE_JWT_SECRET:
        try:
            payload = jwt.decode(
                token,
                settings.SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                options={"verify_aud": False},
            )
            user_id: Optional[str] = payload.get("sub")
            if user_id:
                return UserResponse(
                    id=user_id,
                    email=payload.get("email"),
                )
        except JWTError:
            # Fall through to Supabase Auth API verification
            pass
        except Exception:
            pass

    # 2. Asymmetric signing or JWKS fallback: verify via Supabase Auth API
    try:
        supabase = get_supabase_client()
        user_response = supabase.auth.get_user(token)
        if user_response and user_response.user:
            return UserResponse(
                id=user_response.user.id,
                email=user_response.user.email,
            )
    except Exception:
        pass

    # If neither method succeeded, the token is invalid or expired
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired authentication token",
        headers={"WWW-Authenticate": "Bearer"},
    )
