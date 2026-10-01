from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from packages.schemas.resume import ResumeDocument
from packages.schemas.job import JobDescriptionDocument

app = FastAPI(
    title="ATS Free For All API",
    description="Backend API for CV Parsing, ATS Scoring, and AI Analysis",
    version="1.0.0"
)

@app.get("/health")
async def health_check():
    return {"status": "ok", "message": "ATS API is running"}

@app.post("/parse/resume", response_model=ResumeDocument)
async def parse_resume(file: UploadFile = File(...)):
    """
    Takes a PDF or DOCX file, extracts text, layout and returns Canonical Resume JSON.
    (This is a placeholder that returns an empty document currently.)
    """
    if not file.filename.endswith((".pdf", ".docx", ".txt")):
        raise HTTPException(status_code=400, detail="Unsupported file type")
    
    # TODO: Pass file to parser service
    return ResumeDocument(raw_text=f"Extracted content of {file.filename} will be here.")

@app.post("/parse/job", response_model=JobDescriptionDocument)
async def parse_job_description(text: str = Form(...)):
    """
    Takes raw job description text and parses it into structured format.
    """
    # TODO: Pass text to NLP/LLM job description parser
    return JobDescriptionDocument(raw_text=text)
