from typing import Optional

import jwt
from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database.session import get_db
from database.models import Guardian, Student

from app.api.routes import hash_password, verify_password

from app.services.guardian_auth_service import (
    create_guardian_token,
    decode_guardian_token,
)
from app.services.guardian_access_service import (
    get_authorized_students,
    assert_guardian_can_access,
    serialize_student_summary,
    get_guardian_progress_view,
)

router = APIRouter(prefix="/guardian", tags=["guardian"])


# ============================================================
# SCHEMAS
# ============================================================

class GuardianSignup(BaseModel):
    email: str
    full_name: str
    password: str


class GuardianLogin(BaseModel):
    email: str
    password: str


# ============================================================
# AUTH DEPENDENCY (this is the scope gate every route below uses)
# ============================================================

def get_current_guardian(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
) -> Guardian:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing guardian token")

    token = authorization.split(" ", 1)[1]

    try:
        payload = decode_guardian_token(token)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Guardian session expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid guardian token")

    guardian = (
        db.query(Guardian)
        .filter(Guardian.guardian_id == payload["guardian_id"])
        .first()
    )

    if not guardian:
        raise HTTPException(status_code=401, detail="Guardian account not found")

    return guardian


# ============================================================
# SIGNUP / LOGIN
# ============================================================

@router.post("/signup")
def guardian_signup(payload: GuardianSignup, db: Session = Depends(get_db)):
    # Only allow signup for an email that's already listed as a guardian_email
    # on at least one student. Stops a random person from registering as
    # "guardian" of a student they have no connection to.
    linked_student = (
        db.query(Student)
        .filter(Student.guardian_email == payload.email)
        .first()
    )

    if not linked_student:
        raise HTTPException(
            status_code=400,
            detail="This email is not registered as a guardian on any student account",
        )

    existing = db.query(Guardian).filter(Guardian.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Guardian account already exists")

    guardian = Guardian(
        email=payload.email,
        full_name=payload.full_name,
        password_hash=hash_password(payload.password),
    )
    db.add(guardian)
    db.commit()
    db.refresh(guardian)

    return {"success": True, "message": "Guardian account created. Please log in."}


@router.post("/login")
def guardian_login(payload: GuardianLogin, db: Session = Depends(get_db)):
    guardian = db.query(Guardian).filter(Guardian.email == payload.email).first()

    if not guardian or not verify_password(payload.password, guardian.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_guardian_token(guardian.guardian_id, guardian.email)

    return {
        "success": True,
        "access_token": token,
        "token_type": "bearer",
        "guardian": {
            "guardian_id": str(guardian.guardian_id),
            "email": guardian.email,
            "full_name": guardian.full_name,
        },
    }


# ============================================================
# SCOPE-GATED READ-ONLY ENDPOINTS
# ============================================================

@router.get("/students")
def list_my_students(
    guardian: Guardian = Depends(get_current_guardian),
    db: Session = Depends(get_db),
):
    students = get_authorized_students(db, guardian.email)
    return {"students": [serialize_student_summary(s) for s in students]}


@router.get("/students/{student_id}/progress")
def student_progress(
    student_id: str,
    guardian: Guardian = Depends(get_current_guardian),
    db: Session = Depends(get_db),
):
    student = assert_guardian_can_access(db, guardian.email, student_id)
    return get_guardian_progress_view(db, student)
