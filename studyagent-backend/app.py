# app.py
import os
from pathlib import Path
import json
import uuid
from datetime import datetime
from pathlib import Path
import hashlib
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
from dotenv import load_dotenv

# Load environment variables from .env file in parent directory
load_dotenv(dotenv_path='../.env')

# DB + AI helpers
from db import get_db, init_db
from ai import process_long_text
from extractors import extract_text_from_image, extract_text_from_pdf

#embedding
from embeddings import store_embedding, semantic_search

# Active Recall
from active_recall import ActiveRecallSystem

# Ensure brew binaries are accessible
os.environ["PATH"] += os.pathsep + "/opt/homebrew/bin"

# Flask setup
app = Flask(__name__)
CORS(app, origins=['http://localhost:3000', 'http://127.0.0.1:3000'], supports_credentials=False, allow_headers=['Content-Type', 'Authorization'], methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])

# Serve static files (raw uploads)
from flask import send_from_directory

# Initialize Active Recall System
active_recall = ActiveRecallSystem()

@app.route('/uploads/<path:filename>')
def serve_uploads(filename):
    return send_from_directory('uploads', filename)

UPLOAD_RAWS = "uploads/raws"
UPLOAD_AI = "uploads/ai"
# Initialize DB on startup
init_db()

# -------------------------------------------------------------------
# Routes
# -------------------------------------------------------------------

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "timestamp": datetime.now().isoformat()})


# -------- TOPICS --------
@app.route("/api/topics", methods=["POST"])
def create_topic():
    print(f"Received topic creation request: {request.json}")
    data = request.json
    if not data or "name" not in data:
        print("Missing topic name in request")
        return jsonify({"error": "Missing topic name"}), 400

    topic_id = str(uuid.uuid4())
    name = data["name"]
    print(f"Creating topic: {name} with ID: {topic_id}")

    conn = get_db()
    conn.execute(
        "INSERT INTO topics VALUES (?, ?, ?)",
        (topic_id, name, datetime.now().isoformat())
    )
    conn.commit()
    print(f"Topic created successfully: {topic_id}")

    return jsonify({"id": topic_id, "name": name, "created_at": datetime.now().isoformat()})


# -------- CLASSES --------
@app.route("/api/classes", methods=["POST"])
def create_class():
    print(f"Received class creation request: {request.json}")
    data = request.json
    if not data or "name" not in data or "topic_id" not in data:
        print("Missing class name or topic_id in request")
        return jsonify({"error": "Missing class name or topic_id"}), 400

    class_id = str(uuid.uuid4())
    name = data["name"]
    topic_id = data["topic_id"]
    print(f"Creating class: {name} for topic: {topic_id}")

    conn = get_db()
    # Verify topic exists
    topic = conn.execute("SELECT id FROM topics WHERE id=?", (topic_id,)).fetchone()
    if not topic:
        print(f"Topic not found: {topic_id}")
        return jsonify({"error": "Topic not found"}), 404

    conn.execute(
        "INSERT INTO classes VALUES (?, ?, ?, ?)",
        (class_id, name, topic_id, datetime.now().isoformat())
    )
    conn.commit()
    print(f"Class created successfully: {class_id}")

    return jsonify({"id": class_id, "name": name, "topic_id": topic_id, "created_at": datetime.now().isoformat()})


@app.route("/api/classes", methods=["GET"])
def list_classes():
    topic_id = request.args.get('topic_id')
    conn = get_db()
    
    if topic_id:
        rows = conn.execute(
            "SELECT c.*, t.name as topic_name FROM classes c JOIN topics t ON c.topic_id = t.id WHERE c.topic_id=?", 
            (topic_id,)
        ).fetchall()
    else:
        rows = conn.execute(
            "SELECT c.*, t.name as topic_name FROM classes c JOIN topics t ON c.topic_id = t.id"
        ).fetchall()
    
    return jsonify([dict(r) for r in rows])


@app.route("/api/topics", methods=["GET"])
def get_topics():
    conn = get_db()
    
    # Don't cleanup immediately - let users create classes first
    # cleanup_empty_topics()
    
    # Get topics with class count and note count
    rows = conn.execute("""
        SELECT 
            t.id, 
            t.name, 
            t.created_at,
            COUNT(DISTINCT c.id) as class_count,
            COUNT(DISTINCT n.id) as note_count
        FROM topics t
        LEFT JOIN classes c ON t.id = c.topic_id
        LEFT JOIN notes n ON c.id = n.class_id
        GROUP BY t.id, t.name, t.created_at
        ORDER BY t.created_at DESC
    """).fetchall()
    
    return jsonify([dict(r) for r in rows])


# -------- NOTES --------
def calculate_file_hash(file_content):
    """Calculate SHA-256 hash of file content"""
    return hashlib.sha256(file_content).hexdigest()

@app.route("/api/notes/<class_id>", methods=["POST"])
def upload_note(class_id):
    conn = get_db()
    class_info = conn.execute(
        "SELECT c.name as class_name, t.name as topic_name FROM classes c JOIN topics t ON c.topic_id = t.id WHERE c.id=?", 
        (class_id,)
    ).fetchone()
    if not class_info:
        return jsonify({"error": "Class not found"}), 404

    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    class_name = class_info["class_name"].replace(" ", "_")  # safe folder name
    topic_name = class_info["topic_name"].replace(" ", "_")
    file = request.files["file"]
    
    # Read file content for duplicate checking
    file_content = file.read()
    file.seek(0)  # Reset file pointer for later use
    
    filename = secure_filename(file.filename.lower())
    file_hash = calculate_file_hash(file_content)
    
    # Check for duplicates by filename in this class
    existing_by_name = conn.execute(
        "SELECT id, title FROM notes WHERE class_id=? AND title=?", 
        (class_id, file.filename)
    ).fetchone()
    
    if existing_by_name:
        return jsonify({
            "error": "Duplicate file", 
            "message": f"A file named '{file.filename}' already exists in this class"
        }), 409
    
    # Check for duplicates by content hash across all classes
    existing_by_hash = conn.execute(
        "SELECT n.id, n.title, c.name as class_name, t.name as topic_name FROM notes n JOIN classes c ON n.class_id = c.id JOIN topics t ON c.topic_id = t.id WHERE n.file_hash=?", 
        (file_hash,)
    ).fetchone()
    
    if existing_by_hash:
        return jsonify({
            "error": "Duplicate content", 
            "message": f"This file content already exists as '{existing_by_hash['title']}' in class '{existing_by_hash['class_name']}' under topic '{existing_by_hash['topic_name']}'"
        }), 409

    # ensure raw dir exists
    class_raw_dir = Path(UPLOAD_RAWS) / topic_name / class_name
    class_raw_dir.mkdir(parents=True, exist_ok=True)

    filepath = class_raw_dir / filename
    file.save(str(filepath))

    # --- Extract text
    if filename.endswith(".txt"):
        raw_text = filepath.read_text(errors="ignore")
    elif filename.endswith(".pdf"):
        raw_text = extract_text_from_pdf(str(filepath))
    elif filename.endswith((".jpg", ".jpeg", ".png")):
        raw_text = extract_text_from_image(file)
    else:
        return jsonify({"error": "Unsupported file type"}), 400

    if not raw_text.strip():
        return jsonify({"error": "Could not extract text"}), 400

    # --- AI processing (with chunking)
    result = process_long_text(raw_text)
    formatted_notes = result["cleaned"]
    summary = result["summary"]

    note_id = str(uuid.uuid4())

    # --- Save AI notes (processed markdown)
    class_ai_dir = Path(UPLOAD_AI) / topic_name / class_name
    class_ai_dir.mkdir(parents=True, exist_ok=True)
    notes_path = class_ai_dir / f"{Path(filename).stem}_ai.md"
    notes_path.write_text(formatted_notes, encoding="utf-8")

    # --- Store embedding
    note_id = str(uuid.uuid4())
    store_embedding(note_id, formatted_notes)

    # Save to database
    conn.execute("""
        INSERT INTO notes (id, class_id, title, raw_path, cleaned_text, summary, created_at, notes_path, file_hash)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (note_id, class_id, file.filename, str(filepath), formatted_notes, json.dumps(summary),
          datetime.now().isoformat(), str(notes_path), file_hash))
    conn.commit()

    # Automatically generate concepts for Active Recall
    try:
        from active_recall import ActiveRecallSystem
        ar_system = ActiveRecallSystem()
        concept_ids = ar_system.generate_concepts_from_notes(class_id)
        print(f"Auto-generated {len(concept_ids)} concepts for Active Recall from new upload")
    except Exception as e:
        print(f"Failed to auto-generate concepts: {e}")
        # Don't fail the upload if concept generation fails

    return jsonify({
        "id": note_id,
        "title": file.filename,
        "notes": formatted_notes,
        "summary": summary
    })


@app.route("/api/notes/<class_id>", methods=["GET"])
def get_notes(class_id):
    conn = get_db()
    rows = conn.execute(
        "SELECT id, title, summary, cleaned_text, created_at, raw_path, notes_path FROM notes WHERE class_id=?",
        (class_id,)
    ).fetchall()
    
    # Don't cleanup immediately when fetching notes - let users create classes first
    # cleanup_empty_topics()
    
    return jsonify([dict(r) for r in rows])


# -------- SEARCH --------
@app.route("/api/search", methods=["GET"])
def search_notes():
    query = request.args.get("q")
    topic_id = request.args.get("topic_id")
    class_id = request.args.get("class_id")
    search_type = request.args.get("type", "hybrid")  # hybrid, keyword, semantic

    if not query:
        return jsonify({"error": "Missing query"}), 400

    results = []
    
    # Keyword search
    if search_type in ["hybrid", "keyword"]:
        keyword_results = keyword_search(query, topic_id, class_id)
        results.extend(keyword_results)
    
    # Semantic search
    if search_type in ["hybrid", "semantic"]:
        try:
            semantic_results = semantic_search(query, topic_id, class_id)
            results.extend(semantic_results)
        except Exception as e:
            print(f"Semantic search error: {e}")
            # Fall back to keyword search only
            if search_type == "semantic":
                keyword_results = keyword_search(query, topic_id, class_id)
                results.extend(keyword_results)
    
    # Remove duplicates and merge results
    seen_ids = set()
    unique_results = []
    for result in results:
        if result['id'] not in seen_ids:
            seen_ids.add(result['id'])
            unique_results.append(result)
    
    # Sort by relevance score (highest first), then by date for ties
    unique_results.sort(key=lambda x: (
        -x.get('score', 0),  # Primary sort: highest score first
        -int(x.get('created_at', '').replace('-', '').replace(':', '').replace('T', '').replace('.', '')[:14] or '0')  # Secondary sort: newest first
    ))
    
    return jsonify(unique_results)

def keyword_search(query, topic_id=None, class_id=None):
    """Perform keyword-based search"""
    conn = get_db()
    
    # Search in both summary and cleaned_text fields
    sql = """
        SELECT n.id, n.title, n.summary, n.cleaned_text, n.created_at, n.class_id, n.raw_path,
               c.name as class_name, t.name as topic_name, t.id as topic_id
        FROM notes n
        JOIN classes c ON n.class_id = c.id
        JOIN topics t ON c.topic_id = t.id
        WHERE (n.summary LIKE ? OR n.cleaned_text LIKE ? OR n.title LIKE ?)
    """
    
    params = [f"%{query}%", f"%{query}%", f"%{query}%"]
    
    if topic_id:
        sql += " AND t.id = ?"
        params.append(topic_id)
    
    if class_id:
        sql += " AND c.id = ?"
        params.append(class_id)
    
    sql += " ORDER BY n.created_at DESC"
    
    rows = conn.execute(sql, params).fetchall()
    
    # Format results with highlighted snippets
    results = []
    for row in rows:
        note = dict(row)
        
        # Create snippets with context around the search term
        snippets = []
        
        # Check summary for matches
        if note['summary'] and query.lower() in note['summary'].lower():
            snippet = create_snippet(note['summary'], query)
            if snippet:
                snippets.append({"type": "summary", "text": snippet})
        
        # Check cleaned_text for matches
        if note['cleaned_text'] and query.lower() in note['cleaned_text'].lower():
            snippet = create_snippet(note['cleaned_text'], query)
            if snippet:
                snippets.append({"type": "content", "text": snippet})
        
        note['snippets'] = snippets
        note['search_type'] = 'keyword'
        note['score'] = 0.1  # Give keyword results a low score for consistent sorting
        results.append(note)
    
    return results

def create_snippet(text, query, context_chars=150):
    """Create a snippet with context around the search term"""
    if not text or not query:
        return ""
    
    text_lower = text.lower()
    query_lower = query.lower()
    
    # Find the first occurrence of the query
    index = text_lower.find(query_lower)
    if index == -1:
        return ""
    
    # Calculate start and end positions for context
    start = max(0, index - context_chars // 2)
    end = min(len(text), index + len(query) + context_chars // 2)
    
    # Adjust to word boundaries
    if start > 0:
        start = text.rfind(' ', 0, start) + 1
    if end < len(text):
        end = text.find(' ', end)
        if end == -1:
            end = len(text)
    
    snippet = text[start:end]
    
    # Add ellipsis if truncated
    if start > 0:
        snippet = "..." + snippet
    if end < len(text):
        snippet = snippet + "..."
    
    return snippet

def cleanup_empty_topics():
    """Remove topics that have no notes and no classes"""
    conn = get_db()
    
    # Find topics with no classes at all (more lenient - allow empty classes to exist)
    empty_topics = conn.execute("""
        SELECT t.id, t.name FROM topics t
        WHERE NOT EXISTS (
            SELECT 1 FROM classes c 
            WHERE c.topic_id = t.id
        )
        AND datetime(t.created_at) < datetime('now', '-1 hour')
    """).fetchall()
    
    for topic in empty_topics:
        topic_id = topic["id"]
        topic_name = topic["name"]
        
        # Delete the topic
        conn.execute("DELETE FROM topics WHERE id = ?", (topic_id,))
        
        # Remove topic folders if they exist
        topic_folder_name = topic_name.replace(" ", "_")
        raw_topic_dir = Path(UPLOAD_RAWS) / topic_folder_name
        ai_topic_dir = Path(UPLOAD_AI) / topic_folder_name
        
        if raw_topic_dir.exists():
            import shutil
            shutil.rmtree(raw_topic_dir)
        if ai_topic_dir.exists():
            import shutil
            shutil.rmtree(ai_topic_dir)
    
    conn.commit()
    return len(empty_topics)


# -------------------------------------------------------------------
# Run
# -------------------------------------------------------------------
# -------- ACTIVE RECALL --------

@app.route("/api/active-recall/generate-concepts/<class_id>", methods=["POST"])
def generate_concepts_for_class(class_id):
    """Generate active recall concepts from all notes in a class"""
    try:
        concept_ids = active_recall.generate_concepts_from_notes(class_id)
        return jsonify({
            "success": True,
            "concept_ids": concept_ids,
            "message": f"Generated {len(concept_ids)} concepts for active recall"
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/active-recall/concepts/<class_id>", methods=["GET"])
def get_class_concepts(class_id):
    """Get all concepts for a class"""
    try:
        concepts = active_recall.get_concepts_for_class(class_id)
        return jsonify([{
            "id": c.id,
            "name": c.name,
            "content": c.content,
            "mastery_level": c.mastery_level.name,
            "last_reviewed": c.last_reviewed.isoformat() if c.last_reviewed else None,
            "next_review": c.next_review.isoformat(),
            "review_count": c.review_count,
            "correct_streak": c.correct_streak,
            "difficulty_level": c.difficulty_level.name
        } for c in concepts])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/active-recall/study-session/<class_id>", methods=["GET"])
def start_study_session(class_id):
    """Start an active recall study session"""
    try:
        due_concepts = active_recall.get_concepts_due_for_review(class_id)
        
        if not due_concepts:
            return jsonify({
                "message": "No concepts due for review",
                "concepts_available": False
            })
        
        # Get the first concept due for review
        concept = due_concepts[0]
        question = active_recall.generate_question(concept)
        
        return jsonify({
            "concept": {
                "id": concept.id,
                "name": concept.name,
                "mastery_level": concept.mastery_level.name
            },
            "question": {
                "text": question.question_text,
                "type": question.question_type,
                "difficulty": question.difficulty.name
            },
            "session_info": {
                "concepts_due": len(due_concepts),
                "current_position": 1
            },
            "concepts_available": True
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/active-recall/submit-answer", methods=["POST"])
def submit_answer():
    """Submit an answer for evaluation"""
    try:
        data = request.get_json()
        concept_id = data.get('concept_id')
        question_text = data.get('question')
        user_answer = data.get('answer')
        
        if not all([concept_id, question_text, user_answer]):
            return jsonify({"error": "Missing required fields"}), 400
        
        # Get the concept
        conn = get_db()
        concept_row = conn.execute(
            "SELECT * FROM concepts WHERE id = ?", (concept_id,)
        ).fetchone()
        
        if not concept_row:
            return jsonify({"error": "Concept not found"}), 404
        
        # Create concept object
        from active_recall import Concept, MasteryLevel, DifficultyLevel
        concept = Concept(
            id=concept_row['id'],
            class_id=concept_row['class_id'],
            name=concept_row['name'],
            content=concept_row['content'],
            mastery_level=MasteryLevel(concept_row['mastery_level']),
            last_reviewed=datetime.fromisoformat(concept_row['last_reviewed']) if concept_row['last_reviewed'] else None,
            next_review=datetime.fromisoformat(concept_row['next_review']),
            review_count=concept_row['review_count'],
            correct_streak=concept_row['correct_streak'],
            difficulty_level=DifficultyLevel(concept_row['difficulty_level']),
            created_at=datetime.fromisoformat(concept_row['created_at'])
        )
        
        # Create question object (simplified)
        from active_recall import Question
        question = Question(
            concept_id=concept_id,
            question_text=question_text,
            expected_answer="",  # We'll evaluate without expected answer
            difficulty=concept.difficulty_level,
            question_type="recall"
        )
        
        # Evaluate the answer
        evaluation = active_recall.evaluate_answer(question, user_answer, concept)
        
        # Update concept progress
        updated_concept = active_recall.update_concept_progress(concept, evaluation['correct'])
        
        # Save review session
        session_id = active_recall.save_review_session(
            concept_id, question_text, user_answer, 
            evaluation['correct'], evaluation['feedback']
        )
        
        return jsonify({
            "session_id": session_id,
            "correct": evaluation['correct'],
            "score": evaluation['score'],
            "feedback": evaluation['feedback'],
            "concept_progress": {
                "mastery_level": updated_concept.mastery_level.name,
                "correct_streak": updated_concept.correct_streak,
                "next_review": updated_concept.next_review.isoformat()
            }
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/active-recall/progress/<class_id>", methods=["GET"])
def get_class_progress(class_id):
    """Get progress statistics for a class"""
    try:
        progress = active_recall.get_class_progress(class_id)
        return jsonify(progress)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/active-recall/sessions/<concept_id>", methods=["GET"])
def get_concept_sessions(concept_id):
    """Get review session history for a concept"""
    try:
        conn = get_db()
        sessions = conn.execute("""
            SELECT id, question, user_answer, correct, timestamp, 
                   hints_used, feedback, session_type
            FROM review_sessions 
            WHERE concept_id = ?
            ORDER BY timestamp DESC
        """, (concept_id,)).fetchall()
        
        return jsonify([dict(session) for session in sessions])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5002)
