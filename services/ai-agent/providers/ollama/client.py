import os
import httpx
from typing import Dict, Any, Optional

OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")

async def generate_completion(prompt: str, model: str = "llama3", temperature: float = 0.7) -> Optional[str]:
    """
    Calls the local Ollama instance to generate a completion.
    """
    url = f"{OLLAMA_HOST}/api/generate"
    payload = {
        "model": model,
        "prompt": prompt,
        "temperature": temperature,
        "stream": False
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, json=payload, timeout=60.0)
            response.raise_for_status()
            data = response.json()
            return data.get("response", "")
        except Exception as e:
            print(f"Error calling Ollama: {e}")
            return None
