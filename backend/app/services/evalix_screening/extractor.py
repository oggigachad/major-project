"""Evalix Resume Text Extraction & File Validation.

Supports PDF, DOC, and DOCX formats with magic-byte validation and fallback parsers.
"""

import io
import logging
import re
import zipfile
import xml.etree.ElementTree as ET
from typing import Tuple

log = logging.getLogger("evalix.screening.extractor")

MAGIC_PDF = b"%PDF-"
MAGIC_DOCX = b"PK\x03\x04"
MAGIC_DOC = b"\xd0\xcf\x11\xe0"

MAX_RESUME_BYTES = 10 * 1024 * 1024  # 10 MB limit


def validate_file_type(filename: str, content: bytes) -> str:
    """Validate file extension and magic bytes. Returns detected format ('pdf', 'docx', 'doc').

    Raises ValueError if invalid or unsupported.
    """
    if not content or len(content.strip()) == 0:
        raise ValueError("Uploaded file is empty")

    if len(content) > MAX_RESUME_BYTES:
        raise ValueError(f"File exceeds maximum allowed size of {MAX_RESUME_BYTES // (1024*1024)}MB")

    lower_name = (filename or "").lower().strip()

    # Check magic bytes first (Step 13: security - do not trust filename alone)
    if content.startswith(MAGIC_PDF):
        return "pdf"
    elif content.startswith(MAGIC_DOCX):
        return "docx"
    elif content.startswith(MAGIC_DOC):
        return "doc"

    # Fallback to extension check if magic bytes are slightly offset
    if lower_name.endswith(".pdf"):
        if b"%PDF" in content[:1024]:
            return "pdf"
        raise ValueError("Corrupted or invalid PDF file format")
    elif lower_name.endswith(".docx"):
        try:
            with zipfile.ZipFile(io.BytesIO(content)) as zf:
                if "[Content_Types].xml" in zf.namelist():
                    return "docx"
        except Exception:
            pass
        raise ValueError("Corrupted or invalid DOCX file format")
    elif lower_name.endswith(".doc"):
        return "doc"

    raise ValueError("Unsupported file format. Please upload a PDF, DOC, or DOCX document.")


def extract_text_from_pdf(content: bytes) -> str:
    """Extract text from PDF using pypdf, with fallback to regex stream extraction."""
    text_chunks = []
    try:
        import pypdf

        reader = pypdf.PdfReader(io.BytesIO(content))
        if reader.is_encrypted:
            try:
                reader.decrypt("")
            except Exception:
                raise ValueError("PDF is password-protected and cannot be read")

        for page_idx, page in enumerate(reader.pages):
            page_text = page.extract_text() or ""
            if page_text.strip():
                text_chunks.append(page_text.strip())

    except Exception as exc:
        log.warning("pypdf parsing failed: %s. Attempting fallback text extraction.", exc)
        try:
            raw = content.decode("latin1", errors="ignore")
            blocks = re.findall(r"\((.*?)\)\s*T[jJ]", raw)
            if blocks:
                text_chunks.append(" ".join(blocks))
            else:
                words = re.findall(r"[A-Za-z0-9,.:;'\-@]{3,}", raw)
                text_chunks.append(" ".join(words[:2000]))
        except Exception as fallback_exc:
            log.error("Fallback PDF extraction failed: %s", fallback_exc)

    full_text = "\n\n".join(text_chunks).strip()
    if not full_text or len(full_text) < 20:
        raise ValueError("Unable to extract text from PDF (document may be scanned or empty)")

    return full_text


def extract_text_from_docx(content: bytes) -> str:
    """Extract text from DOCX using python-docx, with zipfile XML fallback."""
    text_chunks = []
    try:
        import docx

        doc = docx.Document(io.BytesIO(content))
        for p in doc.paragraphs:
            if p.text.strip():
                text_chunks.append(p.text.strip())
        for table in doc.tables:
            for row in table.rows:
                row_text = " | ".join(cell.text.strip() for cell in row.cells if cell.text.strip())
                if row_text:
                    text_chunks.append(row_text)

    except Exception as exc:
        log.warning("python-docx extraction failed: %s. Using zipfile XML parser.", exc)
        try:
            with zipfile.ZipFile(io.BytesIO(content)) as zf:
                xml_content = zf.read("word/document.xml")
                root = ET.fromstring(xml_content)
                namespaces = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
                for node in root.findall(".//w:t", namespaces):
                    if node.text and node.text.strip():
                        text_chunks.append(node.text.strip())
        except Exception as zip_exc:
            log.error("DOCX XML fallback failed: %s", zip_exc)

    full_text = "\n".join(text_chunks).strip()
    if not full_text or len(full_text) < 20:
        raise ValueError("Unable to extract text from DOCX document")

    return full_text


def extract_text_from_doc(content: bytes) -> str:
    """Extract text from legacy binary DOC files using string analysis."""
    try:
        raw = content.decode("latin1", errors="ignore")
        printable = re.findall(r"[\x20-\x7E\r\n\t]{4,}", raw)
        clean = " ".join(printable)
        words = re.findall(r"[A-Za-z0-9,.:;'\-@]{2,}", clean)
        text = " ".join(words)
        if len(text) >= 20:
            return text
    except Exception as exc:
        log.error("DOC extraction error: %s", exc)

    raise ValueError("Legacy DOC parsing failed. Please upload resume in PDF or DOCX format.")


def extract_resume_text(filename: str, content: bytes) -> Tuple[str, str]:
    """Validate and extract clean text from a resume file.

    Returns:
        (text, format_type)

    Raises:
        ValueError on validation or extraction failure.
    """
    fmt = validate_file_type(filename, content)

    if fmt == "pdf":
        raw_text = extract_text_from_pdf(content)
    elif fmt == "docx":
        raw_text = extract_text_from_docx(content)
    elif fmt == "doc":
        raw_text = extract_text_from_doc(content)
    else:
        raise ValueError(f"Unsupported format: {fmt}")

    cleaned = re.sub(r"[ \t]+", " ", raw_text)
    cleaned = re.sub(r"\n{3,}", "\n\n", cleaned).strip()

    return cleaned, fmt
