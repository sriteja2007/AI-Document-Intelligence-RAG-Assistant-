"""Gemini text embeddings service using google-genai.

Handles document and query embedding generation with the recommended gemini-embedding-001 model,
output dimension 768 via Matryoshka Representation Learning (MRL), manual L2 unit normalization,
exponential backoff retry with jitter, batch rate-limit management, and friendly error handling.
"""

import logging
import math
import random
import time
from typing import List

from google import genai
from google.genai import types

from app.core.config import settings

logger = logging.getLogger(__name__)

# Batch size for document embedding calls
BATCH_SIZE = 30

# Inter-batch pause in seconds to avoid exhausting free-tier rate limits
BATCH_PAUSE_SECONDS = 0.5

# Retry configuration
MAX_RETRIES = 5
INITIAL_BACKOFF_SECONDS = 1.0
MAX_BACKOFF_SECONDS = 30.0


class EmbeddingError(Exception):
    """Custom exception raised for embedding service failures."""

    pass


def normalize_vector(vector: List[float]) -> List[float]:
    """Normalize a vector to unit length (L2 norm = 1.0).

    Required for gemini-embedding-001 when output_dimensionality is truncated below 3072.
    """
    if not vector:
        return []
    norm = math.sqrt(sum(x * x for x in vector))
    if norm == 0.0:
        return [0.0] * len(vector)
    return [x / norm for x in vector]


def _get_client() -> genai.Client:
    """Instantiate and return the google-genai Client using configured GEMINI_API_KEY."""
    api_key = settings.GEMINI_API_KEY.strip()
    if not api_key:
        raise EmbeddingError(
            "Gemini API key is not configured. Please set GEMINI_API_KEY in your backend/.env file."
        )
    return genai.Client(api_key=api_key)


def _call_embed_with_retry(
    client: genai.Client,
    contents: List[str],
    task_type: str,
) -> List[List[float]]:
    """Execute embed_content with exponential backoff and jitter on rate limits or server errors."""
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            response = client.models.embed_content(
                model=settings.EMBEDDING_MODEL,
                contents=contents,
                config=types.EmbedContentConfig(
                    task_type=task_type,
                    output_dimensionality=settings.EMBEDDING_DIMENSION,
                ),
            )

            if not response.embeddings:
                raise EmbeddingError("No embeddings returned by the AI service.")

            vectors = []
            for item in response.embeddings:
                raw_vals = list(item.values or [])
                norm_vals = normalize_vector(raw_vals)
                vectors.append(norm_vals)

            return vectors

        except EmbeddingError:
            raise
        except Exception as exc:
            err_str = str(exc)
            err_lower = err_str.lower()

            # Check for missing / invalid API key
            if any(
                k in err_lower
                for k in [
                    "api key not valid",
                    "invalid api key",
                    "api_key_invalid",
                    "permission_denied",
                    "unauthenticated",
                ]
            ) or (
                "api key" in err_lower and ("400" in err_str or "403" in err_str or "401" in err_str)
            ):
                raise EmbeddingError(
                    "The provided Gemini API key is invalid or unauthorized. Please verify your GEMINI_API_KEY."
                ) from None

            # Check for quota exhaustion / rate limits (429 / RESOURCE_EXHAUSTED)
            is_rate_limit = (
                "429" in err_str
                or "resource_exhausted" in err_lower
                or "quota" in err_lower
                or "rate limit" in err_lower
            )

            # Check for temporary server errors
            is_server_error = (
                "500" in err_str
                or "502" in err_str
                or "503" in err_str
                or "504" in err_str
                or "unavailable" in err_lower
                or "internal error" in err_lower
            )

            if (is_rate_limit or is_server_error) and attempt < MAX_RETRIES:
                # Exponential backoff with random jitter
                backoff = min(
                    INITIAL_BACKOFF_SECONDS * (2 ** (attempt - 1)) + random.uniform(0.5, 1.5),
                    MAX_BACKOFF_SECONDS,
                )
                logger.warning(
                    "Temporary embedding error (attempt %d/%d), retrying in %.2fs: %s",
                    attempt,
                    MAX_RETRIES,
                    backoff,
                    err_str,
                )
                time.sleep(backoff)
                continue

            if is_rate_limit:
                raise EmbeddingError(
                    "The AI service is busy or your quota is used up. Please try again later."
                ) from None

            if is_server_error:
                raise EmbeddingError(
                    "The AI service is temporarily unavailable. Please try again later."
                ) from None

            raise EmbeddingError(
                f"Failed to generate embeddings: {exc}"
            ) from None

    raise EmbeddingError(
        "The AI service is busy or your quota is used up. Please try again later."
    )


def embed_documents(texts: List[str]) -> List[List[float]]:
    """Generate 768-dimensional normalized embeddings for a list of document chunks.

    Uses task_type='RETRIEVAL_DOCUMENT' in batches.
    Safely handles empty or whitespace texts by substituting a zero vector,
    strictly preserving the input length and order.

    Args:
        texts: List of document text strings.

    Returns:
        List of 768-element float vectors corresponding 1-to-1 with input texts.
    """
    if not texts:
        return []

    client = _get_client()

    # Separate non-empty texts to query the API while preserving original positions
    valid_indices: List[int] = []
    valid_texts: List[str] = []

    for idx, t in enumerate(texts):
        cleaned = t.strip() if t else ""
        if cleaned:
            valid_indices.append(idx)
            valid_texts.append(cleaned)

    # If all texts were empty/whitespace
    if not valid_texts:
        return [[0.0] * settings.EMBEDDING_DIMENSION for _ in texts]

    # Process non-empty texts in batches
    collected_vectors: List[List[float]] = []

    for i in range(0, len(valid_texts), BATCH_SIZE):
        batch = valid_texts[i : i + BATCH_SIZE]
        batch_vectors = _call_embed_with_retry(
            client=client,
            contents=batch,
            task_type="RETRIEVAL_DOCUMENT",
        )
        collected_vectors.extend(batch_vectors)

        # Brief pause between batches to respect free-tier rate limits
        if i + BATCH_SIZE < len(valid_texts):
            time.sleep(BATCH_PAUSE_SECONDS)

    # Reconstruct complete result matching original input length and order
    result: List[List[float]] = [[0.0] * settings.EMBEDDING_DIMENSION for _ in texts]
    for idx, vec in zip(valid_indices, collected_vectors):
        result[idx] = vec

    return result


def embed_query(text: str) -> List[float]:
    """Generate a single 768-dimensional normalized embedding for a search query.

    Uses task_type='RETRIEVAL_QUERY'.

    Args:
        text: Query or question string.

    Returns:
        A 768-element normalized float vector.
    """
    cleaned = text.strip() if text else ""
    if not cleaned:
        return [0.0] * settings.EMBEDDING_DIMENSION

    client = _get_client()
    vectors = _call_embed_with_retry(
        client=client,
        contents=[cleaned],
        task_type="RETRIEVAL_QUERY",
    )
    return vectors[0]
