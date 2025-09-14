import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { ArrowLeft, FolderOpen, FileText, Brain, Search, Plus, Zap, Target, TrendingUp } from "lucide-react";
import { NoteCard } from "./NoteCard";
import { UploadNoteDialog } from "./UploadNoteDialog";
import { apiService, type Note, type Topic as ApiTopic, type Class, type ClassProgress, type StudySession, type AnswerSubmission, type AnswerEvaluation } from "../services/api";

// Extended Topic interface that includes UI properties
interface UITopic extends ApiTopic {
  subject?: string;
  color?: string;
  originalNotesCount?: number;
  processedNotesCount?: number;
  lastUpdated?: string;
  totalNotes?: number;
}

interface TopicViewerProps {
  topic: UITopic;
  onBack: () => void;
  onViewNote: (note: Note, className?: string) => void;
  onUploadNote?: () => void;
  selectedClass?: { name: string } | null;
  onBackToTopics?: () => void;
}


export function TopicViewer({ topic, onBack, onViewNote, onUploadNote, selectedClass: initialSelectedClass, onBackToTopics }: TopicViewerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchResults, setSearchResults] = useState<Note[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [topics, setTopics] = useState<ApiTopic[]>([]);
  
  // Active Recall state
  const [classProgress, setClassProgress] = useState<ClassProgress | null>(null);
  const [studySession, setStudySession] = useState<StudySession | null>(null);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [isStudying, setIsStudying] = useState(false);
  const [lastEvaluation, setLastEvaluation] = useState<AnswerEvaluation | null>(null);
  const [isGeneratingConcepts, setIsGeneratingConcepts] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [fetchedClasses, fetchedTopics] = await Promise.all([
          apiService.getClasses(topic.id),
          apiService.getTopics()
        ]);
        setClasses(fetchedClasses);
        setTopics(fetchedTopics);
        
        // Restore selected class if returning from note view
        if (initialSelectedClass && fetchedClasses.length > 0) {
          const classToSelect = fetchedClasses.find(cls => cls.name === initialSelectedClass.name);
          if (classToSelect) {
            setSelectedClass(classToSelect);
          }
        }
        
        setError(null);
      } catch (err) {
        setError('Failed to load data');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [topic.id, initialSelectedClass]);

  // Fetch notes when a class is selected
  useEffect(() => {
    if (selectedClass) {
      fetchNotes(selectedClass.id);
      fetchClassProgress(selectedClass.id);
    }
  }, [selectedClass]);

  const fetchNotes = async (classId: string) => {
    try {
      const fetchedNotes = await apiService.getNotes(classId);
      setNotes(fetchedNotes);
    } catch (err) {
      console.error('Error fetching notes:', err);
      setNotes([]);
    }
  };

  const fetchClassProgress = async (classId: string) => {
    try {
      const progress = await apiService.getClassProgress(classId);
      setClassProgress(progress);
    } catch (error) {
      console.error('Failed to fetch class progress:', error);
    }
  };

  const handleGenerateConcepts = async () => {
    if (!selectedClass) return;
    
    setIsGeneratingConcepts(true);
    try {
      const result = await apiService.generateConcepts(selectedClass.id);
      if (result.success) {
        await fetchClassProgress(selectedClass.id);
        alert(`Successfully generated ${result.concept_ids.length} concepts for active recall!`);
      }
    } catch (error) {
      console.error('Failed to generate concepts:', error);
      alert('Failed to generate concepts. Please try again.');
    } finally {
      setIsGeneratingConcepts(false);
    }
  };

  const handleStartStudySession = async () => {
    if (!selectedClass) return;
    
    try {
      const session = await apiService.startStudySession(selectedClass.id);
      setStudySession(session);
      setIsStudying(true);
      setLastEvaluation(null);
      setCurrentAnswer('');
    } catch (error) {
      console.error('Failed to start study session:', error);
      alert('Failed to start study session. Please try again.');
    }
  };

  const handleSubmitAnswer = async () => {
    if (!studySession || !currentAnswer.trim()) return;
    
    try {
      const submission: AnswerSubmission = {
        concept_id: studySession.concept.id,
        question: studySession.question.text,
        answer: currentAnswer.trim()
      };
      
      const evaluation = await apiService.submitAnswer(submission);
      setLastEvaluation(evaluation);
      setCurrentAnswer('');
      
      // Refresh progress
      await fetchClassProgress(selectedClass!.id);
      
      // Allow user to manually continue to next question
      
    } catch (error) {
      console.error('Failed to submit answer:', error);
      alert('Failed to submit answer. Please try again.');
    }
  };

  const handleStopStudying = () => {
    setIsStudying(false);
    setStudySession(null);
    setLastEvaluation(null);
    setCurrentAnswer('');
  };

  const handleUploadSuccess = async () => {
    // Refresh notes after successful upload
    if (selectedClass) {
      try {
        const fetchedNotes = await apiService.getNotes(selectedClass.id);
        setNotes(fetchedNotes);
      } catch (err) {
        console.error('Error refreshing notes:', err);
      }
    }
  };

  // Handle search functionality
  const handleSearch = async (query: string) => {
    if (!query.trim() || !selectedClass) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      // First, restore class filtering to the backend
      const params = new URLSearchParams({ 
        q: query, 
        type: 'hybrid',
        class_id: selectedClass.id 
      });
      
      const response = await fetch(`http://localhost:5002/api/search?${params}`);
      if (!response.ok) {
        throw new Error('Search failed');
      }
      
      const results = await response.json();
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm) {
        handleSearch(searchTerm);
      } else {
        setSearchResults([]);
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, selectedClass]);

  // Determine which notes to display
  const displayNotes = searchTerm ? searchResults : notes;


  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Brain className="mx-auto h-12 w-12 mb-4 animate-pulse" />
          <p>Loading notes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={onBackToTopics || onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Topics
            </Button>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl bg-blue-100 border-2 border-blue-500">
                📚
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground">{topic.name}</h1>
                <Badge variant="outline" className="text-blue-600 border-blue-600">
                  {classes.length} classes
                </Badge>
              </div>
            </div>
          </div>
          
          {selectedClass && (
            <UploadNoteDialog
              topics={topics}
              onUpload={handleUploadSuccess}
              preselectedTopicId={topic.id}
              preselectedClassId={selectedClass.id}
              disableTopicSelection={true}
              trigger={
                <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Note
                </Button>
              }
            />
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Classes Section */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Classes</h2>
          {classes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {classes.map((cls) => (
                <div
                  key={cls.id}
                  onClick={() => setSelectedClass(cls)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedClass?.id === cls.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-border hover:border-blue-300 bg-card'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <FolderOpen className="h-5 w-5 text-blue-600" />
                    <div>
                      <h3 className="font-medium">{cls.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedClass?.id === cls.id ? notes.length : '...'} notes
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 border border-dashed border-border rounded-lg">
              <FolderOpen className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No classes found. Create a class to organize your notes.</p>
            </div>
          )}
        </div>

        {/* Active Recall Section */}
        {selectedClass && !isStudying && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Brain className="h-5 w-5 mr-2 text-purple-600" />
              Active Recall
            </h2>
            
            {classProgress ? (
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{classProgress.total_concepts}</div>
                    <div className="text-sm text-muted-foreground">Total Concepts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{classProgress.concepts_due}</div>
                    <div className="text-sm text-muted-foreground">Due for Review</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{Math.round(classProgress.average_mastery * 100)}%</div>
                    <div className="text-sm text-muted-foreground">Average Mastery</div>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-6">
                  <Badge variant="outline" className="text-gray-600 border-gray-600">
                    Unknown: {classProgress.mastery_distribution.UNKNOWN}
                  </Badge>
                  <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                    Learning: {classProgress.mastery_distribution.LEARNING}
                  </Badge>
                  <Badge variant="outline" className="text-blue-600 border-blue-600">
                    Familiar: {classProgress.mastery_distribution.FAMILIAR}
                  </Badge>
                  <Badge variant="outline" className="text-purple-600 border-purple-600">
                    Proficient: {classProgress.mastery_distribution.PROFICIENT}
                  </Badge>
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    Mastered: {classProgress.mastery_distribution.MASTERED}
                  </Badge>
                </div>
                
                <div className="flex gap-3">
                  {classProgress.total_concepts === 0 ? (
                    <Button 
                      onClick={handleGenerateConcepts}
                      disabled={isGeneratingConcepts}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      {isGeneratingConcepts ? 'Generating...' : 'Generate Concepts'}
                    </Button>
                  ) : (
                    <>
                      <Button 
                        onClick={handleStartStudySession}
                        disabled={classProgress.concepts_due === 0}
                        className="bg-green-600 hover:bg-green-700 text-white font-semibold shadow-lg border-0"
                        style={{ backgroundColor: '#16a34a', color: 'white' }}
                      >
                        <Target className="h-4 w-4 mr-2" />
                        Start Study Session ({classProgress.concepts_due} due)
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={handleGenerateConcepts}
                        disabled={isGeneratingConcepts}
                      >
                        <Zap className="h-4 w-4 mr-2" />
                        {isGeneratingConcepts ? 'Generating...' : 'Regenerate Concepts'}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-card border border-border rounded-lg p-6 text-center">
                <Brain className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">Loading active recall data...</p>
              </div>
            )}
          </div>
        )}

        {/* Study Session */}
        {isStudying && studySession && (
          <div className="mb-8">
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center">
                  <Target className="h-5 w-5 mr-2 text-purple-600" />
                  Study Session
                </h2>
                <Button variant="outline" size="sm" onClick={handleStopStudying}>
                  Stop Session
                </Button>
              </div>
              
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                  <span>Concept: {studySession.concept.name}</span>
                  <span>Question {studySession.session_info.current_position} of {studySession.session_info.concepts_due}</span>
                </div>
                <div className="text-sm text-muted-foreground mb-4">
                  Difficulty: {studySession.question.difficulty} | Mastery: {studySession.concept.mastery_level}
                </div>
              </div>
              
              {lastEvaluation ? (
                <div className="mb-6">
                  <div className={`p-4 rounded-lg border ${lastEvaluation.correct ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex items-center mb-2">
                      <div className={`text-lg font-semibold ${lastEvaluation.correct ? 'text-green-600' : 'text-red-600'}`}>
                        {lastEvaluation.correct ? '✓ Correct!' : '✗ Incorrect'}
                      </div>
                      <div className="ml-auto text-lg font-bold">
                        {lastEvaluation.score}/100
                      </div>
                    </div>
                    <p className="text-sm text-gray-700">{lastEvaluation.feedback}</p>
                    <div className="mt-2 text-xs text-muted-foreground">
                      Next review: {new Date(lastEvaluation.concept_progress.next_review).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-center mt-4">
                    <button
                      onClick={handleStartStudySession}
                      className="px-6 py-2 rounded-lg transition-colors font-medium"
                      style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
                    >
                      Next Question
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mb-6">
                  <div className="bg-white border border-border rounded-lg p-4 mb-4">
                    <h3 className="font-medium mb-2">Question:</h3>
                    <p className="text-gray-700">{studySession.question.text}</p>
                  </div>
                  
                  <div className="space-y-3">
                    <textarea
                      value={currentAnswer}
                      onChange={(e) => setCurrentAnswer(e.target.value)}
                      placeholder="Type your answer here..."
                      className="w-full p-3 border border-border rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      rows={4}
                    />
                    <Button 
                      onClick={handleSubmitAnswer}
                      disabled={!currentAnswer.trim()}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg border-0"
                      style={{ backgroundColor: '#2563eb', color: 'white' }}
                    >
                      Submit Answer
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Notes Section */}
        {selectedClass && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Notes in {selectedClass.name}</h2>
              <Badge variant="outline">{notes.length} notes</Badge>
            </div>

            {/* Search */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Notes Grid */}
            {displayNotes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayNotes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onView={(note) => onViewNote(note, selectedClass?.name)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No notes found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm ? 'Try adjusting your search terms' : `Upload your first note to ${selectedClass.name}`}
                </p>
                {!searchTerm && (
                  <UploadNoteDialog
                    topics={topics}
                    onUpload={handleUploadSuccess}
                    preselectedTopicId={topic.id}
                    preselectedClassId={selectedClass.id}
                    disableTopicSelection={true}
                    trigger={
                      <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Note
                      </Button>
                    }
                  />
                )}
              </div>
            )}
          </div>
        )}

        {/* No class selected message */}
        {!selectedClass && classes.length > 0 && (
          <div className="text-center py-12">
            <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Select a class to view notes</h3>
            <p className="text-muted-foreground">Click on a class above to see its notes</p>
          </div>
        )}
      </div>
    </div>
  );
}