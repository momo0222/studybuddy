# app.py
import os
import uuid
import json
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename

# DB + AI helpers
from db import get_db, init_db
from ai import summarize_text

# PDF/OCR libs
import pdfplumber
from pdf2image import convert_from_path
import pytesseract
from PyPDF2 import PdfReader
from PIL import Image

# Ensure brew binaries are accessible
os.environ["PATH"] += os.pathsep + "/opt/homebrew/bin"

# Flask setup
app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Initialize DB on startup
init_db()


# -------------------------------------------------------------------
# Helpers
# -------------------------------------------------------------------
def extract_text_from_pdf(filepath: str) -> str:
    """Try to extract text from a PDF. Use PyPDF2/pdfplumber first, fallback to OCR if needed."""
    text = ""

    # 1. Try pdfplumber
    try:
        with pdfplumber.open(filepath) as pdf:
            extracted = [page.extract_text() or "" for page in pdf.pages]
            text = "\n".join(extracted).strip()
    except Exception as e:
        print(f"pdfplumber failed: {e}")
        text = ""

    # 2. Try PyPDF2 if pdfplumber failed
    if not text.strip():
        try:
            reader = PdfReader(filepath)
            for page in reader.pages:
                text += page.extract_text() or ""
        except Exception as e:
            print(f"PyPDF2 failed: {e}")

    # 3. OCR fallback
    if not text.strip():
        try:
            images = convert_from_path(filepath)
            ocr_texts = [pytesseract.image_to_string(img) for img in images]
            text = "\n".join(ocr_texts)
        except Exception as e:
            print(f"OCR failed: {e}")
            text = ""

    return text.strip()


def extract_text_from_image(file) -> str:
    """Extract text from an uploaded image file."""
    try:
        image = Image.open(file.stream)
        return pytesseract.image_to_string(image)
    except Exception as e:
        print(f"OCR image failed: {e}")
        return ""


# -------------------------------------------------------------------
# Routes
# -------------------------------------------------------------------

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "timestamp": datetime.now().isoformat()})


# -------- TOPICS --------
@app.route("/api/topics", methods=["POST"])
def create_topic():
    data = request.json
    if not data or "name" not in data:
        return jsonify({"error": "Missing topic name"}), 400

    topic_id = str(uuid.uuid4())
    name = data["name"]

    conn = get_db()
    conn.execute(
        "INSERT INTO topics VALUES (?, ?, ?)",
        (topic_id, name, datetime.now().isoformat())
    )
    conn.commit()

    return jsonify({"id": topic_id, "name": name})


@app.route("/api/topics", methods=["GET"])
def list_topics():
    conn = get_db()
    rows = conn.execute("SELECT * FROM topics").fetchall()
    return jsonify([dict(r) for r in rows])


# -------- NOTES --------
@app.route("/api/notes/<topic_id>", methods=["POST"])
def upload_note(topic_id):
    conn = get_db()
    topic_exists = conn.execute("SELECT 1 FROM topics WHERE id=?", (topic_id,)).fetchone()
    if not topic_exists:
        return jsonify({"error": "Topic not found"}), 404

    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["file"]
    filename = secure_filename(file.filename.lower())
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    file.save(filepath)

    raw_text = ""

    if filename.endswith(".txt"):
        with open(filepath, "r", errors="ignore") as f:
            raw_text = f.read()

    elif filename.endswith(".pdf"):
        raw_text = extract_text_from_pdf(filepath)

    elif filename.endswith((".jpg", ".jpeg", ".png")):
        raw_text = extract_text_from_image(file)

    else:
        return jsonify({"error": "Unsupported file type"}), 400

    if not raw_text.strip():
        return jsonify({"error": "Could not extract text"}), 400

    # Summarize with AI
    processed = summarize_text(raw_text)
    note_id = str(uuid.uuid4())

    # Save raw text to disk
    raw_path = os.path.join(UPLOAD_FOLDER, f"{note_id}_raw.txt")
    with open(raw_path, "w") as f:
        f.write(raw_text)

    # Save to DB
    conn.execute(
        "INSERT INTO notes VALUES (?, ?, ?, ?, ?, ?, ?)",
        (
            note_id,
            topic_id,
            file.filename,
            raw_path,
            processed["cleaned"],
            json.dumps(processed["summary"]),
            datetime.now().isoformat()
        )
    )
    conn.commit()

    return jsonify({
        "id": note_id,
        "title": file.filename,
        "summary": processed["summary"]
    })


@app.route("/api/notes/<topic_id>", methods=["GET"])
def list_notes(topic_id):
    conn = get_db()
    rows = conn.execute("SELECT * FROM notes WHERE topic_id=?", (topic_id,)).fetchall()
    return jsonify([dict(r) for r in rows])


# -------- SEARCH --------
@app.route("/api/search", methods=["GET"])
def search_notes():
    topic_id = request.args.get("topic")
    query = request.args.get("q")

    if not topic_id or not query:
        return jsonify({"error": "Missing topic or query"}), 400

    conn = get_db()
    rows = conn.execute(
        "SELECT id, title, summary FROM notes WHERE topic_id=? AND cleaned_text LIKE ?",
        (topic_id, f"%{query}%")
    ).fetchall()

    return jsonify([dict(r) for r in rows])


# -------------------------------------------------------------------
# Run
# -------------------------------------------------------------------
if __name__ == "__main__":
    app.run(debug=True)
