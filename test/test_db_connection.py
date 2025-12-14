# test/test_db_connection.py

# Add project root
import sys
import os
from sqlalchemy import text
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, ROOT_DIR)
from utils.db import SessionLocal

def test_db():
    db = SessionLocal()
    try:
        result = db.execute(text("SELECT 1")).fetchone()
        print("✅ DB CONNECTED:", result)
    finally:
        db.close()

if __name__ == "__main__":
    test_db()
