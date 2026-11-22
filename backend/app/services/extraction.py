"""Document text extraction service.

Supports PDF (via PyMuPDF), DOCX (via python-docx with tables and virtual pages),
and TXT (with multi-encoding fallback and virtual pages).
"""

from dataclasses import dataclass
import io
import logging
import re
from typing import List

import docx
import pymupdf

logger = logging.getLogger(__name__)

# Target character count for virtual pages (Word documents and plain text files)
VIRTUAL_PAGE_TARGET_CHARS = 3000


class ExtractionError(Exception):
    """Custom exception raised when document text extraction fails."""

    pass


@dataclass
class ExtractedPage:
    """Represents text extracted from a single physical or virtual page."""

    page_number: int  # 1-indexed
    text: str


def _group_into_virtual_pages(paragraphs: List[str]) -> List[ExtractedPage]:
    """Group a list of text paragraphs into virtual pages of ~3000 characters.

    Splits strictly at paragraph boundaries to avoid breaking paragraphs across virtual pages.
    """
    if not paragraphs:
        return [ExtractedPage(page_number=1, text="")]

    pages: List[ExtractedPage] = []
    current_page_paras: List[str] = []
    current_char_count = 0

    for para in paragraphs:
        para_clean = para.strip()
        if not para_clean:
            continue
        para_len = len(para_clean)

        # If adding this paragraph exceeds the virtual page target and we already have content
        if current_page_paras and (current_char_count + para_len > VIRTUAL_PAGE_TARGET_CHARS):
            page_text = "\n\n".join(current_page_paras)
            pages.append(ExtractedPage(page_number=len(pages) + 1, text=page_text))
            current_page_paras = [para_clean]
            current_char_count = para_len
        else:
            current_page_paras.append(para_clean)
            current_char_count += para_len

    if current_page_paras:
        page_text = "\n\n".join(current_page_paras)
        pages.append(ExtractedPage(page_number=len(pages) + 1, text=page_text))

    if not pages:
        pages.append(ExtractedPage(page_number=1, text=""))

    return pages


def _extract_pdf(file_bytes: bytes) -> List[ExtractedPage]:
    """Extract pages from a PDF document using PyMuPDF."""
    try:
        doc = pymupdf.open(stream=file_bytes, filetype="pdf")
    except Exception as exc:
        raise ExtractionError(
            f"This PDF file appears to be corrupted or invalid and cannot be opened: {exc}"
        ) from exc

    try:
        if doc.needs_pass:
            raise ExtractionError(
                "This PDF is password-protected. Please remove the password and try again."
            )

        if doc.page_count == 0:
            return [ExtractedPage(page_number=1, text="")]

        pages: List[ExtractedPage] = []
        for idx in range(doc.page_count):
            try:
                page = doc.load_page(idx)
                text = page.get_text() or ""
                pages.append(ExtractedPage(page_number=idx + 1, text=text))
            except Exception as page_exc:
                logger.warning("Error reading page %d of PDF: %s", idx + 1, page_exc)
                pages.append(ExtractedPage(page_number=idx + 1, text=""))
        return pages
    finally:
        doc.close()


def _extract_docx(file_bytes: bytes) -> List[ExtractedPage]:
    """Extract text and tables from a Word (.docx) document using python-docx.

    Groups elements into virtual pages of roughly 3000 characters, splitting only at paragraph boundaries.
    """
    try:
        doc_stream = io.BytesIO(file_bytes)
        doc = docx.Document(doc_stream)
    except Exception as exc:
        raise ExtractionError(
            f"This Word document appears to be corrupted or invalid and cannot be opened: {exc}"
        ) from exc

    elements: List[str] = []

    try:
        if hasattr(doc, "iter_inner_content"):
            for item in doc.iter_inner_content():
                if isinstance(item, docx.text.paragraph.Paragraph):
                    text = item.text.strip()
                    if text:
                        elements.append(text)
                elif isinstance(item, docx.table.Table):
                    table_lines: List[str] = []
                    for row in item.rows:
                        row_cells = [cell.text.strip() for cell in row.cells]
                        if any(row_cells):
                            table_lines.append(" | ".join(row_cells))
                    if table_lines:
                        elements.append("\n".join(table_lines))
        else:
            for p in doc.paragraphs:
                text = p.text.strip()
                if text:
                    elements.append(text)
            for t in doc.tables:
                table_lines = []
                for row in t.rows:
                    row_cells = [cell.text.strip() for cell in row.cells]
                    if any(row_cells):
                        table_lines.append(" | ".join(row_cells))
                if table_lines:
                    elements.append("\n".join(table_lines))
    except Exception as exc:
        raise ExtractionError(
            f"Failed to read content from Word document: {exc}"
        ) from exc

    return _group_into_virtual_pages(elements)


def _extract_txt(file_bytes: bytes) -> List[ExtractedPage]:
    """Extract text from plain text files with encoding fallback and virtual paging."""
    encodings = ["utf-8", "utf-8-sig", "latin-1", "cp1252", "iso-8859-1"]
    decoded_text: str | None = None

    for enc in encodings:
        try:
            decoded_text = file_bytes.decode(enc)
            break
        except (UnicodeDecodeError, LookupError):
            continue

    if decoded_text is None:
        raise ExtractionError(
            "Unable to decode text file. Unsupported or corrupted character encoding."
        )

    # Normalize carriage returns
    normalized = decoded_text.replace("\r\n", "\n").replace("\r", "\n")
    # Split paragraphs by blank lines or multiple newlines
    paragraphs = [p.strip() for p in re.split(r"\n{2,}", normalized) if p.strip()]

    # If the text has no double newlines, split by single newlines
    if len(paragraphs) <= 1 and "\n" in normalized:
        paragraphs = [p.strip() for p in normalized.split("\n") if p.strip()]

    return _group_into_virtual_pages(paragraphs)


def extract_pages(file_bytes: bytes, file_type: str) -> List[ExtractedPage]:
    """Extract pages from a document (PDF, DOCX, or TXT).

    Args:
        file_bytes: Raw bytes of the document.
        file_type: File extension (e.g. '.pdf') or MIME type (e.g. 'application/pdf').

    Returns:
        List of ExtractedPage objects with 1-indexed page numbers.

    Raises:
        ExtractionError: If file is corrupted, password-protected, or unsupported.
    """
    if not file_bytes:
        raise ExtractionError("The provided file is empty (0 bytes).")

    ft_lower = file_type.lower().strip()

    if "pdf" in ft_lower:
        return _extract_pdf(file_bytes)
    elif "docx" in ft_lower or "wordprocessing" in ft_lower or ft_lower.endswith(".docx"):
        return _extract_docx(file_bytes)
    elif "text" in ft_lower or "txt" in ft_lower or ft_lower.endswith(".txt"):
        return _extract_txt(file_bytes)
    else:
        raise ExtractionError(
            f"Unsupported file type: '{file_type}'. Supported formats are PDF, DOCX, and TXT."
        )
