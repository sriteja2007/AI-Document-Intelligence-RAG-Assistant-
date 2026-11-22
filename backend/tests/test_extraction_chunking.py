"""Automated unit tests for document extraction, cleaning, and chunking."""

import io
import docx
import pymupdf
import pytest

from app.services.chunking import (
    MIN_CHUNK_CHARS,
    TARGET_CHUNK_TOKENS,
    chunk_pages,
    chunk_single_page,
    count_tokens,
)
from app.services.cleaning import clean_text, remove_repeated_headers_footers
from app.services.extraction import (
    ExtractionError,
    ExtractedPage,
    extract_pages,
)


def _create_sample_pdf(page_texts: list[str]) -> bytes:
    """Helper to create an in-memory PDF with specified text per page."""
    doc = pymupdf.open()
    for text in page_texts:
        page = doc.new_page()
        if text:
            page.insert_text((50, 50), text, fontsize=12)
    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes


def _create_sample_docx(paragraphs: list[str], table_rows: list[list[str]] | None = None) -> bytes:
    """Helper to create an in-memory DOCX with paragraphs and an optional table."""
    doc = docx.Document()
    for p in paragraphs:
        doc.add_paragraph(p)
    if table_rows:
        num_rows = len(table_rows)
        num_cols = len(table_rows[0]) if num_rows > 0 else 0
        table = doc.add_table(rows=num_rows, cols=num_cols)
        for r_idx, row in enumerate(table_rows):
            for c_idx, cell_value in enumerate(row):
                table.rows[r_idx].cells[c_idx].text = cell_value
    stream = io.BytesIO()
    doc.save(stream)
    return stream.getvalue()


class TestExtraction:
    """Tests for document text extraction."""

    def test_pdf_extraction_multi_page(self):
        """Multi-page text PDF correctly returns one page per physical PDF page."""
        pdf_bytes = _create_sample_pdf(["Page one content.", "Page two content.", "Page three content."])
        pages = extract_pages(pdf_bytes, "application/pdf")

        assert len(pages) == 3
        assert pages[0].page_number == 1
        assert "Page one content." in pages[0].text
        assert pages[1].page_number == 2
        assert "Page two content." in pages[1].text
        assert pages[2].page_number == 3
        assert "Page three content." in pages[2].text

    def test_pdf_extraction_scanned_or_empty(self):
        """Empty or scanned PDF pages return empty string text without crashing."""
        pdf_bytes = _create_sample_pdf(["", "", ""])
        pages = extract_pages(pdf_bytes, ".pdf")

        assert len(pages) == 3
        for idx, page in enumerate(pages, start=1):
            assert page.page_number == idx
            assert page.text.strip() == ""

    def test_docx_extraction_with_table(self):
        """Word document extraction extracts paragraphs and table text."""
        docx_bytes = _create_sample_docx(
            paragraphs=["Quarterly performance analysis paragraph.", "Second paragraph text."],
            table_rows=[["Metric", "Value"], ["Revenue", "$10M"], ["Growth", "25%"]],
        )
        pages = extract_pages(docx_bytes, "docx")

        assert len(pages) >= 1
        combined_text = "\n".join(p.text for p in pages)
        assert "Quarterly performance analysis paragraph." in combined_text
        assert "Second paragraph text." in combined_text
        assert "Metric | Value" in combined_text
        assert "Revenue | $10M" in combined_text

    def test_txt_extraction_with_virtual_pages(self):
        """Plain text extraction parses UTF-8 text and creates virtual pages at paragraph breaks."""
        long_para = "This is a substantial paragraph of text designed to test virtual page boundaries. " * 30
        paras = [f"Section {i}\n\n{long_para}" for i in range(5)]
        txt_bytes = "\n\n".join(paras).encode("utf-8")

        pages = extract_pages(txt_bytes, "text/plain")
        assert len(pages) >= 2
        for page in pages:
            assert page.page_number >= 1
            assert len(page.text) > 0

    def test_corrupted_file_raises_custom_error(self):
        """Corrupted or invalid file raises ExtractionError with a friendly message."""
        corrupted_bytes = b"NOT_A_VALID_PDF_HEADER_123456"
        with pytest.raises(ExtractionError) as exc_info:
            extract_pages(corrupted_bytes, "application/pdf")
        assert "corrupted or invalid" in str(exc_info.value)


class TestCleaning:
    """Tests for text cleaning and repeated header/footer detection."""

    def test_clean_text_removes_line_end_hyphens(self):
        """Hyphenated line-ends are joined into continuous words."""
        raw = "This is an implemen-\ntation of docu-\n  ment chunking."
        cleaned = clean_text(raw)
        assert "implementation" in cleaned
        assert "document" in cleaned
        assert "implemen-" not in cleaned

    def test_clean_text_normalizes_spaces_and_control_chars(self):
        """Repeated spaces, null bytes, and non-printable control characters are removed."""
        raw = "Word  with   multiple    spaces.\x00\x07\x08End of line."
        cleaned = clean_text(raw)
        assert "Word with multiple spaces.End of line." in cleaned
        assert "\x00" not in cleaned
        assert "\x07" not in cleaned

    def test_clean_text_condenses_excessive_newlines(self):
        """Four consecutive newlines are condensed to two (paragraph break)."""
        raw = "Paragraph One.\n\n\n\n\nParagraph Two."
        cleaned = clean_text(raw)
        assert cleaned == "Paragraph One.\n\nParagraph Two."

    def test_remove_repeated_headers_and_footers(self):
        """Lines repeated across >= 60% of pages and page numbers are removed."""
        pages = [
            ExtractedPage(
                page_number=1,
                text="Acme Corp Confidential\nFirst page body paragraph.\nPage 1 of 3",
            ),
            ExtractedPage(
                page_number=2,
                text="Acme Corp Confidential\nSecond page body paragraph.\nPage 2 of 3",
            ),
            ExtractedPage(
                page_number=3,
                text="Acme Corp Confidential\nThird page body paragraph.\nPage 3 of 3",
            ),
        ]

        cleaned = remove_repeated_headers_footers(pages)
        assert len(cleaned) == 3

        for p in cleaned:
            assert "Acme Corp Confidential" not in p.text
            assert "Page 1 of 3" not in p.text
            assert "Page 2 of 3" not in p.text
            assert "Page 3 of 3" not in p.text

        assert "First page body paragraph." in cleaned[0].text
        assert "Second page body paragraph." in cleaned[1].text
        assert "Third page body paragraph." in cleaned[2].text


class TestChunking:
    """Tests for semantic recursive chunking."""

    def test_chunking_consecutive_indexing_across_pages(self):
        """Chunk index must count consecutively (0, 1, 2, ...) across all pages."""
        pages = [
            ExtractedPage(page_number=1, text="Page 1 sentence one. Page 1 sentence two."),
            ExtractedPage(page_number=2, text="Page 2 sentence one. Page 2 sentence two."),
            ExtractedPage(page_number=3, text="Page 3 sentence one. Page 3 sentence two."),
        ]

        chunks = chunk_pages(pages, target_tokens=100, overlap_tokens=20)
        assert len(chunks) == 3
        for idx, chunk in enumerate(chunks):
            assert chunk.chunk_index == idx
            assert chunk.page_number == idx + 1

    def test_chunks_never_cross_page_boundaries(self):
        """Text from different pages is never combined into one chunk."""
        pages = [
            ExtractedPage(page_number=1, text="Unique content strictly belonging to page 1."),
            ExtractedPage(page_number=2, text="Unique content strictly belonging to page 2."),
        ]

        chunks = chunk_pages(pages, target_tokens=800, overlap_tokens=100)
        assert len(chunks) == 2
        assert chunks[0].page_number == 1
        assert "page 1" in chunks[0].content
        assert "page 2" not in chunks[0].content

        assert chunks[1].page_number == 2
        assert "page 2" in chunks[1].content
        assert "page 1" not in chunks[1].content

    def test_chunking_overlap_on_large_text(self):
        """Pages exceeding target tokens are split into overlapping chunks."""
        long_page_text = (
            "Natural language processing allows computers to understand human language. "
            "Large language models represent a breakthrough in modern artificial intelligence. "
            "Semantic chunking divides documents into meaningful passages for retrieval. "
        ) * 15

        chunks = chunk_single_page(long_page_text, target_tokens=100, overlap_tokens=30)
        assert len(chunks) > 1

        # Check overlap: consecutive chunks share some common text
        for i in range(len(chunks) - 1):
            current_words = set(chunks[i].split()[-10:])
            next_words = set(chunks[i + 1].split()[:15])
            shared = current_words.intersection(next_words)
            assert len(shared) > 0, "Expected overlap between consecutive chunks on the same page"

    def test_short_chunks_skipped(self):
        """Chunks shorter than MIN_CHUNK_CHARS are skipped."""
        short_text = "Tiny"
        assert len(short_text) < MIN_CHUNK_CHARS
        chunks = chunk_single_page(short_text, min_chars=MIN_CHUNK_CHARS)
        assert len(chunks) == 0
