# StudyAgent Active Recall System

An intelligent active recall system that uses spaced repetition and adaptive questioning to help students master study materials. The system dynamically generates questions using Claude AI and tracks learning progress to optimize study sessions.

## Features

### 🧠 Intelligent Question Generation
- **Dynamic Questions**: Uses Claude AI to generate contextual questions based on study material
- **Adaptive Difficulty**: Questions become more complex as mastery increases
- **Multiple Question Types**:
  - **Recall**: Basic understanding and memory tests
  - **Application**: Applying concepts to new situations  
  - **Synthesis**: Combining concepts and creative problem-solving

### 📈 Mastery Tracking
- **5 Mastery Levels**: UNKNOWN → LEARNING → FAMILIAR → PROFICIENT → MASTERED
- **Performance-Based Progression**: Advance levels by answering correctly consistently
- **Regression Protection**: Levels decrease if performance drops

### 🔄 Spaced Repetition Algorithm
- **Optimized Review Intervals**:
  - UNKNOWN: 1 day
  - LEARNING: 2 days
  - FAMILIAR: 4 days
  - PROFICIENT: 7 days
  - MASTERED: 14 days
- **Adaptive Scheduling**: Incorrect answers reset to 1-day intervals

### 💡 Intelligent Feedback
- **Answer Evaluation**: Claude AI evaluates responses and provides detailed feedback
- **Hint System**: Progressive hints guide students toward correct answers
- **Performance Analytics**: Track progress across all concepts

## Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set up your Anthropic API key:
```bash
export ANTHROPIC_API_KEY="your-api-key-here"
```

## Usage

### Basic Usage

```python
from recall import ActiveRecallSystem

# Initialize the system
system = ActiveRecallSystem(api_key="your-anthropic-api-key")

# Add study material
system.add_study_material("Arrays", "Arrays are fundamental data structures...")

# Start a study session
concept, question = system.start_study_session()
print(f"Question: {question.question_text}")

# Submit an answer
result = system.submit_answer(concept, question, "Your answer here")
print(f"Correct: {result['correct']}")
print(f"Feedback: {result['feedback']}")
```

### Running the Demo

```bash
python test_recall.py
```

This will:
- Set up dummy study materials (Arrays, Linked Lists, Stacks)
- Simulate a complete study session
- Demonstrate adaptive difficulty and spaced repetition
- Show progress tracking

## System Architecture

### Core Components

1. **ActiveRecallDatabase**: SQLite database for persistent storage
   - Concepts table: Stores study materials and progress
   - Review sessions table: Tracks all Q&A interactions

2. **ClaudeQuestionGenerator**: AI-powered question generation
   - Context-aware question creation
   - Answer evaluation and feedback
   - Hint generation for incorrect responses

3. **ActiveRecallSystem**: Main orchestrator
   - Coordinates database and AI components
   - Manages study session flow
   - Tracks progress and analytics

### Data Models

```python
@dataclass
class Concept:
    id: int
    name: str
    content: str
    mastery_level: MasteryLevel
    last_reviewed: datetime
    next_review: datetime
    review_count: int
    correct_streak: int
    difficulty_level: DifficultyLevel
```

## Algorithm Details

### Mastery Progression
- **Advancement**: 3 consecutive correct answers (without hints)
- **Regression**: Incorrect answer or excessive hint usage
- **Streak Reset**: Any incorrect answer resets the correct streak

### Question Difficulty Mapping
| Mastery Level | Question Type | Difficulty | Example |
|---------------|---------------|------------|---------|
| UNKNOWN/LEARNING | Recall | Basic | "What is the time complexity of array access?" |
| FAMILIAR | Recall/Application | Intermediate | "When would you choose arrays over linked lists?" |
| PROFICIENT | Application/Synthesis | Advanced | "Design a hybrid data structure combining arrays and linked lists" |
| MASTERED | Synthesis | Expert | "Analyze trade-offs in a complex multi-data-structure system" |

### Spaced Repetition
The system implements a modified spaced repetition algorithm:
- **Correct answers**: Extend review interval based on mastery level
- **Incorrect answers**: Reset to 1-day interval for immediate review
- **Priority ordering**: Lower mastery levels reviewed first

## Example Study Session Flow

1. **Session Start**: System identifies concepts due for review
2. **Question Generation**: Claude generates appropriate question based on mastery
3. **User Response**: Student provides answer
4. **AI Evaluation**: Claude evaluates answer and provides feedback
5. **Progress Update**: System updates mastery level and schedules next review
6. **Repeat**: Continue until no concepts are due or session limit reached

## Database Schema

### Concepts Table
```sql
CREATE TABLE concepts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    content TEXT NOT NULL,
    mastery_level INTEGER DEFAULT 0,
    last_reviewed TEXT,
    next_review TEXT,
    review_count INTEGER DEFAULT 0,
    correct_streak INTEGER DEFAULT 0,
    difficulty_level INTEGER DEFAULT 1
);
```

### Review Sessions Table
```sql
CREATE TABLE review_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    concept_id INTEGER,
    question TEXT NOT NULL,
    user_answer TEXT,
    correct BOOLEAN,
    timestamp TEXT NOT NULL,
    hints_used INTEGER DEFAULT 0,
    FOREIGN KEY (concept_id) REFERENCES concepts (id)
);
```

## Configuration

### Environment Variables
- `ANTHROPIC_API_KEY`: Required for Claude AI integration

### Customizable Parameters
- Database path
- Review intervals for each mastery level
- Question generation prompts
- Mastery progression thresholds

## Future Enhancements

- **Multi-subject Support**: Organize concepts by subject/course
- **Learning Analytics**: Detailed performance insights and recommendations
- **Collaborative Features**: Share study materials and compete with peers
- **Mobile Integration**: API endpoints for mobile app development
- **Advanced Scheduling**: Consider forgetting curves and individual learning patterns

## Contributing

This is a backend-only implementation focused on the core active recall algorithm. Future development will include:
- REST API endpoints
- Frontend integration
- Advanced analytics dashboard
- Multi-user support

## License

This project is part of the StudyAgent system for educational purposes.
