"""Documents API Router.

Handles document upload, retrieval, and deletion with strict content validation,
secure Supabase Storage management, and database record keeping.
"""

import os
import re
import uuid
from typing import List

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    File,
    HTTPException,
    UploadFile,
    status,
)

from app.core.auth import get_current_user
from app.core.supabase import get_supabase_client
from app.models.document import DocumentDeleteResponse, DocumentResponse
from app.models.user import UserResponse
from app.services.pipeline import process_document

router = APIRouter(prefix="/documents", tags=["Documents"])

# Maximum allowed upload size: 20 MB
MAX_FILE_SIZE = 20 * 1024 * 1024

# Supported extensions and their MIME types
SUPPORTED_EXTENSIONS = {
    ".pdf": "application/pdf",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".txt": "text/plain",
}


def sanitize_filename(filename: str) -> str:
    """Sanitize the uploaded filename to prevent directory traversal and dangerous characters."""
    base = os.path.basename(filename)
    name, ext = os.path.splitext(base)
    # Replace non-alphanumeric (except hyphens and underscores) with underscore
    clean_name = re.sub(r"[^\w\-]", "_", name).strip("._")
    if not clean_name:
        clean_name = "document"
    clean_name = clean_name[:80]  # truncate to sensible length
    return f"{clean_name}{ext.lower()}"


def validate_file_content(file_bytes: bytes, extension: str) -> None:
    """Verify the real file content against its claimed extension via magic bytes inspection.

    Raises HTTPException 400 with a friendly message if content is invalid.
    """
    if extension == ".pdf":
        # PDFs must begin with %PDF
        if not file_bytes.startswith(b"%PDF"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid PDF file. The file content does not match a valid PDF document.",
            )
    elif extension == ".docx":
        # DOCX files are OpenXML ZIP packages starting with PK\x03\x04
        if not (file_bytes.startswith(b"PK\x03\x04") or file_bytes.startswith(b"PK")):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid DOCX file. The file content does not match a valid Microsoft Word document.",
            )
    elif extension == ".txt":
        # TXT files should be decodable text and should not contain binary null bytes
        if b"\x00" in file_bytes[:1024]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid TXT file. The file appears to contain binary data rather than plain text.",
            )
        try:
            # Check if at least the beginning can be decoded as UTF-8 or Latin-1
            file_bytes[:4096].decode("utf-8")
        except UnicodeDecodeError:
            try:
                file_bytes[:4096].decode("latin-1")
            except Exception:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid TXT file. Could not decode text content.",
                )


@router.post(
    "/upload",
    response_model=DocumentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a new document",
)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: UserResponse = Depends(get_current_user),
) -> DocumentResponse:
    """Upload a PDF, DOCX, or TXT document (max 20 MB).

    Performs deep content validation, stores the raw file in private Supabase Storage,
    creates a document record in PostgreSQL, and queues background processing.
    """
    original_filename = file.filename or "uploaded_document"
    _, ext = os.path.splitext(original_filename)
    ext = ext.lower().strip()

    # 1. Validate file extension
    if ext not in SUPPORTED_EXTENSIONS:
        supported_list = ", ".join(SUPPORTED_EXTENSIONS.keys())
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{ext}'. Only {supported_list} documents are supported.",
        )

    # 2. Read file content
    try:
        file_bytes = await file.read()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to read uploaded file: {str(e)}",
        )

    file_size = len(file_bytes)

    # 3. Validate file size and non-emptiness
    if file_size == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file is empty. Please select a valid document.",
        )

    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File size exceeds the 20 MB limit. Please upload a smaller file.",
        )

    # 4. Deep content validation (magic bytes inspection)
    validate_file_content(file_bytes, ext)

    # 5. Sanitize filename and create unique storage path
    clean_name = sanitize_filename(original_filename)
    file_uuid = uuid.uuid4().hex
    storage_path = f"{current_user.id}/{file_uuid}_{clean_name}"
    content_type = SUPPORTED_EXTENSIONS[ext]

    supabase = get_supabase_client()

    # 6. Upload file to Supabase Storage bucket 'documents'
    try:
        supabase.storage.from_("documents").upload(
            path=storage_path,
            file=file_bytes,
            file_options={"content-type": content_type},
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload file to storage: {str(e)}",
        )

    # 7. Insert record into PostgreSQL 'documents' table
    try:
        doc_record = {
            "user_id": current_user.id,
            "name": original_filename,
            "storage_path": storage_path,
            "file_type": ext.lstrip("."),
            "file_size": file_size,
            "status": "processing",
            "page_count": 0,
        }
        db_res = supabase.table("documents").insert(doc_record).execute()
        if not db_res.data or len(db_res.data) == 0:
            raise RuntimeError("Database returned empty record after insert.")

        created_document = db_res.data[0]
    except Exception as e:
        # Rollback: delete the uploaded file from storage so no orphaned files remain
        try:
            supabase.storage.from_("documents").remove([storage_path])
        except Exception:
            pass

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to record document metadata in database: {str(e)}",
        )

    # 8. Trigger background processing task stub
    background_tasks.add_task(process_document, created_document["id"])

    # 9. Return the new document record
    return DocumentResponse(
        id=str(created_document["id"]),
        user_id=str(created_document["user_id"]),
        name=created_document["name"],
        storage_path=created_document["storage_path"],
        file_type=created_document["file_type"],
        file_size=created_document["file_size"],
        status=created_document["status"],
        error_message=created_document.get("error_message"),
        page_count=created_document.get("page_count", 0),
        created_at=str(created_document["created_at"]),
    )


@router.get(
    "",
    response_model=List[DocumentResponse],
    summary="List all documents for the authenticated user",
)
def list_documents(
    current_user: UserResponse = Depends(get_current_user),
) -> List[DocumentResponse]:
    """Retrieve all documents belonging to the authenticated user, ordered newest first."""
    supabase = get_supabase_client()
    try:
        res = (
            supabase.table("documents")
            .select("*")
            .eq("user_id", current_user.id)
            .order("created_at", desc=True)
            .execute()
        )
        return [
            DocumentResponse(
                id=str(item["id"]),
                user_id=str(item["user_id"]),
                name=item["name"],
                storage_path=item["storage_path"],
                file_type=item["file_type"],
                file_size=item["file_size"],
                status=item["status"],
                error_message=item.get("error_message"),
                page_count=item.get("page_count", 0),
                created_at=str(item["created_at"]),
            )
            for item in res.data
        ]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve documents: {str(e)}",
        )


@router.get(
    "/{document_id}",
    response_model=DocumentResponse,
    summary="Get document details by ID",
)
def get_document(
    document_id: str,
    current_user: UserResponse = Depends(get_current_user),
) -> DocumentResponse:
    """Retrieve details for a single document owned by the authenticated user."""
    supabase = get_supabase_client()
    try:
        res = (
            supabase.table("documents")
            .select("*")
            .eq("id", document_id)
            .eq("user_id", current_user.id)
            .execute()
        )
        if not res.data or len(res.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found.",
            )

        item = res.data[0]
        return DocumentResponse(
            id=str(item["id"]),
            user_id=str(item["user_id"]),
            name=item["name"],
            storage_path=item["storage_path"],
            file_type=item["file_type"],
            file_size=item["file_size"],
            status=item["status"],
            error_message=item.get("error_message"),
            page_count=item.get("page_count", 0),
            created_at=str(item["created_at"]),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve document: {str(e)}",
        )


@router.delete(
    "/{document_id}",
    response_model=DocumentDeleteResponse,
    summary="Delete a document and its storage file",
)
def delete_document(
    document_id: str,
    current_user: UserResponse = Depends(get_current_user),
) -> DocumentDeleteResponse:
    """Delete a document owned by the authenticated user from storage and database."""
    supabase = get_supabase_client()

    # 1. Fetch document to verify ownership and obtain storage path
    try:
        res = (
            supabase.table("documents")
            .select("*")
            .eq("id", document_id)
            .eq("user_id", current_user.id)
            .execute()
        )
        if not res.data or len(res.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found.",
            )
        doc = res.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to find document for deletion: {str(e)}",
        )

    # 2. Delete file from Supabase Storage
    storage_path = doc.get("storage_path")
    if storage_path:
        try:
            supabase.storage.from_("documents").remove([storage_path])
        except Exception:
            # Continue with database deletion even if storage remove returned warning
            pass

    # 3. Delete row from documents table (foreign keys cascade to chunks automatically)
    try:
        supabase.table("documents").delete().eq("id", document_id).eq("user_id", current_user.id).execute()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete document record: {str(e)}",
        )

    return DocumentDeleteResponse(
        message=f"Document '{doc['name']}' deleted successfully.",
        id=document_id,
    )


@router.post(
    "/{document_id}/reprocess",
    response_model=DocumentResponse,
    summary="Reprocess a failed document",
)
def reprocess_document(
    document_id: str,
    background_tasks: BackgroundTasks,
    current_user: UserResponse = Depends(get_current_user),
) -> DocumentResponse:
    """Reprocess a failed document in the background.

    Only accessible by the document owner and only when document status is 'failed'.
    """
    supabase = get_supabase_client()

    try:
        res = (
            supabase.table("documents")
            .select("*")
            .eq("id", document_id)
            .eq("user_id", current_user.id)
            .execute()
        )
        if not res.data or len(res.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found.",
            )
        doc = res.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch document: {str(e)}",
        )

    if doc.get("status") != "failed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only failed documents can be reprocessed.",
        )

    # Reset status to 'processing' and clear error_message
    try:
        update_res = (
            supabase.table("documents")
            .update({"status": "processing", "error_message": None})
            .eq("id", document_id)
            .eq("user_id", current_user.id)
            .execute()
        )
        if not update_res.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update document status for reprocessing.",
            )
        updated_doc = update_res.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to reset document status: {str(e)}",
        )

    # Enqueue background pipeline task
    background_tasks.add_task(process_document, document_id)

    return DocumentResponse(**updated_doc)
