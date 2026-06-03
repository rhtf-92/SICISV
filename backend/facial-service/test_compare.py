import psycopg2
import requests
from config import settings

conn = psycopg2.connect(settings.DATABASE_URL)
cur = conn.cursor()
cur.execute('SELECT id::text, "driverPhoto" FROM public."Entry" WHERE "driverPhoto" IS NOT NULL LIMIT 1')
row = cur.fetchone()
conn.close()

photo = row[1]
res = requests.post('http://localhost:3002/api/facial/compare', json={
    'entry_id': row[0],
    'image': photo
}, timeout=30)
print(f"Compare status: {res.status_code}")
data = res.json()
print(f"Compare result: match={data.get('match')} confidence={data.get('confidence')}")

# Test compare-two with same photo
res2 = requests.post('http://localhost:3002/api/facial/compare-two', json={
    'image1': photo,
    'image2': photo
}, timeout=30)
print(f"Compare-two status: {res2.status_code}")
data2 = res2.json()
print(f"Compare-two result: match={data2.get('match')} confidence={data2.get('confidence')}")
