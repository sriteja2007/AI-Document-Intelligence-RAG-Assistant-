"""Text cleaning and normalization service.

Handles fixing split hyphens, removing control characters, normalizing whitespace,
and detecting and stripping repeated headers, footers, and page numbers across pages.
"""

from collections import Counter
import logging
import re
from typing import List

from app.services.extraction import ExtractedPage

logger = logging.getLogger(__name__)

# Pattern for standalone page numbers (e.g. "1", "Page 1", "Page 1 of 5", "- 2 -", "pg. 4")
PAGE_NUMBER_PATTERN = re.compile(
    r"^(?:[-–—\s]*(?:page|pg\.?)?\s*\d+\s*(?:(?:of|/)\s*\d+)?[-–—\s]*)$",
    re.IGNORECASE,
)


def clean_text(text: str) -> str:
    """Clean and normalize extracted text.

    - Fixes words split by line-end hyphens (e.g., 'connec-\ntion' -> 'connection').
    - Removes null bytes, soft hyphens, and non-printable control characters (preserving newlines and tabs).
    - Normalizes repeated spaces within lines.
    - Condenses excessive blank lines while preserving paragraph breaks.
    """
    if not text:
        return ""

    # Normalize carriage returns and line feeds
    normalized = text.replace("\r\n", "\n").replace("\r", "\n")

    # Remove soft hyphen (\xad) and null byte (\x00)
    normalized = normalized.replace("\xad", "").replace("\x00", "")

    # Remove non-printable control characters (keep \t=0x09 and \n=0x0A)
    # Characters 0x00-0x08, 0x0B-0x0C, 0x0E-0x1F, and 0x7F (DEL)
    normalized = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", normalized)

    # Fix words split by line-end hyphens:
    # Matches a word prefix ending in a hyphen, newline, optional whitespace, and the word suffix.
    # Example: 'implemen-\n  tation' -> 'implementation'
    normalized = re.sub(
        r"(\b[a-zA-Z]+)-\s*\n\s*([a-zA-Z]+\b)",
        r"\1\2",
        normalized,
    )

    # Process line by line to remove repeated horizontal spaces while preserving lines
    lines = normalized.split("\n")
    cleaned_lines = []
    for line in lines:
        # Collapse multiple horizontal whitespace characters (spaces, tabs) into a single space
        condensed_line = re.sub(r"[^\S\n]+", " ", line).strip()
        cleaned_lines.append(condensed_line)

    cleaned_text = "\n".join(cleaned_lines)

    # Condense 3 or more consecutive newlines into 2 newlines (standard paragraph break)
    cleaned_text = re.sub(r"\n{3,}", "\n\n", cleaned_text)

    return cleaned_text.strip()


def remove_repeated_headers_footers(pages: List[ExtractedPage]) -> List[ExtractedPage]:
    """Detect and remove repeated header/footer lines and page numbers across pages.

    Identifies:
    1. Exact lines (e.g. running headers, confidential notices) appearing on >= 60% of pages (for 3+ pages).
    2. Standalone page number patterns occurring across multiple pages.
    """
    if not pages:
        return []

    # If document has at least 3 pages, detect repeated running lines
    repeated_lines = set()
    if len(pages) >= 3:
        threshold = max(2, int(len(pages) * 0.6))
        line_page_counts: Counter[str] = Counter()

        for page in pages:
            lines_on_page = set()
            for raw_line in page.text.split("\n"):
                stripped = raw_line.strip()
                # Ignore very short lines (< 3 chars) or very long lines (> 200 chars) for running header detection
                if 3 <= len(stripped) <= 200:
                    lines_on_page.add(stripped)
            for line in lines_on_page:
                line_page_counts[line] += 1

        for line, count in line_page_counts.items():
            if count >= threshold:
                repeated_lines.add(line)

    # Check for presence of page numbers across pages
    page_num_hits = 0
    for page in pages:
        for raw_line in page.text.split("\n"):
            stripped = raw_line.strip()
            if PAGE_NUMBER_PATTERN.match(stripped):
                page_num_hits += 1
                break

    has_page_numbers = page_num_hits >= max(2, len(pages) // 2) if len(pages) >= 2 else (page_num_hits > 0)

    cleaned_pages: List[ExtractedPage] = []
    for page in pages:
        filtered_lines: List[str] = []
        for raw_line in page.text.split("\n"):
            stripped = raw_line.strip()
            if not stripped:
                filtered_lines.append("")
                continue

            # Strip repeated headers or footers
            if stripped in repeated_lines:
                continue

            # Strip detected page numbers
            if has_page_numbers and PAGE_NUMBER_PATTERN.match(stripped):
                continue

            filtered_lines.append(raw_line)

        cleaned_text = clean_text("\n".join(filtered_lines))
        cleaned_pages.append(ExtractedPage(page_number=page.page_number, text=cleaned_text))

    return cleaned_pages
