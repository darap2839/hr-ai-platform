import pdfplumber
from docx import Document
import os

def extract_text_from_pdf(file_path: str) -> str:
    text = ""
    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            text += page.extract_text() or ""
    return text

def extract_text_from_docx(file_path: str) -> str:
    if not os.path.exists(file_path):
        return ""
    doc = Document(file_path)
    return "\n".join([para.text for para in doc.paragraphs])