"""Vector storage service for PostgreSQL pgvector using Supabase service-role client.

Provides batch insertion of document chunk embeddings and removal of chunks.
"""

import logging
from typing import Any, Dict, List

from app.core.supabase import get_supabase_client

logger = logging.getLogger(__name__)

# Batch size for chunk insertion into PostgreSQL
INSERT_BATCH_SIZE = 100


class VectorStoreError(Exception):
    """Exception raised for vector store operations."""

    pass


def save_chunks(
    document_id: str,
    user_id: str,
    chunks_with_embeddings: List[Dict[str, Any]],
) -> int:
    """Insert chunk records with embeddings into the chunks table in batches.

    Args:
        document_id: UUID of the parent document.
        user_id: UUID of the document owner.
        chunks_with_embeddings: List of dicts containing 'content', 'page_number',
                                'chunk_index', and 'embedding'.

    Returns:
        Number of inserted chunks.
    """
    if not chunks_with_embeddings:
        return 0

    supabase = get_supabase_client()
    total_inserted = 0

    try:
        for i in range(0, len(chunks_with_embeddings), INSERT_BATCH_SIZE):
            batch = chunks_with_embeddings[i : i + INSERT_BATCH_SIZE]
            rows = [
                {
                    "document_id": document_id,
                    "user_id": user_id,
                    "content": chunk["content"],
                    "page_number": chunk.get("page_number", 1),
                    "chunk_index": chunk.get("chunk_index", 0),
                    "embedding": chunk["embedding"],
                }
                for chunk in batch
            ]

            supabase.table("chunks").insert(rows).execute()
            total_inserted += len(rows)

        logger.info(
            "Successfully saved %d chunks for document '%s'",
            total_inserted,
            document_id,
        )
        return total_inserted

    except Exception as exc:
        logger.error(
            "Failed to save chunks for document '%s': %s",
            document_id,
            exc,
        )
        raise VectorStoreError(f"Failed to save document chunks into vector database: {exc}") from exc


def delete_chunks(document_id: str) -> None:
    """Delete all existing chunks for a document from the chunks table."""
    supabase = get_supabase_client()
    try:
        supabase.table("chunks").delete().eq("document_id", document_id).execute()
        logger.info("Deleted existing chunks for document '%s'", document_id)
    except Exception as exc:
        logger.error(
            "Failed to delete chunks for document '%s': %s",
            document_id,
            exc,
        )
        raise VectorStoreError(f"Failed to delete existing chunks: {exc}") from exc
