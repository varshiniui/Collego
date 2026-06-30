import requests

BASE = "http://localhost:5000/api/student/colleges/search"

token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiYTI0YzYwNWEtNDM1ZS00MmFjLTlkOGUtMjJlYTk4YWY4MmY1Iiwicm9sZSI6InN0dWRlbnQiLCJlbWFpbCI6InJpdGhpczAwM0BnbWFpbC5jb20ifQ.ochVH0hDuiWfnXnynVkS8JmTkWPq5Lp4lECdFqDaAAw"

resp = requests.get(
    BASE,
    params={"name": "Sai"},
    headers={"Authorization": f"Bearer {token}"}
)
print(resp.status_code)
print(resp.text[:2000])