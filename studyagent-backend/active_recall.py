import sqlite3
import json
import uuid
from datetime import datetime, timedelta
from enum import Enum
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass
from db import get_db
import anthropic
import os

class MasteryLevel(Enum):
    UNKNOWN = 0
    LEARNING = 1
    FAMILIAR = 2
    PROFICIENT = 3
    MASTERED = 4

class DifficultyLevel(Enum):
    BASIC = 1
    INTERMEDIATE = 2
    ADVANCED = 3
    EXPERT = 4

@dataclass
class Concept:
    id: str
    class_id: str
    name: str
    content: str
    mastery_level: MasteryLevel
    last_reviewed: Optional[datetime]
    next_review: datetime
    review_count: int
    correct_streak: int
    difficulty_level: DifficultyLevel
    created_at: datetime

@dataclass
class Question:
    concept_id: str
    question_text: str
    expected_answer: str
    difficulty: DifficultyLevel
    question_type: str  # "recall", "application", "synthesis"

@dataclass
class ReviewSession:
    id: str
    concept_id: str
    question: str
    user_answer: Optional[str]
    correct: Optional[bool]
    timestamp: datetime
    hints_used: int
    feedback: Optional[str]
    session_type: str

class ActiveRecallSystem:
    def __init__(self):
        self.anthropic_client = anthropic.Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))
    
    def generate_concepts_from_notes(self, class_id: str) -> List[str]:
        """Generate concepts from all notes in a class, avoiding duplicates"""
        conn = get_db()
        
        # Get all notes for this class
        notes = conn.execute("""
            SELECT cleaned_text FROM notes WHERE class_id = ?
        """, (class_id,)).fetchall()
        
        if not notes:
            return []
        
        # Get existing concept names to avoid duplicates
        existing_concepts = conn.execute("""
            SELECT name FROM concepts WHERE class_id = ?
        """, (class_id,)).fetchall()
        existing_names = {concept['name'].lower() for concept in existing_concepts}
        
        # Combine all note content
        combined_content = "\n\n".join([note['cleaned_text'] for note in notes])
        
        # Generate concepts using AI
        concepts_data = self._generate_concepts_with_ai(combined_content)
        
        concept_ids = []
        for concept_data in concepts_data:
            # Skip if concept already exists
            if concept_data['name'].lower() in existing_names:
                continue
                
            concept_id = str(uuid.uuid4())
            now = datetime.now()
            
            concept = Concept(
                id=concept_id,
                class_id=class_id,
                name=concept_data['name'],
                content=concept_data['content'],
                mastery_level=MasteryLevel.UNKNOWN,
                last_reviewed=None,
                next_review=now,
                review_count=0,
                correct_streak=0,
                difficulty_level=DifficultyLevel(concept_data.get('difficulty', 1)),
                created_at=now
            )
            
            # Save to database
            conn.execute("""
                INSERT INTO concepts (id, class_id, name, content, mastery_level, 
                                    last_reviewed, next_review, review_count, correct_streak, 
                                    difficulty_level, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                concept.id, concept.class_id, concept.name, concept.content,
                concept.mastery_level.value, None, concept.next_review.isoformat(),
                concept.review_count, concept.correct_streak, concept.difficulty_level.value,
                concept.created_at.isoformat()
            ))
            
            concept_ids.append(concept_id)
        
        conn.commit()
        return concept_ids
    
    def _generate_concepts_with_ai(self, content: str) -> List[dict]:
        """Generate concepts using AI from content"""
        try:
            response = self.anthropic_client.messages.create(
                model="claude-3-haiku-20240307",
                max_tokens=2000,
                messages=[
                    {
                        "role": "user",
                        "content": f"""Based on the following lecture content, generate 5-8 key concepts for active recall study. 
                        Each concept should be a fundamental idea, definition, or principle that a student should master.
                        
                        Return ONLY a JSON array in this exact format:
                        [
                            {{"name": "Concept Name", "content": "Detailed explanation of the concept", "difficulty": 1}},
                            {{"name": "Another Concept", "content": "Another explanation", "difficulty": 2}}
                        ]
                        
                        Difficulty levels: 1=Basic, 2=Intermediate, 3=Advanced
                        
                        Content:
                        {content[:8000]}"""
                    }
                ]
            )
            
            response_text = response.content[0].text.strip()
            
            # Handle cases where AI might return text before/after JSON
            if response_text.startswith('[') and response_text.endswith(']'):
                concepts_data = json.loads(response_text)
            else:
                # Try to extract JSON from response
                start_idx = response_text.find('[')
                end_idx = response_text.rfind(']') + 1
                if start_idx != -1 and end_idx != 0:
                    json_str = response_text[start_idx:end_idx]
                    concepts_data = json.loads(json_str)
                else:
                    raise ValueError("No valid JSON array found in response")
            
            return concepts_data
            
        except Exception as e:
            print(f"Error generating concepts with AI: {e}")
            return []
    
    def get_concepts_for_class(self, class_id: str) -> List[Concept]:
        """Get all concepts for a class"""
        conn = get_db()
        rows = conn.execute("""
            SELECT id, class_id, name, content, mastery_level, last_reviewed, 
                   next_review, review_count, correct_streak, difficulty_level, created_at
            FROM concepts 
            WHERE class_id = ?
            ORDER BY next_review ASC
        """, (class_id,)).fetchall()
        
        concepts = []
        for row in rows:
            concepts.append(Concept(
                id=row['id'],
                class_id=row['class_id'],
                name=row['name'],
                content=row['content'],
                mastery_level=MasteryLevel(row['mastery_level']),
                last_reviewed=datetime.fromisoformat(row['last_reviewed']) if row['last_reviewed'] else None,
                next_review=datetime.fromisoformat(row['next_review']),
                review_count=row['review_count'],
                correct_streak=row['correct_streak'],
                difficulty_level=DifficultyLevel(row['difficulty_level']),
                created_at=datetime.fromisoformat(row['created_at'])
            ))
        
        return concepts
    
    def get_concepts_due_for_review(self, class_id: str) -> List[Concept]:
        """Get concepts that are due for review, prioritizing those with low mastery"""
        conn = get_db()
        now = datetime.now().isoformat()
        
        # Get concepts due for review, prioritizing by mastery level (lowest first)
        # and include concepts that need more practice (correct_streak < 3 and mastery = 0)
        rows = conn.execute("""
            SELECT * FROM concepts 
            WHERE class_id = ? AND (
                next_review <= ? OR 
                (mastery_level = 0 AND correct_streak < 3)
            )
            ORDER BY mastery_level ASC, correct_streak ASC, next_review ASC
        """, (class_id, now)).fetchall()
        
        concepts = []
        for row in rows:
            concept = Concept(
                id=row['id'],
                class_id=row['class_id'],
                name=row['name'],
                content=row['content'],
                mastery_level=MasteryLevel(row['mastery_level']),
                last_reviewed=datetime.fromisoformat(row['last_reviewed']) if row['last_reviewed'] else None,
                next_review=datetime.fromisoformat(row['next_review']),
                review_count=row['review_count'],
                correct_streak=row['correct_streak'],
                difficulty_level=DifficultyLevel(row['difficulty_level']),
                created_at=datetime.fromisoformat(row['created_at'])
            )
            concepts.append(concept)
        
        return concepts
    
    def generate_question(self, concept: Concept) -> Question:
        """Generate a question for a concept based on mastery level"""
        difficulty_map = {
            MasteryLevel.UNKNOWN: DifficultyLevel.BASIC,
            MasteryLevel.LEARNING: DifficultyLevel.BASIC,
            MasteryLevel.FAMILIAR: DifficultyLevel.INTERMEDIATE,
            MasteryLevel.PROFICIENT: DifficultyLevel.ADVANCED,
            MasteryLevel.MASTERED: DifficultyLevel.EXPERT
        }
        
        difficulty = difficulty_map[concept.mastery_level]
        
        question_types = {
            DifficultyLevel.BASIC: "recall",
            DifficultyLevel.INTERMEDIATE: "application", 
            DifficultyLevel.ADVANCED: "application",
            DifficultyLevel.EXPERT: "synthesis"
        }
        
        question_type = question_types[difficulty]
        
        try:
            response = self.anthropic_client.messages.create(
                model="claude-3-haiku-20240307",
                max_tokens=200,
                temperature=0.7,
                messages=[
                    {
                        "role": "user",
                        "content": f"""You are an educational AI that creates study questions. 
                        Generate a {difficulty.value} question about the given concept.
                        
                        Difficulty levels:
                        - RECALL: Simple factual questions (What is...? Define...)
                        - APPLICATION: Apply knowledge (How would you use...? Calculate...)
                        - SYNTHESIS: Complex analysis (Compare and contrast... Analyze the implications...)
                        
                        Return only the question text, nothing else.
                        
                        Create a {difficulty.value} question about: {concept.name}
                        
                        Concept details: {concept.content}"""
                    }
                ]
            )
            
            question = response.content[0].text.strip()
            
            return Question(
                concept_id=concept.id,
                question_text=question,
                expected_answer="",
                difficulty=difficulty,
                question_type=question_type
            )
            
        except Exception as e:
            print(f"Error generating question: {e}")
            # Fallback question
            return Question(
                concept_id=concept.id,
                question_text=f"Explain the key points about {concept.name}.",
                expected_answer="Key concepts and principles",
                difficulty=difficulty,
                question_type="recall"
            )
    
    def evaluate_answer(self, question: Question, user_answer: str, concept: Concept) -> Dict:
        """Evaluate user's answer using AI"""
        try:
            response = self.anthropic_client.messages.create(
                model="claude-3-haiku-20240307",
                max_tokens=300,
                temperature=0.3,
                messages=[
                    {
                        "role": "user",
                        "content": f"""You are an educational AI that evaluates student answers for active recall sessions.
                        
                        Evaluate the student's answer and provide:
                        1. Whether the answer is correct (true/false)
                        2. Detailed feedback explaining what was good and what could be improved
                        3. A score from 0-100
                        
                        Be encouraging but honest. Partial credit is okay.
                        
                        Return your response as JSON:
                        {{
                            "correct": true/false,
                            "score": 0-100,
                            "feedback": "Detailed feedback for the student"
                        }}
                        
                        Question: {question.question_text}
                        
                        Expected Answer: {question.expected_answer}
                        
                        Student Answer: {user_answer}
                        
                        Concept Context: {concept.content}"""
                    }
                ]
            )
            
            evaluation = json.loads(response.content[0].text)
            return evaluation
            
        except Exception as e:
            print(f"Error evaluating answer: {e}")
            # Fallback evaluation
            return {
                "correct": len(user_answer.strip()) > 10,  # Simple length check
                "score": 50,
                "feedback": "Answer received. Please review the concept material for better understanding."
            }
    
    def update_concept_progress(self, concept: Concept, correct: bool) -> Concept:
        """Update concept progress based on answer correctness"""
        conn = get_db()
        now = datetime.now()
        
        # Update review count
        concept.review_count += 1
        concept.last_reviewed = now
        
        if correct:
            concept.correct_streak += 1
            
            # More responsive mastery advancement based on performance
            if concept.mastery_level.value < MasteryLevel.MASTERED.value:
                # Advance immediately on first correct answer from Unknown
                if concept.mastery_level == MasteryLevel.UNKNOWN:
                    concept.mastery_level = MasteryLevel.LEARNING
                    concept.correct_streak = 0
                # Advance after 2 correct for higher levels
                elif concept.correct_streak >= 2:
                    concept.mastery_level = MasteryLevel(concept.mastery_level.value + 1)
                    concept.correct_streak = 0
        else:
            concept.correct_streak = 0
            
            # Regression: drop mastery level if performance is poor
            if concept.mastery_level.value > MasteryLevel.UNKNOWN.value:
                concept.mastery_level = MasteryLevel(concept.mastery_level.value - 1)
        
        # Calculate next review date based on mastery level
        review_intervals = {
            MasteryLevel.UNKNOWN: 1,
            MasteryLevel.LEARNING: 2,
            MasteryLevel.FAMILIAR: 4,
            MasteryLevel.PROFICIENT: 7,
            MasteryLevel.MASTERED: 14
        }
        
        # For concepts that still need practice (mastery = 0 and streak < 3), 
        # set next review to now so they can be practiced immediately
        if concept.mastery_level == MasteryLevel.UNKNOWN and concept.correct_streak < 3:
            concept.next_review = now  # Available for immediate practice
        else:
            days_to_add = review_intervals[concept.mastery_level]
            if not correct:
                days_to_add = 1  # Reset to 1 day if incorrect
            concept.next_review = now + timedelta(days=days_to_add)
        
        # Update database
        conn.execute("""
            UPDATE concepts 
            SET mastery_level = ?, last_reviewed = ?, next_review = ?, 
                review_count = ?, correct_streak = ?
            WHERE id = ?
        """, (
            concept.mastery_level.value,
            concept.last_reviewed.isoformat(),
            concept.next_review.isoformat(),
            concept.review_count,
            concept.correct_streak,
            concept.id
        ))
        conn.commit()
        
        return concept
    
    def save_review_session(self, concept_id: str, question: str, user_answer: str, 
                           correct: bool, feedback: str, hints_used: int = 0) -> str:
        """Save a review session to the database"""
        conn = get_db()
        session_id = str(uuid.uuid4())
        now = datetime.now().isoformat()
        
        conn.execute("""
            INSERT INTO review_sessions (id, concept_id, question, user_answer, correct, 
                                       timestamp, hints_used, feedback)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (session_id, concept_id, question, user_answer, correct, now, hints_used, feedback))
        
        conn.commit()
        return session_id
    
    def get_class_progress(self, class_id: str) -> Dict:
        """Get overall progress statistics for a class"""
        concepts = self.get_concepts_for_class(class_id)
        
        if not concepts:
            return {
                "total_concepts": 0,
                "mastery_distribution": {},
                "concepts_due": 0,
                "average_mastery": 0
            }
        
        mastery_counts = {}
        for level in MasteryLevel:
            mastery_counts[level.name] = sum(1 for c in concepts if c.mastery_level == level)
        
        concepts_due = len(self.get_concepts_due_for_review(class_id))
        average_mastery = sum(c.mastery_level.value for c in concepts) / len(concepts)
        
        return {
            "total_concepts": len(concepts),
            "mastery_distribution": mastery_counts,
            "concepts_due": concepts_due,
            "average_mastery": round(average_mastery, 2)
        }
