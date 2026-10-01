import numpy as np

def cosine_similarity(vec1: list[float], vec2: list[float]) -> float:
    """
    Calculates the cosine similarity between two vectors.
    """
    v1 = np.array(vec1)
    v2 = np.array(vec2)
    
    if np.linalg.norm(v1) == 0 or np.linalg.norm(v2) == 0:
        return 0.0
        
    return float(np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2)))

async def match_semantic_similarity(resume_embeddings: list[list[float]], job_embeddings: list[list[float]]) -> float:
    """
    Simulates semantic matching (Layer 3) as described in the technical plan.
    Matches CV experience/skills against Job Description requirements.
    Normally this would be done directly in Postgres using pgvector operators (e.g. <->, <=>),
    but this provides a programmatic fallback for scoring.
    """
    if not resume_embeddings or not job_embeddings:
        return 0.0
        
    # Basic greedy matching: for each job requirement, find the best matching resume chunk
    total_score = 0.0
    for req_vec in job_embeddings:
        best_match = max(cosine_similarity(req_vec, res_vec) for res_vec in resume_embeddings)
        total_score += best_match
        
    # Average semantic satisfaction
    return (total_score / len(job_embeddings)) * 100.0
