import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Separator } from "./ui/separator";
import { ArrowLeft, FolderOpen, FileText, Brain, Search, Calendar, Tag, Eye, MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";

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

interface TopicViewerProps {
  topic: Topic;
  onBack: () => void;
  onViewNote: (note: Note) => void;
  onUploadNote: () => void;
}

// Mock data for notes within a topic
const getMockNotes = (topicId: string): { original: Note[], processed: Note[] } => {
  const originalNotes: Note[] = [
    {
      id: 'orig-1',
      title: 'Cell Division Lecture Notes',
      date: 'Sep 12, 2025',
      tags: ['mitosis', 'meiosis', 'lecture'],
      preview: 'Raw notes from Professor Smith\'s lecture on cell division processes...',
      content: 'Cell Division - September 12th\n\nMitosis:\n- Process of cell division\n- Produces 2 identical cells\n- Important for growth...',
      status: 'original'
    },
    {
      id: 'orig-2', 
      title: 'Textbook Chapter 8 - Cell Cycle',
      date: 'Sep 10, 2025',
      tags: ['textbook', 'cell cycle', 'reading'],
      preview: 'Notes taken while reading chapter 8 about cell cycle regulation...',
      content: 'Chapter 8 Notes\n\nCell Cycle Overview:\n- G1, S, G2, M phases\n- Checkpoints...',
      status: 'original'
    }
  ];

  const processedNotes: Note[] = [
    {
      id: 'proc-1',
      title: 'Cell Division - AI Summary',
      date: 'Sep 12, 2025',
      tags: ['mitosis', 'meiosis', 'ai-processed'],
      preview: 'AI-generated clean summary of cell division concepts with key points...',
      content: 'Cell Division Summary\n\nKey Concepts:\n• Mitosis produces identical diploid cells\n• Meiosis produces diverse haploid gametes...',
      summary: 'Comprehensive overview of cell division including mitosis and meiosis processes...',
      keyPoints: ['Mitosis for growth and repair', 'Meiosis for reproduction', 'Chromosome behavior differs'],
      status: 'processed'
    }
  ];

  return { original: originalNotes, processed: processedNotes };
};

export function TopicViewer({ topic, onBack, onViewNote, onUploadNote }: TopicViewerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFolder, setActiveFolder] = useState<'original' | 'processed' | 'both'>('both');

  const { original: originalNotes, processed: processedNotes } = getMockNotes(topic.id);

  const filteredOriginalNotes = originalNotes.filter(note =>
    note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredProcessedNotes = processedNotes.filter(note =>
    note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const NoteItem = ({ note }: { note: Note }) => (
    <Card key={note.id} className="group hover:shadow-md transition-shadow cursor-pointer border border-border">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <div className="flex items-center space-x-2">
              {note.status === 'original' ? (
                <FileText className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Brain className="h-4 w-4 text-accent" />
              )}
              <h4 className="font-medium text-foreground line-clamp-1">{note.title}</h4>
            </div>
            
            <p className="text-sm text-muted-foreground line-clamp-2">
              {note.preview}
            </p>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-3 w-3" />
                  <span>{note.date}</span>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-1">
                {note.tags.slice(0, 2).map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {note.tags.length > 2 && (
                  <Badge variant="outline" className="text-xs">
                    +{note.tags.length - 2}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onViewNote(note)}>
                <Eye className="mr-2 h-4 w-4" />
                Open Note
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full mt-3 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => onViewNote(note)}
        >
          <Eye className="mr-2 h-4 w-4" />
          Open Note
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Topics
            </Button>
            <div className="flex items-center space-x-3">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                style={{ backgroundColor: `${topic.color}20`, border: `2px solid ${topic.color}` }}
              >
                {topic.subject === 'Biology' ? '🧬' : '📖'}
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground">{topic.name}</h1>
                <Badge 
                  variant="outline"
                  style={{ borderColor: topic.color, color: topic.color }}
                >
                  {topic.subject}
                </Badge>
              </div>
            </div>
          </div>
          
          <Button onClick={onUploadNote} className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <FileText className="h-4 w-4 mr-2" />
            Add Note
          </Button>
        </div>
      </div>

      <div className="p-6">
        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant={activeFolder === 'both' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveFolder('both')}
              >
                All
              </Button>
              <Button
                variant={activeFolder === 'original' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveFolder('original')}
              >
                Original
              </Button>
              <Button
                variant={activeFolder === 'processed' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveFolder('processed')}
              >
                AI Processed
              </Button>
            </div>
          </div>
        </div>

        {/* Folder Structure */}
        <div className="space-y-6">
          {(activeFolder === 'both' || activeFolder === 'original') && (
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <FolderOpen className="h-5 w-5 text-muted-foreground" />
                <h2 className="font-semibold text-foreground">Original Notes</h2>
                <Badge variant="secondary">{filteredOriginalNotes.length}</Badge>
              </div>
              
              {filteredOriginalNotes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredOriginalNotes.map(note => (
                    <NoteItem key={note.id} note={note} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="mx-auto h-12 w-12 mb-4" />
                  <p>No original notes found</p>
                </div>
              )}
            </div>
          )}

          {(activeFolder === 'both' || activeFolder === 'processed') && (
            <>
              {activeFolder === 'both' && <Separator />}
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <Brain className="h-5 w-5 text-accent" />
                  <h2 className="font-semibold text-foreground">AI Processed Notes</h2>
                  <Badge variant="secondary">{filteredProcessedNotes.length}</Badge>
                </div>
                
                {filteredProcessedNotes.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredProcessedNotes.map(note => (
                      <NoteItem key={note.id} note={note} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Brain className="mx-auto h-12 w-12 mb-4" />
                    <p>No AI processed notes yet</p>
                    <p className="text-sm">Upload original notes to generate AI summaries</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}