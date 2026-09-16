"""
Guardian access control + scope-gated, privacy-safe data views.

HARD RULE: nothing in this file may return KnowledgeChunk.text_content,
KnowledgeChunk.embedding, or raw document content. Guardians only ever
see aggregated progress numbers (mastery scores, counts, timestamps).
"""

from fastapi import HTTPException
from sqlalchemy.orm import Session

from database.models import Student, StudentMastery, Document, Test


def get_authorized_students(db: Session, guardian_email: str):
    """All students this guardian is linked to (via guardian_email match)."""
    return (
        db.query(Student)
        .filter(Student.guardian_email == guardian_email)
        .all()
    )


def assert_guardian_can_access(db: Session, guardian_email: str, student_id: str) -> Student:
    """
    Scope gate for every guardian-facing student endpoint.

    - 404 if the student doesn't exist at all.
    - 403 if the student exists but isn't linked to this guardian.
    Checking existence first (before the ownership check) means an
    unauthorized guardian can't use response codes to fish for which
    student_ids are valid.
    """
    student = (
        db.query(Student)
        .filter(Student.student_id == student_id)
        .first()
    )

    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    if not student.guardian_email or student.guardian_email != guardian_email:
        raise HTTPException(
            status_code=403,
            detail="You are not authorized to view this student's data",
        )

    return student


def serialize_student_summary(student: Student) -> dict:
    """Minimal metadata for a guardian's student list."""
    return {
        "student_id": str(student.student_id),
        "full_name": student.full_name,
        "board": student.board,
        "grade": student.grade,
    }


def get_guardian_progress_view(db: Session, student: Student) -> dict:
    """
    Subject/topic-wise mastery for the dashboard heatmap, built only from
    StudentMastery (aggregated scores) -- never touches KnowledgeChunk or
    Document content.
    """
    mastery_records = (
        db.query(StudentMastery)
        .filter(StudentMastery.student_id == student.student_id)
        .all()
    )

    topics = [
        {
            "subject": r.subject,
            "topic": r.topic,
            "mastery_score": float(r.mastery_score or 0.0),
            "correct_answers": r.correct_answers,
            "total_questions": r.total_questions,
            "updated_at": r.updated_at,
        }
        for r in mastery_records
    ]

    overall_mastery = (
        round(sum(t["mastery_score"] for t in topics) / len(topics), 2)
        if topics
        else 0.0
    )

    # Counts only -- filenames and raw content are never exposed to guardians.
    document_count = (
        db.query(Document)
        .filter(Document.student_id == student.student_id)
        .count()
    )

    test_count = (
        db.query(Test)
        .filter(Test.student_id == student.student_id)
        .count()
    )

    return {
        "student_id": str(student.student_id),
        "full_name": student.full_name,
        "overall_mastery": overall_mastery,
        "topics": topics,
        "documents_uploaded": document_count,
        "tests_taken": test_count,
    }
