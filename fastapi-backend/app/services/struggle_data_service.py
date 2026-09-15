from datetime import datetime, timezone

from sqlalchemy.orm import Session

from database.models import StudentMastery, SyllabusWeight


DEFAULT_SYLLABUS_WEIGHT = 1.0


def get_struggle_input_data(
    db: Session,
    student_id: str
):
    """
    Fetch all data required by the struggle predictor.

    Data is dynamically taken from:
    - StudentMastery table
    - SyllabusWeight table

    No topic names or syllabus weights are hardcoded.
    """

    # --------------------------------------------------------
    # Get student's mastery records
    # --------------------------------------------------------

    mastery_records = (
        db.query(StudentMastery)
        .filter(
            StudentMastery.student_id == student_id
        )
        .all()
    )

    # --------------------------------------------------------
    # Get syllabus weights from database
    # --------------------------------------------------------

    weight_rows = (
        db.query(SyllabusWeight)
        .all()
    )

    # Use subject + topic together
    weight_lookup = {
        (
            row.subject,
            row.topic
        ): float(row.weight)
        for row in weight_rows
    }

    # --------------------------------------------------------
    # Current time
    # --------------------------------------------------------

    now = datetime.now(timezone.utc)

    results = []

    # --------------------------------------------------------
    # Build struggle input data
    # --------------------------------------------------------

    for record in mastery_records:

        # ----------------------------------------------
        # Dynamic syllabus weight
        # ----------------------------------------------

        syllabus_weight = weight_lookup.get(
            (
                record.subject,
                record.topic
            ),
            DEFAULT_SYLLABUS_WEIGHT
        )

        # ----------------------------------------------
        # Last practice/update time
        # ----------------------------------------------

        last_updated = getattr(
            record,
            "updated_at",
            None
        )

        if last_updated is None:
            last_updated = getattr(
                record,
                "created_at",
                None
            )

        # ----------------------------------------------
        # Days since practice
        # ----------------------------------------------

        days_since_practice = None

        if last_updated is not None:

            # Handle timezone-naive datetime
            if last_updated.tzinfo is None:
                last_updated = last_updated.replace(
                    tzinfo=timezone.utc
                )

            days_since_practice = (
                now - last_updated
            ).total_seconds() / 86400

            days_since_practice = max(
                0,
                days_since_practice
            )

        # ----------------------------------------------
        # Add result
        # ----------------------------------------------

        results.append(
            {
                "subject": record.subject,
                "topic": record.topic,
                "mastery_score": float(
                    record.mastery_score or 0.0
                ),
                "syllabus_weight": syllabus_weight,
                "last_updated_at": last_updated,
                "days_since_practice": days_since_practice,
            }
        )

    return results