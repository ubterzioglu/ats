import json
from typing import Dict, Any, Optional
from .providers.ollama.client import generate_completion
from .prompts.prompts import EXPLAIN_SCORE_PROMPT, REWRITE_BULLET_PROMPT

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
