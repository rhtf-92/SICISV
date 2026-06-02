import psycopg2
from psycopg2.extras import RealDictCursor
from config import settings


def get_connection():
    return psycopg2.connect(settings.DATABASE_URL, cursor_factory=RealDictCursor)


def init_db():
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.columns
                        WHERE table_name = 'Entry' AND column_name = 'driverEmbedding'
                    ) THEN
                        ALTER TABLE "Entry" ADD COLUMN "driverEmbedding" TEXT;
                    END IF;
                END $$;
            """)
        conn.commit()
    finally:
        conn.close()
