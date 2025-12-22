from passlib.context import CryptContext
import sys

# This must match the context in your main_api.py
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Use a default password or get one from the command line
plain_password = "password"
if len(sys.argv) > 1:
    plain_password = sys.argv[1]

hashed_password = pwd_context.hash(plain_password)

print("\n--- PASSWORD HASH GENERATED ---")
print(f"Plain text: '{plain_password}'")
print("\nCOPY THE SQL COMMAND BELOW and run it in your psql terminal:")
print("-" * 50)
print(f"UPDATE app.users SET hashed_password = '{hashed_password}' WHERE username = 'admin';")
print("-" * 50)