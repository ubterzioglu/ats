import sys
import os
from typing import Dict, Any

# Make packages importable
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))
from packages.skill_taxonomy.taxonomy import taxonomy_engine

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
    
    # Real implementation for required_skills using taxonomy
    req_skills_score = 0
    matched_skills = []
    missing_skills = []
    
    cv_skills_raw = resume.get("skills", [])
    jd_skills_raw = job_description.get("required_skills", [])
    
    # Normalize CV skills
    cv_normalized = set()
    for s in cv_skills_raw:
        norm = taxonomy_engine.normalize(s)
        cv_normalized.add(norm if norm else s.lower())
        
    for req_skill in jd_skills_raw:
        norm_req = taxonomy_engine.normalize(req_skill)
        target = norm_req if norm_req else req_skill.lower()
        
        if target in cv_normalized:
            matched_skills.append(req_skill)
        else:
            # Check related/aliases if strict match fails
            related = taxonomy_engine.get_related(req_skill)
            if any(r.lower() in cv_normalized for r in related):
                matched_skills.append(req_skill) # Matched via relation
            else:
                missing_skills.append(req_skill)
                
    max_req_score = config.get("required_skills", 25)
    
    if jd_skills_raw:
        req_skills_score = int((len(matched_skills) / len(jd_skills_raw)) * max_req_score)
    else:
        req_skills_score = max_req_score
        
    components.append({
        "name": "required_skills",
        "score": req_skills_score,
        "max": max_req_score,
        "matched": matched_skills,
        "missing": missing_skills,
        "evidence": [f"Found {len(matched_skills)} out of {len(jd_skills_raw)} required skills."]
    })
    total_score += req_skills_score
    
    # Calculate overall score out of 100
    overall = min(total_score, 100)
    
    return {
        "overall": overall,
        "components": components
    }
