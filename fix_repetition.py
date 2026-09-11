import re

with open('c:/Users/omtaj/ai-digital-twin/fastapi-backend/app/services/revision_service.py', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('repetition=schedule.repetition', 'repetition=schedule.repetition_number')
text = text.replace('schedule.repetition = new_rep', 'schedule.repetition_number = new_rep')
text = text.replace('schedule.ease_factor = new_ef', 'schedule.easiness_factor = new_ef')
text = text.replace('ease_factor=schedule.ease_factor', 'ease_factor=schedule.easiness_factor')

with open('c:/Users/omtaj/ai-digital-twin/fastapi-backend/app/services/revision_service.py', 'w', encoding='utf-8') as f:
    f.write(text)
print('Fixed repetition and ease_factor')
