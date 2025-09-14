import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { ArrowLeft, FileText, Brain, Download, ExternalLink, Maximize2, ZoomIn, ZoomOut } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { type Note, type Class, type Topic } from "../services/api";

interface NoteViewerProps {
  note: Note;
  onBack: () => void;
  className?: string;
  topicName?: string;
}

export function NoteViewer({ note, onBack, className, topicName }: NoteViewerProps) {
  const [pdfZoom, setPdfZoom] = useState(100);
  const [imageZoom, setImageZoom] = useState(100);
  const [leftWidth, setLeftWidth] = useState(50); // percentage
  const [isDragging, setIsDragging] = useState(false);

  const getFileExtension = (filename: string) => {
    return filename.split('.').pop()?.toLowerCase() || '';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSummaryText = (summary: string | string[]) => {
    if (Array.isArray(summary)) {
      return summary.join('\n\n');
    }
    try {
      const parsed = JSON.parse(summary);
      if (Array.isArray(parsed)) {
        return parsed.join('\n\n');
      }
      return summary;
    } catch {
      return summary || 'No summary available';
    }
  };

  const renderRawFile = () => {
    const extension = getFileExtension(note.title);
    const rawPath = note.raw_path || note.notes_path;
    
    if (extension === 'pdf') {
      return (
        <div className="h-full">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPdfZoom(Math.max(50, pdfZoom - 25))}
                disabled={pdfZoom <= 50}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">{pdfZoom}%</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPdfZoom(Math.min(200, pdfZoom + 25))}
                disabled={pdfZoom >= 200}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="h-[calc(100%-40px)] overflow-auto border rounded-lg">
            <div style={{ 
              transform: `scale(${pdfZoom / 100})`,
              transformOrigin: 'top left',
              width: `${100 / (pdfZoom / 100)}%`,
              height: `${100 / (pdfZoom / 100)}%`
            }}>
              <iframe
                src={`http://localhost:5002/${rawPath}#toolbar=0`}
                className="w-full border-0"
                title={`PDF: ${note.title}`}
                style={{ 
                  minHeight: '800px',
                  height: '800px'
                }}
                onError={(e) => {
                  console.error('PDF iframe failed to load:', e);
                  console.log('Attempted URL:', `http://localhost:5002/${rawPath}`);
                }}
              />
            </div>
          </div>
        </div>
      );
    } else if (['png', 'jpg', 'jpeg'].includes(extension)) {
      return (
        <div className="h-full">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setImageZoom(Math.max(25, imageZoom - 25))}
                disabled={imageZoom <= 25}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">{imageZoom}%</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setImageZoom(Math.min(300, imageZoom + 25))}
                disabled={imageZoom >= 300}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="h-[calc(100%-40px)] overflow-auto bg-gray-50 rounded-lg">
            <div 
              className="p-4"
              style={{ 
                transform: `scale(${imageZoom / 100})`,
                transformOrigin: 'top left',
                width: `${100 / (imageZoom / 100)}%`,
                height: `${100 / (imageZoom / 100)}%`
              }}
            >
              <img
                src={`http://localhost:5002/${rawPath}`}
                alt={note.title}
                className="rounded-lg shadow-lg w-full h-auto"
                style={{ display: 'block' }}
              />
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg">
          <div className="text-center">
            <FileText className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <p className="text-gray-600">File type not supported for preview</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => window.open(`http://localhost:5002/${rawPath}`, '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open File
            </Button>
          </div>
        </div>
      );
    }
  };

  const handleExport = () => {
    alert('Export functionality would be implemented here');
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    const container = document.querySelector('.split-container') as HTMLElement;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const newLeftWidth = ((e.clientX - rect.left) / rect.width) * 100;
    
    // Constrain between 20% and 80%
    const constrainedWidth = Math.min(80, Math.max(20, newLeftWidth));
    setLeftWidth(constrainedWidth);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Add event listeners for mouse move and up
  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging]);

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


  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {className === 'search' ? 'Back to Search Results' : `Back to ${className || 'Class'}`}
            </Button>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <Brain className="h-5 w-5 text-accent" />
                <h1 className="text-xl font-semibold text-foreground">{note.title}</h1>
              </div>
              <Badge variant="outline" className="text-xs text-muted-foreground">
                {formatDate(note.created_at)}
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.open(`http://localhost:5002/${note.raw_path}`, '_blank')}
            >
              <Download className="h-4 w-4 mr-2" />
              Download Original
            </Button>
          </div>
        </div>
      </div>

      {/* Split View Content */}
      <div className="flex h-[calc(100vh-80px)] split-container">
        {/* Left Side - Raw File */}
        <div 
          className="border-r border-border"
          style={{ width: `${leftWidth}%` }}
        >
          <div className="h-full p-6">
            <div className="h-full">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-muted-foreground" />
                  Original File
                </h2>
                <Badge variant="outline" className="text-xs">
                  {getFileExtension(note.title).toUpperCase()}
                </Badge>
              </div>
              <div className="h-[calc(100%-60px)]">
                {renderRawFile()}
              </div>
            </div>
          </div>
        </div>

        {/* Resizable Divider */}
        <div 
          className="w-1 bg-border hover:bg-accent cursor-col-resize flex items-center justify-center group"
          onMouseDown={handleMouseDown}
        >
          <div className="w-0.5 h-8 bg-muted-foreground/30 group-hover:bg-accent transition-colors rounded-full"></div>
        </div>

        {/* Right Side - AI Generated Markdown */}
        <div 
          className="flex-1"
          style={{ width: `${100 - leftWidth}%` }}
        >
          <div className="h-full p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center">
                <Brain className="h-5 w-5 mr-2 text-accent" />
                AI Processed Notes
              </h2>
              <Badge variant="outline" className="text-xs bg-green-100 text-green-800">
                Processed
              </Badge>
            </div>
            
            {/* AI Summary */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-base">Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                  >
                    {getSummaryText(note.summary)}
                  </ReactMarkdown>
                </div>
              </CardContent>
            </Card>

            {/* Full AI Generated Content */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Detailed Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                  >
                    {note.cleaned_text || 'No processed content available'}
                  </ReactMarkdown>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}