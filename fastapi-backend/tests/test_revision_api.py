"""
tests/test_revision_api.py

HTTP-level tests for the SM-2 revision endpoints:
  GET  /api/v1/revision/{student_id}/plan
  POST /api/v1/revision/{student_id}/settings
  POST /api/v1/revision/{student_id}/review

Runs against the real app + real Postgres (twin_db). No mocking.
"""

import os
import sys
import uuid
from datetime import date

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

import pytest
from fastapi.testclient import TestClient

from app.main import app
from database.session import SessionLocal
from database.models import (
    Student,
    StudentMastery,
    MasterySnapshot,
    RevisionSchedule,
    RevisionHistory,
    StudentRevisionSettings,
    StudentMasteryHistory,
)
from app.services.revision_service import calculate_sm2

client = TestClient(app)
API = "/api/v1"


@pytest.fixture
def student():
    db = SessionLocal()
    s = Student(
        email=f"revision_test_{uuid.uuid4()}@example.com",
        full_name="Revision Test Student",
    )
    db.add(s)
    db.commit()
    db.refresh(s)
    student_id = s.student_id
    try:
        yield student_id
    finally:
        schedule_ids = [
            row.id for row in
            db.query(RevisionSchedule.id).filter(
                RevisionSchedule.student_id == student_id
            ).all()
        ]
        if schedule_ids:
            db.query(RevisionHistory).filter(
                RevisionHistory.schedule_id.in_(schedule_ids)
            ).delete(synchronize_session=False)
        db.query(RevisionSchedule).filter(
            RevisionSchedule.student_id == student_id
        ).delete()
        db.query(StudentRevisionSettings).filter(
            StudentRevisionSettings.student_id == student_id
        ).delete()
        db.query(StudentMasteryHistory).filter(
            StudentMasteryHistory.student_id == student_id
        ).delete()
        db.query(MasterySnapshot).filter(
            MasterySnapshot.student_id == student_id
        ).delete()
        db.query(StudentMastery).filter(
            StudentMastery.student_id == student_id
        ).delete()
        db.query(Student).filter(
            Student.student_id == student_id
        ).delete()
        db.commit()
        db.close()


def _create_schedule(db, student_id, **overrides):
    """Directly insert a RevisionSchedule row, bypassing
    sync_struggles_to_revision_schedule, so the test controls the exact
    starting SM-2 state instead of depending on struggle-score logic."""
    defaults = dict(
        student_id=student_id,
        subject="Physics",
        topic="Kinematics",
        struggle_score=0.5,
        priority="MEDIUM",
        estimated_minutes=15,
        status="PENDING",
        repetition_number=1,
        easiness_factor=2.5,
        interval_days=6,
        next_review_date=date.today(),
    )
    defaults.update(overrides)
    schedule = RevisionSchedule(**defaults)
    db.add(schedule)
    db.commit()
    db.refresh(schedule)
    return schedule


# ------------------------------------------------------------------
# GET /api/v1/revision/{student_id}/plan
# ------------------------------------------------------------------

def test_revision_plan_returns_expected_shape_for_new_student(student):
    resp = client.get(f"{API}/revision/{student}/plan")
    assert resp.status_code == 200

    body = resp.json()
    for key in [
        "student_id", "max_daily_minutes", "today_minutes", "today_count",
        "completed_today_count", "today_tasks", "completed_today",
        "upcoming_tasks", "all_tasks",
    ]:
        assert key in body

    # A brand-new student has no mastery records and no struggles, so
    # this shouldn't error even though the GET triggers
    # sync_struggles_to_revision_schedule() + balance_workload() as a
    # side effect.
    assert body["max_daily_minutes"] == 60  # default from get_or_create_settings


# ------------------------------------------------------------------
# POST /api/v1/revision/{student_id}/settings
# ------------------------------------------------------------------
# KNOWN ISSUE (c): update_revision_settings() returns the raw
# StudentRevisionSettings ORM object and the route returns it directly,
# same class of issue as /review below. Verifying via a direct DB query
# rather than trusting resp.json() sidesteps that until it's confirmed
# fixed or safe.

def test_update_revision_settings_success(student):
    resp = client.post(
        f"{API}/revision/{student}/settings",
        json={"max_daily_minutes": 90},
    )
    assert resp.status_code == 200
    db = SessionLocal()
    settings = db.query(StudentRevisionSettings).filter(
        StudentRevisionSettings.student_id == student
    ).first()
    db.close()
    assert settings is not None
    assert settings.max_daily_minutes == 90


def test_update_revision_settings_clamps_low(student):
    client.post(f"{API}/revision/{student}/settings", json={"max_daily_minutes": 5})
    db = SessionLocal()
    settings = db.query(StudentRevisionSettings).filter(
        StudentRevisionSettings.student_id == student
    ).first()
    db.close()
    assert settings.max_daily_minutes == 15  # clamped to the [15, 240] floor


def test_update_revision_settings_clamps_high(student):
    client.post(f"{API}/revision/{student}/settings", json={"max_daily_minutes": 500})
    db = SessionLocal()
    settings = db.query(StudentRevisionSettings).filter(
        StudentRevisionSettings.student_id == student
    ).first()
    db.close()
    assert settings.max_daily_minutes == 240  # clamped to the ceiling


# ------------------------------------------------------------------
# POST /api/v1/revision/{student_id}/review
# ------------------------------------------------------------------

def test_review_schedule_success_updates_sm2_fields(student):
    db = SessionLocal()
    schedule = _create_schedule(
        db, student,
        repetition_number=1, easiness_factor=2.5, interval_days=6,
    )
    schedule_id = str(schedule.id)
    db.close()

    expected_rep, expected_ef, expected_interval = calculate_sm2(
        repetition=1, ease_factor=2.5, interval_days=6, quality=5,
    )

    resp = client.post(
        f"{API}/revision/{student}/review",
        json={"schedule_id": schedule_id, "quality_score": 5},
    )
    print("DEBUG review response:", resp.status_code, resp.text)

    # KNOWN ISSUE (a): record_topic_review() returns the raw
    # RevisionSchedule ORM object and the route returns it directly —
    # this may or may not serialize cleanly. If status_code isn't 200,
    # that confirms the bug; update this assertion to reflect reality
    # and flag it rather than silently loosening it.
    assert resp.status_code == 200

    db = SessionLocal()
    updated = db.query(RevisionSchedule).filter(
        RevisionSchedule.id == schedule.id
    ).first()
    db.close()

    assert updated.repetition_number == expected_rep
    assert updated.easiness_factor == expected_ef
    assert updated.interval_days == expected_interval
    assert updated.status == "COMPLETED"


def test_review_schedule_low_quality_resets_repetition(student):
    db = SessionLocal()
    schedule = _create_schedule(
        db, student,
        repetition_number=3, easiness_factor=2.4, interval_days=15,
    )
    schedule_id = str(schedule.id)
    db.close()

    resp = client.post(
        f"{API}/revision/{student}/review",
        json={"schedule_id": schedule_id, "quality_score": 2},  # < 3 = fail
    )
    print("DEBUG low-quality review response:", resp.status_code, resp.text)
    assert resp.status_code == 200

    db = SessionLocal()
    updated = db.query(RevisionSchedule).filter(
        RevisionSchedule.id == schedule.id
    ).first()
    db.close()

    assert updated.repetition_number == 0
    assert updated.interval_days == 1


def test_review_invalid_schedule_id_returns_current_status(student):
    """
    KNOWN ISSUE (b): record_topic_review() raises a plain ValueError for
    a nonexistent schedule_id, which the route's `except Exception`
    catches and re-raises as HTTPException(500) — not 404. This test
    documents CURRENT behavior. If the route is fixed to return 404
    (recommended, for consistency with /mastery/update's 404 handling),
    update this assertion to expect 404 instead of 500.
    """
    resp = client.post(
        f"{API}/revision/{student}/review",
        json={"schedule_id": str(uuid.uuid4()), "quality_score": 5},
    )
    print("DEBUG invalid schedule_id response:", resp.status_code, resp.text)
    assert resp.status_code == 500  # current behavior — see docstring
