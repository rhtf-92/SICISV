import psycopg2
from config import settings

conn = psycopg2.connect(settings.DATABASE_URL)
cur = conn.cursor()

# Fix the id column to have a default UUID
cur.execute('ALTER TABLE public."KnownDriver" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()')
# Fix updatedAt to have a default
cur.execute('ALTER TABLE public."KnownDriver" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP')
conn.commit()
print("Schema fixed")

cur.execute("""
    SELECT column_name, column_default
    FROM information_schema.columns
    WHERE table_name = 'KnownDriver'
    ORDER BY ordinal_position
""")
for row in cur.fetchall():
    print(f"  {row[0]}: {row[1]}")

conn.close()
