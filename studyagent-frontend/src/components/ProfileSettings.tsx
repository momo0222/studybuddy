import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { Separator } from "./ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { ArrowLeft, User, Bell, Link, Upload, Save } from "lucide-react";

interface ProfileSettingsProps {
  onBack: () => void;
}

export function ProfileSettings({ onBack }: ProfileSettingsProps) {
  const [profile, setProfile] = useState({
    name: 'John Doe',
    email: 'john.doe@university.edu',
    university: 'State University',
    major: 'Biology'
  });

  const [preferences, setPreferences] = useState({
    autoSummarize: true,
    dailyQuiz: false,
    emailNotifications: true,
    pushNotifications: false
  });

  const [integrations, setIntegrations] = useState({
    googleDrive: false,
    dropbox: false,
    notion: false
  });

  const handleProfileUpdate = () => {
    alert('Profile updated successfully!');
  };

  const handleIntegrationToggle = (service: keyof typeof integrations) => {
    setIntegrations(prev => ({
      ...prev,
      [service]: !prev[service]
    }));
    
    if (!integrations[service]) {
      alert(`${service} integration would be set up here`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-xl font-semibold text-foreground">Profile & Settings</h1>
        </div>
      </div>

      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar */}
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src="" alt="Profile" />
                <AvatarFallback className="bg-accent text-accent-foreground text-lg">
                  {profile.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Change Photo
              </Button>
            </div>

            {/* Profile Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={profile.name}
                  onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="university">University</Label>
                <Input
                  id="university"
                  value={profile.university}
                  onChange={(e) => setProfile(prev => ({ ...prev, university: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="major">Major</Label>
                <Input
                  id="major"
                  value={profile.major}
                  onChange={(e) => setProfile(prev => ({ ...prev, major: e.target.value }))}
                />
              </div>
            </div>

            <Button onClick={handleProfileUpdate} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Save className="h-4 w-4 mr-2" />
              Save Profile
            </Button>
          </CardContent>
        </Card>

        {/* Study Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="h-5 w-5 mr-2" />
              Study Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Auto-summarize new notes</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically generate AI summaries when you upload new notes
                  </p>
                </div>
                <Switch
                  checked={preferences.autoSummarize}
                  onCheckedChange={(checked) => 
                    setPreferences(prev => ({ ...prev, autoSummarize: checked }))
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Daily quiz reminder</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified to take a daily quiz at 8 PM
                  </p>
                </div>
                <Switch
                  checked={preferences.dailyQuiz}
                  onCheckedChange={(checked) => 
                    setPreferences(prev => ({ ...prev, dailyQuiz: checked }))
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Email notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive study progress and achievement notifications via email
                  </p>
                </div>
                <Switch
                  checked={preferences.emailNotifications}
                  onCheckedChange={(checked) => 
                    setPreferences(prev => ({ ...prev, emailNotifications: checked }))
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Push notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive browser notifications for study reminders
                  </p>
                </div>
                <Switch
                  checked={preferences.pushNotifications}
                  onCheckedChange={(checked) => 
                    setPreferences(prev => ({ ...prev, pushNotifications: checked }))
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Integrations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Link className="h-5 w-5 mr-2" />
              Integrations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              {/* Google Drive */}
              <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6.24 3.48L8.36 7.2H15.64L17.76 3.48L12 2.4L6.24 3.48ZM12 2.4L6.24 3.48L4.8 6.24L12 22.56L19.2 6.24L17.76 3.48L12 2.4ZM4.8 6.24L9.6 15.36H19.2L14.4 6.24H4.8Z"/>
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">Google Drive</h4>
                    <p className="text-sm text-muted-foreground">
                      Sync notes and documents from Google Drive
                    </p>
                  </div>
                </div>
                <Button
                  variant={integrations.googleDrive ? "secondary" : "outline"}
                  onClick={() => handleIntegrationToggle('googleDrive')}
                >
                  {integrations.googleDrive ? 'Connected' : 'Connect'}
                </Button>
              </div>

              {/* Dropbox */}
              <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M7.71 2.29L12 5.87L16.29 2.29L22 7L12 13.87L2 7L7.71 2.29ZM2 17L7.71 20.71L12 17.13L16.29 20.71L22 17L16.29 13.29L12 17.13L7.71 13.29L2 17Z"/>
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">Dropbox</h4>
                    <p className="text-sm text-muted-foreground">
                      Access and sync files from Dropbox
                    </p>
                  </div>
                </div>
                <Button
                  variant={integrations.dropbox ? "secondary" : "outline"}
                  onClick={() => handleIntegrationToggle('dropbox')}
                >
                  {integrations.dropbox ? 'Connected' : 'Connect'}
                </Button>
              </div>

              {/* Notion */}
              <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466l1.823 1.447zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.747c.093.42 0 .84-.42.887l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.139c-.093-.514.28-.887.747-.933l3.269-.186z"/>
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">Notion</h4>
                    <p className="text-sm text-muted-foreground">
                      Import pages and databases from Notion
                    </p>
                  </div>
                </div>
                <Button
                  variant={integrations.notion ? "secondary" : "outline"}
                  onClick={() => handleIntegrationToggle('notion')}
                >
                  {integrations.notion ? 'Connected' : 'Connect'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                Export All Data
              </Button>
              <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700">
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}