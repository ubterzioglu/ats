from typing import Dict, Any

# Initial weights based on Technical Plan Section 16
DEFAULT_SCORING_CONFIG = {
    "parseability": 15,
    "required_skills": 25,
    "preferred_skills": 10,
    "experience": 15,
    "semantic": 10,
    "achievements": 10,
    "completeness": 5,
    "education": 5,
    "language_location": 5,
}

def calculate_ats_score(resume: Dict[str, Any], job_description: Dict[str, Any], config: Dict[str, int] = DEFAULT_SCORING_CONFIG) -> Dict[str, Any]:
    """
    Deterministic ATS scoring engine.
    This will take the Canonical Resume JSON and Canonical Job JSON to produce a score.
    """
    total_score = 0
    components = []
    
    # Placeholder logic for required_skills
    # In reality, this would intersect resume.skills and job.required_skills
    req_skills_score = config.get("required_skills", 0)
    components.append({
        "name": "required_skills",
        "score": req_skills_score, # stub
        "max": config.get("required_skills", 25),
        "matched": [],
        "missing": [],
        "evidence": ["Stub implementation"]
    })
    total_score += req_skills_score
    
    # Calculate overall score out of 100
    overall = min(total_score, 100)
    
    return {
        "overall": overall,
        "components": components
    }
