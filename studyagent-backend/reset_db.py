# reset_db.py
from db import init_db, get_db

def reset_db():
    conn = get_db()
    cur = conn.cursor()

    # Drop tables if they exist
    cur.execute("DROP TABLE IF EXISTS notes")
    cur.execute("DROP TABLE IF EXISTS topics")

    conn.commit()
    conn.close()

    # Recreate tables
    init_db()
    print("✅ Database has been reset.")

if __name__ == "__main__":
    reset_db()
