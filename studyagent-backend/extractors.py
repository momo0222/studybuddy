
# PDF/OCR libs
import pdfplumber
from pdf2image import convert_from_path
import pytesseract
from PyPDF2 import PdfReader
from PIL import Image
# -------------------------------------------------------------------
# Extractor Helpers
# -------------------------------------------------------------------
def extract_text_from_pdf(filepath: str) -> str:
    """Try to extract text from a PDF. Use PyPDF2/pdfplumber first, fallback to OCR if needed."""
    text = ""

    # 1. Try pdfplumber
    try:
        with pdfplumber.open(filepath) as pdf:
            extracted = [page.extract_text() or "" for page in pdf.pages]
            text = "\n".join(extracted).strip()
    except Exception as e:
        print(f"pdfplumber failed: {e}")
        text = ""

    # 2. Try PyPDF2 if pdfplumber failed
    if not text.strip():
        try:
            reader = PdfReader(filepath)
            for page in reader.pages:
                text += page.extract_text() or ""
        except Exception as e:
            print(f"PyPDF2 failed: {e}")

    # 3. OCR fallback
    if not text.strip():
        try:
            images = convert_from_path(filepath)
            ocr_texts = [pytesseract.image_to_string(img) for img in images]
            text = "\n".join(ocr_texts)
        except Exception as e:
            print(f"OCR failed: {e}")
            text = ""

    return text.strip()


def extract_text_from_image(file) -> str:
    """Extract text from an uploaded image file."""
    try:
        image = Image.open(file.stream)
        return pytesseract.image_to_string(image)
    except Exception as e:
        print(f"OCR image failed: {e}")
        return ""

