# Study Buddy 🧠📚

An intelligent study companion with **agentic Active Recall** capabilities that automatically generates personalized study concepts from your lecture materials.

## 🚀 Features

### 🤖 Agentic Active Recall System
- **Automatic Concept Generation**: AI automatically creates study concepts when you upload new lectures
- **Smart Study Sessions**: Adaptive questioning based on your mastery level
- **Progress Tracking**: Visual mastery progression with spaced repetition
- **Duplicate Prevention**: Intelligent detection to avoid redundant concepts

### 📝 Note Management
- **Multi-format Support**: PDF, images (.jpg, .jpeg, .png), and text files
- **AI Processing**: Automatic text extraction, cleaning, and summarization
- **Smart Search**: Hybrid search across all your notes with embeddings
- **Organized Storage**: Topic and class-based organization

### 🎯 Study Tools
- **Interactive Sessions**: Question-answer format with immediate feedback
- **Mastery Levels**: Unknown → Learning → Familiar → Proficient → Mastered
- **Review Scheduling**: Spaced repetition algorithm for optimal retention
- **Progress Analytics**: Track your learning journey with detailed statistics

## 🏗️ Architecture

### Backend (Flask)
- **Port**: `localhost:5002`
- **Database**: SQLite with topics, notes, concepts, and review sessions
- **AI Integration**: Anthropic Claude for concept generation and evaluation
- **File Processing**: Text extraction, embedding generation, and storage

### Frontend (React + TypeScript)
- **Port**: `localhost:3000`
- **Framework**: Vite + React with TypeScript
- **UI**: Radix UI components with Tailwind CSS
- **State Management**: React hooks with API integration

## 🛠️ Setup

### Prerequisites
- Python 3.8+
- Node.js 16+
- Anthropic API key

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/momo0222/studyagent.git
cd studyagent2.0
```

2. **Backend Setup**
```bash
cd studyagent-backend
pip install -r requirements.txt
```

3. **Frontend Setup**
```bash
cd studyagent-frontend
npm install
```

4. **Environment Configuration**
Create a `.env` file in the root directory:
```env
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

### Running the Application

1. **Start Backend**
```bash
cd studyagent-backend
python app.py
```

2. **Start Frontend**
```bash
cd studyagent-frontend
npm run dev
```

3. **Access the Application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5002

## 🔄 Agentic Workflow

### Automatic Concept Generation
```
Upload Lecture → AI Processing → Concept Extraction → Database Storage → Ready for Study
```

The system automatically:
1. Analyzes uploaded content using Claude AI
2. Extracts key concepts and definitions
3. Assigns difficulty levels (Basic/Intermediate/Advanced)
4. Prevents duplicate concepts
5. Makes concepts immediately available for study

### Study Session Flow
```
Select Class → AI Generates Questions → Answer & Get Feedback → Mastery Updates → Spaced Repetition
```

## 📊 Database Schema

### Core Tables
- **topics**: Subject organization
- **classes**: Class-level grouping
- **notes**: Uploaded lecture materials
- **concepts**: AI-generated study concepts
- **review_sessions**: Study session history
- **embeddings**: Vector search capabilities

## 🎯 API Endpoints

### Active Recall
- `POST /api/active-recall/generate-concepts/<class_id>` - Generate concepts
- `GET /api/active-recall/concepts/<class_id>` - Get class concepts
- `GET /api/active-recall/study-session/<class_id>` - Start study session
- `POST /api/active-recall/submit-answer` - Submit answer for evaluation
- `GET /api/active-recall/progress/<class_id>` - Get progress statistics

### Notes & Topics
- `POST /api/notes/<topic_id>` - Upload notes
- `GET /api/topics` - Get all topics
- `GET /api/classes` - Get classes for topic
- `GET /api/search` - Search across notes

## 🧪 Key Technologies

- **AI**: Anthropic Claude for concept generation and evaluation
- **Backend**: Flask, SQLite, sentence-transformers for embeddings
- **Frontend**: React, TypeScript, Vite, Tailwind CSS, Radix UI
- **File Processing**: PyPDF2, Pillow, pytesseract for OCR

## 🎨 UI Components

- **Dashboard**: Overview of topics and recent activity
- **TopicViewer**: Class management and Active Recall interface
- **NoteViewer**: Individual note display and interaction
- **Study Sessions**: Interactive Q&A with progress tracking

## 🔧 Development

### Project Structure
```
studyagent2.0/
├── studyagent-backend/     # Flask API server
│   ├── app.py             # Main application
│   ├── active_recall.py   # Active Recall system
│   ├── ai.py              # AI processing utilities
│   └── db.py              # Database utilities
├── studyagent-frontend/    # React frontend
│   ├── src/components/    # UI components
│   ├── src/services/      # API integration
│   └── src/styles/        # CSS and styling
└── .env                   # Environment variables
```

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📈 Future Enhancements

- [ ] Multi-user support with authentication
- [ ] Advanced analytics and learning insights
- [ ] Mobile app development
- [ ] Integration with learning management systems
- [ ] Collaborative study features
- [ ] Voice-to-text note taking

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Acknowledgments

- Anthropic for Claude AI capabilities
- The open-source community for amazing tools and libraries
- Educational research on spaced repetition and active recall techniques

---

**Study Buddy** - Making learning more effective through intelligent automation 🚀
