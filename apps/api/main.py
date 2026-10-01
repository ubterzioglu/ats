import os
import shutil
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from packages.schemas.resume import ResumeDocument
from packages.schemas.job import JobDescriptionDocument
import sys

# Make services importable
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))
from services.parser.pdf_extractor import extract_text_from_pdf
from services.parser.docx_extractor import extract_text_from_docx
from services.ats_engine.scoring import calculate_ats_score, DEFAULT_SCORING_CONFIG
from services.ai_agent.agent import AIAgent

ai_agent = AIAgent(model="llama3")

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
    Currently only performs raw text extraction.
    """
    filename = file.filename.lower()
    if not filename.endswith((".pdf", ".docx", ".txt")):
        raise HTTPException(status_code=400, detail="Unsupported file type")
    
    # Save uploaded file to temp path
    temp_path = f"/tmp/{file.filename}"
    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        raw_text = ""
        if filename.endswith(".pdf"):
            raw_text = extract_text_from_pdf(temp_path)
        elif filename.endswith(".docx"):
            raw_text = extract_text_from_docx(temp_path)
        elif filename.endswith(".txt"):
            with open(temp_path, "r", encoding="utf-8") as f:
                raw_text = f.read()
                
        # Return canonical model with raw text
        return ResumeDocument(raw_text=raw_text)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

@app.post("/parse/job", response_model=JobDescriptionDocument)
async def parse_job_description(text: str = Form(...)):
    """
    Takes raw job description text and parses it into structured format.
    """
    # TODO: Pass text to NLP/LLM job description parser
    return JobDescriptionDocument(raw_text=text)

@app.post("/analyze")
async def analyze_full_pipeline(file: UploadFile = File(...)):
    """
    Runs the full pipeline:
    1. Parse Resume
    2. Deterministic ATS Scoring
    3. AI Agent Explanation
    """
    filename = file.filename.lower()
    temp_path = f"/tmp/{file.filename}"
    
    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        raw_text = ""
        if filename.endswith(".pdf"):
            raw_text = extract_text_from_pdf(temp_path)
        elif filename.endswith(".docx"):
            raw_text = extract_text_from_docx(temp_path)
            
        # 1. Parse (Stub)
        resume_data = {"raw_text": raw_text, "skills": ["Stub Skill"]}
        job_data = {"required_skills": ["Stub Skill", "Missing Skill"]}
        
        # 2. Score
        score = calculate_ats_score(resume=resume_data, job_description=job_data)
        
        # 3. AI Explain (This is async, might fail if Ollama is off)
        explanation = await ai_agent.explain_score(score)
        
        return {
            "score_data": score,
            "ai_explanation": explanation or "AI explanation unavailable. (Ollama not running or unreachable)"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)
