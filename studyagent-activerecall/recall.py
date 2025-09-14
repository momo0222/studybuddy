import sqlite3
import json
import datetime
from dataclasses import dataclass
from enum import Enum
from typing import List, Dict, Optional, Tuple
import random
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
class NotesSection:
    section_id: str
    title: str
    content: str
    order: int
    mastery_level: MasteryLevel = MasteryLevel.UNKNOWN
    correct_streak: int = 0
    times_studied: int = 0
    last_studied: Optional[datetime.datetime] = None

@dataclass
class Concept:
    id: int
    name: str
    content: str
    mastery_level: MasteryLevel
    last_reviewed: datetime.datetime
    next_review: datetime.datetime
    review_count: int
    correct_streak: int
    difficulty_level: DifficultyLevel
    notes_sections: List[NotesSection] = None
    current_section_index: int = 0

@dataclass
class Question:
    concept_id: int
    question_text: str
    expected_answer: str
    difficulty: DifficultyLevel
    question_type: str  # "recall", "application", "synthesis"

@dataclass
class ReviewSession:
    concept_id: int
    question: str
    user_answer: str
    correct: bool
    timestamp: datetime.datetime
    hints_used: int
    follow_up_questions: int = 0
    weakness_identified: bool = False

@dataclass
class ConversationState:
    concept_id: int
    original_question: str
    conversation_history: List[Dict[str, str]]
    attempts: int
    needs_remediation: bool
    weakness_areas: List[str]

class ActiveRecallDatabase:
    def __init__(self, db_path: str = "active_recall.db"):
        self.db_path = db_path
        self.init_database()
    
    def init_database(self):
        """Initialize the database with required tables"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Concepts table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS concepts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                content TEXT NOT NULL,
                mastery_level INTEGER DEFAULT 0,
                last_reviewed TEXT,
                next_review TEXT,
                review_count INTEGER DEFAULT 0,
                correct_streak INTEGER DEFAULT 0,
                difficulty_level INTEGER DEFAULT 1
            )
        ''')
        
        # Review sessions table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS review_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                concept_id INTEGER,
                question TEXT NOT NULL,
                user_answer TEXT,
                correct BOOLEAN,
                timestamp TEXT NOT NULL,
                hints_used INTEGER DEFAULT 0,
                follow_up_questions INTEGER DEFAULT 0,
                weakness_identified BOOLEAN DEFAULT 0,
                conversation_data TEXT,
                FOREIGN KEY (concept_id) REFERENCES concepts (id)
            )
        ''')
        
        # Concept weaknesses table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS concept_weaknesses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                concept_id INTEGER,
                weakness_area TEXT NOT NULL,
                severity INTEGER DEFAULT 1,
                last_encountered TEXT NOT NULL,
                times_encountered INTEGER DEFAULT 1,
                FOREIGN KEY (concept_id) REFERENCES concepts (id)
            )
        ''')
        
        conn.commit()
        conn.close()
    
    def add_concept(self, name: str, content: str) -> int:
        """Add a new concept to study"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        now = datetime.datetime.now().isoformat()
        cursor.execute('''
            INSERT INTO concepts (name, content, last_reviewed, next_review)
            VALUES (?, ?, ?, ?)
        ''', (name, content, now, now))
        
        concept_id = cursor.lastrowid
        conn.commit()
        conn.close()
        return concept_id
    
    def get_concept(self, concept_id: int) -> Optional[Concept]:
        """Get a concept by ID"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM concepts WHERE id = ?', (concept_id,))
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return Concept(
                id=row[0],
                name=row[1],
                content=row[2],
                mastery_level=MasteryLevel(row[3]),
                last_reviewed=datetime.datetime.fromisoformat(row[4]) if row[4] else datetime.datetime.now(),
                next_review=datetime.datetime.fromisoformat(row[5]) if row[5] else datetime.datetime.now(),
                review_count=row[6],
                correct_streak=row[7],
                difficulty_level=DifficultyLevel(row[8])
            )
        return None
    
    def update_concept_mastery(self, concept_id: int, correct: bool, hints_used: int = 0):
        """Update concept mastery based on performance"""
        concept = self.get_concept(concept_id)
        if not concept:
            return
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Update mastery level based on performance
        if correct and hints_used == 0:
            concept.correct_streak += 1
            if concept.correct_streak >= 3 and concept.mastery_level.value < MasteryLevel.MASTERED.value:
                concept.mastery_level = MasteryLevel(concept.mastery_level.value + 1)
        else:
            concept.correct_streak = 0
            if concept.mastery_level.value > MasteryLevel.LEARNING.value:
                concept.mastery_level = MasteryLevel(concept.mastery_level.value - 1)
        
        # Calculate next review time using spaced repetition
        now = datetime.datetime.now()
        if correct:
            # Increase interval based on mastery level
            intervals = {
                MasteryLevel.UNKNOWN: 1,
                MasteryLevel.LEARNING: 2,
                MasteryLevel.FAMILIAR: 4,
                MasteryLevel.PROFICIENT: 7,
                MasteryLevel.MASTERED: 14
            }
            days_to_add = intervals[concept.mastery_level]
        else:
            # Review again soon if incorrect
            days_to_add = 1
        
        next_review = now + datetime.timedelta(days=days_to_add)
        
        cursor.execute('''
            UPDATE concepts 
            SET mastery_level = ?, last_reviewed = ?, next_review = ?, 
                review_count = ?, correct_streak = ?
            WHERE id = ?
        ''', (
            concept.mastery_level.value,
            now.isoformat(),
            next_review.isoformat(),
            concept.review_count + 1,
            concept.correct_streak,
            concept_id
        ))
        
        conn.commit()
        conn.close()
    
    def update_concept_review_time(self, concept_id: int, review_time: datetime.datetime):
        """Update the next_review time for a concept"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            UPDATE concepts 
            SET next_review = ?
            WHERE id = ?
        ''', (review_time.isoformat(), concept_id))
        
        conn.commit()
        conn.close()
    
    def get_concepts_due_for_review(self) -> List[Concept]:
        """Get concepts that are due for review"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        now = datetime.datetime.now().isoformat()
        cursor.execute('''
            SELECT * FROM concepts 
            WHERE next_review <= ? OR review_count = 0
            ORDER BY mastery_level ASC, next_review ASC
        ''', (now,))
        
        concepts = []
        for row in cursor.fetchall():
            concepts.append(Concept(
                id=row[0],
                name=row[1],
                content=row[2],
                mastery_level=MasteryLevel(row[3]),
                last_reviewed=datetime.datetime.fromisoformat(row[4]) if row[4] else datetime.datetime.now(),
                next_review=datetime.datetime.fromisoformat(row[5]) if row[5] else datetime.datetime.now(),
                review_count=row[6],
                correct_streak=row[7],
                difficulty_level=DifficultyLevel(row[8])
            ))
        
        conn.close()
        return concepts
    
    def record_review_session(self, concept_id: int, question: str, user_answer: str, 
                            correct: bool, hints_used: int = 0, follow_up_questions: int = 0,
                            weakness_identified: bool = False, conversation_data: str = ""):
        """Record a review session with enhanced tracking"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO review_sessions (concept_id, question, user_answer, correct, timestamp, 
                                       hints_used, follow_up_questions, weakness_identified, conversation_data)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (concept_id, question, user_answer, correct, datetime.datetime.now().isoformat(), 
              hints_used, follow_up_questions, weakness_identified, conversation_data))
        
        conn.commit()
        conn.close()
    
    def add_concept_weakness(self, concept_id: int, weakness_area: str, severity: int = 1):
        """Track specific weakness areas for a concept"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Check if this weakness already exists
        cursor.execute('''
            SELECT id, times_encountered FROM concept_weaknesses 
            WHERE concept_id = ? AND weakness_area = ?
        ''', (concept_id, weakness_area))
        
        existing = cursor.fetchone()
        if existing:
            # Update existing weakness
            cursor.execute('''
                UPDATE concept_weaknesses 
                SET times_encountered = times_encountered + 1, 
                    last_encountered = ?, severity = ?
                WHERE id = ?
            ''', (datetime.datetime.now().isoformat(), severity, existing[0]))
        else:
            # Add new weakness
            cursor.execute('''
                INSERT INTO concept_weaknesses (concept_id, weakness_area, severity, last_encountered)
                VALUES (?, ?, ?, ?)
            ''', (concept_id, weakness_area, severity, datetime.datetime.now().isoformat()))
        
        conn.commit()
        conn.close()
    
    def get_concept_weaknesses(self, concept_id: int) -> List[Dict]:
        """Get tracked weaknesses for a concept"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT weakness_area, severity, times_encountered, last_encountered
            FROM concept_weaknesses 
            WHERE concept_id = ?
            ORDER BY severity DESC, times_encountered DESC
        ''', (concept_id,))
        
        weaknesses = []
        for row in cursor.fetchall():
            weaknesses.append({
                'area': row[0],
                'severity': row[1],
                'times_encountered': row[2],
                'last_encountered': row[3]
            })
        
        conn.close()
        return weaknesses

class ClaudeQuestionGenerator:
    def __init__(self, api_key: str):
        self.client = anthropic.Anthropic(api_key=api_key)
    
    def generate_question(self, concept: Concept) -> Question:
        """Generate a question based on the concept's notes structure and current progress"""
        
        # If concept has structured notes, use them for progressive questioning
        if concept.notes_sections and len(concept.notes_sections) > 0:
            return self._generate_notes_based_question(concept)
        
        # Fallback to original method for concepts without notes
        if concept.mastery_level in [MasteryLevel.UNKNOWN, MasteryLevel.LEARNING]:
            question_type = "recall"
            difficulty = DifficultyLevel.BASIC
        elif concept.mastery_level == MasteryLevel.FAMILIAR:
            question_type = random.choice(["recall", "application"])
            difficulty = DifficultyLevel.INTERMEDIATE
        elif concept.mastery_level == MasteryLevel.PROFICIENT:
            question_type = random.choice(["application", "synthesis"])
            difficulty = DifficultyLevel.ADVANCED
        else:  # MASTERED
            question_type = "synthesis"
            difficulty = DifficultyLevel.EXPERT
        
        prompt = self._create_question_prompt(concept, question_type, difficulty)
        
        try:
            print(f"🔍 DEBUG: Calling Claude API for {concept.name}")
            response = self.client.messages.create(
                model="claude-3-haiku-20240307",
                max_tokens=500,
                messages=[{"role": "user", "content": prompt}]
            )
            
            # Parse the response to extract question and expected answer
            content = response.content[0].text
            print(f"🔍 DEBUG: Claude response: {content}")
            
            lines = content.strip().split('\n')
            
            question_text = ""
            expected_answer = ""
            
            for i, line in enumerate(lines):
                if line.startswith("Question:"):
                    question_text = line.replace("Question:", "").strip()
                elif line.startswith("Expected Answer:"):
                    expected_answer = line.replace("Expected Answer:", "").strip()
                    # Include any additional lines as part of the answer
                    if i + 1 < len(lines):
                        expected_answer += " " + " ".join(lines[i+1:])
                    break
            
            if not question_text:
                print("🔍 DEBUG: No question found in Claude response")
                question_text = f"What can you tell me about {concept.name}?"
            else:
                print(f"🔍 DEBUG: Successfully generated question: {question_text}")
            
            return Question(
                concept_id=concept.id,
                question_text=question_text,
                expected_answer=expected_answer or "Basic understanding expected",
                difficulty=difficulty,
                question_type=question_type
            )
            
        except Exception as e:
            print(f"🔍 DEBUG: Exception in question generation: {str(e)}")
            # Fallback question when API fails
            return Question(
                concept_id=concept.id,
                question_text=f"What can you tell me about {concept.name}?",
                expected_answer="Basic understanding expected",
                difficulty=DifficultyLevel.BASIC,
                question_type="basic"
            )
    
    def _generate_notes_based_question(self, concept: Concept) -> Question:
        """Generate questions based on structured notes with progressive difficulty"""
        
        # Determine current section to focus on
        current_section = self._get_current_focus_section(concept)
        
        # Decide if we should review previous sections (spaced repetition)
        should_review_previous = self._should_review_previous_sections(concept)
        
        if should_review_previous:
            # Pick a random previous section that needs review
            review_section = self._pick_review_section(concept)
            if review_section:
                current_section = review_section
        
        # Generate question based on section mastery level
        if current_section.mastery_level == MasteryLevel.UNKNOWN:
            question_type = "basic_recall"
            difficulty = DifficultyLevel.BASIC
        elif current_section.mastery_level == MasteryLevel.LEARNING:
            question_type = "understanding"
            difficulty = DifficultyLevel.BASIC
        elif current_section.mastery_level == MasteryLevel.FAMILIAR:
            question_type = "application"
            difficulty = DifficultyLevel.INTERMEDIATE
        else:
            question_type = "synthesis"
            difficulty = DifficultyLevel.ADVANCED
        
        prompt = self._create_notes_question_prompt(concept, current_section, question_type, difficulty)
        
        try:
            response = self.client.messages.create(
                model="claude-3-haiku-20240307",
                max_tokens=300,
                messages=[{"role": "user", "content": prompt}]
            )
            
            content = response.content[0].text
            lines = content.strip().split('\n')
            
            question_text = ""
            expected_answer = ""
            
            for line in lines:
                if line.startswith("Question:"):
                    question_text = line.replace("Question:", "").strip()
                elif line.startswith("Expected Answer:"):
                    expected_answer = line.replace("Expected Answer:", "").strip()
            
            return Question(
                concept_id=concept.id,
                question_text=question_text or f"What can you tell me about {current_section.title.lower()}?",
                expected_answer=expected_answer or "Basic understanding expected",
                difficulty=difficulty,
                question_type=f"{question_type}_{current_section.section_id}"
            )
            
        except Exception as e:
            # Fallback question
            return Question(
                concept_id=concept.id,
                question_text=f"What can you tell me about {current_section.title.lower()}?",
                expected_answer="Basic understanding expected",
                difficulty=DifficultyLevel.BASIC,
                question_type=f"basic_{current_section.section_id}"
            )
    
    def _get_current_focus_section(self, concept: Concept) -> NotesSection:
        """Get the section to focus on based on progress"""
        
        # Find the first section that isn't mastered, or return current index
        for i, section in enumerate(concept.notes_sections):
            if section.mastery_level != MasteryLevel.MASTERED:
                concept.current_section_index = i
                return section
        
        # If all sections are mastered, cycle through them
        concept.current_section_index = concept.current_section_index % len(concept.notes_sections)
        return concept.notes_sections[concept.current_section_index]
    
    def _should_review_previous_sections(self, concept: Concept) -> bool:
        """Decide if we should review previous sections (spaced repetition)"""
        
        # 30% chance to review previous sections if we're past the first section
        if concept.current_section_index > 0 and random.random() < 0.3:
            return True
        return False
    
    def _pick_review_section(self, concept: Concept) -> Optional[NotesSection]:
        """Pick a previous section for review based on when it was last studied"""
        
        available_sections = concept.notes_sections[:concept.current_section_index]
        if not available_sections:
            return None
        
        # Prefer sections that haven't been studied recently or have lower mastery
        weights = []
        for section in available_sections:
            weight = 1.0
            if section.mastery_level == MasteryLevel.UNKNOWN:
                weight = 3.0
            elif section.mastery_level == MasteryLevel.LEARNING:
                weight = 2.0
            elif section.mastery_level == MasteryLevel.FAMILIAR:
                weight = 1.5
            weights.append(weight)
        
        return random.choices(available_sections, weights=weights)[0]
    
    def _create_notes_question_prompt(self, concept: Concept, section: NotesSection, 
                                    question_type: str, difficulty: DifficultyLevel) -> str:
        """Create a prompt for generating questions based on notes sections"""
        
        prompt = f"""
You are creating a targeted study question about: {section.title}

Notes content for this section:
{section.content}

Question type: {question_type}
Difficulty: {difficulty.name}

Generate a focused, specific question that:
1. Tests understanding of ONE key concept from this section
2. Is appropriate for {difficulty.name.lower()} level  
3. Can be answered directly from the notes content
4. Avoids generic "what can you tell me about..." phrasing
5. Focuses on specific facts, definitions, or concepts

Examples of good targeted questions:
- For basic recall: "What are the main components of X?" "Why does Y happen?" "What is the time complexity of Z?"
- For understanding: "How does X differ from Y?" "When would you use Z instead of W?"

Format your response as:
Question: [specific, targeted question]
Expected Answer: [brief answer based on the notes]

Focus on creating a question that tests specific knowledge from this section.
"""
        
        try:
            response = self.client.messages.create(
                model="claude-3-haiku-20240307",
                max_tokens=300,
                messages=[{"role": "user", "content": prompt}]
            )
            
            content = response.content[0].text
            lines = content.strip().split('\n')
            
            question_text = ""
            expected_answer = ""
            
            for line in lines:
                if line.startswith("Question:"):
                    question_text = line.replace("Question:", "").strip()
                elif line.startswith("Expected Answer:"):
                    expected_answer = line.replace("Expected Answer:", "").strip()
            
            return Question(
                concept_id=concept.id,
                question_text=question_text or f"What can you tell me about {current_section.title.lower()}?",
                expected_answer=expected_answer or "Basic understanding expected",
                difficulty=difficulty,
                question_type=f"{question_type}_{current_section.section_id}"
            )
            
        except Exception as e:
            # Fallback question
            return Question(
                concept_id=concept.id,
                question_text=f"What can you tell me about {current_section.title.lower()}?",
                expected_answer="Basic understanding expected",
                difficulty=DifficultyLevel.BASIC,
                question_type=f"basic_{current_section.section_id}"
            )
    
    def _get_current_focus_section(self, concept: Concept) -> NotesSection:
        """Get the section to focus on based on progress"""
        
        # Find the first section that isn't mastered, or return current index
        for i, section in enumerate(concept.notes_sections):
            if section.mastery_level != MasteryLevel.MASTERED:
                concept.current_section_index = i
                return section
        
        # If all sections are mastered, cycle through them
        concept.current_section_index = concept.current_section_index % len(concept.notes_sections)
        return concept.notes_sections[concept.current_section_index]
    
    def _should_review_previous_sections(self, concept: Concept) -> bool:
        """Decide if we should review previous sections (spaced repetition)"""
        
        # 30% chance to review previous sections if we're past the first section
        if concept.current_section_index > 0 and random.random() < 0.3:
            return True
        return False
    
    def _pick_review_section(self, concept: Concept) -> Optional[NotesSection]:
        """Pick a previous section for review based on when it was last studied"""
        
        available_sections = concept.notes_sections[:concept.current_section_index]
        if not available_sections:
            return None
        
        # Prefer sections that haven't been studied recently or have lower mastery
        weights = []
        for section in available_sections:
            weight = 1.0
            if section.mastery_level == MasteryLevel.UNKNOWN:
                weight = 3.0
            elif section.mastery_level == MasteryLevel.LEARNING:
                weight = 2.0
            elif section.mastery_level == MasteryLevel.FAMILIAR:
                weight = 1.5
            weights.append(weight)
        
        return random.choices(available_sections, weights=weights)[0]
    
    def _create_question_prompt(self, concept: Concept, question_type: str, difficulty: DifficultyLevel) -> str:
        """Create a prompt for generating questions"""
        base_prompt = f"""
Based on the following study material about {concept.name}, generate a {question_type} question at {difficulty.name.lower()} difficulty level.

Study Material:
{concept.content}

Question Type Guidelines:
- Recall: Test basic understanding and memory of facts
- Application: Test ability to apply concepts to new situations
- Synthesis: Test ability to combine concepts and create new understanding

Difficulty Guidelines:
- Basic: Fundamental concepts and definitions
- Intermediate: Connections between concepts and simple applications
- Advanced: Complex applications and analysis
- Expert: Creative synthesis and advanced problem-solving

Please format your response as:
Question: [Your question here]
Expected Answer: [Brief expected answer or key points]
"""
        return base_prompt
    
    def evaluate_answer(self, question: Question, user_answer: str) -> Tuple[bool, str, List[str]]:
        """Evaluate user's answer and provide feedback"""
        prompt = f"""
Question: {question.question_text}
Expected Answer: {question.expected_answer}
User's Answer: {user_answer}

Please evaluate the user's answer and provide:
1. A score (Correct/Partially Correct/Incorrect)
2. Brief feedback explaining what was right or wrong
3. Up to 3 hints to guide them toward the correct answer if needed

Format your response as:
Score: [Correct/Partially Correct/Incorrect]
Feedback: [Your feedback]
Hints: [Hint 1] | [Hint 2] | [Hint 3]
"""
        
        try:
            response = self.client.messages.create(
                model="claude-3-haiku-20240307",
                max_tokens=400,
                messages=[{"role": "user", "content": prompt}]
            )
            
            content = response.content[0].text
            lines = content.strip().split('\n')
            
            score = "Incorrect"
            feedback = "Unable to evaluate answer"
            hints = []
            
            for line in lines:
                if line.startswith("Score:"):
                    score = line.replace("Score:", "").strip()
                elif line.startswith("Feedback:"):
                    feedback = line.replace("Feedback:", "").strip()
                elif line.startswith("Hints:"):
                    hints_text = line.replace("Hints:", "").strip()
                    hints = [h.strip() for h in hints_text.split('|') if h.strip()]
            
            is_correct = score.lower() in ["correct", "partially correct"]
            return is_correct, feedback, hints
            
        except Exception as e:
            return False, f"Error evaluating answer: {str(e)}", ["Try to be more specific", "Review the key concepts", "Think about the main principles"]
    
    def generate_guiding_response(self, concept: Concept, user_answer: str, conversation_history: List[Dict[str, str]], 
                                is_correct: bool) -> str:
        """Generate a guiding response that encourages deeper thinking"""
        
        history_text = "\n".join([f"{entry['role']}: {entry['content']}" for entry in conversation_history[-3:]])
        
        if is_correct:
            # Check if we should transition to a new topic
            should_transition = self._should_transition_topic(conversation_history, concept)
            
            if should_transition:
                prompt = f"""
The student gave a correct answer about {concept.name}: "{user_answer}"

Recent conversation:
{history_text}

The student has demonstrated understanding of this aspect. Generate a response that:
1. Acknowledges they're correct
2. Smoothly transitions to a NEW related topic/aspect of {concept.name}
3. Clearly indicates the topic shift (e.g., "Great! Now let's explore..." or "Perfect! Moving on to...")
4. Asks ONE question about the new topic
5. Keep it conversational and encouraging

Study Material for reference:
{concept.content}

Respond in 2-3 sentences maximum as a tutor.
"""
            else:
                prompt = f"""
The student gave a correct answer about {concept.name}: "{user_answer}"

Recent conversation:
{history_text}

Generate a brief, encouraging response that:
1. Acknowledges they're correct
2. Asks ONE NEW follow-up question (different from previous questions)
3. Keeps it conversational and brief
4. Don't repeat questions already asked in the conversation

Study Material for reference:
{concept.content}

Respond in 1-2 sentences maximum as a tutor.
"""
        else:
            prompt = f"""
The student gave an incomplete answer about {concept.name}: "{user_answer}"

Recent conversation:
{history_text}

Generate a brief, gentle hint that:
1. Focuses on ONE specific aspect they should think about
2. Uses a phrase like "think about..." or "consider..."
3. Doesn't repeat previous hints from the conversation
4. Is supportive but concise

Study Material for reference:
{concept.content}

Respond in 1-2 sentences maximum as a helpful tutor.
"""
        
        try:
            response = self.client.messages.create(
                model="claude-3-haiku-20240307",
                max_tokens=100,
                messages=[{"role": "user", "content": prompt}]
            )
            return response.content[0].text.strip()
        except Exception as e:
            if is_correct:
                return f"Good! What's one advantage of using {concept.name.lower()}?"
            else:
                return f"Think about what makes {concept.name.lower()} special compared to other data structures."
    
    def _should_transition_topic(self, conversation_history: List[Dict[str, str]], concept: Concept) -> bool:
        """Determine if we should transition to a new topic based on conversation flow"""
        
        # If we've had 2-3 exchanges on the same subtopic, consider transitioning
        if len(conversation_history) >= 4:  # At least 2 exchanges (4 messages)
            # Look at recent exchanges to see if student is demonstrating understanding
            recent_student_responses = [
                entry['content'] for entry in conversation_history[-4:] 
                if entry['role'] == 'student'
            ]
            
            # If student has given substantive answers (not just "I don't know"), consider transitioning
            substantive_responses = [
                resp for resp in recent_student_responses 
                if len(resp.split()) > 3 and not any(phrase in resp.lower() 
                    for phrase in ['not sure', "don't know", 'idk', 'no idea'])
            ]
            
            # Transition if we have 2+ substantive responses in recent history
            return len(substantive_responses) >= 2
        
        return False
    
    def identify_weaknesses(self, concept: Concept, user_answer: str, correct_answer: str) -> List[str]:
        """Identify specific areas where the student is struggling"""
        
        prompt = f"""
Analyze this student's answer to identify specific knowledge gaps or misconceptions:

Question Topic: {concept.name}
Expected Answer: {correct_answer}
Student's Answer: {user_answer}

Identify up to 3 specific weakness areas from these categories:
- Definitions and terminology
- Time complexity understanding
- Implementation details
- Use cases and applications
- Conceptual relationships
- Problem-solving approach

Respond with just the weakness areas, separated by commas.
"""
        
        try:
            response = self.client.messages.create(
                model="claude-3-haiku-20240307",
                max_tokens=150,
                messages=[{"role": "user", "content": prompt}]
            )
            
            weaknesses = [w.strip() for w in response.content[0].text.split(',')]
            return [w for w in weaknesses if w and len(w) > 3][:3]
        except Exception as e:
            return ["general understanding"]

class ActiveRecallSystem:
    def __init__(self, api_key: str, db_path: str = "active_recall.db"):
        self.db = ActiveRecallDatabase(db_path)
        self.question_generator = ClaudeQuestionGenerator(api_key)
    
    def add_study_material(self, name: str, content: str) -> Concept:
        """Add new study material as a concept"""
        concept_id = self.db.add_concept(name, content)
        return self.db.get_concept(concept_id)
    
    def start_study_session(self) -> Optional[Tuple[Concept, Question]]:
        """Start a study session by getting the next concept to review"""
        concepts_due = self.db.get_concepts_due_for_review()
        
        if not concepts_due:
            print("No concepts are due for review right now!")
            return None
        
        # Prioritize concepts with lower mastery levels
        concept = concepts_due[0]
        question = self.question_generator.generate_question(concept)
        
        return concept, question
    
    def submit_answer(self, concept: Concept, question: Question, user_answer: str) -> Dict:
        """Submit an answer and get feedback"""
        is_correct, feedback, hints = self.question_generator.evaluate_answer(question, user_answer)
        
        # Record the session
        hints_used = 0  # This would be tracked in a real interactive session
        self.db.record_review_session(
            concept.id, question.question_text, user_answer, is_correct, hints_used
        )
        
        # Update concept mastery
        self.db.update_concept_mastery(concept.id, is_correct, hints_used)
        
        return {
            "correct": is_correct,
            "feedback": feedback,
            "hints": hints,
            "concept_name": concept.name,
            "mastery_level": concept.mastery_level.name
        }
    
    def start_interactive_session(self, concept_id: int) -> ConversationState:
        """Start an interactive dialogue session for a specific concept"""
        concept = self.db.get_concept(concept_id)
        if not concept:
            raise ValueError(f"Concept {concept_id} not found")
        
        # Generate initial question
        question = self.question_generator.generate_question(concept)
        
        # Initialize conversation state
        conversation_state = ConversationState(
            concept_id=concept_id,
            original_question=question.question_text,
            conversation_history=[
                {"role": "tutor", "content": question.question_text}
            ],
            attempts=0,
            needs_remediation=False,
            weakness_areas=self.db.get_concept_weaknesses(concept_id)
        )
        
        return conversation_state
    
    def handle_user_question(self, conversation_state: ConversationState, user_question: str) -> Dict:
        """Handle when the user asks a question instead of answering"""
        concept = self.db.get_concept(conversation_state.concept_id)
        
        # Add user question to conversation history
        conversation_state.conversation_history.append({
            "role": "student", 
            "content": user_question
        })
        
        # Generate an answer to their question using Claude
        prompt = f"""
The student is asking a question about {concept.name}: "{user_question}"

Study Material for reference:
{concept.content}

Conversation history:
{chr(10).join([f"{entry['role']}: {entry['content']}" for entry in conversation_state.conversation_history[-3:]])}

Provide a helpful, clear answer to their question. Then suggest a follow-up question that:
1. Builds on what you just explained
2. Tests their understanding of the concept you explained
3. Keeps the learning momentum going

Format your response as:
Answer: [Your clear explanation here]
Follow-up: [A question to test their understanding]
"""
        
        try:
            response = self.question_generator.client.messages.create(
                model="claude-3-haiku-20240307",
                max_tokens=400,
                messages=[{"role": "user", "content": prompt}]
            )
            
            content = response.content[0].text
            lines = content.strip().split('\n')
            
            answer = ""
            follow_up = ""
            
            for line in lines:
                if line.startswith("Answer:"):
                    answer = line.replace("Answer:", "").strip()
                elif line.startswith("Follow-up:"):
                    follow_up = line.replace("Follow-up:", "").strip()
            
            # Add tutor's answer to conversation history
            conversation_state.conversation_history.append({
                "role": "tutor",
                "content": answer
            })
            
            return {
                "answer": answer or "That's a great question! Let me explain...",
                "follow_up_question": follow_up
            }
            
        except Exception as e:
            return {
                "answer": f"That's a great question about {concept.name}! Let me think about that...",
                "follow_up_question": "What specific aspect would you like to explore further?"
            }
    
    def continue_conversation(self, conversation_state: ConversationState, user_response: str) -> Dict:
        """Continue the interactive conversation based on user response"""
        concept = self.db.get_concept(conversation_state.concept_id)
        conversation_state.attempts += 1
        
        # Add user response to conversation history
        conversation_state.conversation_history.append({
            "role": "student", 
            "content": user_response
        })
        
        # Evaluate the answer (but don't end conversation based on correctness)
        temp_question = Question(
            concept_id=concept.id,
            question_text=conversation_state.original_question,
            expected_answer="Expected answer based on concept content",
            difficulty=DifficultyLevel.BASIC,
            question_type="recall"
        )
        
        is_correct, feedback, hints = self.question_generator.evaluate_answer(temp_question, user_response)
        
        # Generate guiding response instead of immediate feedback
        guiding_response = self.question_generator.generate_guiding_response(
            concept, user_response, conversation_state.conversation_history, is_correct
        )
        
        # Track weaknesses if answer is incorrect
        if not is_correct:
            weaknesses = self.question_generator.identify_weaknesses(
                concept, user_response, temp_question.expected_answer
            )
            
            # Track weaknesses in database
            for weakness in weaknesses:
                self.db.add_concept_weakness(concept.id, weakness, severity=1)
            
            conversation_state.weakness_areas.extend(weaknesses)
            conversation_state.needs_remediation = True
        
        # Add tutor's guiding response to conversation history
        conversation_state.conversation_history.append({
            "role": "tutor",
            "content": guiding_response
        })
        
        # Always continue the conversation - never end automatically
        return {
            "status": "continuing",
            "correct": is_correct,
            "guiding_response": guiding_response,
            "conversation_complete": False,
            "attempts": conversation_state.attempts,
            "needs_remediation": conversation_state.needs_remediation
        }
    
    def end_conversation(self, conversation_state: ConversationState) -> Dict:
        """End the conversation and record the session"""
        concept = self.db.get_concept(conversation_state.concept_id)
        
        # Record the session
        self.db.record_review_session(
            concept.id, conversation_state.original_question, 
            conversation_state.conversation_history[1]["content"],  # Original student answer
            not conversation_state.needs_remediation, 0, conversation_state.attempts - 1, 
            conversation_state.needs_remediation,
            json.dumps(conversation_state.conversation_history)
        )
        
        # Update mastery based on overall performance
        if not conversation_state.needs_remediation and conversation_state.attempts <= 2:
            self.db.update_concept_mastery(concept.id, True, 0)
        elif conversation_state.needs_remediation and conversation_state.attempts > 3:
            # Don't penalize too much for remediation sessions
            pass
        else:
            self.db.update_concept_mastery(concept.id, False, 0)
        
        return {
            "status": "completed",
            "total_attempts": conversation_state.attempts,
            "remediation_needed": conversation_state.needs_remediation,
            "conversation_history": conversation_state.conversation_history
        }
    
    def _evaluate_improvement(self, conversation_state: ConversationState, latest_response: str) -> bool:
        """Evaluate if the student is showing improvement in understanding"""
        if len(conversation_state.conversation_history) < 3:
            return False
        
        # Simple heuristic: longer, more detailed responses often indicate better understanding
        first_response = conversation_state.conversation_history[1]["content"]
        
        # Check for improvement indicators
        improvement_indicators = [
            len(latest_response) > len(first_response) * 1.2,  # More detailed response
            any(word in latest_response.lower() for word in ["because", "since", "therefore", "complexity", "time", "space"]),  # Technical reasoning
            latest_response.count('.') > first_response.count('.'),  # More structured explanation
        ]
        
        return sum(improvement_indicators) >= 2
    
    def get_study_progress(self) -> Dict:
        """Get overall study progress"""
        conn = sqlite3.connect(self.db.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT mastery_level, COUNT(*) 
            FROM concepts 
            GROUP BY mastery_level
        ''')
        
        mastery_distribution = {}
        for row in cursor.fetchall():
            mastery_distribution[MasteryLevel(row[0]).name] = row[1]
        
        cursor.execute('SELECT COUNT(*) FROM concepts')
        total_concepts = cursor.fetchone()[0]
        
        cursor.execute('SELECT COUNT(*) FROM concepts WHERE next_review <= ?', 
                      (datetime.datetime.now().isoformat(),))
        concepts_due = cursor.fetchone()[0]
        
        conn.close()
        
        return {
            "total_concepts": total_concepts,
            "concepts_due_for_review": concepts_due,
            "mastery_distribution": mastery_distribution
        }

# Example usage and dummy data setup
def setup_dummy_data(system: ActiveRecallSystem):
    """Set up some dummy study materials for testing"""
    
    # Data Structures concepts
    array_content = """
Arrays are fundamental data structures that store elements of the same type in contiguous memory locations.

Key Properties:
- Fixed size (in most languages)
- Elements accessed by index (0-based indexing)
- Constant time O(1) access to elements
- Elements stored in contiguous memory

Common Operations:
- Access: O(1) - Direct access using index
- Search: O(n) - Linear search through elements
- Insertion: O(n) - May require shifting elements
- Deletion: O(n) - May require shifting elements

Advantages:
- Fast access to elements
- Memory efficient
- Cache-friendly due to locality

Disadvantages:
- Fixed size
- Expensive insertion/deletion in middle
- Memory waste if not fully utilized
"""
    
    # Create structured notes for Linked Lists
    linked_list_notes = [
        NotesSection("ll_basics", "Basic Structure", 
            """A linked list is a linear data structure where elements (nodes) are stored in sequence, but not in contiguous memory locations. Each node contains:
            - Data: The actual value stored
            - Pointer/Reference: Address of the next node in the sequence
            
            The first node is called the HEAD, and the last node points to NULL.""", 0),
            
        NotesSection("ll_types", "Types of Linked Lists",
            """1. Singly Linked List: Each node points only to the next node
            2. Doubly Linked List: Each node has pointers to both next AND previous nodes
            3. Circular Linked List: The last node points back to the first node (forms a circle)
            
            Most common is the singly linked list.""", 1),
            
        NotesSection("ll_operations", "Basic Operations",
            """Key operations and their time complexities:
            - Insertion at beginning: O(1) - just update head pointer
            - Insertion at end: O(n) - must traverse to find last node
            - Deletion: O(1) if you have the node, O(n) if searching first
            - Search: O(n) - must check each node sequentially
            - Access by index: O(n) - no direct indexing like arrays""", 2),
            
        NotesSection("ll_advantages", "Advantages & Use Cases",
            """Advantages:
            - Dynamic size (grows/shrinks during runtime)
            - Efficient insertion/deletion at beginning
            - Memory allocated only when needed
            
            Best used when:
            - You don't know the size in advance
            - Frequent insertions/deletions at the start
            - Memory is limited""", 3),
            
        NotesSection("ll_disadvantages", "Disadvantages & Limitations", 
            """Disadvantages:
            - No random access (can't jump to index 5 directly)
            - Extra memory overhead for storing pointers
            - Not cache-friendly (nodes scattered in memory)
            - Sequential access only
            
            Avoid when:
            - You need frequent random access by index
            - Memory is very constrained
            - Cache performance is critical""", 4)
    ]

    # Convert structured notes to a single content string for fallback
    linked_list_content = "\n\n".join([f"{section.title}:\n{section.content}" for section in linked_list_notes])
    
    stack_content = """
Stack is a Last-In-First-Out (LIFO) data structure where elements are added and removed from the same end called the top.

Core Operations:
- Push: Add element to top - O(1)
- Pop: Remove element from top - O(1)
- Peek/Top: View top element without removing - O(1)
- isEmpty: Check if stack is empty - O(1)

Implementation:
- Can be implemented using arrays or linked lists
- Array implementation: Use index to track top
- Linked list implementation: Head is the top

Applications:
- Function call management (call stack)
- Expression evaluation and syntax parsing
- Undo operations in applications
- Browser history
- Depth-First Search (DFS)

Example Use Cases:
- Balanced parentheses checking
- Infix to postfix conversion
- Backtracking algorithms
"""
    
    # Add each note section as a separate reviewable concept
    # This ensures each section can be studied independently with proper priority
    
    # Add Linked Lists note sections as individual concepts (highest priority)
    for i, section in enumerate(linked_list_notes):
        concept_name = f"Linked Lists: {section.title}"
        concept = system.add_study_material(concept_name, section.content)
        # Set next_review to now so they're immediately available
        system.db.update_concept_review_time(concept.id, datetime.datetime.now())
    
    # Add other concepts (lower priority)
    arrays_concept = system.add_study_material("Arrays", array_content)
    system.db.update_concept_review_time(arrays_concept.id, datetime.datetime.now())
    
    stacks_concept = system.add_study_material("Stacks", stack_content)
    system.db.update_concept_review_time(stacks_concept.id, datetime.datetime.now())
    
    print("Dummy study materials added successfully!")

if __name__ == "__main__":
    # This would typically get the API key from environment variables
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        print("Please set ANTHROPIC_API_KEY environment variable")
        exit(1)
    
    # Initialize the system
    recall_system = ActiveRecallSystem(api_key)
    
    # Set up dummy data
    setup_dummy_data(recall_system)
    
    # Show progress
    progress = recall_system.get_study_progress()
    print(f"Study Progress: {progress}")