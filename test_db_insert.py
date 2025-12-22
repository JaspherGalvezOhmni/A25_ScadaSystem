import psycopg2
from dotenv import load_dotenv
import os
import time

# --- CONFIGURATION ---
load_dotenv()
DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": os.getenv("DB_PORT", "5432"),
    "dbname": os.getenv("DB_NAME"),
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD")
}

# --- TEST PARAMETERS ---
# From our psql test, we know tag_id 23 is for 'VFD_Sts_OutPowerScaled' (a float)
TEST_TAG_ID = 23
TEST_FLOAT_VALUE = 99.99
CURRENT_TIMESTAMP = time.strftime('%Y-%m-%d %H:%M:%S %Z')

print("--- Python Database Insert Test ---")
conn = None
try:
    print("Connecting to database...")
    conn = psycopg2.connect(**DB_CONFIG)
    print("Connection successful.")
    
    with conn.cursor() as cur:
        # We will use the STRICT syntax that worked for you in psql
        sql_query = "INSERT INTO historian.historian (tag_id, value_float, ts) VALUES (%s, %s, %s)"
        params = (TEST_TAG_ID, TEST_FLOAT_VALUE, CURRENT_TIMESTAMP)
        
        # This special line asks psycopg2 to show us the EXACT query it will run
        print("\nPython is attempting to execute this SQL:")
        print(cur.mogrify(sql_query, params).decode('utf-8'))
        
        # Now, execute the command
        cur.execute(sql_query, params)
        conn.commit()
        
        print("\n✅ SUCCESS: The INSERT command worked from Python!")

except Exception as e:
    print(f"\n🔴 FAILED: The script crashed with an error.")
    print(f"   Error: {e}")
    if conn:
        conn.rollback()
finally:
    if conn:
        conn.close()
        print("\nConnection closed.")

print("--- Test Complete ---")