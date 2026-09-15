from datetime import datetime, timezone
from math import exp

from sqlalchemy.orm import Session

from database.models import StudentMastery, SyllabusWeight


DEFAULT_SYLLABUS_WEIGHT = 1.0


# ============================================================
# TIME DECAY
# ============================================================

def calculate_time_decay(last_practiced_at):
    """
    Calculate time decay based on how long ago
    the student practiced the topic.

    More days without practice
    -> higher time decay
    -> higher struggle score.
    """

    if not last_practiced_at:
        return 1.5

    now = datetime.now(timezone.utc)

    # Handle timezone-naive datetime
    if last_practiced_at.tzinfo is None:
        last_practiced_at = last_practiced_at.replace(
            tzinfo=timezone.utc
        )

    days_since_practice = (
        now - last_practiced_at
    ).total_seconds() / 86400

    # Prevent negative values
    days_since_practice = max(
        0,
        days_since_practice
    )

    # 0 days  -> approximately 1.0
    # More days -> approaches 2.0
    decay = (
        1
        + (
            1
            - exp(
                -days_since_practice / 30
            )
        )
    )

    return round(decay, 4)


# ============================================================
# STRUGGLE SCORE
# ============================================================

def calculate_struggle_score(
    mastery,
    syllabus_weight,
    time_decay,
):
    """
    Struggle Score:

        (1 - Mastery)
        × Syllabus Weight
        × Time Decay
    """

    mastery = max(
        0.0,
        min(1.0, float(mastery))
    )

    syllabus_weight = float(
        syllabus_weight
    )

    time_decay = float(
        time_decay
    )

    weakness = 1 - mastery

    score = (
        weakness
        * syllabus_weight
        * time_decay
    )

    return round(score, 4)


# ============================================================
# TOP STRUGGLES
# ============================================================

def get_top_struggles(
    db: Session,
    student_id,
    top_n=5,
):
    """
    Get student's mastery records,
    calculate struggle scores,
    rank them,
    and return Top N weak topics.

    Syllabus weights are fetched dynamically
    from the SyllabusWeight database table.
    """

    # --------------------------------------------------------
    # Load syllabus weights from database
    # --------------------------------------------------------

    weight_records = (
        db.query(SyllabusWeight)
        .all()
    )

    # Use BOTH subject and topic as the key.
    #
    # Example:
    # ("Physics", "Waves") -> 1.5
    # ("Mathematics", "Integration") -> 1.8
    #
    weight_lookup = {
        (
            row.subject,
            row.topic
        ): float(row.weight)
        for row in weight_records
    }

    # --------------------------------------------------------
    # Get student's mastery records
    # --------------------------------------------------------

    records = (
        db.query(StudentMastery)
        .filter(
            StudentMastery.student_id == student_id
        )
        .all()
    )

    struggles = []

    for record in records:

        # ----------------------------------------------------
        # Mastery
        # ----------------------------------------------------

        mastery = record.mastery_score or 0.0

        mastery = max(
            0.0,
            min(1.0, float(mastery))
        )

        # ----------------------------------------------------
        # Syllabus Weight
        # ----------------------------------------------------

        syllabus_weight = weight_lookup.get(
            (
                record.subject,
                record.topic
            ),
            DEFAULT_SYLLABUS_WEIGHT
        )

        # ----------------------------------------------------
        # Last Practice Time
        # ----------------------------------------------------

        last_practiced_at = getattr(
            record,
            "updated_at",
            None,
        )

        if last_practiced_at is None:
            last_practiced_at = getattr(
                record,
                "created_at",
                None,
            )

        # ----------------------------------------------------
        # Time Decay
        # ----------------------------------------------------

        time_decay = calculate_time_decay(
            last_practiced_at
        )

        # ----------------------------------------------------
        # Struggle Score
        # ----------------------------------------------------

        struggle_score = calculate_struggle_score(
            mastery=mastery,
            syllabus_weight=syllabus_weight,
            time_decay=time_decay,
        )

        struggles.append(
            {
                "topic": record.topic,
                "subject": record.subject,
                "mastery": round(
                    mastery,
                    4
                ),
                "mastery_percentage": round(
                    mastery * 100,
                    2
                ),
                "syllabus_weight": syllabus_weight,
                "time_decay": time_decay,
                "struggle_score": struggle_score,
            }
        )

    # --------------------------------------------------------
    # Rank by highest struggle score
    # --------------------------------------------------------

    struggles.sort(
        key=lambda item: item["struggle_score"],
        reverse=True,
    )

    # --------------------------------------------------------
    # Return Top N
    # --------------------------------------------------------

    return struggles[:top_n]