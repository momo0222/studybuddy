import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Upload, Filter, Calendar, BookOpen, Calculator, History, FileText, Bell } from "lucide-react";
import { apiService } from "../services/api";

interface SidebarProps {
  onUploadNote: () => void;
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  uploadComponent?: React.ReactNode;
  topics?: Array<{ id: string; name: string; subject: string; totalNotes: number }>;
  refreshTrigger?: number;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

interface ActivityItem {
  id: string;
  type: 'note_uploaded' | 'topic_created' | 'class_created' | 'ai_processed';
  title: string;
  description: string;
  timestamp: string;
}

export function Sidebar({ onUploadNote, activeFilter, onFilterChange, uploadComponent, topics = [], refreshTrigger, activeTab, onTabChange }: SidebarProps) {
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [showAllActivity, setShowAllActivity] = useState(false);

  useEffect(() => {
    fetchRecentActivity();
  }, [refreshTrigger]);

  const fetchRecentActivity = async () => {
    try {
      // Fetch recent topics, classes, and notes to build activity
      const [topicsResponse, allTopics] = await Promise.all([
        apiService.getTopics(),
        apiService.getTopics()
      ]);

      const activities: ActivityItem[] = [];

      // Add recent topics
      for (const topic of topicsResponse.slice(0, 3)) {
        activities.push({
          id: `topic-${topic.id}`,
          type: 'topic_created',
          title: 'New topic created',
          description: topic.name,
          timestamp: topic.created_at
        });

        // Get classes for this topic
        try {
          const classes = await apiService.getClasses(topic.id);
          for (const cls of classes.slice(0, 2)) {
            activities.push({
              id: `class-${cls.id}`,
              type: 'class_created',
              title: 'New class created',
              description: `${cls.name} in ${topic.name}`,
              timestamp: cls.created_at
            });

            // Get notes for this class
            try {
              const notes = await apiService.getNotes(cls.id);
              for (const note of notes.slice(0, 2)) {
                activities.push({
                  id: `note-${note.id}`,
                  type: 'note_uploaded',
                  title: 'Note uploaded',
                  description: `${note.title} - ${cls.name}`,
                  timestamp: note.created_at
                });

                if (note.cleaned_text) {
                  activities.push({
                    id: `ai-${note.id}`,
                    type: 'ai_processed',
                    title: 'AI processing completed',
                    description: `${note.title} - processed`,
                    timestamp: note.created_at
                  });
                }
              }
            } catch (error) {
              console.error('Error fetching notes:', error);
            }
          }
        } catch (error) {
          console.error('Error fetching classes:', error);
        }
      }

      // Sort by timestamp and take most recent 10 (to have more for expand)
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setRecentActivity(activities.slice(0, 10));
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  // Generate dynamic filters based on topics
  const subjectCounts = topics.reduce((acc, topic) => {
    const subject = topic.subject.toLowerCase();
    acc[subject] = (acc[subject] || 0) + topic.totalNotes;
    return acc;
  }, {} as Record<string, number>);

  const totalNotes = topics.reduce((sum, topic) => sum + topic.totalNotes, 0);
  
  const filters = [
    { id: 'all', label: 'All Topics', icon: Filter, count: totalNotes },
    { id: 'recent', label: 'Recent', icon: Calendar, count: Math.floor(totalNotes * 0.3) },
    ...Object.entries(subjectCounts).map(([subject, count]) => ({
      id: subject,
      label: subject === 'computer science' ? 'Computer Science' : subject.charAt(0).toUpperCase() + subject.slice(1),
      icon: subject === 'biology' ? BookOpen : 
            subject === 'mathematics' ? Calculator :
            subject === 'history' ? History :
            subject === 'computer science' ? BookOpen : BookOpen,
      count
    }))
  ];

  const tabs = [
    { id: 'topics', label: 'Topics', icon: BookOpen },
    { id: 'summaries', label: 'Summaries', icon: FileText },
    { id: 'activity', label: 'Activity', icon: Bell }
  ];

  return (
    <aside className="w-64 bg-card border-r border-border p-4 h-full">
      {/* Upload Button */}
      <div className="mb-6">
        {uploadComponent}
      </div>

      {/* Separator */}
      <div className="border-b border-border mb-6"></div>

      {/* Filters Section */}
      {activeTab === 'topics' && (
        <div className="space-y-2 mb-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">FILTERS</h3>
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
      )}

      {/* Separator */}
      <div className="border-b border-border mb-6"></div>

      {/* Recent Activity */}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-muted-foreground">RECENT ACTIVITY</h3>
          {recentActivity.length > 3 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAllActivity(!showAllActivity)}
              className="text-xs h-6 px-2"
            >
              {showAllActivity ? 'Show Less' : 'Show More'}
            </Button>
          )}
        </div>
        <div className="space-y-2 text-sm text-muted-foreground">
          {recentActivity.length > 0 ? (
            (showAllActivity ? recentActivity : recentActivity.slice(0, 3)).map((activity) => (
              <div key={activity.id} className="p-2 rounded-md bg-background">
                <p className="font-medium">{activity.title}</p>
                <p className="text-xs">{activity.description}</p>
                <p className="text-xs text-muted-foreground mt-1">{formatTimeAgo(activity.timestamp)}</p>
              </div>
            ))
          ) : (
            <div className="p-2 rounded-md bg-background">
              <p className="font-medium">No recent activity</p>
              <p className="text-xs">Upload a note to get started</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}