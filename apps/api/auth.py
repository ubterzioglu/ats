import os
from typing import Optional

from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError

SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", "") # Provide via ENV

# auto_error=False: the product is usable without an account, so a missing
# Authorization header must reach the handler as "anonymous" rather than a 403.
security = HTTPBearer(auto_error=False)

def verify_supabase_token(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security),
):
    """
    Verifies the JWT token from Supabase Auth.
    """
    if credentials is None or not SUPABASE_JWT_SECRET:
        # No secret configured means no identity can be proven; callers get the
        # anonymous principal and must not treat it as authenticated.
        return {"sub": "anonymous", "role": "anon"}

    token = credentials.credentials

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
