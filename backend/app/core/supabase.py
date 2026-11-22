"""Supabase Service-Role Client Helper.

Initializes and provides the admin-level Supabase client for server operations
(storage bucket uploads, database operations, user management).
"""

from typing import Optional
from fastapi import HTTPException, status
from supabase import Client, create_client
from supabase.client import ClientOptions

from app.core.config import settings

_supabase_admin_client: Optional[Client] = None


def get_supabase_client() -> Client:
    """Return the singleton Supabase admin client initialized with service role key.

    Raises HTTPException 500 if SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY are missing.
    """
    global _supabase_admin_client
    if _supabase_admin_client is None:
        if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Supabase credentials are not configured in backend/.env",
            )
        _supabase_admin_client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_SERVICE_ROLE_KEY,
            options=ClientOptions(
                postgrest_client_timeout=40,
                storage_client_timeout=40,
                postgrest_client_retry=True,
            ),
        )
    return _supabase_admin_client
