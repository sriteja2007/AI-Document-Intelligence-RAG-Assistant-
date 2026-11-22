"""Document ingestion and processing pipeline service.

Executes the complete end-to-end processing lifecycle for an uploaded document:
1. Loads document metadata from database.
2. Downloads file from Supabase Storage.
3. Extracts text and virtual pages across PDF, DOCX, and TXT.
4. Cleans text and strips repeated headers, footers, and page numbers.
5. Generates semantic chunks with page boundaries and token overlap.
6. Enforces safety limits (< 2000 chunks max).
7. Generates 768-dimensional normalized vector embeddings via Gemini API.
8. Cleans up existing chunks (preventing duplicates upon reprocessing).
9. Persists new chunks with embeddings into pgvector.
10. Updates document status to 'ready' (or 'failed' with friendly error on failure).
"""

import logging

from app.core.supabase import get_supabase_client
from app.services.chunking import chunk_pages
from app.services.cleaning import remove_repeated_headers_footers
from app.services.embeddings import EmbeddingError, embed_documents
from app.services.extraction import ExtractionError, extract_pages
from app.services.vector_store import delete_chunks, save_chunks

logger = logging.getLogger(__name__)

SCANNED_ERROR_MESSAGE = (
    "This file has no readable text. It may be a scanned document. Please upload a text-based PDF."
)
MAX_CHUNKS_LIMIT = 2000


def process_document(document_id: str) -> None:
    """Process an uploaded document through the complete RAG ingestion pipeline."""
    logger.info("Starting processing pipeline for document '%s'", document_id)
    supabase = get_supabase_client()

    user_id = None
    page_count = 0

    try:
        # 1. Retrieve document metadata
        response = (
            supabase.table("documents").select("*").eq("id", document_id).execute()
        )
        if not response.data:
            logger.warning("Document '%s' not found in database", document_id)
            return

        doc = response.data[0]
        user_id = doc.get("user_id")
        storage_path = doc.get("storage_path")
        file_type = doc.get("file_type") or ""

        if not storage_path or not user_id:
            logger.error("Document '%s' is missing storage_path or user_id", document_id)
            supabase.table("documents").update(
                {
                    "status": "failed",
                    "error_message": "Missing storage path or user identity for document.",
                }
            ).eq("id", document_id).execute()
            return

        # 2. Download file from storage
        try:
            file_bytes = supabase.storage.from_("documents").download(storage_path)
        except Exception as dl_err:
            logger.error(
                "Failed to download document '%s' at '%s': %s",
                document_id,
                storage_path,
                dl_err,
            )
            supabase.table("documents").update(
                {
                    "status": "failed",
                    "error_message": "Failed to download file from storage. Please re-upload.",
                }
            ).eq("id", document_id).execute()
            return

        # 3. Extract text pages
        try:
            pages = extract_pages(file_bytes, file_type)
        except ExtractionError as ext_err:
            logger.warning("Extraction error for document '%s': %s", document_id, ext_err)
            supabase.table("documents").update(
                {
                    "status": "failed",
                    "error_message": str(ext_err),
                }
            ).eq("id", document_id).execute()
            return

        page_count = len(pages)

        # 4. Check for unreadable / scanned document
        raw_text_len = sum(len(p.text.strip()) for p in pages)
        if raw_text_len < 50:
            logger.warning(
                "Document '%s' has insufficient text (%d characters)",
                document_id,
                raw_text_len,
            )
            supabase.table("documents").update(
                {
                    "status": "failed",
                    "page_count": page_count,
                    "error_message": SCANNED_ERROR_MESSAGE,
                }
            ).eq("id", document_id).execute()
            return

        # 5. Clean text and deduplicate headers/footers
        pages = remove_repeated_headers_footers(pages)
        cleaned_text_len = sum(len(p.text.strip()) for p in pages)
        if cleaned_text_len < 50:
            logger.warning(
                "Document '%s' has insufficient text after cleaning (%d characters)",
                document_id,
                cleaned_text_len,
            )
            supabase.table("documents").update(
                {
                    "status": "failed",
                    "page_count": page_count,
                    "error_message": SCANNED_ERROR_MESSAGE,
                }
            ).eq("id", document_id).execute()
            return

        # 6. Semantic chunking
        chunks = chunk_pages(pages)
        if not chunks:
            logger.warning("Document '%s' produced no chunks", document_id)
            supabase.table("documents").update(
                {
                    "status": "failed",
                    "page_count": page_count,
                    "error_message": SCANNED_ERROR_MESSAGE,
                }
            ).eq("id", document_id).execute()
            return

        # 7. Safety limit: max 2000 chunks
        if len(chunks) > MAX_CHUNKS_LIMIT:
            logger.warning(
                "Document '%s' exceeded chunk limit (%d > %d)",
                document_id,
                len(chunks),
                MAX_CHUNKS_LIMIT,
            )
            supabase.table("documents").update(
                {
                    "status": "failed",
                    "page_count": page_count,
                    "error_message": "This document is too large to process (exceeds 2,000 chunks). Please upload a smaller document.",
                }
            ).eq("id", document_id).execute()
            return

        # 8. Generate embeddings for all chunks
        chunk_texts = [c.content for c in chunks]
        try:
            embeddings = embed_documents(chunk_texts)
        except EmbeddingError as emb_err:
            logger.warning("Embedding error for document '%s': %s", document_id, emb_err)
            delete_chunks(document_id)
            supabase.table("documents").update(
                {
                    "status": "failed",
                    "page_count": page_count,
                    "error_message": str(emb_err),
                }
            ).eq("id", document_id).execute()
            return

        # 9. Clean up any existing chunks (guarantees idempotent reprocessing)
        delete_chunks(document_id)

        # 10. Save new chunks with embeddings into PostgreSQL
        chunks_with_embeddings = [
            {
                "content": c.content,
                "page_number": c.page_number,
                "chunk_index": c.chunk_index,
                "embedding": emb,
            }
            for c, emb in zip(chunks, embeddings)
        ]
        save_chunks(document_id, user_id, chunks_with_embeddings)

        # 11. Mark document as 'ready'
        supabase.table("documents").update(
            {
                "status": "ready",
                "page_count": page_count,
                "error_message": None,
            }
        ).eq("id", document_id).execute()

        logger.info(
            "Document '%s' processed successfully: %d page(s), %d chunk(s) stored. Status set to 'ready'.",
            document_id,
            page_count,
            len(chunks),
        )

    except Exception as exc:
        logger.exception("Unexpected error processing document '%s': %s", document_id, exc)
        # Never leave partial chunks or stuck 'processing' status
        try:
            delete_chunks(document_id)
        except Exception as cleanup_err:
            logger.error("Failed to clean up chunks on error for '%s': %s", document_id, cleanup_err)

        try:
            friendly_msg = "Could not process this file. Please try again later."
            supabase.table("documents").update(
                {
                    "status": "failed",
                    "page_count": page_count,
                    "error_message": friendly_msg,
                }
            ).eq("id", document_id).execute()
        except Exception as db_err:
            logger.error("Failed to set failure status for document '%s': %s", document_id, db_err)
