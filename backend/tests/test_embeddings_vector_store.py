"""Automated unit tests for embeddings, vector storage, and processing pipeline."""

import math
from unittest.mock import MagicMock, patch
import pytest

from app.core.config import settings
from app.services.embeddings import (
    EmbeddingError,
    embed_documents,
    embed_query,
    normalize_vector,
)
from app.services.pipeline import MAX_CHUNKS_LIMIT, process_document
from app.services.vector_store import delete_chunks, save_chunks


def _create_mock_embedding(dim: int = 768) -> list[float]:
    """Create a sample 768-dimensional unnormalized vector."""
    return [0.1 * (i % 10 + 1) for i in range(dim)]


class TestEmbeddings:
    """Unit tests for the Gemini embeddings service."""

    def test_normalize_vector(self):
        """Vector normalization yields unit length (L2 norm = 1.0)."""
        raw_vec = [3.0, 4.0]
        norm_vec = normalize_vector(raw_vec)
        assert len(norm_vec) == 2
        assert pytest.approx(math.sqrt(sum(x * x for x in norm_vec)), abs=1e-5) == 1.0

        zero_vec = [0.0, 0.0, 0.0]
        assert normalize_vector(zero_vec) == [0.0, 0.0, 0.0]

    @patch("app.services.embeddings._get_client")
    def test_embed_documents_dimension_and_normalization(self, mock_get_client):
        """Generated embeddings must always have exactly 768 dimensions and unit norm."""
        mock_client = MagicMock()
        mock_get_client.return_value = mock_client

        mock_resp = MagicMock()
        mock_embedding_obj = MagicMock()
        mock_embedding_obj.values = _create_mock_embedding(768)
        mock_resp.embeddings = [mock_embedding_obj]
        mock_client.models.embed_content.return_value = mock_resp

        vectors = embed_documents(["Sample document chunk"])
        assert len(vectors) == 1
        assert len(vectors[0]) == 768

        # Verify unit normalization
        norm = math.sqrt(sum(x * x for x in vectors[0]))
        assert pytest.approx(norm, abs=1e-5) == 1.0

    @patch("app.services.embeddings._get_client")
    def test_embed_documents_empty_texts_and_batch_handling(self, mock_get_client):
        """Empty or whitespace-only texts are safely assigned zero vectors without API failure.

        Output list length strictly matches input list length.
        """
        mock_client = MagicMock()
        mock_get_client.return_value = mock_client

        mock_resp = MagicMock()
        mock_embedding_obj = MagicMock()
        mock_embedding_obj.values = _create_mock_embedding(768)
        mock_resp.embeddings = [mock_embedding_obj, mock_embedding_obj]
        mock_client.models.embed_content.return_value = mock_resp

        input_texts = ["First valid chunk", "", "   ", "Second valid chunk", ""]
        vectors = embed_documents(input_texts)

        # Output length must match input length
        assert len(vectors) == len(input_texts)

        # Non-empty items receive 768-dim normalized vectors
        assert len(vectors[0]) == 768
        assert pytest.approx(math.sqrt(sum(x * x for x in vectors[0])), abs=1e-5) == 1.0
        assert len(vectors[3]) == 768
        assert pytest.approx(math.sqrt(sum(x * x for x in vectors[3])), abs=1e-5) == 1.0

        # Empty items receive 768-dim zero vectors
        assert vectors[1] == [0.0] * 768
        assert vectors[2] == [0.0] * 768
        assert vectors[4] == [0.0] * 768

        # Only the 2 valid texts were sent to the AI service
        call_args = mock_client.models.embed_content.call_args
        assert call_args is not None
        _, kwargs = call_args
        assert kwargs["contents"] == ["First valid chunk", "Second valid chunk"]

    @patch("app.services.embeddings.time.sleep")
    @patch("app.services.embeddings._get_client")
    def test_embed_retry_on_temporary_error(self, mock_get_client, mock_sleep):
        """Temporary 429 rate limit errors trigger automatic retry and succeed."""
        mock_client = MagicMock()
        mock_get_client.return_value = mock_client

        mock_resp = MagicMock()
        mock_embedding_obj = MagicMock()
        mock_embedding_obj.values = _create_mock_embedding(768)
        mock_resp.embeddings = [mock_embedding_obj]

        # Fail twice with 429, then succeed on 3rd attempt
        mock_client.models.embed_content.side_effect = [
            Exception("429 Resource has been exhausted (e.g. check quota)."),
            Exception("503 Service Unavailable"),
            mock_resp,
        ]

        vectors = embed_documents(["Test retry text"])
        assert len(vectors) == 1
        assert len(vectors[0]) == 768
        assert mock_client.models.embed_content.call_count == 3
        assert mock_sleep.call_count == 2

    @patch("app.services.embeddings.time.sleep")
    @patch("app.services.embeddings._get_client")
    def test_embed_fails_after_max_retries_with_friendly_message(self, mock_get_client, mock_sleep):
        """Persistent rate-limit error raises friendly EmbeddingError."""
        mock_client = MagicMock()
        mock_get_client.return_value = mock_client

        mock_client.models.embed_content.side_effect = Exception(
            "429 Resource has been exhausted (quota exceeded)"
        )

        with pytest.raises(EmbeddingError) as exc_info:
            embed_documents(["Test text"])

        assert "quota is used up" in str(exc_info.value).lower()
        assert mock_client.models.embed_content.call_count == 5

    @patch("app.services.embeddings._get_client")
    def test_embed_query(self, mock_get_client):
        """embed_query returns a single normalized 768-dim vector using RETRIEVAL_QUERY."""
        mock_client = MagicMock()
        mock_get_client.return_value = mock_client

        mock_resp = MagicMock()
        mock_embedding_obj = MagicMock()
        mock_embedding_obj.values = _create_mock_embedding(768)
        mock_resp.embeddings = [mock_embedding_obj]
        mock_client.models.embed_content.return_value = mock_resp

        vec = embed_query("What is the quarterly revenue?")
        assert len(vec) == 768
        assert pytest.approx(math.sqrt(sum(x * x for x in vec)), abs=1e-5) == 1.0

        call_args = mock_client.models.embed_content.call_args
        _, kwargs = call_args
        assert kwargs["config"].task_type == "RETRIEVAL_QUERY"


class TestVectorStore:
    """Unit tests for Supabase vector store persistence."""

    @patch("app.services.vector_store.get_supabase_client")
    def test_save_chunks_batches_inserts(self, mock_get_supabase):
        """save_chunks inserts chunks into PostgreSQL in batches of ~100 rows."""
        mock_supabase = MagicMock()
        mock_get_supabase.return_value = mock_supabase

        chunks_data = [
            {
                "content": f"Chunk text {i}",
                "page_number": (i // 10) + 1,
                "chunk_index": i,
                "embedding": [0.01] * 768,
            }
            for i in range(250)
        ]

        inserted = save_chunks("doc-123", "user-456", chunks_data)
        assert inserted == 250

        # With 250 rows and batch size 100, insert should be called 3 times (100, 100, 50)
        assert mock_supabase.table().insert().execute.call_count == 3

    @patch("app.services.vector_store.get_supabase_client")
    def test_delete_chunks(self, mock_get_supabase):
        """delete_chunks removes all rows with document_id."""
        mock_supabase = MagicMock()
        mock_get_supabase.return_value = mock_supabase

        delete_chunks("doc-123")
        mock_supabase.table.assert_called_with("chunks")
        mock_supabase.table().delete().eq.assert_called_with("document_id", "doc-123")


class TestPipeline:
    """Unit tests for the end-to-end processing pipeline."""

    @patch("app.services.pipeline.save_chunks")
    @patch("app.services.pipeline.delete_chunks")
    @patch("app.services.pipeline.embed_documents")
    @patch("app.services.pipeline.extract_pages")
    @patch("app.services.pipeline.get_supabase_client")
    def test_pipeline_success_marks_ready(
        self,
        mock_get_supabase,
        mock_extract,
        mock_embed,
        mock_delete,
        mock_save,
    ):
        """A valid document extracts, chunks, embeds, deletes old chunks, saves, and sets status='ready'."""
        mock_supabase = MagicMock()
        mock_get_supabase.return_value = mock_supabase

        # Mock document record
        mock_supabase.table().select().eq().execute.return_value.data = [
            {
                "id": "doc-1",
                "user_id": "user-1",
                "name": "sample.pdf",
                "storage_path": "user-1/sample.pdf",
                "file_type": "application/pdf",
                "status": "processing",
            }
        ]
        # Mock storage download
        mock_supabase.storage.from_().download.return_value = b"%PDF-1.4 mock content"

        # Mock extraction with adequate readable text (> 50 chars)
        from app.services.extraction import ExtractedPage

        mock_extract.return_value = [
            ExtractedPage(
                page_number=1,
                text="This is page one of the document containing substantial text for RAG retrieval testing.",
            ),
            ExtractedPage(
                page_number=2,
                text="This is page two of the document discussing machine learning and vector embeddings.",
            ),
        ]

        # Mock embeddings
        mock_embed.return_value = [[0.05] * 768, [0.05] * 768]

        process_document("doc-1")

        # Verify old chunks deleted before saving new ones
        mock_delete.assert_called_with("doc-1")
        assert mock_save.called

        # Verify database update to 'ready'
        update_calls = mock_supabase.table().update.call_args_list
        ready_call = any(
            call[0][0].get("status") == "ready" and call[0][0].get("page_count") == 2
            for call in update_calls
        )
        assert ready_call, "Expected document status update to 'ready' with page_count=2"

    @patch("app.services.pipeline.delete_chunks")
    @patch("app.services.pipeline.embed_documents")
    @patch("app.services.pipeline.extract_pages")
    @patch("app.services.pipeline.get_supabase_client")
    def test_pipeline_failure_cleans_up_and_marks_failed(
        self,
        mock_get_supabase,
        mock_extract,
        mock_embed,
        mock_delete,
    ):
        """When embedding fails, partial chunks are cleaned up and document is marked 'failed'."""
        mock_supabase = MagicMock()
        mock_get_supabase.return_value = mock_supabase

        mock_supabase.table().select().eq().execute.return_value.data = [
            {
                "id": "doc-fail",
                "user_id": "user-1",
                "name": "large.pdf",
                "storage_path": "user-1/large.pdf",
                "file_type": "application/pdf",
                "status": "processing",
            }
        ]
        mock_supabase.storage.from_().download.return_value = b"%PDF mock bytes"

        from app.services.extraction import ExtractedPage

        mock_extract.return_value = [
            ExtractedPage(page_number=1, text="Text sufficient to proceed to embedding generation.")
        ]

        # Simulate embedding service quota exhaustion
        mock_embed.side_effect = EmbeddingError(
            "The AI service is busy or your quota is used up. Please try again later."
        )

        process_document("doc-fail")

        # Ensure chunks cleanup was called so no orphan chunks remain
        mock_delete.assert_called_with("doc-fail")

        # Verify database update to 'failed'
        update_calls = mock_supabase.table().update.call_args_list
        failed_call = any(
            call[0][0].get("status") == "failed"
            and "quota is used up" in call[0][0].get("error_message", "").lower()
            for call in update_calls
        )
        assert failed_call, "Expected document status update to 'failed'"

    @patch("app.services.pipeline.chunk_pages")
    @patch("app.services.pipeline.extract_pages")
    @patch("app.services.pipeline.get_supabase_client")
    def test_pipeline_safety_limit_exceeding_2000_chunks(
        self,
        mock_get_supabase,
        mock_extract,
        mock_chunk_pages,
    ):
        """Documents exceeding 2,000 chunks fail with a friendly error message."""
        mock_supabase = MagicMock()
        mock_get_supabase.return_value = mock_supabase

        mock_supabase.table().select().eq().execute.return_value.data = [
            {
                "id": "doc-huge",
                "user_id": "user-1",
                "name": "encyclopedia.pdf",
                "storage_path": "user-1/encyclopedia.pdf",
                "file_type": "application/pdf",
                "status": "processing",
            }
        ]
        mock_supabase.storage.from_().download.return_value = b"%PDF mock"

        from app.services.extraction import ExtractedPage
        from app.services.chunking import DocumentChunk

        mock_extract.return_value = [ExtractedPage(page_number=1, text="Massive content " * 100)]
        mock_chunk_pages.return_value = [
            DocumentChunk(content=f"Chunk {i}", page_number=1, chunk_index=i, token_count=50)
            for i in range(MAX_CHUNKS_LIMIT + 10)
        ]

        process_document("doc-huge")

        update_calls = mock_supabase.table().update.call_args_list
        too_large_call = any(
            call[0][0].get("status") == "failed"
            and "too large" in call[0][0].get("error_message", "").lower()
            for call in update_calls
        )
        assert too_large_call, "Expected document to fail due to chunk limit (>2000)"


class TestReprocessEndpoint:
    """Unit tests for POST /documents/{id}/reprocess endpoint."""

    @patch("app.routers.documents.get_supabase_client")
    def test_reprocess_requires_failed_status(self, mock_get_supabase):
        """Reprocessing documents that are not 'failed' raises 400 Bad Request."""
        from fastapi import HTTPException
        from app.routers.documents import reprocess_document
        from app.models.user import UserResponse

        mock_supabase = MagicMock()
        mock_get_supabase.return_value = mock_supabase

        # Document is already 'ready'
        mock_supabase.table().select().eq().eq().execute.return_value.data = [
            {"id": "doc-ready", "user_id": "user-123", "status": "ready"}
        ]

        current_user = UserResponse(id="user-123", email="user@example.com")
        mock_bg = MagicMock()

        with pytest.raises(HTTPException) as exc_info:
            reprocess_document("doc-ready", mock_bg, current_user)

        assert exc_info.value.status_code == 400
        assert "Only failed documents can be reprocessed" in exc_info.value.detail

    @patch("app.routers.documents.get_supabase_client")
    def test_reprocess_failed_document_enqueues_background_task(self, mock_get_supabase):
        """Reprocessing a failed document sets status='processing' and adds background task."""
        from app.routers.documents import reprocess_document
        from app.models.user import UserResponse

        mock_supabase = MagicMock()
        mock_get_supabase.return_value = mock_supabase

        # Document has failed status
        mock_supabase.table().select().eq().eq().execute.return_value.data = [
            {
                "id": "doc-fail",
                "user_id": "user-123",
                "name": "report.pdf",
                "storage_path": "user-123/report.pdf",
                "file_type": "application/pdf",
                "file_size": 1024,
                "status": "failed",
                "error_message": "Network timeout",
                "page_count": 0,
                "created_at": "2026-11-22T00:00:00Z",
            }
        ]

        # Update returns reset doc
        mock_supabase.table().update().eq().eq().execute.return_value.data = [
            {
                "id": "doc-fail",
                "user_id": "user-123",
                "name": "report.pdf",
                "storage_path": "user-123/report.pdf",
                "file_type": "application/pdf",
                "file_size": 1024,
                "status": "processing",
                "error_message": None,
                "page_count": 0,
                "created_at": "2026-11-22T00:00:00Z",
            }
        ]

        current_user = UserResponse(id="user-123", email="user@example.com")
        mock_bg = MagicMock()

        resp = reprocess_document("doc-fail", mock_bg, current_user)

        assert resp.status == "processing"
        assert resp.error_message is None
        mock_bg.add_task.assert_called_once()

