import sqlite3

DB_NAME = "studyagent.db"

def get_db():
    conn = sqlite3.connect(DB_NAME, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cur = conn.cursor()

    cur.execute("""
    CREATE TABLE IF NOT EXISTS topics (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        created_at TEXT
    )
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        topic_id TEXT,
        title TEXT,
        raw_path TEXT,
        cleaned_text TEXT,
        summary TEXT,
        created_at TEXT,
        FOREIGN KEY(topic_id) REFERENCES topics(id)
    )
    """)

    conn.commit()
    conn.close()