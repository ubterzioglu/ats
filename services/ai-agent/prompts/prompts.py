EXPLAIN_SCORE_PROMPT = """
You are an expert HR and ATS (Applicant Tracking System) consultant.
A deterministic ATS Engine has analyzed a candidate's resume against a Job Description.
Here is the JSON output from the engine:
{score_json}

Your task:
1. Explain in simple terms why the candidate received this overall score.
2. Highlight the most critical missing requirements.
3. Keep the tone professional, encouraging, and objective.
4. Do NOT invent new skills the candidate does not have.
"""

REWRITE_BULLET_PROMPT = """
You are an expert Resume Writer.
The user wants to improve the following bullet point from their resume to better align with ATS standards.
Current Bullet: "{bullet}"
Job Target Keywords: {keywords}

Your task:
1. Rewrite the bullet point to include quantified results and action verbs.
2. Incorporate the relevant keywords naturally.
3. Return ONLY the rewritten bullet point.
"""

PARSE_JOB_DESCRIPTION_PROMPT = """
You are an expert technical recruiter and ATS specialist.
Extract the key requirements from the following Job Description text and output ONLY valid JSON.
Do not wrap the JSON in markdown blocks like ```json.

Schema Required:
{
  "title": "Extracted Job Title",
  "required_skills": ["skill1", "skill2"],
  "preferred_skills": ["skill3", "skill4"]
}

Job Description Text:
{text}
"""

PARSE_RESUME_PROMPT = """
You are an expert ATS parsing engine.
Extract the structured information from the following Resume/CV text and output ONLY valid JSON.
Do not wrap the JSON in markdown blocks like ```json.

Schema Required:
{
  "skills": ["skill1", "skill2"],
  "experience_years": 5,
  "education_level": "Bachelor's"
}

Resume Text:
{text}
"""
