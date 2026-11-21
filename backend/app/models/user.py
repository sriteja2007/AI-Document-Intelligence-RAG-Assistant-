from typing import Optional
from pydantic import BaseModel, ConfigDict


class UserResponse(BaseModel):
    """User response model representing the authenticated user."""

    id: str
    email: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
