import psycopg2
from config import settings
conn = psycopg2.connect(settings.DATABASE_URL)
cur = conn.cursor()
cur.execute('SELECT id::text, "licensePlate", "driverEmbedding" IS NOT NULL as has_emb, length(coalesce("driverEmbedding",'"''"')) as emb_len FROM public."Entry" ORDER BY "entryTimestamp" DESC')
for r in cur.fetchall():
    print(f'{r[0][:8]}... {r[1]}: has_emb={r[2]}, emb_len={r[3]}')
conn.close()
