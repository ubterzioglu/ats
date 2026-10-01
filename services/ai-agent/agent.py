import json
from typing import Dict, Any, Optional
from .providers.ollama.client import generate_completion
from .prompts.prompts import EXPLAIN_SCORE_PROMPT, REWRITE_BULLET_PROMPT, PARSE_JOB_DESCRIPTION_PROMPT, PARSE_RESUME_PROMPT

class AIAgent:
    def __init__(self, model: str = "llama3"):
        self.model = model
        
    async def explain_score(self, score_data: Dict[str, Any]) -> Optional[str]:
        """
        Takes the deterministic score JSON and uses the AI to explain it to the user.
        """
        score_json_str = json.dumps(score_data, indent=2)
        prompt = EXPLAIN_SCORE_PROMPT.format(score_json=score_json_str)
        
        explanation = await generate_completion(prompt=prompt, model=self.model, temperature=0.3)
        return explanation
        
    async def rewrite_bullet(self, bullet: str, keywords: list[str]) -> Optional[str]:
        """
        Rewrites a resume bullet point to make it more impactful and keyword-rich.
        """
        keywords_str = ", ".join(keywords)
        prompt = REWRITE_BULLET_PROMPT.format(bullet=bullet, keywords=keywords_str)
        
        rewritten = await generate_completion(prompt=prompt, model=self.model, temperature=0.7)
        return rewritten
        
    async def parse_job_description(self, text: str) -> Dict[str, Any]:
        """
        Uses LLM to extract structured data from raw job description text.
        """
        prompt = PARSE_JOB_DESCRIPTION_PROMPT.format(text=text)
        result = await generate_completion(prompt=prompt, model=self.model, temperature=0.1)
        
        try:
            if result:
                cleaned = result.replace("```json", "").replace("```", "").strip()
                return json.loads(cleaned)
        except Exception as e:
            print(f"Failed to parse job description JSON: {e}")
            
        return {"title": None, "required_skills": [], "preferred_skills": []}

    async def parse_resume_data(self, text: str) -> Dict[str, Any]:
        """
        Uses LLM to extract structured data (skills, etc.) from raw resume text.
        """
        prompt = PARSE_RESUME_PROMPT.format(text=text)
        result = await generate_completion(prompt=prompt, model=self.model, temperature=0.1)
        
        try:
            if result:
                cleaned = result.replace("```json", "").replace("```", "").strip()
                return json.loads(cleaned)
        except Exception as e:
            print(f"Failed to parse resume JSON: {e}")
            
        return {"skills": [], "experience_years": 0, "education_level": None}
