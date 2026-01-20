# test_db_read.py (CREATE THIS FILE on your host)
import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()
DB_CONFIG = {
    "host": os.getenv("DB_HOST"), "port": os.getenv("DB_PORT", "5432"),
    "dbname": os.getenv("DB_NAME"), "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD")
}

try:
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()
    cur.execute("SELECT role FROM app.users WHERE username = 'admin'")
    print(f"Role read from DB: {cur.fetchone()}")
except Exception as e:
    print(f"Error: {e}")
finally:
    if conn: conn.close()