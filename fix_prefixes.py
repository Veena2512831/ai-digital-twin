import re

with open('c:/Users/omtaj/ai-digital-twin/fastapi-backend/app/api/routes.py', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('@router.get("/v1/revision/{student_id}/plan")', '@router.get("/revision/{student_id}/plan")')
text = text.replace('@router.get("/students/{student_id}/revision/plan")', '')

text = text.replace('@router.post("/v1/revision/{student_id}/settings")', '@router.post("/revision/{student_id}/settings")')
text = text.replace('@router.post("/students/{student_id}/revision/settings")', '')

text = text.replace('@router.post("/v1/revision/{student_id}/review")', '@router.post("/revision/{student_id}/review")')
text = text.replace('@router.post("/students/{student_id}/revision/review")', '')

with open('c:/Users/omtaj/ai-digital-twin/fastapi-backend/app/api/routes.py', 'w', encoding='utf-8') as f:
    f.write(text)

print("Fixed route prefixes!")
