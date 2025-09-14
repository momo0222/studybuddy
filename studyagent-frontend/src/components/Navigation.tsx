import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Search, User, Settings, LogOut, Brain, Type, Zap, Sun, Moon } from "lucide-react";
import { Input } from "./ui/input";
import { apiService, type SearchResult, type SearchType } from "../services/api";

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onProfile: () => void;
  onLogout: () => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onSearchResults?: (results: SearchResult[]) => void;
}

export function Navigation({ 
  activeTab, 
  onTabChange, 
  onProfile, 
  onLogout,
  searchTerm,
  onSearchChange,
  onSearchResults 
}: NavigationProps) {
  const [searchType, setSearchType] = useState<SearchType>('hybrid');
  const [isSearching, setIsSearching] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const tabs = [
    { id: 'topics', label: 'Topics' },
    { id: 'summaries', label: 'Summaries' }
  ];
  useEffect(() => {
    // Check for saved theme preference or default to light mode
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }

  }, []);
  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    
    if (newTheme) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim() || !onSearchResults) return;

    setIsSearching(true);
    try {
      const results = await apiService.searchNotes(searchTerm, undefined, searchType);
      onSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <nav className="bg-card border-b border-border px-6 py-3">
      <div className="flex items-center justify-between">
         {/* Logo */}
         <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden">
            <img 
              src="/logo.png" 
              alt="Study Agent Logo" 
              className="w-full h-full object-contain"
              onError={(e) => {
                console.error('Logo failed to load, using fallback');
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
          <span className="text-xl font-semibold text-foreground">Study Buddy</span>
        </div>

        {/* Enhanced Search Bar */}
        <div className="flex-1 max-w-2xl mx-8">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search notes by keywords, main ideas, or topics..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-10 bg-background border-border"
              />
            </div>
            <Select value={searchType} onValueChange={(value: SearchType) => setSearchType(value)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hybrid">
                  <div className="flex items-center gap-2">
                    <Zap className="h-3 w-3" />
                    <span>Hybrid</span>
                  </div>
                </SelectItem>
                <SelectItem value="semantic">
                  <div className="flex items-center gap-2">
                    <Brain className="h-3 w-3" />
                    <span>Semantic</span>
                  </div>
                </SelectItem>
                <SelectItem value="keyword">
                  <div className="flex items-center gap-2">
                    <Type className="h-3 w-3" />
                    <span>Keyword</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSearch} disabled={isSearching || !searchTerm.trim()}>
              {isSearching ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </div>
        
        {/* User Actions */}
        <div className="flex items-center space-x-2">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="h-8 w-8 p-0 hover:bg-primary hover:text-primary-foreground"
          >
            {isDarkMode ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
          
          {/* User Avatar */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="" alt="User" />
                  <AvatarFallback className="bg-accent text-accent-foreground">JD</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuItem onClick={onProfile}>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onProfile}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}