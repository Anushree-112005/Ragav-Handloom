import psycopg2
conn = psycopg2.connect(dbname='loomora_erp', user='postgres', port=5433)
cur = conn.cursor()
cur.execute("SELECT id, email, first_name, last_name, status, password_hash FROM users WHERE email LIKE '%loomora.com%'")
rows = cur.fetchall()
print(f"Total Loomora Users: {len(rows)}")
for r in rows:
    print(f"  {r[1]:<28} | {r[2]} {r[3]} | {r[4]} | hash_len: {len(r[5])}")
conn.close()
