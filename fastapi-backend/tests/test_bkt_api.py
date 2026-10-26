"""
tests/test_bkt_api.py

HTTP-level tests for the BKT mastery endpoints:
  POST /api/v1/mastery/update
  GET  /api/v1/mastery/{student_id}
  GET  /api/v1/mastery-history/{student_id}
  POST /api/v1/tests/{test_id}/submit  (side effect: BKT update)

Runs against the real app + real Postgres (twin_db). No mocking.
"""

import os
import sys
import uuid

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

import pytest
from fastapi.testclient import TestClient

from app.main import app
from database.session import SessionLocal
from database.models import Student, StudentMastery, MasterySnapshot
from app.services.mastery_service import update_bkt_probability, BKT_P_L0

client = TestClient(app)

# All routes are mounted at /api/v1 in app/main.py
API = "/api/v1"


@pytest.fixture
def student():
    """Creates a throwaway student, yields its id (str), then cleans up."""
    db = SessionLocal()
    s = Student(
        email=f"bkt_test_{uuid.uuid4()}@example.com",
        full_name="BKT Test Student",
    )
    db.add(s)
    db.commit()
    db.refresh(s)
    student_id = str(s.student_id)
    try:
        yield student_id
    finally:
        db.query(MasterySnapshot).filter(
            MasterySnapshot.student_id == s.student_id
        ).delete()
        db.query(StudentMastery).filter(
            StudentMastery.student_id == s.student_id
        ).delete()
        db.query(Student).filter(
            Student.student_id == s.student_id
        ).delete()
        db.commit()
        db.close()


# ------------------------------------------------------------------
# POST /api/v1/mastery/update
# ------------------------------------------------------------------

def test_mastery_update_success_first_update(student):
    payload = {
        "student_id": student,
        "subject": "Physics",
        "topic": "Kinematics",
        "is_correct": True,
    }
    resp = client.post(f"{API}/mastery/update", json=payload)
    assert resp.status_code == 200

    body = resp.json()
    assert body["student_id"] == student
    assert body["subject"] == "Physics"
    assert body["topic"] == "Kinematics"
    assert body["correct_answers"] == 1
    assert body["total_questions"] == 1

    # First-ever update starts from BKT_P_L0, then one correct-answer
    # Bayesian update + transit probability is applied.
    expected_score = update_bkt_probability(BKT_P_L0, True)
    assert body["mastery_score"] == expected_score
    assert body["mastery_percentage"] == round(expected_score * 100, 2)


def test_mastery_update_math_matches_bkt_formula_across_multiple_updates(student):
    payload = {
        "student_id": student,
        "subject": "Chemistry",
        "topic": "Stoichiometry",
        "is_correct": True,
    }
    first = client.post(f"{API}/mastery/update", json=payload).json()
    expected_after_first = update_bkt_probability(BKT_P_L0, True)
    assert first["mastery_score"] == expected_after_first

    payload["is_correct"] = False
    second = client.post(f"{API}/mastery/update", json=payload).json()
    expected_after_second = update_bkt_probability(expected_after_first, False)
    assert second["mastery_score"] == expected_after_second
    assert second["total_questions"] == 2
    assert second["correct_answers"] == 1


def test_mastery_update_invalid_uuid_returns_400():
    payload = {
        "student_id": "not-a-uuid",
        "subject": "Physics",
        "topic": "Kinematics",
        "is_correct": True,
    }
    resp = client.post(f"{API}/mastery/update", json=payload)
    assert resp.status_code == 400


def test_mastery_update_nonexistent_student_returns_404():
    payload = {
        "student_id": str(uuid.uuid4()),  # valid uuid, no matching row
        "subject": "Physics",
        "topic": "Kinematics",
        "is_correct": True,
    }
    resp = client.post(f"{API}/mastery/update", json=payload)
    assert resp.status_code == 404


def test_mastery_update_missing_field_returns_422(student):
    payload = {
        "student_id": student,
        "subject": "Physics",
        # "topic" omitted on purpose
        "is_correct": True,
    }
    resp = client.post(f"{API}/mastery/update", json=payload)
    assert resp.status_code == 422


# ------------------------------------------------------------------
# GET /api/v1/mastery/{student_id}
# ------------------------------------------------------------------

def test_get_mastery_returns_created_record(student):
    client.post(f"{API}/mastery/update", json={
        "student_id": student,
        "subject": "Biology",
        "topic": "Cell Structure",
        "is_correct": True,
    })

    resp = client.get(f"{API}/mastery/{student}")
    assert resp.status_code == 200

    records = resp.json()["mastery"]
    matching = [r for r in records if r["topic"] == "Cell Structure"]
    assert len(matching) == 1
    assert matching[0]["subject"] == "Biology"
    assert matching[0]["correct_answers"] == 1
    assert matching[0]["total_questions"] == 1


def test_get_mastery_invalid_uuid_returns_400():
    resp = client.get(f"{API}/mastery/not-a-uuid")
    assert resp.status_code == 400


def test_get_mastery_empty_for_student_with_no_records(student):
    resp = client.get(f"{API}/mastery/{student}")
    assert resp.status_code == 200
    assert resp.json()["mastery"] == []


# ------------------------------------------------------------------
# GET /api/v1/mastery-history/{student_id}
# ------------------------------------------------------------------

def test_mastery_history_returns_snapshots_in_order(student):
    payload = {
        "student_id": student,
        "subject": "Maths",
        "topic": "Calculus",
        "is_correct": True,
    }
    client.post(f"{API}/mastery/update", json=payload)
    payload["is_correct"] = False
    client.post(f"{API}/mastery/update", json=payload)

    resp = client.get(f"{API}/mastery-history/{student}")
    assert resp.status_code == 200

    history = resp.json()["history"]
    calc_entries = [h for h in history if h["topic"] == "Calculus"]
    assert len(calc_entries) == 2
    assert calc_entries[0]["mastery_score"] != calc_entries[1]["mastery_score"]


# ------------------------------------------------------------------
# POST /api/v1/tests/{test_id}/submit  (side effect: BKT mastery update)
# ------------------------------------------------------------------

def test_submit_test_updates_mastery(student):
    create_payload = {
        "student_id": student,
        "title": "Quick Quiz",
        "subject": "Geography",
        "questions": [
            {
                "topic": "Rivers",
                "question_text": "Longest river in India?",
                "correct_answer": "Ganga",
            }
        ],
    }
    create_resp = client.post(f"{API}/tests", json=create_payload)
    assert create_resp.status_code == 200
    test_body = create_resp.json()
    test_id = test_body["test_id"]
    question_id = test_body["questions"][0]["question_id"]

    submit_payload = {
        "answers": [
            {"question_id": question_id, "answer": "Ganga"},
        ]
    }
    submit_resp = client.post(f"{API}/tests/{test_id}/submit", json=submit_payload)
    assert submit_resp.status_code == 200

    submit_body = submit_resp.json()
    assert submit_body["score"] == 1
    assert submit_body["total_questions"] == 1
    assert submit_body["results"][0]["is_correct"] is True

    mastery_resp = client.get(f"{API}/mastery/{student}")
    rivers = [r for r in mastery_resp.json()["mastery"] if r["topic"] == "Rivers"]
    assert len(rivers) == 1
    assert rivers[0]["correct_answers"] == 1
