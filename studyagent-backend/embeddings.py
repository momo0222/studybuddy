import json
import os
import sqlite3
import uuid
from sentence_transformers import SentenceTransformer
import numpy as np


DB_PATH = "studyagent.db"
model = SentenceTransformer("all-MiniLM-L6-v2")

def get_db():
    return sqlite3.connect(DB_PATH)

def store_embedding(note_id, text):
    """Generate and store embedding for note text"""
    embedding = model.encode(text).tolist()
    conn = get_db()
    cur = conn.cursor()
    cur.execute("INSERT INTO embeddings VALUES (?, ?)",
                (note_id, json.dumps(embedding)))
    conn.commit()

def semantic_search(query: str, topic_id: str = None, class_id: str = None, top_k=5, min_score=0.3):
    q_vec = model.encode([query])[0]
    conn = get_db()
    
    # Build query with optional filtering
    base_query = (
        "SELECT n.id, n.title, n.summary, n.cleaned_text, n.created_at, n.class_id, "
        "n.raw_path, c.name as class_name, t.name as topic_name, t.id as topic_id, e.vector "
        "FROM notes n "
        "JOIN classes c ON n.class_id = c.id "
        "JOIN topics t ON c.topic_id = t.id "
        "JOIN embeddings e ON n.id = e.note_id"
    )
    
    conditions = []
    params = []
    
    if topic_id:
        conditions.append("t.id = ?")
        params.append(topic_id)
    
    if class_id:
        conditions.append("c.id = ?")
        params.append(class_id)
    
    if conditions:
        base_query += " WHERE " + " AND ".join(conditions)
    
    rows = conn.execute(base_query, params).fetchall()

    results = []
    import numpy as np, json

    for r in rows:
        # Unpack all the fields from the updated query
        note_id, title, summary, cleaned_text, created_at, class_id, raw_path, class_name, topic_name, topic_id_val, vector_str = r

        vec = np.array(json.loads(vector_str))
        score = float(np.dot(q_vec, vec) / (np.linalg.norm(q_vec) * np.linalg.norm(vec)))

        results.append({
            "id": note_id,
            "title": title,
            "summary": json.loads(summary) if isinstance(summary, str) else summary,
            "cleaned_text": cleaned_text,
            "created_at": created_at,
            "class_id": class_id,
            "raw_path": raw_path,
            "class_name": class_name,
            "topic_name": topic_name,
            "topic_id": topic_id_val,
            "score": score,
            "search_type": "semantic"
        })

    # Filter results by minimum score threshold
    filtered_results = [r for r in results if r["score"] >= min_score]
    
    filtered_results.sort(key=lambda x: -x["score"])
    return filtered_results[:top_k]
