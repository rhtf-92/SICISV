import psycopg2
from config import settings
conn = psycopg2.connect(settings.DATABASE_URL)
cur = conn.cursor()
cur.execute('SELECT count(*) FROM public."KnownDriver"')
print('KnownDriver count:', cur.fetchone()[0])
cur.execute('SELECT id::text, "licensePlate" FROM public."KnownDriver"')
for r in cur.fetchall():
    print(' ', r[0], r[1])
conn.close()
