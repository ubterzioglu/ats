import docx

def extract_text_from_docx(file_path: str) -> str:
    """
    Extracts raw text from a DOCX file using python-docx.
    """
    try:
        doc = docx.Document(file_path)
        text_content = [paragraph.text for paragraph in doc.paragraphs]
        return "\n".join(text_content)
    except Exception as e:
        raise ValueError(f"Failed to read DOCX: {str(e)}")
