import io
import base64
import numpy as np
from PIL import Image
import psycopg2
from config import settings
from services.facial import FacialService

facial = FacialService()
conn = psycopg2.connect(settings.DATABASE_URL)

cur = conn.cursor()
cur.execute('''
    SELECT DISTINCT ON (e."licensePlate") e.id, e."licensePlate", e."vehiclePhoto", e."driverPhoto"
    FROM public."Entry" e
    WHERE e."driverPhoto" IS NOT NULL AND e."driverPhoto" != ''
    ORDER BY e."licensePlate", e."entryTimestamp" DESC
''')
rows = cur.fetchall()
print(f"Found {len(rows)} unique license plates with driver photos")

for i, (entry_id, plate, vehicle_photo, driver_photo) in enumerate(rows):
    try:
        img_str = driver_photo
        if ',' in img_str:
            img_str = img_str.split(',', 1)[1]
        image_data = base64.b64decode(img_str)

        emb = facial._get_embedding(image_data)
        if emb is None:
            print(f"  [{i+1}/{len(rows)}] {plate}: No face detected, skipping")
            continue

        emb_str = "[" + ",".join(str(round(v, 8)) for v in emb) + "]"

        icur = conn.cursor()
        icur.execute('''
            INSERT INTO public."KnownDriver" ("fullName", "licensePlate", "vehiclePhoto", "driverPhoto", "embedding")
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id
        ''', (None, plate, vehicle_photo, driver_photo, emb_str))
        result = icur.fetchone()
        conn.commit()
        icur.close()

        print(f"  [{i+1}/{len(rows)}] {plate}: Registered as KnownDriver {result[0]}")
    except Exception as e:
        print(f"  [{i+1}/{len(rows)}] {plate}: Error {e}")
        conn.rollback()

cur.close()
conn.close()
print("Done seeding KnownDriver")
