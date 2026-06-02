import psycopg2
import requests
from config import settings

conn = psycopg2.connect(settings.DATABASE_URL)
cur = conn.cursor()
cur.execute('SELECT id::text, "driverPhoto" FROM public."Entry" WHERE "driverEmbedding" IS NOT NULL LIMIT 1')
row = cur.fetchone()
conn.close()

entry_id = row[0]
photo = row[1]
print(f"Entry ID: {entry_id}")

res = requests.post('http://localhost:3002/api/facial/compare', json={
    'entry_id': entry_id,
    'image': photo
}, timeout=30)
print(f"Status: {res.status_code}")
print(f"Body: {res.text}")
