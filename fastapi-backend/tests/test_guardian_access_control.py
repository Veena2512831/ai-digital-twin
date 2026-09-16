import os
import sys
import uuid

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

import jwt
import pytest
from fastapi import HTTPException

from database.session import SessionLocal
from database.models import Student, Guardian, StudentMastery

from app.api.routes import hash_password
from app.services.guardian_auth_service import (
    create_guardian_token,
    decode_guardian_token,
)
from app.services.guardian_access_service import (
    assert_guardian_can_access,
    get_guardian_progress_view,
    get_authorized_students,
)


def _make_student(db, guardian_email=None):
    student = Student(
        email=f"test_{uuid.uuid4()}@example.com",
        full_name="Test Student",
        guardian_email=guardian_email,
    )
    db.add(student)
    db.commit()
    db.refresh(student)
    return student


def _make_guardian(db, email):
    guardian = Guardian(
        email=email,
        full_name="Test Guardian",
        password_hash=hash_password("testpass123"),
    )
    db.add(guardian)
    db.commit()
    db.refresh(guardian)
    return guardian


def test_authorized_guardian_can_access_linked_student():
    db = SessionLocal()
    try:
        guardian_email = f"guardian_{uuid.uuid4()}@example.com"
        guardian = _make_guardian(db, guardian_email)
        student = _make_student(db, guardian_email=guardian_email)

        accessed = assert_guardian_can_access(db, guardian.email, str(student.student_id))
        assert accessed.student_id == student.student_id

        linked = get_authorized_students(db, guardian.email)
        assert student.student_id in [s.student_id for s in linked]

        print("Authorized access test passed!")
    finally:
        db.rollback()
        db.query(Student).filter(Student.full_name == "Test Student").delete()
        db.query(Guardian).filter(Guardian.full_name == "Test Guardian").delete()
        db.commit()
        db.close()


def test_unauthorized_guardian_is_denied_403():
    db = SessionLocal()
    try:
        guardian_email = f"guardian_{uuid.uuid4()}@example.com"
        other_guardian_email = f"other_{uuid.uuid4()}@example.com"

        guardian = _make_guardian(db, guardian_email)
        student = _make_student(db, guardian_email=other_guardian_email)

        with pytest.raises(HTTPException) as exc_info:
            assert_guardian_can_access(db, guardian.email, str(student.student_id))

        assert exc_info.value.status_code == 403
        print("Unauthorized access correctly denied (403)!")
    finally:
        db.rollback()
        db.query(Student).filter(Student.full_name == "Test Student").delete()
        db.query(Guardian).filter(Guardian.full_name == "Test Guardian").delete()
        db.commit()
        db.close()


def test_unlinked_student_guardian_email_is_denied():
    """Student with no guardian_email at all must never be accessible."""
    db = SessionLocal()
    try:
        guardian_email = f"guardian_{uuid.uuid4()}@example.com"
        guardian = _make_guardian(db, guardian_email)
        student = _make_student(db, guardian_email=None)

        with pytest.raises(HTTPException) as exc_info:
            assert_guardian_can_access(db, guardian.email, str(student.student_id))

        assert exc_info.value.status_code == 403
        print("Student with no guardian_email correctly inaccessible!")
    finally:
        db.rollback()
        db.query(Student).filter(Student.full_name == "Test Student").delete()
        db.query(Guardian).filter(Guardian.full_name == "Test Guardian").delete()
        db.commit()
        db.close()


def test_nonexistent_student_returns_404():
    db = SessionLocal()
    try:
        guardian_email = f"guardian_{uuid.uuid4()}@example.com"
        guardian = _make_guardian(db, guardian_email)

        with pytest.raises(HTTPException) as exc_info:
            assert_guardian_can_access(db, guardian.email, str(uuid.uuid4()))

        assert exc_info.value.status_code == 404
        print("Nonexistent student correctly returns 404!")
    finally:
        db.rollback()
        db.query(Guardian).filter(Guardian.full_name == "Test Guardian").delete()
        db.commit()
        db.close()


def test_progress_view_never_leaks_private_fields():
    """
    Guardrail test: the guardian-facing payload must never contain raw
    chunk text, embeddings, or document content -- only aggregated fields.
    """
    db = SessionLocal()
    try:
        guardian_email = f"guardian_{uuid.uuid4()}@example.com"
        student = _make_student(db, guardian_email=guardian_email)

        mastery = StudentMastery(
            student_id=student.student_id,
            subject="Physics",
            topic="Kinematics",
            correct_answers=3,
            total_questions=5,
            mastery_score=0.6,
        )
        db.add(mastery)
        db.commit()

        view = get_guardian_progress_view(db, student)

        forbidden_keys = {"text_content", "embedding", "content", "raw_text"}
        payload_keys = set(view.keys())
        for topic in view["topics"]:
            payload_keys |= set(topic.keys())

        assert forbidden_keys.isdisjoint(payload_keys), (
            f"Guardian payload leaked private fields: {forbidden_keys & payload_keys}"
        )
        assert view["overall_mastery"] == 0.6
        assert view["topics"][0]["subject"] == "Physics"

        print("Progress view privacy guardrail test passed!")
    finally:
        db.rollback()
        db.query(StudentMastery).filter(StudentMastery.student_id == student.student_id).delete()
        db.query(Student).filter(Student.student_id == student.student_id).delete()
        db.commit()
        db.close()


def test_jwt_token_round_trip_and_expiry_scope():
    guardian_id = uuid.uuid4()
    token = create_guardian_token(guardian_id, "parent@example.com")

    payload = decode_guardian_token(token)
    assert payload["guardian_id"] == str(guardian_id)
    assert payload["scope"] == "guardian"

    with pytest.raises(jwt.InvalidTokenError):
        decode_guardian_token(token + "tampered")

    print("JWT round-trip and tamper-rejection test passed!")


if __name__ == "__main__":
    test_authorized_guardian_can_access_linked_student()
    test_unauthorized_guardian_is_denied_403()
    test_unlinked_student_guardian_email_is_denied()
    test_nonexistent_student_returns_404()
    test_progress_view_never_leaks_private_fields()
    test_jwt_token_round_trip_and_expiry_scope()
