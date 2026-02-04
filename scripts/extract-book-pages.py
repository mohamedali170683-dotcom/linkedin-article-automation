#!/usr/bin/env python3
"""
Extract specific pages from research books as PNG images and upload to Vercel Blob.

Usage:
  BLOB_READ_WRITE_TOKEN=vercel_blob_xxx python3 scripts/extract-book-pages.py

  Or pass it as argument:
  python3 scripts/extract-book-pages.py --token vercel_blob_xxx

This script:
1. Reads the book-pages-index.json mapping (topic -> book pages)
2. Extracts each page as a high-quality PNG
3. Uploads to Vercel Blob storage
4. Outputs a book-pages-urls.json with permanent URLs

Requirements:
  pip3 install pymupdf requests

Get your BLOB_READ_WRITE_TOKEN from:
  Vercel Dashboard -> Your Project -> Storage -> Blob -> Settings -> Read/Write Token
"""

import fitz  # pymupdf
import json
import os
import sys
import argparse
import requests
from pathlib import Path

BOOKS_DIR = Path(os.path.expanduser("~/Desktop/book_rag/books"))
PROJECT_DIR = Path(__file__).parent.parent
INDEX_FILE = PROJECT_DIR / "app" / "lib" / "book-pages-index.json"
OUTPUT_FILE = PROJECT_DIR / "app" / "lib" / "book-pages-urls.json"

# Parse arguments
parser = argparse.ArgumentParser()
parser.add_argument("--token", help="Vercel Blob read/write token")
args = parser.parse_args()

# Try to load .env.local for blob token
env_file = PROJECT_DIR / ".env.local"
if env_file.exists():
    with open(env_file) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, val = line.split("=", 1)
                os.environ.setdefault(key.strip(), val.strip())

BLOB_TOKEN = args.token or os.environ.get("BLOB_READ_WRITE_TOKEN")
if not BLOB_TOKEN:
    print("ERROR: Provide BLOB_READ_WRITE_TOKEN via --token flag or environment variable")
    print("Get it from: Vercel Dashboard -> Storage -> Blob -> Settings")
    sys.exit(1)

# Book filename -> full path mapping
BOOK_PATHS = {
    "SYS1-long-and-short-of-it.pdf": BOOKS_DIR / "visibility" / "SYS1-long-and-short-of-it.pdf",
    "the-long-and-short-of-it.pdf": BOOKS_DIR / "visibility" / "the-long-and-short-of-it.pdf",
    "Effectiveness_In_Context.pdf": BOOKS_DIR / "visibility" / "Effectiveness_In_Context.pdf",
    "How_Brands_Grow.pdf": BOOKS_DIR / "visibility" / "_OceanofPDF.com_How_Brands_Grow_-_Byron_Sharp.pdf",
    "long_and_short_presentation.pdf": BOOKS_DIR / "visibility" / "long_and_short_of_it_presentation_final.pdf",
    "Marketing_Effectiveness_Digital_Era.pdf": BOOKS_DIR / "visibility" / "20171023-Media-In-Focus-Marketing-Effectiveness-In-The-Digital-Era.pdf",
    "LinkedIn_B2B_Report.pdf": BOOKS_DIR / "visibility" / "Lin_B2B-Marketing-Report-Digital-V02.pdf",
    "Eat_Your_Greens.pdf": BOOKS_DIR / "visibility" / "Eat_Your_Greens.pdf",
    "Budgeting_Upturn_Nielsen.pdf": BOOKS_DIR / "visibility" / "Budgeting_for_the_Upturn_-_Does_Share_of_Voice_Matter___Nielsen.pdf",
    "The_Choice_Factory.pdf": BOOKS_DIR / "behavioral_science" / "The_Choice_Factory.pdf",
    "Thinking_Fast_Slow.pdf": BOOKS_DIR / "behavioral_science" / "Thinking_Fast_and_Slow.pdf",
    "Influence.pdf": BOOKS_DIR / "behavioral_science" / "Influence.pdf",
    "Pre-Suasion.pdf": BOOKS_DIR / "behavioral_science" / "Pre-Suasion.pdf",
    "Predictably_Irrational.pdf": BOOKS_DIR / "behavioral_science" / "Predictably_Irrational.pdf",
    "Nudge.pdf": BOOKS_DIR / "behavioral_science" / "Nudge.pdf",
    "Alchemy.pdf": BOOKS_DIR / "behavioral_science" / "Alchemy.pdf",
    "Using_Behavioral_Science_Marketing.pdf": BOOKS_DIR / "behavioral_science" / "Using_Behavioral_Science_in_Marketing.pdf",
    "Illusion_of_Choice.pdf": BOOKS_DIR / "behavioral_science" / "The_Illusion_of_Choice.pdf",
    "Decoded.pdf": BOOKS_DIR / "behavioral_science" / "Decoded.pdf",
    "Building_Distinctive_Brand_Assets.pdf": BOOKS_DIR / "visibility" / "Building_Distinctive_Brand_Assets.pdf",
}


def find_book_path(book_name, section_hint=None):
    """Find the actual path for a book, trying multiple strategies."""
    # Direct match with section hint
    if section_hint:
        path = BOOKS_DIR / section_hint / book_name
        if path.exists():
            return path

    # Direct match from BOOK_PATHS
    if book_name in BOOK_PATHS:
        path = BOOK_PATHS[book_name]
        if path.exists():
            return path

    # Try searching by partial name
    sections = [section_hint] if section_hint else ["visibility", "behavioral_science"]
    for section in sections:
        section_dir = BOOKS_DIR / section
        if section_dir.exists():
            for pdf in section_dir.glob("*.pdf"):
                if book_name.lower().replace(".pdf", "") in pdf.name.lower():
                    return pdf

    # Try all sections as fallback
    for section in ["visibility", "behavioral_science"]:
        section_dir = BOOKS_DIR / section
        if section_dir.exists():
            for pdf in section_dir.glob("*.pdf"):
                if book_name.lower().replace(".pdf", "") in pdf.name.lower():
                    return pdf

    return None


def extract_page(pdf_path, page_num, output_path, dpi=200):
    """Extract a single page from a PDF as a PNG image."""
    doc = fitz.open(str(pdf_path))
    if page_num < 1 or page_num > doc.page_count:
        print(f"  WARNING: Page {page_num} out of range (1-{doc.page_count}) for {pdf_path.name}")
        doc.close()
        return False

    page = doc[page_num - 1]  # 0-indexed
    pix = page.get_pixmap(dpi=dpi)
    pix.save(str(output_path))
    doc.close()
    return True


def upload_to_blob(file_path, blob_path):
    """Upload a file to Vercel Blob storage."""
    if not BLOB_TOKEN:
        print("  WARNING: No BLOB_READ_WRITE_TOKEN set, skipping upload")
        return None

    with open(file_path, "rb") as f:
        resp = requests.put(
            f"https://blob.vercel-storage.com/{blob_path}",
            headers={
                "Authorization": f"Bearer {BLOB_TOKEN}",
                "x-api-version": "7",
                "x-content-type": "image/png",
                "x-cache-control-max-age": "31536000",
            },
            data=f,
        )

    if resp.status_code == 200:
        data = resp.json()
        return data.get("url")
    else:
        print(f"  ERROR uploading: {resp.status_code} {resp.text[:200]}")
        return None


def main():
    if not INDEX_FILE.exists():
        print(f"ERROR: {INDEX_FILE} not found. Create it first.")
        sys.exit(1)

    with open(INDEX_FILE) as f:
        index = json.load(f)

    urls = {}
    tmp_dir = Path("/tmp/book-pages")
    tmp_dir.mkdir(exist_ok=True)

    total = sum(len(pages) for pages in index.values())
    done = 0

    for week_key, pages in index.items():
        urls[week_key] = []
        for page_info in pages:
            done += 1
            book = page_info["book"]
            section = page_info.get("section")
            page_num = page_info["page"]
            caption = page_info.get("caption", f"Page {page_num} from {book}")

            book_path = find_book_path(book, section)
            if not book_path:
                print(f"  [{done}/{total}] SKIP: Book not found: {book}")
                continue

            # Extract page
            png_name = f"week-{week_key}-{book.replace('.pdf', '')}-p{page_num}.png"
            tmp_path = tmp_dir / png_name

            print(f"  [{done}/{total}] Extracting {book} p.{page_num}...")
            if not extract_page(book_path, page_num, tmp_path):
                continue

            # Upload to blob
            blob_path = f"book-pages/{png_name}"
            url = upload_to_blob(tmp_path, blob_path)

            if url:
                urls[week_key].append({
                    "book": book,
                    "page": page_num,
                    "caption": caption,
                    "imageUrl": url,
                })
                print(f"    -> Uploaded: {url[:80]}...")
            else:
                # Store local path as fallback
                urls[week_key].append({
                    "book": book,
                    "page": page_num,
                    "caption": caption,
                    "localPath": str(tmp_path),
                })

    # Save URL mapping
    with open(OUTPUT_FILE, "w") as f:
        json.dump(urls, f, indent=2)

    print(f"\nDone! Extracted {done} pages.")
    print(f"URL mapping saved to: {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
