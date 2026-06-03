import psycopg2
import requests
from config import settings

conn = psycopg2.connect(settings.DATABASE_URL)
cur = conn.cursor()
cur.execute('SELECT id::text, "driverPhoto" FROM public."Entry" WHERE "driverEmbedding" IS NULL AND "driverPhoto" IS NOT NULL')
rows = cur.fetchall()
conn.close()

print(f"Found {len(rows)} entries without embeddings")

for entry_id, photo in rows:
    res = requests.post('http://localhost:3002/api/facial/store', json={
        'entry_id': entry_id,
        'image': photo
    }, timeout=30)
    print(f"  {entry_id[:8]}...: {res.status_code} {res.json()}")
