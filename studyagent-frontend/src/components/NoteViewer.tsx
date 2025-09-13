import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { ArrowLeft, FileText, Brain, HelpCircle, Download, Sparkles } from "lucide-react";

interface Note {
  id: string;
  title: string;
  date: string;
  subject: string;
  status: 'summarized' | 'pending' | 'processed';
  tags: string[];
  preview: string;
  content?: string;
  summary?: string;
  keyPoints?: string[];
  questions?: Array<{
    question: string;
    options?: string[];
    answer: string;
    type: 'multiple-choice' | 'short-answer';
  }>;
}

interface NoteViewerProps {
  note: Note;
  onBack: () => void;
  onQuizMode: (note: Note) => void;
}

export function NoteViewer({ note, onBack, onQuizMode }: NoteViewerProps) {
  const [processingState, setProcessingState] = useState<'idle' | 'summarizing' | 'generating-questions'>('idle');

  const handleSummarize = () => {
    setProcessingState('summarizing');
    // Mock AI processing
    setTimeout(() => {
      setProcessingState('idle');
      alert('Note summarized! (This would update the note with AI-generated summary)');
    }, 2000);
  };

  const handleGenerateQuestions = () => {
    setProcessingState('generating-questions');
    // Mock AI processing
    setTimeout(() => {
      setProcessingState('idle');
      alert('Questions generated! (This would create quiz questions from the note)');
    }, 2000);
  };

  const handleExport = () => {
    alert('Export functionality would be implemented here');
  };

  // Mock content for display
  const mockOriginalContent = `
# ${note.title}

## Introduction
This document covers the fundamental concepts of cell division, focusing on the two main processes: mitosis and meiosis. Understanding these processes is crucial for comprehending how organisms grow, reproduce, and maintain genetic diversity.

## Mitosis
Mitosis is the process by which somatic cells divide to produce two genetically identical diploid daughter cells. This process is essential for:
- Growth and development
- Tissue repair and regeneration
- Asexual reproduction in some organisms

### Phases of Mitosis
1. **Prophase**: Chromatin condenses into visible chromosomes, nuclear envelope breaks down
2. **Metaphase**: Chromosomes align at the cell's equator
3. **Anaphase**: Sister chromatids separate and move to opposite poles
4. **Telophase**: Nuclear envelopes reform around chromosome sets

## Meiosis
Meiosis is a specialized form of cell division that produces four genetically diverse haploid gametes from one diploid cell. Key features include:
- Reduction division (diploid → haploid)
- Genetic recombination through crossing over
- Independent assortment of chromosomes

### Importance of Meiosis
- Sexual reproduction
- Genetic diversity
- Species evolution and adaptation
  `;

  const mockSummary = note.summary || `
**Key Points:**
• Mitosis produces 2 identical diploid cells for growth and repair
• Meiosis produces 4 genetically diverse haploid gametes for reproduction
• Both processes involve chromosome condensation and nuclear division
• Meiosis includes genetic recombination for diversity

**Main Concepts:**
• Cell cycle regulation and checkpoints
• Chromosome structure and behavior
• Genetic variation mechanisms
• Biological significance of each process
  `;

  const mockKeyPoints = note.keyPoints || [
    "Mitosis maintains chromosome number (diploid → diploid)",
    "Meiosis reduces chromosome number (diploid → haploid)", 
    "Crossing over occurs only during meiosis",
    "Both processes are essential for life cycles"
  ];

  const mockQuestions = note.questions || [
    {
      question: "What is the main purpose of mitosis?",
      options: ["Sexual reproduction", "Growth and repair", "Genetic diversity", "Chromosome reduction"],
      answer: "Growth and repair",
      type: "multiple-choice" as const
    },
    {
      question: "During which phase of mitosis do chromosomes align at the cell's equator?",
      answer: "Metaphase",
      type: "short-answer" as const
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Notes
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-foreground">{note.title}</h1>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant="outline">{note.subject}</Badge>
                <span className="text-sm text-muted-foreground">{note.date}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleSummarize}
              disabled={processingState === 'summarizing'}
            >
              {processingState === 'summarizing' ? (
                <>
                  <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                  Summarizing...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4 mr-2" />
                  Summarize
                </>
              )}
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleGenerateQuestions}
              disabled={processingState === 'generating-questions'}
            >
              {processingState === 'generating-questions' ? (
                <>
                  <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <HelpCircle className="h-4 w-4 mr-2" />
                  Generate Questions
                </>
              )}
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Two-panel layout */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Left Panel - Original Note */}
        <div className="flex-1 p-6 overflow-auto border-r border-border">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Original Note
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none text-foreground">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                  {mockOriginalContent.trim()}
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - AI Processed */}
        <div className="flex-1 p-6 overflow-auto">
          <div className="space-y-6">
            {/* Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Brain className="h-5 w-5 mr-2" />
                  AI Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none text-foreground">
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                    {mockSummary.trim()}
                  </pre>
                </div>
              </CardContent>
            </Card>

            {/* Key Concepts */}
            <Card>
              <CardHeader>
                <CardTitle>Key Concepts</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {mockKeyPoints.map((point, index) => (
                    <li key={index} className="flex items-start">
                      <span className="w-2 h-2 bg-accent rounded-full mt-2 mr-3 flex-shrink-0" />
                      <span className="text-sm text-foreground">{point}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Suggested Questions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <HelpCircle className="h-5 w-5 mr-2" />
                    Suggested Questions
                  </span>
                  <Button 
                    size="sm" 
                    onClick={() => onQuizMode(note)}
                    className="bg-accent hover:bg-accent/90 text-accent-foreground"
                  >
                    Start Quiz
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockQuestions.map((q, index) => (
                    <div key={index} className="p-3 bg-background rounded-lg border border-border">
                      <p className="font-medium text-foreground mb-2">
                        {index + 1}. {q.question}
                      </p>
                      {q.type === 'multiple-choice' && q.options && (
                        <div className="space-y-1">
                          {q.options.map((option, optIndex) => (
                            <div key={optIndex} className="text-sm text-muted-foreground ml-4">
                              {String.fromCharCode(65 + optIndex)}. {option}
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="mt-2 text-sm">
                        <span className="font-medium text-accent">Answer: </span>
                        <span className="text-foreground">{q.answer}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}