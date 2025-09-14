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
    CREATE TABLE IF NOT EXISTS classes (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        topic_id TEXT NOT NULL,
        created_at TEXT,
        FOREIGN KEY(topic_id) REFERENCES topics(id)
    )
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        class_id TEXT,
        title TEXT,
        raw_path TEXT,
        cleaned_text TEXT,
        summary TEXT,
        created_at TEXT,
        notes_path TEXT,
        file_hash TEXT,
        FOREIGN KEY(class_id) REFERENCES classes(id)
    )
    """)
    
    # Add file_hash column if it doesn't exist (for existing databases)
    try:
        cur.execute("ALTER TABLE notes ADD COLUMN file_hash TEXT")
    except sqlite3.OperationalError:
        pass  # Column already exists
    
    # Add class_id column and update schema for existing databases
    try:
        cur.execute("ALTER TABLE notes ADD COLUMN class_id TEXT")
    except sqlite3.OperationalError:
        pass  # Column already exists

    cur.execute("""
    CREATE TABLE IF NOT EXISTS embeddings (
        note_id TEXT,
        vector BLOB,
        FOREIGN KEY(note_id) REFERENCES notes(id)
    )
    """)

    # Active Recall Tables
    cur.execute("""
    CREATE TABLE IF NOT EXISTS concepts (
        id TEXT PRIMARY KEY,
        class_id TEXT NOT NULL,
        name TEXT NOT NULL,
        content TEXT NOT NULL,
        mastery_level INTEGER DEFAULT 0,
        last_reviewed TEXT,
        next_review TEXT,
        review_count INTEGER DEFAULT 0,
        correct_streak INTEGER DEFAULT 0,
        difficulty_level INTEGER DEFAULT 1,
        created_at TEXT,
        FOREIGN KEY(class_id) REFERENCES classes(id)
    )
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS review_sessions (
        id TEXT PRIMARY KEY,
        concept_id TEXT NOT NULL,
        question TEXT NOT NULL,
        user_answer TEXT,
        correct BOOLEAN,
        timestamp TEXT NOT NULL,
        hints_used INTEGER DEFAULT 0,
        feedback TEXT,
        session_type TEXT DEFAULT 'practice',
        FOREIGN KEY(concept_id) REFERENCES concepts(id)
    )
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS concept_weaknesses (
        id TEXT PRIMARY KEY,
        concept_id TEXT NOT NULL,
        weakness_area TEXT NOT NULL,
        severity INTEGER DEFAULT 1,
        last_encountered TEXT NOT NULL,
        times_encountered INTEGER DEFAULT 1,
        FOREIGN KEY(concept_id) REFERENCES concepts(id)
    )
    """)

    conn.commit()
    conn.close()
