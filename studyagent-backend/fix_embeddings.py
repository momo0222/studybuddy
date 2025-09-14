#!/usr/bin/env python3
"""
Script to fix existing embeddings by ensuring all notes have raw_path data available.
This doesn't modify the embeddings table structure, but ensures the notes table has complete data.
"""

import sqlite3
import os

DB_PATH = "studyagent.db"

def get_db():
    return sqlite3.connect(DB_PATH)

def check_missing_raw_paths():
    """Check which notes are missing raw_path data"""
    conn = get_db()
    
    # Find notes that have embeddings but missing or null raw_path
    missing_raw_path = conn.execute("""
        SELECT n.id, n.title, n.raw_path, n.created_at
        FROM notes n
        JOIN embeddings e ON n.id = e.note_id
        WHERE n.raw_path IS NULL OR n.raw_path = ''
    """).fetchall()
    
    print(f"Found {len(missing_raw_path)} notes with embeddings but missing raw_path:")
    for note in missing_raw_path:
        print(f"  - {note[0]}: {note[1]} (created: {note[3]})")
    
    return missing_raw_path

def fix_raw_paths():
    """Attempt to fix missing raw_path data"""
    conn = get_db()
    
    # Get notes with missing raw_path
    missing_notes = conn.execute("""
        SELECT n.id, n.title, n.raw_path
        FROM notes n
        JOIN embeddings e ON n.id = e.note_id
        WHERE n.raw_path IS NULL OR n.raw_path = ''
    """).fetchall()
    
    if not missing_notes:
        print("No notes with missing raw_path found!")
        return
    
    print(f"Attempting to fix {len(missing_notes)} notes...")
    
    for note_id, title, current_raw_path in missing_notes:
        # Try to construct the raw_path based on the title
        # Assuming files are stored in uploads/raws/ directory
        potential_path = f"uploads/raws/{title}"
        
        # Check if the file exists
        if os.path.exists(potential_path):
            print(f"  ✓ Found file for {title} at {potential_path}")
            conn.execute(
                "UPDATE notes SET raw_path = ? WHERE id = ?",
                (potential_path, note_id)
            )
        else:
            # Try without uploads/raws prefix (in case it's stored differently)
            alt_path = f"raws/{title}"
            if os.path.exists(alt_path):
                print(f"  ✓ Found file for {title} at {alt_path}")
                conn.execute(
                    "UPDATE notes SET raw_path = ? WHERE id = ?",
                    (alt_path, note_id)
                )
            else:
                print(f"  ✗ Could not find file for {title}")
                print(f"    Tried: {potential_path}")
                print(f"    Tried: {alt_path}")
    
    conn.commit()
    print("Raw path fixes applied!")

def verify_embeddings_data():
    """Verify that all notes with embeddings now have complete data"""
    conn = get_db()
    
    complete_notes = conn.execute("""
        SELECT COUNT(*) as count
        FROM notes n
        JOIN embeddings e ON n.id = e.note_id
        WHERE n.raw_path IS NOT NULL AND n.raw_path != ''
    """).fetchone()[0]
    
    total_embeddings = conn.execute("""
        SELECT COUNT(*) as count
        FROM embeddings
    """).fetchone()[0]
    
    print(f"\nVerification Results:")
    print(f"  Total embeddings: {total_embeddings}")
    print(f"  Notes with complete raw_path: {complete_notes}")
    print(f"  Missing raw_path: {total_embeddings - complete_notes}")
    
    if complete_notes == total_embeddings:
        print("  ✅ All embeddings have complete note data!")
    else:
        print("  ⚠️  Some embeddings still have incomplete note data")

def main():
    print("=== Fixing Embeddings Raw Path Data ===\n")
    
    # Check current state
    print("1. Checking for missing raw_path data...")
    missing = check_missing_raw_paths()
    
    if not missing:
        print("✅ All notes already have raw_path data!")
        return
    
    # Attempt to fix
    print("\n2. Attempting to fix missing raw_path data...")
    fix_raw_paths()
    
    # Verify results
    print("\n3. Verifying results...")
    verify_embeddings_data()
    
    print("\n=== Done! ===")

if __name__ == "__main__":
    main()
