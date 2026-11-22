"""CLI utility to preview extraction, cleaning, and semantic chunking on local files.

Usage:
    python backend/scripts/preview_chunks.py <path_to_file>
"""

import os
import sys
from pathlib import Path

# Add backend directory to sys.path so app modules can be imported
BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.services.chunking import chunk_pages
from app.services.cleaning import remove_repeated_headers_footers
from app.services.extraction import extract_pages


def main() -> None:
    """Run extraction, cleaning, and chunking on a local file and display summary statistics."""
    if len(sys.argv) < 2:
        print("Usage: python backend/scripts/preview_chunks.py <path_to_file>")
        sys.exit(1)

    file_path = Path(sys.argv[1]).resolve()
    if not file_path.exists() or not file_path.is_file():
        print(f"Error: File not found at '{file_path}'")
        sys.exit(1)

    ext = file_path.suffix.lower()
    if ext not in [".pdf", ".docx", ".txt"]:
        print(f"Error: Unsupported file extension '{ext}'. Supported formats: .pdf, .docx, .txt")
        sys.exit(1)

    print(f"\nProcessing file: {file_path.name}")
    print(f"File size: {file_path.stat().st_size:,} bytes")

    try:
        file_bytes = file_path.read_bytes()
    except Exception as exc:
        print(f"Error reading file: {exc}")
        sys.exit(1)

    # 1. Extraction
    try:
        pages = extract_pages(file_bytes, ext)
    except Exception as exc:
        print(f"Extraction failed: {exc}")
        sys.exit(1)

    # 2. Cleaning & Header/Footer removal
    pages = remove_repeated_headers_footers(pages)

    # 3. Chunking
    chunks = chunk_pages(pages)

    total_pages = len(pages)
    total_chunks = len(chunks)
    total_tokens = sum(c.token_count for c in chunks)
    avg_tokens = (total_tokens / total_chunks) if total_chunks > 0 else 0.0

    print("\n" + "=" * 60)
    print("DOCUMENT PROCESSING SUMMARY")
    print("=" * 60)
    print(f"Total Pages:             {total_pages}")
    print(f"Total Chunks:            {total_chunks}")
    print(f"Average Tokens / Chunk:  {avg_tokens:.1f}")
    print("=" * 60)

    if not chunks:
        print("\nNo chunks were generated (document may be empty or contain insufficient text).")
        return

    preview_count = min(3, len(chunks))
    print(f"\nPREVIEW OF FIRST {preview_count} CHUNKS:")
    print("=" * 60)

    for i in range(preview_count):
        c = chunks[i]
        print(f"\n--- Chunk #{c.chunk_index + 1} (Page {c.page_number}, {c.token_count} tokens) ---")
        print(c.content)

    print("\n" + "=" * 60)


if __name__ == "__main__":
    main()
