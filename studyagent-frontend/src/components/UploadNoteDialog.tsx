import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { Upload, X, Plus, FileText } from "lucide-react";

interface Topic {
  id: string;
  name: string;
  subject: string;
  color: string;
}

interface UploadNoteDialogProps {
  topics: Topic[];
  onUpload: (noteData: {
    title: string;
    content: string;
    topicId: string;
    newTopicName?: string;
    newTopicSubject?: string;
    tags: string[];
  }) => void;
  trigger: React.ReactNode;
}

export function UploadNoteDialog({ topics, onUpload, trigger }: UploadNoteDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');
  const [createNewTopic, setCreateNewTopic] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');
  const [newTopicSubject, setNewTopicSubject] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const subjects = ['Biology', 'Chemistry', 'Physics', 'Mathematics', 'History', 'English', 'Psychology', 'Computer Science'];

  const handleSubmit = () => {
    if (!title.trim() || !content.trim()) return;
    
    if (createNewTopic && (!newTopicName.trim() || !newTopicSubject.trim())) return;
    if (!createNewTopic && !selectedTopicId) return;

    onUpload({
      title: title.trim(),
      content: content.trim(),
      topicId: createNewTopic ? 'new' : selectedTopicId,
      newTopicName: createNewTopic ? newTopicName.trim() : undefined,
      newTopicSubject: createNewTopic ? newTopicSubject.trim() : undefined,
      tags
    });

    // Reset form
    setTitle('');
    setContent('');
    setSelectedTopicId('');
    setCreateNewTopic(false);
    setNewTopicName('');
    setNewTopicSubject('');
    setTags([]);
    setCurrentTag('');
    setOpen(false);
  };

  const handleAddTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim())) {
      setTags([...tags, currentTag.trim()]);
      setCurrentTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const file = files[0];
      if (file.type === 'text/plain') {
        const reader = new FileReader();
        reader.onload = (e) => {
          const text = e.target?.result as string;
          setContent(text);
          if (!title) {
            setTitle(file.name.replace('.txt', ''));
          }
        };
        reader.readAsText(file);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Upload className="h-5 w-5 mr-2" />
            Upload Note
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* File Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-border hover:border-primary/50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">
              Drag and drop your text file here, or paste your notes below
            </p>
            <p className="text-sm text-muted-foreground">
              Supports .txt files and plain text
            </p>
          </div>

          {/* Note Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Note Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Cell Biology Lecture 3"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Note Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Note Content *</Label>
            <Textarea
              id="content"
              placeholder="Paste or type your lecture notes here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[200px] resize-none"
            />
          </div>

          {/* Topic Selection */}
          <div className="space-y-4">
            <Label>Assign to Topic *</Label>
            
            <div className="flex items-center space-x-2">
              <Button
                type="button"
                variant={!createNewTopic ? "default" : "outline"}
                size="sm"
                onClick={() => setCreateNewTopic(false)}
              >
                Existing Topic
              </Button>
              <Button
                type="button"
                variant={createNewTopic ? "default" : "outline"}
                size="sm"
                onClick={() => setCreateNewTopic(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                New Topic
              </Button>
            </div>

            {!createNewTopic ? (
              <Select value={selectedTopicId} onValueChange={setSelectedTopicId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a topic" />
                </SelectTrigger>
                <SelectContent>
                  {topics.map((topic) => (
                    <SelectItem key={topic.id} value={topic.id}>
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: topic.color }}
                        />
                        <span>{topic.name}</span>
                        <Badge variant="outline" className="ml-2">
                          {topic.subject}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="space-y-3">
                <Input
                  placeholder="Topic name (e.g., Cell Biology)"
                  value={newTopicName}
                  onChange={(e) => setNewTopicName(e.target.value)}
                />
                <Select value={newTopicSubject} onValueChange={setNewTopicSubject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject} value={subject}>
                        {subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags (Optional)</Label>
            <div className="flex space-x-2">
              <Input
                placeholder="Add a tag"
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <Button type="button" variant="outline" size="sm" onClick={handleAddTag}>
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => handleRemoveTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!title.trim() || !content.trim() || 
                (!createNewTopic && !selectedTopicId) || 
                (createNewTopic && (!newTopicName.trim() || !newTopicSubject.trim()))
              }
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              Upload Note
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}