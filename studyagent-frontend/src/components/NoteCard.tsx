import React from "react";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { FileText, Calendar, Eye, MoreHorizontal, Brain } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { type Note } from "../services/api";

interface NoteCardProps {
  note: Note;
  onView?: (note: Note) => void;
  onClick?: () => void;
  onQuiz?: (note: Note) => void;
}

export function NoteCard({ note, onView, onClick, onQuiz }: NoteCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getFileExtension = (filename: string) => {
    return filename.split('.').pop()?.toLowerCase() || '';
  };

  const getFileTypeColor = (filename: string) => {
    const ext = getFileExtension(filename);
    switch (ext) {
      case 'pdf':
        return 'bg-red-100 text-red-800';
      case 'png':
      case 'jpg':
      case 'jpeg':
        return 'bg-blue-100 text-blue-800';
      case 'txt':
      case 'md':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSummaryPreview = (summary: string | string[]) => {
    if (Array.isArray(summary)) {
      return summary[0] || 'No summary available';
    }
    try {
      const parsed = JSON.parse(summary);
      if (Array.isArray(parsed)) {
        return parsed[0] || 'No summary available';
      }
      return summary;
    } catch {
      return summary || 'No summary available';
    }
  };


  return (
    <Card className="group hover:shadow-md transition-shadow cursor-pointer border border-border">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <Badge variant="outline" className={getFileTypeColor(note.title)}>
              {getFileExtension(note.title).toUpperCase()}
            </Badge>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView?.(note) || onClick?.()}>
                <Eye className="h-4 w-4 mr-2" />
                View Note
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onView?.(note) || onClick?.()}>
                <Brain className="h-4 w-4 mr-2" />
                View AI Summary
              </DropdownMenuItem>
              {onQuiz && (
                <DropdownMenuItem onClick={() => onQuiz(note)}>
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Quiz
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-2">
          <Calendar className="h-3 w-3" />
          <span>{formatDate(note.created_at)}</span>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <h3 className="font-medium text-sm mb-2 line-clamp-2">{note.title}</h3>
        <p className="text-xs text-muted-foreground line-clamp-3 mb-3">
          {getSummaryPreview(note.summary)}
        </p>
        
        {/* Processing Status */}
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="bg-green-100 text-green-800">
            AI Processed
          </Badge>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onView?.(note) || onClick?.()}
            className="text-xs"
          >
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}