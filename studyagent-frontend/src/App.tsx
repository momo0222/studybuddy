import { useState } from "react";
import { LoginScreen } from "./components/LoginScreen";
import { Dashboard } from "./components/Dashboard";
import { NoteViewer } from "./components/NoteViewer";
import { TopicViewer } from "./components/TopicViewer";

interface Note {
  id: string;
  title: string;
  date: string;
  tags: string[];
  preview: string;
  content?: string;
  summary?: string;
  keyPoints?: string[];
  status: 'original' | 'processed';
}

interface Topic {
  id: string;
  name: string;
  subject: string;
  color: string;
  originalNotesCount: number;
  processedNotesCount: number;
  lastUpdated: string;
  totalNotes: number;
}

type AppView = 'login' | 'dashboard' | 'note-viewer' | 'topic-viewer';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('login');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);

  const handleLogin = () => {
    setIsLoggedIn(true);
    setCurrentView('dashboard');
  };

  const handleGuestMode = () => {
    setIsLoggedIn(false);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentView('login');
    setSelectedNote(null);
    setSelectedTopic(null);
  };

  const handleViewNote = (note: Note) => {
    setSelectedNote(note);
    setCurrentView('note-viewer');
  };

  const handleViewTopic = (topic: Topic) => {
    setSelectedTopic(topic);
    setCurrentView('topic-viewer');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setSelectedNote(null);
    setSelectedTopic(null);
  };

  const handleUploadNote = () => {
    // This will be handled by the upload dialog in the sidebar
  };

  // Render based on current view
  switch (currentView) {
    case 'login':
      return (
        <LoginScreen 
          onLogin={handleLogin} 
          onGuestMode={handleGuestMode} 
        />
      );

    case 'dashboard':
      return (
        <Dashboard 
          onLogout={handleLogout}
          onViewNote={handleViewNote}
          onViewTopic={handleViewTopic}
        />
      );

    case 'topic-viewer':
      return selectedTopic ? (
        <TopicViewer 
          topic={selectedTopic}
          onBack={handleBackToDashboard}
          onViewNote={handleViewNote}
          onUploadNote={handleUploadNote}
        />
      ) : (
        <Dashboard 
          onLogout={handleLogout}
          onViewNote={handleViewNote}
          onViewTopic={handleViewTopic}
        />
      );

    case 'note-viewer':
      return selectedNote ? (
        <NoteViewer 
          note={selectedNote}
          onBack={handleBackToDashboard}
          onQuizMode={() => {}}
        />
      ) : (
        <Dashboard 
          onLogout={handleLogout}
          onViewNote={handleViewNote}
          onViewTopic={handleViewTopic}
        />
      );

    default:
      return (
        <Dashboard 
          onLogout={handleLogout}
          onViewNote={handleViewNote}
          onViewTopic={handleViewTopic}
        />
      );
  }
}