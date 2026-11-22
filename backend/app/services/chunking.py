"""Document text chunking service.

Performs recursive semantic text chunking with target token sizes and overlap,
using tiktoken (cl100k_base) with character-based fallback.
Ensures page isolation and consecutive document-level chunk indexing.
"""

from dataclasses import dataclass
import logging
import re
from typing import Any, Dict, List

from app.services.extraction import ExtractedPage

logger = logging.getLogger(__name__)

# Chunking defaults
TARGET_CHUNK_TOKENS = 800
CHUNK_OVERLAP_TOKENS = 100
MIN_CHUNK_CHARS = 20

# Initialize tiktoken cl100k_base encoder with fallback
try:
    import tiktoken

    _tokenizer = tiktoken.get_encoding("cl100k_base")

    def count_tokens(text: str) -> int:
        """Count tokens using tiktoken cl100k_base."""
        if not text:
            return 0
        try:
            return len(_tokenizer.encode(text))
        except Exception:
            return max(1, len(text) // 4)

except Exception as _tik_err:
    logger.warning(
        "tiktoken cl100k_base unavailable (%s); falling back to ~4 characters per token",
        _tik_err,
    )

    def count_tokens(text: str) -> int:
        """Fallback token estimation (approx 4 characters per token)."""
        if not text:
            return 0
        return max(1, len(text) // 4)


@dataclass
class DocumentChunk:
    """Represents a discrete semantic chunk of text from a document."""

    content: str
    page_number: int
    chunk_index: int  # 0-indexed across entire document
    token_count: int

    def to_dict(self) -> Dict[str, Any]:
        """Convert chunk to dictionary format."""
        return {
            "content": self.content,
            "page_number": self.page_number,
            "chunk_index": self.chunk_index,
            "token_count": self.token_count,
        }


def _join_units(units: List[str]) -> str:
    """Join split units into a coherent text string with appropriate spacing."""
    res = ""
    for u in units:
        u_clean = u.strip()
        if not u_clean:
            continue
        if not res:
            res = u_clean
        else:
            # If previous unit ended with newline or current starts with newline/paragraph
            if "\n" in res[-50:] or "\n" in u_clean[:50]:
                res = res + "\n\n" + u_clean
            else:
                res = res + " " + u_clean
    return res


def _split_text_to_units(text: str, target_tokens: int, overlap_tokens: int) -> List[str]:
    """Recursively split text into coherent atomic units.

    Hierarchy: paragraph breaks (\n\n) -> line breaks (\n) -> sentences -> spaces (words).
    Units are kept at sentence or paragraph level wherever possible without cutting words.
    """
    separators = [
        ("\n\n", False),
        ("\n", False),
        (re.compile(r"(?<=[.?!])\s+"), True),
        (" ", False),
    ]

    def _recursive_split(t: str, sep_idx: int) -> List[str]:
        t = t.strip()
        if not t:
            return []
        if sep_idx >= len(separators):
            return [t]

        sep, is_regex = separators[sep_idx]
        raw_parts = sep.split(t) if is_regex else t.split(sep)
        parts = [p.strip() for p in raw_parts if p.strip()]

        if len(parts) <= 1:
            return _recursive_split(t, sep_idx + 1)

        units: List[str] = []
        for p in parts:
            p_tokens = count_tokens(p)
            # If the part exceeds target size, it MUST be subdivided
            # Also, if we are at paragraph or line level and part exceeds overlap size,
            # subdivide down to sentence level to provide clean sentence-aligned overlap
            if p_tokens > target_tokens or (sep_idx < 2 and p_tokens > overlap_tokens):
                units.extend(_recursive_split(p, sep_idx + 1))
            else:
                units.append(p)
        return units

    return _recursive_split(text, 0)


def chunk_single_page(
    page_text: str,
    target_tokens: int = TARGET_CHUNK_TOKENS,
    overlap_tokens: int = CHUNK_OVERLAP_TOKENS,
    min_chars: int = MIN_CHUNK_CHARS,
) -> List[str]:
    """Chunk a single page of text into segments with target token size and overlap."""
    clean_page = page_text.strip()
    if not clean_page or len(clean_page) < min_chars:
        return []

    # If the entire page already fits within target tokens
    if count_tokens(clean_page) <= target_tokens:
        return [clean_page]

    units = _split_text_to_units(clean_page, target_tokens, overlap_tokens)
    if not units:
        return []

    chunks: List[str] = []
    current_units: List[str] = []
    current_tokens = 0
    idx = 0

    while idx < len(units):
        unit = units[idx]
        u_tokens = count_tokens(unit)

        # Check if adding this unit would exceed target size
        if current_units and (current_tokens + u_tokens > target_tokens):
            chunk_content = _join_units(current_units)
            if len(chunk_content.strip()) >= min_chars:
                chunks.append(chunk_content.strip())

            # Calculate overlap units from the end of the current chunk
            overlap_units: List[str] = []
            overlap_cnt = 0
            for u in reversed(current_units):
                toks = count_tokens(u)
                if overlap_cnt + toks <= overlap_tokens or not overlap_units:
                    overlap_units.insert(0, u)
                    overlap_cnt += toks
                else:
                    break

            # Ensure forward progress: overlap cannot contain all current units
            if len(overlap_units) >= len(current_units):
                overlap_units = overlap_units[1:]

            current_units = list(overlap_units)
            current_tokens = sum(count_tokens(u) for u in current_units)
        else:
            current_units.append(unit)
            current_tokens += u_tokens
            idx += 1

    # Emit final accumulated chunk
    if current_units:
        chunk_content = _join_units(current_units)
        if len(chunk_content.strip()) >= min_chars:
            chunks.append(chunk_content.strip())

    return chunks


def chunk_pages(
    pages: List[ExtractedPage],
    target_tokens: int = TARGET_CHUNK_TOKENS,
    overlap_tokens: int = CHUNK_OVERLAP_TOKENS,
    min_chars: int = MIN_CHUNK_CHARS,
) -> List[DocumentChunk]:
    """Chunk a list of document pages into consecutive DocumentChunk items.

    Strictly preserves page boundaries (no chunk ever spans multiple pages).
    Assigns continuous 0-indexed chunk_index values across the entire document.
    Filters out chunks with fewer than min_chars characters.

    Args:
        pages: List of ExtractedPage objects.
        target_tokens: Target maximum tokens per chunk (default 800).
        overlap_tokens: Tokens of overlap between consecutive chunks on the same page (default 100).
        min_chars: Minimum character length to retain a chunk (default 20).

    Returns:
        List of DocumentChunk instances.
    """
    all_chunks: List[DocumentChunk] = []
    current_chunk_index = 0

    for page in pages:
        page_chunks = chunk_single_page(
            page.text,
            target_tokens=target_tokens,
            overlap_tokens=overlap_tokens,
            min_chars=min_chars,
        )

        for chunk_text in page_chunks:
            all_chunks.append(
                DocumentChunk(
                    content=chunk_text,
                    page_number=page.page_number,
                    chunk_index=current_chunk_index,
                    token_count=count_tokens(chunk_text),
                )
            )
            current_chunk_index += 1

    return all_chunks
