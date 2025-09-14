import React, { useState, useEffect } from 'react';
import { Search, FileText, Calendar, MapPin, Brain, Type, Zap } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { apiService, type SearchResult, type SearchType } from '../services/api';

interface SearchPageProps {
  onViewNote: (noteId: string, className: string) => void;
}

export function SearchPage({ onViewNote }: SearchPageProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchType, setSearchType] = useState<SearchType>('hybrid');

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    setError('');
    
    try {
      const searchResults = await apiService.searchNotes(query, undefined, searchType);
      setResults(searchResults);
    } catch (err) {
      setError('Failed to search notes');
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Search Notes</h1>
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search across all your notes, summaries, and content..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-10"
              />
            </div>
            <Select value={searchType} onValueChange={(value: SearchType) => setSearchType(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hybrid">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    <span>Hybrid Search</span>
                  </div>
                </SelectItem>
                <SelectItem value="semantic">
                  <div className="flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    <span>Semantic Search</span>
                  </div>
                </SelectItem>
                <SelectItem value="keyword">
                  <div className="flex items-center gap-2">
                    <Type className="h-4 w-4" />
                    <span>Keyword Search</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSearch} disabled={isLoading || !query.trim()}>
              {isLoading ? 'Searching...' : 'Search'}
            </Button>
          </div>
          <div className="text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Zap className="h-3 w-3" />
                <span>Hybrid: Combines keyword + AI semantic matching</span>
              </div>
              <div className="flex items-center gap-1">
                <Brain className="h-3 w-3" />
                <span>Semantic: AI understands meaning and context</span>
              </div>
              <div className="flex items-center gap-1">
                <Type className="h-3 w-3" />
                <span>Keyword: Exact text matching</span>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {results.length > 0 && (
          <div className="mb-4">
            <p className="text-muted-foreground">
              Found {results.length} result{results.length !== 1 ? 's' : ''} for "{query}"
            </p>
          </div>
        )}

        <div className="space-y-6">
          {results.map((result) => (
            <div
              key={result.id}
              className="bg-card border rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold">
                      {highlightText(result.title, query)}
                    </h3>
                    {result.search_type && (
                      <Badge variant={result.search_type === 'semantic' ? 'default' : result.search_type === 'hybrid' ? 'secondary' : 'outline'}>
                        <div className="flex items-center gap-1">
                          {result.search_type === 'semantic' && <Brain className="h-3 w-3" />}
                          {result.search_type === 'hybrid' && <Zap className="h-3 w-3" />}
                          {result.search_type === 'keyword' && <Type className="h-3 w-3" />}
                          <span className="capitalize">{result.search_type}</span>
                        </div>
                      </Badge>
                    )}
                    {result.score && (
                      <Badge variant="outline" className="text-xs">
                        {(result.score * 100).toFixed(1)}% match
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span>{result.topic_name} → {result.class_name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(result.created_at)}</span>
                    </div>
                  </div>
                </div>
                <Button
                  onClick={() => onViewNote(result.id, result.class_name)}
                  variant="outline"
                  size="sm"
                >
                  <FileText className="h-4 w-4 mr-1" />
                  View Note
                </Button>
              </div>

              {result.snippets && result.snippets.length > 0 && (
                <div className="space-y-3">
                  {result.snippets.map((snippet, index) => (
                    <div key={index} className="border-l-2 border-primary/20 pl-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={snippet.type === 'summary' ? 'default' : 'secondary'}>
                          {snippet.type === 'summary' ? 'Summary' : 'Content'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {highlightText(snippet.text, query)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {query && results.length === 0 && !isLoading && !error && (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No results found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search terms or check for typos.
            </p>
          </div>
        )}

        {!query && results.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Start searching</h3>
            <p className="text-muted-foreground">
              Enter a search term to find content across all your notes and summaries.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
