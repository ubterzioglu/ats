import os
from fastapi import Request, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError

SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", "") # Provide via ENV

security = HTTPBearer()

def verify_supabase_token(credentials: HTTPAuthorizationCredentials = Security(security)):
    """
    Verifies the JWT token from Supabase Auth.
    """
    token = credentials.credentials
    if not SUPABASE_JWT_SECRET:
        # If no secret is configured, allow bypass for MVP/dev (or fail strict based on preference)
        # We will bypass if env is missing as per "Free For All" initial state, but typically you'd raise here.
        return {"sub": "anonymous", "role": "anon"}
        
    try:
        payload = jwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            options={"verify_aud": False}
        )
        return payload
    except JWTError as e:
        raise HTTPException(status_code=401, detail=f"Invalid authentication credentials: {str(e)}")
