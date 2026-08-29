"""BNHS PDF Document Ingestion and Chunking Module.
Loads the BNHS master PDF, cleans the text, extracts section metadata,
and splits it into coherent semantic chunks.
"""

import os
import re
from pathlib import Path
from typing import List, Optional
import pypdf
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter

from src.config import Config


def clean_page_text(raw_text: str) -> str:
    """Cleans raw text extracted from PDF pages.
    
    Removes repetitive header/footer artifacts, normalizes whitespace,
    and strips unwanted formatting noise while preserving paragraphs.
    """
    if not raw_text:
        return ""

    lines = raw_text.split("\n")
    cleaned_lines = []

    for line in lines:
        stripped = line.strip()

        # Skip document title repeated headers and raw metadata markers
        if "BNHS Master Clean RAG Knowledge Base" in stripped:
            continue
        if re.match(r"^Page\s+\d+$", stripped, re.IGNORECASE):
            continue
        if stripped.startswith("RAG metadata:"):
            continue

        if stripped:
            cleaned_lines.append(stripped)

    # Reassemble and normalize spacing
    text = "\n".join(cleaned_lines)
    
    # Replace 3 or more consecutive newlines with two
    text = re.sub(r"\n{3,}", "\n\n", text)
    
    # Clean multiple spaces into single space
    text = re.sub(r"[ \t]+", " ", text)

    return text.strip()


def extract_section_title(raw_text: str, page_num: int) -> str:
    """Extracts the section / topic title from the page content."""
    lines = [line.strip() for line in raw_text.split("\n") if line.strip()]
    
    # Check for numbered section headers like '02 — Nature Activities: Bird & Nature Walks'
    for line in lines[:6]:
        match = re.match(r"^\d{2}\s*—\s*(.+)$", line)
        if match:
            return match.group(1).strip()
    
    # Check for prominent first line headers if page 1
    if page_num == 1:
        return "Corpus Guide & BNHS Overview"

    return f"BNHS Knowledge - Page {page_num}"


def load_pdf_pages(pdf_path: Optional[Path | str] = None) -> List[Document]:
    """Loads a PDF document page-by-page, cleans text, and attaches page metadata.
    
    Args:
        pdf_path: Path to the target PDF file. Defaults to Config.DEFAULT_PDF_PATH.
        
    Returns:
        List of LangChain Document objects representing pages.
    """
    target_path = Path(pdf_path) if pdf_path else Config.DEFAULT_PDF_PATH

    if not target_path.exists():
        raise FileNotFoundError(
            f"PDF file not found at '{target_path}'. "
            f"Please ensure the file exists or configure PDF_FILENAME in .env."
        )

    reader = pypdf.PdfReader(str(target_path))
    total_pages = len(reader.pages)
    documents: List[Document] = []
    file_name = target_path.name

    for page_idx, page in enumerate(reader.pages):
        page_number = page_idx + 1
        raw_text = page.extract_text() or ""
        
        section_title = extract_section_title(raw_text, page_number)
        cleaned_content = clean_page_text(raw_text)

        if not cleaned_content:
            continue

        doc = Document(
            page_content=cleaned_content,
            metadata={
                "source": file_name,
                "file_path": str(target_path),
                "page": page_number,
                "section": section_title,
                "total_pages": total_pages,
            },
        )
        documents.append(doc)

    print(f" Loaded {len(documents)} valid pages from '{file_name}' (out of {total_pages} pages).")
    return documents


def chunk_documents(
    documents: List[Document],
    chunk_size: int = Config.CHUNK_SIZE,
    chunk_overlap: int = Config.CHUNK_OVERLAP,
) -> List[Document]:
    """Splits loaded page documents into smaller, semantically coherent chunks.
    
    Args:
        documents: List of page Document objects.
        chunk_size: Maximum characters per chunk.
        chunk_overlap: Overlapping characters between adjacent chunks.
        
    Returns:
        List of chunked Document objects with updated metadata.
    """
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n", ". ", "; ", ", ", " "],
        keep_separator=True,
    )

    chunks: List[Document] = []
    for doc in documents:
        page_chunks = splitter.split_documents([doc])
        for idx, chunk in enumerate(page_chunks):
            # Assign unique chunk_id and preserve metadata
            chunk.metadata["chunk_id"] = f"{doc.metadata['source']}_p{doc.metadata['page']}_c{idx + 1}"
            chunks.append(chunk)

    print(f" Created {len(chunks)} chunks (chunk_size={chunk_size}, overlap={chunk_overlap}).")
    return chunks


def ingest_pdf(
    pdf_path: Optional[Path | str] = None,
    chunk_size: int = Config.CHUNK_SIZE,
    chunk_overlap: int = Config.CHUNK_OVERLAP,
) -> List[Document]:
    """Complete ingestion pipeline: Loads PDF, cleans text, and splits into chunks.
    
    Args:
        pdf_path: Optional custom path to PDF file.
        chunk_size: Chunk size in characters.
        chunk_overlap: Chunk overlap in characters.
        
    Returns:
        List of processed Document chunks ready for embedding.
    """
    print("=" * 60)
    print(" Starting BNHS Document Ingestion...")
    print("=" * 60)
    pages = load_pdf_pages(pdf_path)
    chunks = chunk_documents(pages, chunk_size=chunk_size, chunk_overlap=chunk_overlap)
    print(f" Ingestion complete: {len(pages)} pages -> {len(chunks)} chunks.")
    print("=" * 60)
    return chunks


if __name__ == "__main__":
    import sys
    custom_pdf = sys.argv[1] if len(sys.argv) > 1 else None
    result_chunks = ingest_pdf(custom_pdf)
    if result_chunks:
        print("\n--- Sample First Chunk ---")
        print(f"Metadata: {result_chunks[0].metadata}")
        print(f"Content:\n{result_chunks[0].page_content[:300]}...")
