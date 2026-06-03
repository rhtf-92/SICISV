import psycopg2
import requests
from config import settings

conn = psycopg2.connect(settings.DATABASE_URL)
cur = conn.cursor()
cur.execute('SELECT "driverPhoto" FROM public."Entry" WHERE "driverPhoto" IS NOT NULL LIMIT 1')
row = cur.fetchone()
conn.close()

if not row:
    print("No driver photos found")
    exit(1)

photo = row[0]
res = requests.post('http://localhost:3002/api/facial/recognize', json={'image': photo}, timeout=30)
print(f"Status: {res.status_code}")
data = res.json()
print(f"Recognized: {data.get('recognized')}")
if data.get('profile'):
    print(f"Profile: {data['profile']['licensePlate']} confidence={data.get('confidence')}")
else:
    print(f"No profile matched")
    print(f"Response: {data}")
