import { useState } from "react";
import { Navigation } from "./Navigation";
import { Sidebar } from "./Sidebar";
import { TopicCard } from "./TopicCard";
import { SummariesPage } from "./SummariesPage";
import { ProfileSettings } from "./ProfileSettings";
import { UploadNoteDialog } from "./UploadNoteDialog";
import { Button } from "./ui/button";
import { FileText } from "lucide-react";

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

interface DashboardProps {
  onLogout: () => void;
  onViewNote: (note: Note) => void;
  onViewTopic: (topic: Topic) => void;
}

// Mock data for topics
const mockTopics: Topic[] = [
  {
    id: 'topic-1',
    name: 'Cell Biology',
    subject: 'Biology',
    color: '#10B981',
    originalNotesCount: 5,
    processedNotesCount: 3,
    lastUpdated: 'Sep 12, 2025',
    totalNotes: 8
  },
  {
    id: 'topic-2',
    name: 'Calculus',
    subject: 'Mathematics',
    color: '#3B82F6',
    originalNotesCount: 4,
    processedNotesCount: 4,
    lastUpdated: 'Sep 11, 2025',
    totalNotes: 8
  },
  {
    id: 'topic-3',
    name: 'World War II',
    subject: 'History',
    color: '#8B5CF6',
    originalNotesCount: 6,
    processedNotesCount: 2,
    lastUpdated: 'Sep 10, 2025',
    totalNotes: 8
  },
  {
    id: 'topic-4',
    name: 'Organic Chemistry',
    subject: 'Chemistry',
    color: '#F59E0B',
    originalNotesCount: 3,
    processedNotesCount: 1,
    lastUpdated: 'Sep 9, 2025',
    totalNotes: 4
  }
];

const mockNotes: Note[] = [
  {
    id: '1',
    title: 'Cell Biology: Mitosis and Meiosis - AI Summary',
    date: 'Sep 12, 2025',
    tags: ['mitosis', 'meiosis', 'cell division', 'ai-processed'],
    preview: 'AI-generated comprehensive summary of cell division processes including the phases of mitosis and meiosis.',
    content: 'Detailed content about cell division...',
    summary: 'Cell division occurs through mitosis (somatic cells) and meiosis (gametes)...',
    keyPoints: ['Mitosis produces identical diploid cells', 'Meiosis produces genetically diverse haploid cells'],
    status: 'processed'
  },
  {
    id: '2',
    title: 'Calculus: Integration Techniques - Clean Notes',
    date: 'Sep 11, 2025',
    tags: ['integration', 'calculus', 'techniques', 'ai-processed'],
    preview: 'AI-processed notes covering various integration techniques including substitution and integration by parts.',
    content: 'Integration techniques content...',
    status: 'processed'
  }
];

export function Dashboard({ onLogout, onViewNote, onViewTopic }: DashboardProps) {
  const [activeTab, setActiveTab] = useState('topics');
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentView, setCurrentView] = useState<'dashboard' | 'profile'>('dashboard');
  const [topics, setTopics] = useState<Topic[]>(mockTopics);

  const filteredTopics = topics.filter(topic => {
    const matchesFilter = 
      activeFilter === 'all' || 
      (activeFilter === 'this-week' && new Date(topic.lastUpdated) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) ||
      topic.subject.toLowerCase() === activeFilter;
    
    const matchesSearch = 
      searchTerm === '' ||
      topic.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      topic.subject.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const filteredNotes = mockNotes.filter(note => {
    const matchesSearch = 
      searchTerm === '' ||
      note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
      note.preview.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const handleUploadNote = (noteData: {
    title: string;
    content: string;
    topicId: string;
    newTopicName?: string;
    newTopicSubject?: string;
    tags: string[];
  }) => {
    // Mock upload functionality
    if (noteData.topicId === 'new' && noteData.newTopicName && noteData.newTopicSubject) {
      // Create new topic
      const newTopic: Topic = {
        id: `topic-${Date.now()}`,
        name: noteData.newTopicName,
        subject: noteData.newTopicSubject,
        color: '#6366F1', // Default color
        originalNotesCount: 1,
        processedNotesCount: 0,
        lastUpdated: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        totalNotes: 1
      };
      setTopics(prev => [...prev, newTopic]);
    } else {
      // Add to existing topic
      setTopics(prev => prev.map(topic => 
        topic.id === noteData.topicId 
          ? { ...topic, originalNotesCount: topic.originalNotesCount + 1, totalNotes: topic.totalNotes + 1, lastUpdated: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }
          : topic
      ));
    }
    
    alert('Note uploaded successfully!');
  };

  const handleUploadToTopic = (topic: Topic) => {
    // This would trigger the upload dialog with the topic pre-selected
    alert(`Upload note to ${topic.name} (this would open upload dialog with topic pre-selected)`);
  };

  if (currentView === 'profile') {
    return (
      <div className="min-h-screen bg-background">
        <Navigation 
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onProfile={() => setCurrentView('profile')}
          onLogout={onLogout}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />
        <ProfileSettings onBack={() => setCurrentView('dashboard')} />
      </div>
    );
  }



  return (
    <div className="min-h-screen bg-background">
      <Navigation 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onProfile={() => setCurrentView('profile')}
        onLogout={onLogout}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />
      
      <div className="flex h-[calc(100vh-64px)]">
        <Sidebar 
          onUploadNote={() => {}}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          uploadComponent={
            <UploadNoteDialog
              topics={topics}
              onUpload={handleUploadNote}
              trigger={
                <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                  <FileText className="mr-2 h-4 w-4" />
                  Upload Note
                </Button>
              }
            />
          }
        />
        
        <main className="flex-1 p-6 overflow-auto">
          {activeTab === 'topics' && (
            <div>
              <div className="mb-6">
                <h1 className="text-2xl font-semibold text-foreground mb-2">Your Study Topics</h1>
                <p className="text-muted-foreground">
                  {filteredTopics.length} topics found
                  {searchTerm && ` for "${searchTerm}"`}
                  {activeFilter !== 'all' && ` in ${activeFilter}`}
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTopics.map((topic) => (
                  <TopicCard 
                    key={topic.id}
                    topic={topic}
                    onView={onViewTopic}
                    onUploadToTopic={handleUploadToTopic}
                  />
                ))}
              </div>
              
              {filteredTopics.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No topics found. Upload a note to create your first topic.</p>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'summaries' && (
            <SummariesPage notes={mockNotes.filter(n => n.status === 'processed')} />
          )}
        </main>
      </div>
    </div>
  );
}