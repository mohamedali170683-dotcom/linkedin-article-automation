#!/usr/bin/env python3
"""
Extract charts and figures from research books as cropped PNG images and upload to Vercel Blob.

Usage:
  python3 scripts/extract-book-pages.py --token vercel_blob_xxx
  python3 scripts/extract-book-pages.py --token vercel_blob_xxx --preview  # local only, no upload
  python3 scripts/extract-book-pages.py --token vercel_blob_xxx --week 5   # single week

This script:
1. Reads book-pages-index.json (topic -> book pages with crop regions)
2. Extracts and crops each page to isolate charts/figures
3. Uploads cropped images to Vercel Blob storage
4. Outputs book-pages-urls.json with permanent URLs

Crop format in index: "crop": [left%, top%, right%, bottom%]
  - Percentages of page dimensions (0-100)
  - Example: [0, 30, 55, 95] = left half, bottom 65% of page

Requirements:
  pip3 install pymupdf requests
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
parser = argparse.ArgumentParser(description="Extract charts/figures from research books")
parser.add_argument("--token", help="Vercel Blob read/write token")
parser.add_argument("--preview", action="store_true", help="Preview mode: extract locally without uploading")
parser.add_argument("--week", type=str, help="Extract only a specific week number")
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
if not BLOB_TOKEN and not args.preview:
    print("ERROR: Provide BLOB_READ_WRITE_TOKEN via --token flag or use --preview for local testing")
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
    if section_hint:
        path = BOOKS_DIR / section_hint / book_name
        if path.exists():
            return path

    if book_name in BOOK_PATHS:
        path = BOOK_PATHS[book_name]
        if path.exists():
            return path

    sections = [section_hint] if section_hint else ["visibility", "behavioral_science"]
    for section in sections:
        section_dir = BOOKS_DIR / section
        if section_dir.exists():
            for pdf in section_dir.glob("*.pdf"):
                if book_name.lower().replace(".pdf", "") in pdf.name.lower():
                    return pdf

    for section in ["visibility", "behavioral_science"]:
        section_dir = BOOKS_DIR / section
        if section_dir.exists():
            for pdf in section_dir.glob("*.pdf"):
                if book_name.lower().replace(".pdf", "") in pdf.name.lower():
                    return pdf

    return None


def extract_cropped_page(pdf_path, page_num, output_path, crop=None, dpi=250):
    """Extract a cropped region from a PDF page as a PNG image.

    Args:
        pdf_path: Path to the PDF file
        page_num: 1-indexed page number
        output_path: Where to save the PNG
        crop: [left%, top%, right%, bottom%] percentages (0-100), or None for full page
        dpi: Resolution for rendering
    """
    doc = fitz.open(str(pdf_path))
    if page_num < 1 or page_num > doc.page_count:
        print(f"  WARNING: Page {page_num} out of range (1-{doc.page_count}) for {pdf_path.name}")
        doc.close()
        return False

    page = doc[page_num - 1]
    page_rect = page.rect

    if crop:
        left_pct, top_pct, right_pct, bottom_pct = crop
        clip = fitz.Rect(
            page_rect.x0 + (page_rect.width * left_pct / 100),
            page_rect.y0 + (page_rect.height * top_pct / 100),
            page_rect.x0 + (page_rect.width * right_pct / 100),
            page_rect.y0 + (page_rect.height * bottom_pct / 100),
        )
        pix = page.get_pixmap(dpi=dpi, clip=clip)
    else:
        pix = page.get_pixmap(dpi=dpi)

    pix.save(str(output_path))
    doc.close()
    return True


def upload_to_blob(file_path, blob_path):
    """Upload a file to Vercel Blob storage."""
    if not BLOB_TOKEN:
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
        print(f"ERROR: {INDEX_FILE} not found.")
        sys.exit(1)

    with open(INDEX_FILE) as f:
        index = json.load(f)

    # Load existing URLs if doing single-week update
    urls = {}
    if args.week and OUTPUT_FILE.exists():
        with open(OUTPUT_FILE) as f:
            urls = json.load(f)

    tmp_dir = Path("/tmp/book-pages-charts")
    tmp_dir.mkdir(exist_ok=True)

    # Filter to single week if specified
    weeks_to_process = {args.week: index[args.week]} if args.week else index

    total = sum(len(pages) for pages in weeks_to_process.values())
    done = 0

    for week_key, pages in weeks_to_process.items():
        urls[week_key] = []
        for entry_idx, page_info in enumerate(pages):
            done += 1
            book = page_info["book"]
            section = page_info.get("section")
            page_num = page_info["page"]
            caption = page_info.get("caption", f"Page {page_num} from {book}")
            crop = page_info.get("crop")

            book_path = find_book_path(book, section)
            if not book_path:
                print(f"  [{done}/{total}] SKIP: Book not found: {book}")
                continue

            crop_tag = f"-chart{entry_idx}" if crop else f"-full{entry_idx}"
            png_name = f"week-{week_key}-{book.replace('.pdf', '')}-p{page_num}{crop_tag}.png"
            tmp_path = tmp_dir / png_name

            crop_desc = f" crop={crop}" if crop else " (full page)"
            print(f"  [{done}/{total}] Extracting {book} p.{page_num}{crop_desc}...")

            if not extract_cropped_page(book_path, page_num, tmp_path, crop=crop):
                continue

            file_size_kb = tmp_path.stat().st_size / 1024
            print(f"    Size: {file_size_kb:.0f}KB")

            if args.preview:
                urls[week_key].append({
                    "book": book,
                    "page": page_num,
                    "caption": caption,
                    "localPath": str(tmp_path),
                })
                print(f"    -> Preview saved: {tmp_path}")
            else:
                blob_path = f"book-charts/{png_name}"
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
                    urls[week_key].append({
                        "book": book,
                        "page": page_num,
                        "caption": caption,
                        "localPath": str(tmp_path),
                    })

    with open(OUTPUT_FILE, "w") as f:
        json.dump(urls, f, indent=2)

    print(f"\nDone! Processed {done} chart extractions.")
    print(f"URL mapping saved to: {OUTPUT_FILE}")
    if args.preview:
        print(f"Preview images in: {tmp_dir}")


if __name__ == "__main__":
    main()
