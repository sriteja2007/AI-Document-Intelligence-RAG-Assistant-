"""Pydantic models for Document resources."""

from typing import Optional
from pydantic import BaseModel, ConfigDict


class DocumentResponse(BaseModel):
    """Document representation returned to clients."""

    id: str
    user_id: str
    name: str
    storage_path: str
    file_type: str
    file_size: int
    status: str
    error_message: Optional[str] = None
    page_count: int = 0
    created_at: str

    model_config = ConfigDict(from_attributes=True)


class DocumentDeleteResponse(BaseModel):
    """Response returned upon successful document deletion."""

    message: str
    id: str
