import React, { useState } from "react";
import { LoginScreen } from "./components/LoginScreen";
import { Dashboard } from "./components/Dashboard";
import { NoteViewer } from "./components/NoteViewer";
import { TopicViewer } from "./components/TopicViewer";
import { type Topic as ApiTopic, type Note } from "./services/api";

interface Topic {
  id: string;
  name: string;
  subject: string;
  color: string;
  originalNotesCount: number;
  processedNotesCount: number;
  lastUpdated: string;
  totalNotes: number;
  created_at: string;
}

// For components that need the API Topic type
type TopicForAPI = ApiTopic;

type AppView = 'login' | 'dashboard' | 'note-viewer' | 'topic-viewer';

export default function App() {
  const [currentView, setCurrentView] = useState<'login' | 'dashboard' | 'note-viewer' | 'topic-viewer'>('login');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [previousView, setPreviousView] = useState<'dashboard' | 'topic-viewer'>('dashboard');
  const [noteSource, setNoteSource] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [searchContext, setSearchContext] = useState<{isSearchActive: boolean, searchTerm: string, searchType: string} | null>(null);

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

  const handleViewNote = (note: Note, className?: string) => {
    setPreviousView(currentView as 'dashboard' | 'topic-viewer');
    setNoteSource(className || '');
    // Store current search context when viewing from search
    if (className === 'search' && !searchContext) {
      // This will be updated by Dashboard component with actual search data
      setSearchContext({isSearchActive: true, searchTerm: '', searchType: 'hybrid'});
    }
    // Store class info if coming from topic viewer
    if (currentView === 'topic-viewer' && className) {
      setSelectedClass({ name: className });
    }
    setSelectedNote(note);
    setCurrentView('note-viewer');
  };

  const handleViewTopic = (topic: Topic) => {
    setSelectedTopic(topic);
    setCurrentView('topic-viewer');
  };

  const handleBackToDashboard = () => {
    setCurrentView(previousView);
    setSelectedNote(null);
    if (previousView === 'dashboard') {
      setSelectedTopic(null);
      setSelectedClass(null);
    }
    setNoteSource('');
    // Don't clear search context - let it persist when returning from note view
  };

  const handleBackToTopics = () => {
    setCurrentView('dashboard');
    setSelectedTopic(null);
    setSelectedClass(null);
    setSelectedNote(null);
    setNoteSource('');
    setPreviousView('dashboard');
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
          searchContext={searchContext}
          onSearchContextChange={setSearchContext}
        />
      );

    case 'topic-viewer':
      return selectedTopic ? (
        <TopicViewer 
          topic={selectedTopic} 
          onBack={handleBackToDashboard}
          onViewNote={handleViewNote}
          onUploadNote={handleUploadNote}
          selectedClass={selectedClass}
          onBackToTopics={handleBackToTopics}
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
          className={noteSource}
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