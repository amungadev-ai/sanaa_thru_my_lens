#!/usr/bin/env python3
"""Read all .docx articles and extract structured content."""
import os
import json
from docx import Document
from pathlib import Path

UPLOAD_DIR = Path("/home/z/my-project/upload")
OUTPUT_FILE = Path("/home/z/my-project/scripts/articles_extracted.json")

def extract_article(file_path: Path) -> dict:
    """Extract paragraphs and structure from a .docx file."""
    doc = Document(str(file_path))
    
    paragraphs = []
    for para in doc.paragraphs:
        text = para.text.strip()
        if not text:
            continue
        
        style_name = para.style.name if para.style else "Normal"
        paragraphs.append({
            "text": text,
            "style": style_name,
        })
    
    # Try to identify title (first heading or first paragraph)
    title = file_path.stem
    if paragraphs:
        # If first paragraph is a heading, use it as title
        first = paragraphs[0]
        if "Heading" in first["style"] or "Title" in first["style"]:
            title = first["text"]
            paragraphs = paragraphs[1:]
        elif len(paragraphs[0]["text"]) < 200:
            # Use first short paragraph as title
            title = first["text"]
            paragraphs = paragraphs[1:]
    
    # Clean title from filename artifacts
    if title == file_path.stem:
        title = file_path.stem.replace("_", " ").replace("  ", " ")
    
    return {
        "filename": file_path.name,
        "title": title,
        "paragraphs": paragraphs,
        "word_count": sum(len(p["text"].split()) for p in paragraphs),
    }

def main():
    articles = []
    docx_files = sorted(UPLOAD_DIR.glob("*.docx"))
    
    print(f"Found {len(docx_files)} .docx files")
    
    for file_path in docx_files:
        print(f"Reading: {file_path.name}")
        article = extract_article(file_path)
        articles.append(article)
        print(f"  - Title: {article['title']}")
        print(f"  - Paragraphs: {len(article['paragraphs'])}")
        print(f"  - Word count: {article['word_count']}")
    
    OUTPUT_FILE.write_text(json.dumps(articles, indent=2, ensure_ascii=False))
    print(f"\nExtracted {len(articles)} articles to {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
