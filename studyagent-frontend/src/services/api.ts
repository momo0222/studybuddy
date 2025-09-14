// API service for StudyAgent backend
const API_BASE_URL = 'http://localhost:5002/api';

export interface Topic {
  id: string;
  name: string;
  created_at: string;
}

export interface Class {
  id: string;
  name: string;
  topic_id: string;
  topic_name?: string;
  created_at: string;
}

export interface Note {
  id: string;
  class_id: string;
  title: string;
  raw_path: string;
  cleaned_text: string;
  summary: string | string[]; // Can be string or array of strings
  created_at: string;
  notes_path: string;
}

export interface UploadResponse {
  id: string;
  title: string;
  notes: string;
  summary: any;
}

// Active Recall interfaces
export interface Concept {
  id: string;
  name: string;
  content: string;
  mastery_level: 'UNKNOWN' | 'LEARNING' | 'FAMILIAR' | 'PROFICIENT' | 'MASTERED';
  difficulty_level: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  last_reviewed: string | null;
  next_review: string;
  review_count: number;
  correct_streak: number;
}

export interface StudySession {
  concept: {
    id: string;
    name: string;
    mastery_level: string;
  };
  question: {
    text: string;
    difficulty: string;
    type: string;
  };
  session_info: {
    concepts_due: number;
    current_position: number;
  };
  concepts_available: boolean;
}

export interface AnswerSubmission {
  concept_id: string;
  question: string;
  answer: string;
}

export interface AnswerEvaluation {
  correct: boolean;
  score: number;
  feedback: string;
  session_id: string;
  concept_progress: {
    mastery_level: string;
    correct_streak: number;
    next_review: string;
  };
}

export interface ClassProgress {
  total_concepts: number;
  concepts_due: number;
  average_mastery: number;
  mastery_distribution: {
    UNKNOWN: number;
    LEARNING: number;
    FAMILIAR: number;
    PROFICIENT: number;
    MASTERED: number;
  };
}

export interface SearchResult {
  id: string;
  title: string;
  summary: string;
  cleaned_text: string;
  created_at: string;
  class_id: string;
  raw_path: string;
  notes_path?: string;
  class_name: string;
  topic_name: string;
  topic_id: string;
  snippets?: Array<{
    type: 'summary' | 'content';
    text: string;
  }>;
  score?: number;
  search_type?: 'keyword' | 'semantic' | 'hybrid';
}

export type SearchType = 'keyword' | 'semantic' | 'hybrid';

class ApiService {
  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (!response.ok) {
      throw new Error('Health check failed');
    }
    return response.json();
  }

  // Topics
  async getTopics(): Promise<Topic[]> {
    const response = await fetch(`${API_BASE_URL}/topics`);
    if (!response.ok) {
      throw new Error('Failed to fetch topics');
    }
    return response.json();
  }

  async createTopic(name: string): Promise<Topic> {
    console.log('API: Creating topic with name:', name);
    const response = await fetch(`${API_BASE_URL}/topics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name }),
    });
    console.log('API: Response status:', response.status);
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API: Error response:', errorText);
      throw new Error(`Failed to create topic: ${response.status} ${errorText}`);
    }
    const result = await response.json();
    console.log('API: Topic created successfully:', result);
    return result;
  }

  // Classes
  async getClasses(topicId: string): Promise<Class[]> {
    const response = await fetch(`${API_BASE_URL}/classes?topic_id=${topicId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch classes');
    }
    return response.json();
  }

  async createClass(name: string, topicId: string): Promise<Class> {
    const response = await fetch(`${API_BASE_URL}/classes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, topic_id: topicId }),
    });
    if (!response.ok) {
      throw new Error('Failed to create class');
    }
    return response.json();
  }

  // Active Recall API methods
  async generateConcepts(classId: string): Promise<{ success: boolean; concept_ids: string[]; message: string }> {
    const response = await fetch(`${API_BASE_URL}/active-recall/generate-concepts/${classId}`, {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error('Failed to generate concepts');
    }
    return response.json();
  }

  async getConcepts(classId: string): Promise<Concept[]> {
    const response = await fetch(`${API_BASE_URL}/active-recall/concepts/${classId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch concepts');
    }
    return response.json();
  }

  async startStudySession(classId: string): Promise<StudySession> {
    const response = await fetch(`${API_BASE_URL}/active-recall/study-session/${classId}`);
    if (!response.ok) {
      throw new Error('Failed to start study session');
    }
    return response.json();
  }

  async submitAnswer(submission: AnswerSubmission): Promise<AnswerEvaluation> {
    const response = await fetch(`${API_BASE_URL}/active-recall/submit-answer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(submission),
    });
    if (!response.ok) {
      throw new Error('Failed to submit answer');
    }
    return response.json();
  }

  async getClassProgress(classId: string): Promise<ClassProgress> {
    const response = await fetch(`${API_BASE_URL}/active-recall/progress/${classId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch class progress');
    }
    return response.json();
  }

  async getConceptSessions(conceptId: string): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/active-recall/sessions/${conceptId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch concept sessions');
    }
    return response.json();
  }

  // Notes
  async getNotes(classId: string): Promise<Note[]> {
    const response = await fetch(`${API_BASE_URL}/notes/${classId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch notes');
    }
    return response.json();
  }

  async uploadNote(classId: string, file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/notes/${classId}`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to upload note');
    }

    return response.json();
  }

  // Search
  async searchNotes(query: string, topicId?: string, searchType: SearchType = 'hybrid'): Promise<SearchResult[]> {
    const params = new URLSearchParams({ q: query, type: searchType });
    if (topicId) {
      params.append('topic_id', topicId);
    }

    const response = await fetch(`${API_BASE_URL}/search?${params}`);
    if (!response.ok) {
      throw new Error('Search failed');
    }

    return response.json();
  }
}

export const apiService = new ApiService();
