import psycopg2
from config import settings
conn = psycopg2.connect(settings.DATABASE_URL)
cur = conn.cursor()
cur.execute("""
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_name = 'KnownDriver'
    ORDER BY ordinal_position
""")
print("KnownDriver columns:")
for row in cur.fetchall():
    print(f"  {row[0]} {row[1]} nullable={row[2]} default={row[3]}")

cur.execute("SELECT count(*) FROM prisma_migrations WHERE migration_name LIKE '%known_driver%'")
print(f"Migration applied: {cur.fetchone()[0]}")

cur.execute("SELECT count(*) FROM prisma_migrations")
print(f"Total migrations: {cur.fetchone()[0]}")

conn.close()
