import React, { useState, useEffect } from "react";
import { Navigation } from "./Navigation";
import { Sidebar } from "./Sidebar";
import { TopicCard } from "./TopicCard";
import { SummariesPage } from "./SummariesPage";
import { ProfileSettings } from "./ProfileSettings";
import { UploadNoteDialog } from "./UploadNoteDialog";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { FileText, Calendar, MapPin, Brain, Type, Zap, Plus } from "lucide-react";
import { apiService, type Topic as ApiTopic, type SearchResult, type Note } from "../services/api";

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

// Extended Topic interface that matches App.tsx
interface ExtendedTopic {
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

interface DashboardProps {
  onLogout: () => void;
  onViewNote: (note: Note, className?: string) => void;
  onViewTopic: (topic: ExtendedTopic) => void;
  searchContext?: {isSearchActive: boolean, searchTerm: string, searchType: string} | null;
  onSearchContextChange?: (context: {isSearchActive: boolean, searchTerm: string, searchType: string} | null) => void;
}

// Mock data for topics
const mockTopics: Topic[] = [
  {
    id: 'topic-1',
    name: 'Cell Biology',
    subject: 'Biology',
    color: '#3B82F6',
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

// Mock notes removed - using real API data instead

export function Dashboard({ onLogout, onViewNote, onViewTopic, searchContext, onSearchContextChange }: DashboardProps) {
  const [activeTab, setActiveTab] = useState('topics');
  const [topics, setTopics] = useState<ExtendedTopic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [currentView, setCurrentView] = useState<'dashboard' | 'profile'>('dashboard');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Convert API topics to UI topic format with note counts and inferred subjects
  const convertToUITopic = async (apiTopic: ApiTopic): Promise<ExtendedTopic> => {
    try {
      // Use the class_count and note_count from the backend API
      const classCount = (apiTopic as any).class_count || 0;
      const noteCount = (apiTopic as any).note_count || 0;
      
      // Infer subject from topic name
      const topicName = apiTopic.name.toLowerCase();
      let subject = 'General';
      const colors = ['#6366F1', '#8B5CF6', '#06B6D4', '#3B82F6', '#F59E0B', '#EF4444'];
      
      if (topicName.includes('biology') || topicName.includes('bio') || topicName.includes('cell') || topicName.includes('genetics')) {
        subject = 'Biology';
      } else if (topicName.includes('math') || topicName.includes('calculus') || topicName.includes('algebra') || topicName.includes('geometry')) {
        subject = 'Mathematics';
      } else if (topicName.includes('history') || topicName.includes('historical') || topicName.includes('war') || topicName.includes('ancient')) {
        subject = 'History';
      } else if (topicName.includes('chemistry') || topicName.includes('chem') || topicName.includes('organic') || topicName.includes('molecular')) {
        subject = 'Chemistry';
      } else if (topicName.includes('physics') || topicName.includes('quantum') || topicName.includes('mechanics') || topicName.includes('thermodynamics')) {
        subject = 'Physics';
      } else if (
        topicName.includes('computer') || topicName.includes('programming') || topicName.includes('software') || 
        topicName.includes('coding') || topicName.includes('algorithm') || topicName.includes('data structure') ||
        topicName.includes('operating system') || topicName.includes('database') || topicName.includes('network') ||
        topicName.includes('web dev') || topicName.includes('machine learning') || topicName.includes('ai') ||
        topicName.includes('cybersecurity') || topicName.includes('software engineering') || topicName.includes('cs ') ||
        topicName.includes('comp sci') || topicName.includes('javascript') || topicName.includes('python') ||
        topicName.includes('java') || topicName.includes('c++') || topicName.includes('react') || topicName.includes('node')
      ) {
        subject = 'Computer Science';
      }
      
      return {
        id: apiTopic.id,
        name: apiTopic.name,
        subject: subject,
        color: colors[Math.abs(apiTopic.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % colors.length],
        originalNotesCount: classCount,
        processedNotesCount: noteCount,
        lastUpdated: new Date(apiTopic.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        totalNotes: noteCount,
        created_at: apiTopic.created_at
      };
    } catch (error) {
      return {
        id: apiTopic.id,
        name: apiTopic.name,
        subject: 'General',
        color: '#6366F1',
        originalNotesCount: 0,
        processedNotesCount: 0,
        lastUpdated: new Date(apiTopic.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        totalNotes: 0,
        created_at: apiTopic.created_at
      };
    }
  };

  // Fetch topics on component mount
  useEffect(() => {
    const fetchTopics = async () => {
      try {
        setIsLoading(true);
        const fetchedTopics = await apiService.getTopics();
        
        // Convert API topics to UI topics with note counts
        const uiTopics = await Promise.all(
          fetchedTopics.map(async (apiTopic) => await convertToUITopic(apiTopic))
        );
        
        setTopics(uiTopics);
        setError('');
      } catch (err) {
        setError('Failed to load topics');
        console.error('Error fetching topics:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTopics();
  }, []);

  const filteredTopics = topics.filter(topic => {
    const matchesSearch = topic.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = activeFilter === 'all' || 
      (activeFilter === 'recent' && new Date(topic.lastUpdated).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000) ||
      (activeFilter === topic.subject.toLowerCase());
    return matchesSearch && matchesFilter;
  });

  // Notes filtering removed - using search API instead

  const handleUploadNote = async () => {
    // Refresh topics after upload
    try {
      setIsLoading(true);
      const fetchedTopics = await apiService.getTopics();
      
      // Convert API topics to UI topics with note counts
      const uiTopics = await Promise.all(
        fetchedTopics.map(async (apiTopic) => await convertToUITopic(apiTopic))
      );
      
      setTopics(uiTopics);
      setError('');
    } catch (err) {
      console.error('Error refreshing topics:', err);
      setError('Failed to refresh topics');
    } finally {
      setIsLoading(false);
    }
    // Trigger sidebar refresh
    setRefreshTrigger(prev => prev + 1);
  };

  const handleUploadToTopic = (topic: Topic) => {
    // This would trigger the upload dialog with the topic pre-selected
    alert(`Upload note to ${topic.name} (this would open upload dialog with topic pre-selected)`);
  };

  const handleSearchResults = (results: SearchResult[]) => {
    setSearchResults(results);
    setShowSearchResults(true);
    updateSearchContext(true, searchTerm, 'hybrid');
  };

  // Initialize search context from props - only run once when component mounts or context changes from null
  useEffect(() => {
    if (searchContext?.isSearchActive && !showSearchResults) {
      setShowSearchResults(true);
      setSearchTerm(searchContext.searchTerm || '');
      // Re-run the search to restore results
      if (searchContext.searchTerm) {
        handleSearch(searchContext.searchTerm, searchContext.searchType as any);
      }
    } else if (searchContext === null) {
      // Clear search state when context is explicitly cleared
      setShowSearchResults(false);
      setSearchResults([]);
      setSearchTerm('');
    }
  }, [searchContext]);

  const handleSearch = async (term: string, type: string = 'hybrid') => {
    if (!term.trim()) return;
    
    try {
      const results = await apiService.searchNotes(term, undefined, type as any);
      setSearchResults(results);
      setShowSearchResults(true);
      updateSearchContext(true, term, type);
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  // Update search context when search state changes
  const updateSearchContext = (isActive: boolean, term: string = '', type: string = 'hybrid') => {
    if (onSearchContextChange) {
      onSearchContextChange(isActive ? {isSearchActive: isActive, searchTerm: term, searchType: type} : null);
    }
  };

  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
    if (!term.trim()) {
      setShowSearchResults(false);
      setSearchResults([]);
      if (onSearchContextChange) {
        onSearchContextChange(null);
      }
    }
    // Don't automatically update context here - let Navigation handle the search
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
          onSearchChange={handleSearchChange}
          onSearchResults={handleSearchResults}
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
        onSearchChange={handleSearchChange}
        onSearchResults={handleSearchResults}
      />
      
      <div className="flex h-[calc(100vh-64px)]">
        <Sidebar 
          onUploadNote={() => {}}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          topics={topics}
          refreshTrigger={refreshTrigger}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          uploadComponent={
            <UploadNoteDialog 
              topics={topics}
              onUpload={handleUploadNote}
              trigger={
                <Button 
                  className="w-full mb-6 flex items-center justify-center gap-2 px-4"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Note</span>
                </Button>
              }
            />
          }
        />
        
        <main className="flex-1 p-6 overflow-auto">
          {showSearchResults ? (
            <div>
              <div className="mb-6">
                <h1 className="text-2xl font-semibold text-foreground mb-2">Search Results</h1>
                <p className="text-muted-foreground">
                  Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "{searchTerm}"
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    // Clear all search state
                    setShowSearchResults(false);
                    setSearchResults([]);
                    setSearchTerm('');
                    // Clear the search context completely
                    if (onSearchContextChange) {
                      onSearchContextChange(null);
                    }
                    // Force re-render by updating the search term in Navigation
                    handleSearchChange('');
                  }}
                  className="mt-2"
                >
                  Back to Topics
                </Button>
              </div>

              <div className="space-y-6">
                {searchResults.map((result) => (
                  <div
                    key={result.id}
                    className="bg-card border rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold">
                            {result.title}
                          </h3>
                          {result.search_type && (
                            <Badge variant={result.search_type === 'semantic' ? 'default' : result.search_type === 'hybrid' ? 'secondary' : 'outline'}>
                              <div className="flex items-center gap-1">
                                {result.search_type === 'semantic' && <Brain className="h-3 w-3" />}
                                {result.search_type === 'hybrid' && <Zap className="h-3 w-3" />}
                                {result.search_type === 'keyword' && <Type className="h-3 w-3" />}
                                <span className="capitalize">{result.search_type}</span>
                              </div>
                            </Badge>
                          )}
                          {result.score && (
                            <Badge variant="outline" className="text-xs">
                              {(result.score * 100).toFixed(1)}% match
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span>{result.topic_name} → {result.class_name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(result.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={() => {
                          // Ensure search context is preserved before navigating
                          updateSearchContext(true, searchTerm, 'hybrid');
                          onViewNote({
                            id: result.id,
                            title: result.title,
                            class_id: result.class_id,
                            raw_path: result.raw_path,
                            cleaned_text: result.cleaned_text,
                            summary: Array.isArray(result.summary) ? result.summary.join('\n') : result.summary,
                            created_at: result.created_at,
                            notes_path: result.notes_path || ''
                          }, 'search');
                        }}
                        variant="outline"
                        size="sm"
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        View Note
                      </Button>
                    </div>

                    {result.snippets && result.snippets.length > 0 && (
                      <div className="space-y-3">
                        {result.snippets.map((snippet, index) => (
                          <div key={index} className="border-l-2 border-primary/20 pl-4">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant={snippet.type === 'summary' ? 'default' : 'secondary'}>
                                {snippet.type === 'summary' ? 'Summary' : 'Content'}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {snippet.text}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {searchResults.length === 0 && (
                <div className="text-center py-12">
                  <h3 className="text-lg font-medium mb-2">No results found</h3>
                  <p className="text-muted-foreground">
                    Try adjusting your search terms or check for typos.
                  </p>
                </div>
              )}
            </div>
          ) : activeTab === 'topics' ? (
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
          ) : null}
        </main>
      </div>
    </div>
  );
}