import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Upload, Filter, Calendar, BookOpen, Calculator, History } from "lucide-react";

interface SidebarProps {
  onUploadNote: () => void;
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  uploadComponent?: React.ReactNode;
}

export function Sidebar({ onUploadNote, activeFilter, onFilterChange, uploadComponent }: SidebarProps) {
  const filters = [
    { id: 'all', label: 'All Topics', icon: Filter, count: 4 },
    { id: 'this-week', label: 'This Week', icon: Calendar, count: 2 },
    { id: 'biology', label: 'Biology', icon: BookOpen, count: 1 },
    { id: 'mathematics', label: 'Mathematics', icon: Calculator, count: 1 },
    { id: 'history', label: 'History', icon: History, count: 1 },
    { id: 'chemistry', label: 'Chemistry', icon: BookOpen, count: 1 }
  ];

  return (
    <aside className="w-64 bg-card border-r border-border p-4 h-full">
      {/* Upload Button */}
      <div className="mb-6">
        {uploadComponent || (
          <Button 
            onClick={onUploadNote}
            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload Note
          </Button>
        )}
      </div>

      {/* Quick Filters */}
      <div className="space-y-2">
        <h3 className="font-semibold text-foreground mb-3">Filter Topics</h3>
        {filters.map((filter) => {
          const IconComponent = filter.icon;
          return (
            <Button
              key={filter.id}
              variant={activeFilter === filter.id ? "secondary" : "ghost"}
              className={`w-full justify-start ${
                activeFilter === filter.id 
                  ? "bg-secondary text-secondary-foreground" 
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`}
              onClick={() => onFilterChange(filter.id)}
            >
              <IconComponent className="mr-2 h-4 w-4" />
              <span className="flex-1 text-left">{filter.label}</span>
              <Badge variant="secondary" className="ml-auto">
                {filter.count}
              </Badge>
            </Button>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="mt-8">
        <h3 className="font-semibold text-foreground mb-3">Recent Activity</h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="p-2 rounded-md bg-background">
            <p className="font-medium">AI processing completed</p>
            <p className="text-xs">Cell Biology - 3 notes processed</p>
          </div>
          <div className="p-2 rounded-md bg-background">
            <p className="font-medium">New topic created</p>
            <p className="text-xs">Organic Chemistry</p>
          </div>
          <div className="p-2 rounded-md bg-background">
            <p className="font-medium">Note uploaded</p>
            <p className="text-xs">Calculus Integration Methods</p>
          </div>
        </div>
      </div>
    </aside>
  );
}