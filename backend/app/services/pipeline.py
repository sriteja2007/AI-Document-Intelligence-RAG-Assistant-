"""Document ingestion and processing pipeline service.

In future phases, this pipeline handles document text extraction (PyMuPDF / python-docx),
semantic chunking, and embedding generation via the Gemini API.
"""

import logging

logger = logging.getLogger(__name__)


def process_document(document_id: str) -> None:
    """Stub background processing task for an uploaded document.

    Logs execution and leaves document status as 'processing' for now.
    """
    logger.info(
        "BackgroundTask: processing document '%s' (text extraction & embeddings deferred to next phase)",
        document_id,
    )
