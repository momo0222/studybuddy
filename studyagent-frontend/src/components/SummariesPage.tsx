import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Calendar, BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";

interface Note {
  id: string;
  title: string;
  date: string;
  subject: string;
  status: 'summarized' | 'pending' | 'processed';
  tags: string[];
  preview: string;
  summary?: string;
}

interface SummariesPageProps {
  notes: Note[];
}

export function SummariesPage({ notes }: SummariesPageProps) {
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const toggleExpanded = (noteId: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(noteId)) {
      newExpanded.delete(noteId);
    } else {
      newExpanded.add(noteId);
    }
    setExpandedCards(newExpanded);
  };

  const subjects = Array.from(new Set(notes.map(note => note.subject)));
  
  const filteredNotes = notes.filter(note => {
    const matchesSubject = subjectFilter === 'all' || note.subject === subjectFilter;
    const matchesDate = dateFilter === 'all' || 
      (dateFilter === 'this-week' && new Date(note.date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) ||
      (dateFilter === 'this-month' && new Date(note.date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    
    return matchesSubject && matchesDate;
  });

  // Mock summary data
  const getMockSummary = (note: Note) => {
    const summaries: Record<string, string> = {
      '1': `**Cell Division Overview:**
• Mitosis produces 2 identical diploid cells for growth and repair
• Meiosis produces 4 genetically diverse haploid gametes for reproduction
• Both involve chromosome condensation and nuclear division
• Crossing over occurs only in meiosis for genetic variation

**Key Differences:**
• Mitosis: Maintains chromosome number (2n → 2n)
• Meiosis: Reduces chromosome number (2n → n)
• Mitosis: No genetic recombination
• Meiosis: Genetic recombination through crossing over`,

      '4': `**Functional Groups in Organic Chemistry:**
• Hydroxyl (-OH): Found in alcohols, polar and forms hydrogen bonds
• Carbonyl (C=O): Found in aldehydes and ketones, polar group
• Carboxyl (-COOH): Found in organic acids, ionizable group
• Amino (-NH2): Found in amines and amino acids, basic group

**Properties:**
• Functional groups determine molecular properties
• Polarity affects solubility and interactions
• Reactivity patterns based on functional group chemistry`
    };
    
    return summaries[note.id] || note.summary || "Summary not yet generated for this note.";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Summaries</h1>
          <p className="text-muted-foreground">
            {filteredNotes.length} summarized notes
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-4">
          <Select value={subjectFilter} onValueChange={setSubjectFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Subjects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              {subjects.map(subject => (
                <SelectItem key={subject} value={subject}>{subject}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Time" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="this-week">This Week</SelectItem>
              <SelectItem value="this-month">This Month</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summaries Grid */}
      {filteredNotes.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No summaries found</h3>
          <p className="text-muted-foreground">Try adjusting your filters or create more summarized notes.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredNotes.map((note) => (
            <Card key={note.id} className="border border-border">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <CardTitle className="text-lg">{note.title}</CardTitle>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {note.date}
                      </div>
                      <Badge variant="outline">{note.subject}</Badge>
                    </div>
                  </div>
                  
                  <Collapsible 
                    open={expandedCards.has(note.id)}
                    onOpenChange={() => toggleExpanded(note.id)}
                  >
                    <CollapsibleTrigger asChild>
                      <Button variant="outline" size="sm">
                        {expandedCards.has(note.id) ? (
                          <>
                            <ChevronUp className="h-4 w-4 mr-2" />
                            Collapse
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-4 w-4 mr-2" />
                            Expand
                          </>
                        )}
                      </Button>
                    </CollapsibleTrigger>
                  </Collapsible>
                </div>
              </CardHeader>

              <CardContent>
                {/* Preview */}
                <div className="mb-4">
                  <p className="text-muted-foreground line-clamp-2">
                    {note.preview}
                  </p>
                </div>

                {/* Expandable Summary */}
                <Collapsible 
                  open={expandedCards.has(note.id)}
                  onOpenChange={() => toggleExpanded(note.id)}
                >
                  <CollapsibleContent className="space-y-4">
                    <div className="border-t border-border pt-4">
                      <h4 className="font-semibold text-foreground mb-3">AI Summary</h4>
                      <div className="bg-background p-4 rounded-lg border border-border">
                        <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
                          {getMockSummary(note)}
                        </pre>
                      </div>
                      
                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 mt-4">
                        {note.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}