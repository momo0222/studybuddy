import { Card, CardContent, CardHeader } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { FileText, Calendar, Eye, MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";

interface Note {
  id: string;
  title: string;
  date: string;
  subject: string;
  status: 'summarized' | 'pending' | 'processed';
  tags: string[];
  preview: string;
}

interface NoteCardProps {
  note: Note;
  onView: (note: Note) => void;
  onQuiz: (note: Note) => void;
}

export function NoteCard({ note, onView, onQuiz }: NoteCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'summarized':
        return 'bg-accent text-accent-foreground';
      case 'processed':
        return 'bg-accent text-accent-foreground';
      case 'pending':
        return 'bg-secondary text-secondary-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getSubjectColor = (subject: string) => {
    switch (subject.toLowerCase()) {
      case 'biology':
        return 'bg-green-100 text-green-800';
      case 'math':
        return 'bg-blue-100 text-blue-800';
      case 'history':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="group hover:shadow-md transition-shadow cursor-pointer border border-border">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <Badge variant="outline" className={getSubjectColor(note.subject)}>
              {note.subject}
            </Badge>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(note)}>
                <Eye className="mr-2 h-4 w-4" />
                View Note
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onQuiz(note)}>
                Quiz Mode
              </DropdownMenuItem>
              <DropdownMenuItem>
                Export PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="space-y-1">
          <h3 className="font-semibold text-foreground line-clamp-2">{note.title}</h3>
          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar className="mr-1 h-3 w-3" />
            {note.date}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
          {note.preview}
        </p>

        <div className="flex items-center justify-between">
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
          
          <Badge className={getStatusColor(note.status)}>
            {note.status}
          </Badge>
        </div>

        <Button 
          onClick={() => onView(note)}
          variant="outline" 
          size="sm" 
          className="w-full mt-3 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Eye className="mr-2 h-4 w-4" />
          View Note
        </Button>
      </CardContent>
    </Card>
  );
}