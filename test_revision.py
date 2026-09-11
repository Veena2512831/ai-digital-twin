import sys
import uuid
import logging
from datetime import datetime
from database.session import SessionLocal, engine
from database.models import Base, Student, StudentMastery
from app.services.revision_service import get_revision_plan, record_topic_review

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger('test')

def test():
    # Force table creation
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        student_id = str(uuid.uuid4())
        student = Student(student_id=student_id, email=f"test_{student_id}@example.com", full_name="Test Rev", password_hash="hash")
        db.add(student)
        
        # Add a struggle topic
        mastery = StudentMastery(student_id=student_id, subject="Physics", topic="Gravity", mastery_score=0.2, total_questions=10, correct_answers=2)
        db.add(mastery)
        db.commit()

        logger.info("Fetching Revision Plan...")
        plan = get_revision_plan(db, student_id)
        logger.info(f"Plan Tasks: {len(plan['today_tasks'])} today, {len(plan['upcoming_tasks'])} upcoming")
        if len(plan['today_tasks']) > 0:
            task_id = plan['today_tasks'][0]['schedule_id']
            logger.info(f"Today Task: {task_id}")
            
            # Review it
            logger.info(f"Recording review for {task_id} with score 4...")
            record_topic_review(db, student_id, task_id, 4)
            
            plan_after = get_revision_plan(db, student_id)
            logger.info(f"After Review - Plan Tasks: {len(plan_after['today_tasks'])} today, {len(plan_after['upcoming_tasks'])} upcoming")
            
    except Exception as e:
        logger.error(f"Error: {e}")
    finally:
        db.close()

if __name__ == '__main__':
    test()
