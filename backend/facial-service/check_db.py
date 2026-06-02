import psycopg2
conn = psycopg2.connect('postgresql://sicisv:sicisv_dev@localhost:5432/sicisv')
cur = conn.cursor()
cur.execute('SELECT count(*) FROM public."Entry" WHERE "driverPhoto" IS NOT NULL')
print('Entries with driverPhoto:', cur.fetchone()[0])
cur.execute('SELECT count(*) FROM public."KnownDriver"')
print('KnownDriver records:', cur.fetchone()[0])
cur.execute('SELECT id::text, "licensePlate" FROM public."Entry" WHERE "driverPhoto" IS NOT NULL ORDER BY "entryTimestamp" DESC LIMIT 10')
for row in cur:
    print('Entry:', row[0], row[1])
conn.close()
