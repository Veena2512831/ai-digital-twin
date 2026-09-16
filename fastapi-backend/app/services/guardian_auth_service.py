import os
from datetime import datetime, timedelta, timezone

import jwt

GUARDIAN_JWT_SECRET = os.getenv("GUARDIAN_JWT_SECRET", "dev-secret-change-me")
GUARDIAN_JWT_ALGORITHM = "HS256"
GUARDIAN_JWT_EXPIRY_HOURS = int(os.getenv("GUARDIAN_JWT_EXPIRY_HOURS", "24"))


def create_guardian_token(guardian_id, email: str) -> str:
    """Issue a short-lived signed session token for a logged-in guardian."""
    payload = {
        "guardian_id": str(guardian_id),
        "email": email,
        "scope": "guardian",
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(hours=GUARDIAN_JWT_EXPIRY_HOURS),
    }
    return jwt.encode(payload, GUARDIAN_JWT_SECRET, algorithm=GUARDIAN_JWT_ALGORITHM)


def decode_guardian_token(token: str) -> dict:
    """
    Decode + validate a guardian session token.
    Raises jwt.ExpiredSignatureError / jwt.InvalidTokenError on failure --
    callers (the FastAPI dependency) translate those into 401s.
    """
    payload = jwt.decode(token, GUARDIAN_JWT_SECRET, algorithms=[GUARDIAN_JWT_ALGORITHM])

    if payload.get("scope") != "guardian":
        raise jwt.InvalidTokenError("Token is not a guardian session token")

    return payload
