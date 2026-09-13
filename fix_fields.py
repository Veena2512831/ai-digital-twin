import re

# Update models.py
with open('c:/Users/omtaj/ai-digital-twin/database/models.py', 'r', encoding='utf-8') as f:
    models_code = f.read()

new_cols = '''    # --- Extra revision fields ---
    struggle_score = Column(Float, nullable=False, default=0.0)
    priority = Column(String(50), nullable=False, default="Medium")
    estimated_minutes = Column(Integer, nullable=False, default=15)
    status = Column(String(50), nullable=False, default="PENDING")
    
    # --- SM-2 state ---'''

models_code = models_code.replace('# --- SM-2 state ---', new_cols)

with open('c:/Users/omtaj/ai-digital-twin/database/models.py', 'w', encoding='utf-8') as f:
    f.write(models_code)


# Update revision_service.py
with open('c:/Users/omtaj/ai-digital-twin/fastapi-backend/app/services/revision_service.py', 'r', encoding='utf-8') as f:
    rev_code = f.read()

rev_code = rev_code.replace('repetition=0,', 'repetition_number=0,')
rev_code = rev_code.replace('ease_factor=2.5,', 'easiness_factor=2.5,')
rev_code = rev_code.replace('scheduled_date=today,', 'next_review_date=today,')

rev_code = rev_code.replace('task.scheduled_date', 'task.next_review_date')
rev_code = rev_code.replace('t.scheduled_date', 't.next_review_date')
rev_code = rev_code.replace('RevisionSchedule.scheduled_date', 'RevisionSchedule.next_review_date')

rev_code = rev_code.replace('t.schedule_id', 't.id')
rev_code = rev_code.replace('schedule_id=schedule_id', 'id=schedule_id')
rev_code = rev_code.replace('RevisionSchedule.schedule_id', 'RevisionSchedule.id')

rev_code = rev_code.replace('t.repetition', 't.repetition_number')
rev_code = rev_code.replace('t.ease_factor', 't.easiness_factor')

with open('c:/Users/omtaj/ai-digital-twin/fastapi-backend/app/services/revision_service.py', 'w', encoding='utf-8') as f:
    f.write(rev_code)

print("Updates applied.")
