from fastapi import APIRouter, Depends

from app.core.auth import get_current_user
from app.models.user import UserResponse

router = APIRouter(tags=["Users"])


@router.get("/me", response_model=UserResponse)
def get_me(current_user: UserResponse = Depends(get_current_user)) -> UserResponse:
    """Return the currently authenticated user's ID and email."""
    return current_user
