import os
import shutil
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Body
from pydantic import BaseModel
from packages.schemas.resume import ResumeDocument
from packages.schemas.job import JobDescriptionDocument
import sys
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Body, Depends
from pydantic import BaseModel

# Make services importable
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))
from services.parser.pdf_extractor import extract_text_from_pdf
from services.parser.docx_extractor import extract_text_from_docx
from services.ats_engine.scoring import calculate_ats_score, DEFAULT_SCORING_CONFIG
from services.ai_agent.agent import AIAgent
from apps.api.auth import verify_supabase_token

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
class AnalysisInput(BaseModel):
    cvText: str
    jobDescription: str = ""

@app.post("/analyze")
async def analyze_full_pipeline(payload: AnalysisInput, token_data: dict = Depends(verify_supabase_token)):
    """
    Runs the full pipeline:
    1. Parse Resume (from raw text)
    2. Deterministic ATS Scoring
    3. Return AnalysisResult matching frontend schema
    """
    try:
        raw_text = payload.cvText
        job_ad = payload.jobDescription
        
        # 1. Parse Resume (Stub - assumes basic NLP extracts this)
        resume_data = {"raw_text": raw_text, "skills": ["React", "TypeScript", "Python"]}
        
        # Parse Job Description with AI Agent
        job_data = {"required_skills": []}
        if job_ad:
            parsed_job = await ai_agent.parse_job_description(job_ad)
            job_data["required_skills"] = parsed_job.get("required_skills", [])
            
        # 2. Score
        score = calculate_ats_score(resume=resume_data, job_description=job_data)
        
        # 3. AI Explain (Async)
        explanation = await ai_agent.explain_score(score)
        
        # Construct AnalysisResult matching the TS interface
        return {
            "total": score["overall"],
            "band": "good" if score["overall"] > 70 else "fair",
            "bandLabel": "Good" if score["overall"] > 70 else "Fair",
            "language": "en",
            "dimensions": [
                {
                    "id": "keywords",
                    "label": "Keyword Match",
                    "score": score["overall"],
                    "max": 100,
                    "summary": explanation or "Keywords analyzed by AI."
                }
            ],
            "findings": [
                {
                    "id": "missing-skills",
                    "dimension": "keywords",
                    "severity": "medium",
                    "title": "Missing Required Skills",
                    "detail": f"AI noted missing skills in your resume.",
                    "fix": "Add missing skills identified in the JD.",
                    "cost": 10
                }
            ],
            "keywords": {
                "source": "job-description" if job_ad else "baseline",
                "coverage": 80,
                "matched": [{"term": s, "weight": 1, "hits": 1} for s in resume_data["skills"]],
                "missing": [{"term": "SQL", "weight": 1, "hits": 0}],
                "overused": []
            },
            "sections": [],
            "stats": {
                "characters": len(raw_text),
                "words": len(raw_text.split()),
                "lines": len(raw_text.splitlines()),
                "bulletLines": 0,
                "averageBulletWords": 0,
                "estimatedPages": 1,
                "years": [],
                "experienceMonths": 0
            },
            "generatedAt": "2026-10-01T12:00:00Z"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

