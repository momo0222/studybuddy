import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Upload, FileText, Image, FileIcon, X, CheckCircle, AlertCircle, Plus } from 'lucide-react';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { apiService } from '../services/api';
import type { Topic, Class } from '../services/api';

interface UploadNoteDialogProps {
  topics: Topic[];
  onUpload: (noteData: any) => void;
  trigger: React.ReactNode;
  preselectedTopicId?: string;
  preselectedClassId?: string;
  disableTopicSelection?: boolean;
}

export function UploadNoteDialog({ topics, onUpload, trigger, preselectedTopicId, preselectedClassId, disableTopicSelection }: UploadNoteDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<string>(preselectedTopicId || '');
  const [selectedClassId, setSelectedClassId] = useState<string>(preselectedClassId || '');
  const [classes, setClasses] = useState<Class[]>([]);
  const [localTopics, setLocalTopics] = useState<Topic[]>(topics);
  const [newClassName, setNewClassName] = useState<string>('');
  const [newTopicName, setNewTopicName] = useState<string>('');
  const [showNewClassInput, setShowNewClassInput] = useState(false);
  const [showNewTopicInput, setShowNewTopicInput] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update local topics when props change
  useEffect(() => {
    setLocalTopics(topics);
  }, [topics]);

  // Load classes when topic changes
  useEffect(() => {
    if (selectedTopicId) {
      apiService.getClasses(selectedTopicId)
        .then(setClasses)
        .catch(console.error);
    } else {
      setClasses([]);
    }
    setSelectedClassId(preselectedClassId || '');
  }, [selectedTopicId, preselectedClassId]);

  // Reset form when dialog opens (but preserve file and topic if just created)
  useEffect(() => {
    if (open) {
      if (!selectedTopicId || selectedTopicId !== preselectedTopicId) {
        setSelectedFile(null);
        setSelectedTopicId(preselectedTopicId || '');
        setSelectedClassId(preselectedClassId || '');
      }
      setNewClassName('');
      setNewTopicName('');
      setShowNewClassInput(false);
      setShowNewTopicInput(false);
      setIsUploading(false);
      setUploadStatus('idle');
      setErrorMessage('');
      setSuccessMessage('');
    }
  }, [open, preselectedTopicId, preselectedClassId]);

  const handleCreateTopic = async () => {
    if (!newTopicName.trim()) return;
    
    try {
      console.log('Creating topic:', newTopicName.trim());
      const newTopic = await apiService.createTopic(newTopicName.trim());
      console.log('Topic created:', newTopic);
      
      // Add to local topics immediately and select it
      setLocalTopics(prev => [...prev, newTopic]);
      setSelectedTopicId(newTopic.id);
      setNewTopicName('');
      setShowNewTopicInput(false);
      
      // Don't reset the form - keep the file
      // Trigger refresh of topics list in parent
      onUpload({ type: 'topic_created', topic: newTopic });
    } catch (error) {
      console.error('Topic creation error:', error);
      setErrorMessage('Failed to create topic: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleCreateClass = async () => {
    if (!newClassName.trim() || !selectedTopicId) return;
    
    try {
      console.log('Creating class:', newClassName.trim(), 'for topic:', selectedTopicId);
      const newClass = await apiService.createClass(newClassName.trim(), selectedTopicId);
      console.log('Class created:', newClass);
      setClasses(prev => [...prev, newClass]);
      setSelectedClassId(newClass.id);
      setNewClassName('');
      setShowNewClassInput(false);
    } catch (error) {
      console.error('Class creation error:', error);
      setErrorMessage('Failed to create class: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedClassId) {
      setErrorMessage('Please select a file, topic, and class');
      return;
    }

    try {
      setIsUploading(true);
      setUploadStatus('idle');
      setErrorMessage('');
      
      const result = await apiService.uploadNote(selectedClassId, selectedFile);
      
      setUploadStatus('success');
      setSuccessMessage(`Successfully uploaded "${selectedFile.name}"`);
      onUpload(result);
      
      // Reset form after successful upload
      setTimeout(() => {
        setOpen(false);
      }, 1500);
      
    } catch (error) {
      setUploadStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (file: File) => {
    const allowedTypes = [
      'text/plain',
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      setErrorMessage('Unsupported file type. Please upload .txt, .pdf, .jpg, .jpeg, or .png files.');
      return;
    }
    
    setSelectedFile(file);
    setErrorMessage('');
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
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
      handleFileSelect(files[0]);
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
          {/* Error Display */}
          {errorMessage && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
          
          {successMessage && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          )}

          {/* File Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
              dragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-border hover:border-primary/50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">
              {selectedFile ? selectedFile.name : 'Click to select or drag and drop your file here'}
            </p>
            <p className="text-sm text-muted-foreground">
              Supports .txt, .pdf, .jpg, .jpeg, and .png files
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.pdf,.jpg,.jpeg,.png"
              onChange={handleFileInputChange}
              className="hidden"
            />
          </div>

          {/* Topic Selection */}
          {!disableTopicSelection ? (
            <div className="space-y-2">
              <Label htmlFor="topic">Topic</Label>
              <div className="flex items-center space-x-2">
                <Select
                  value={selectedTopicId}
                  onValueChange={setSelectedTopicId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a topic" />
                  </SelectTrigger>
                  <SelectContent>
                    {localTopics.map((topic) => (
                      <SelectItem key={topic.id} value={topic.id}>
                        {topic.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNewTopicInput(true)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {showNewTopicInput && (
                <div className="flex items-center space-x-2 mt-2">
                  <Input
                    placeholder="Enter topic name"
                    value={newTopicName}
                    onChange={(e) => setNewTopicName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleCreateTopic();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleCreateTopic}
                  >
                    Add
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowNewTopicInput(false);
                      setNewTopicName('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Topic</Label>
              <div className="p-2 bg-muted rounded-md">
                {topics.find(t => t.id === preselectedTopicId)?.name || 'Selected Topic'}
              </div>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="class">Class</Label>
            <div className="flex items-center space-x-2">
              <Select
                value={selectedClassId}
                onValueChange={setSelectedClassId}
                disabled={!selectedTopicId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowNewClassInput(true)}
                disabled={!selectedTopicId}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            {showNewClassInput && (
              <div className="flex items-center space-x-2 mt-2">
                <Input
                  placeholder="Enter class name"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleCreateClass();
                    }
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleCreateClass}
                >
                  Add
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowNewClassInput(false);
                    setNewClassName('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              onClick={handleUpload} 
              disabled={isUploading || !selectedFile || !selectedClassId}
              className="w-full"
            >
              {isUploading ? (
                <>
                  <Upload className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Note
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}