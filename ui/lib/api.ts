// lib/api.ts
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/kb`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Types
export interface Document {
  id: string;
  filename: string;
  original_filename: string;
  tahun_ajaran?: string;
  tahun?: number;
  jenjang?: string;
  kategori?: string;
  cabang?: string;
  tags?: string[];
  status: string;
  uploaded_at?: string;
  total_contents: number;
  approved_contents: number;
  title?: string;
  description?: string;
}

export interface ParsedContent {
  id: string;
  document_id: string;
  content_type: string;
  original_content: string;
  edited_content?: string;
  page_number?: number;
  section_title?: string;
  status: string;
  needs_review: boolean;
  is_important: boolean;
  extracted_entities?: Record<string, any>;
  review_notes?: string;
  created_at?: string;
}

export interface KnowledgeEntry {
  id: string;
  content: string;
  content_type: string;
  tahun_ajaran?: string;
  tahun?: number;
  jenjang?: string;
  kategori?: string;
  cabang?: string;
  title?: string;
  keywords?: string[];
  extracted_data?: Record<string, any>;
  is_active: boolean;
  version: number;
  created_at?: string;
}

export interface Statistics {
  documents: {
    total: number;
    by_status: Record<string, number>;
    by_jenjang: Record<string, number>;
    by_kategori: Record<string, number>;
  };
  knowledge_entries: {
    total: number;
    active: number;
    by_jenjang: Record<string, number>;
    by_kategori: Record<string, number>;
  };
  chunks: {
    total: number;
    embedded: number;
  };
  staging: {
    pending_review: number;
    approved: number;
  };
}

// Document APIs
export const documentApi = {
  upload: async (file: File, metadata: Record<string, any>) => {
    const formData = new FormData();
    formData.append('file', file);
    Object.entries(metadata).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        formData.append(key, String(value));
      }
    });
    
    const response = await api.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  
  list: async (params?: {
    status?: string;
    jenjang?: string;
    kategori?: string;
    tahun?: number;
    page?: number;
    per_page?: number;
  }) => {
    const response = await api.get('/documents', { params });
    return response.data;
  },
  
  get: async (id: string) => {
    const response = await api.get(`/documents/${id}`);
    return response.data;
  },
  
  parse: async (id: string, parseMethod: string = 'unstructured') => {
    const response = await api.post(`/documents/${id}/parse`, null, {
      params: { parse_method: parseMethod },
    });
    return response.data;
  },
  
  delete: async (id: string) => {
    const response = await api.delete(`/documents/${id}`);
    return response.data;
  },
};

// Staging APIs
export const stagingApi = {
  list: async (params?: {
    document_id?: string;
    needs_review?: boolean;
    status?: string;
    page?: number;
    per_page?: number;
  }) => {
    const response = await api.get('/staging', { params });
    return response.data;
  },
  
  get: async (id: string) => {
    const response = await api.get(`/staging/${id}`);
    return response.data;
  },
  
  edit: async (id: string, data: {
    edited_content: string;
    section_title?: string;
    review_notes?: string;
  }) => {
    const response = await api.put(`/staging/${id}`, data);
    return response.data;
  },
  
  approve: async (id: string) => {
    const response = await api.post(`/staging/${id}/approve`);
    return response.data;
  },
  
  reject: async (id: string, reason?: string) => {
    const response = await api.post(`/staging/${id}/reject`, null, {
      params: { reason },
    });
    return response.data;
  },
  
  approveAll: async (documentId: string) => {
    const response = await api.post(`/staging/approve-all/${documentId}`);
    return response.data;
  },
};

// Processing APIs
export const processingApi = {
  process: async (documentId?: string, chunkSize: number = 1000, chunkOverlap: number = 200) => {
    const response = await api.post('/process', null, {
      params: { document_id: documentId, chunk_size: chunkSize, chunk_overlap: chunkOverlap },
    });
    return response.data;
  },
  
  embed: async (knowledgeEntryId?: string, batchSize: number = 100) => {
    const response = await api.post('/embed', null, {
      params: { knowledge_entry_id: knowledgeEntryId, batch_size: batchSize },
    });
    return response.data;
  },
};

// Knowledge APIs
export const knowledgeApi = {
  list: async (params?: {
    query?: string;
    tahun?: number;
    jenjang?: string;
    kategori?: string;
    page?: number;
    per_page?: number;
  }) => {
    const response = await api.get('/knowledge', { params });
    return response.data;
  },
  
  get: async (id: string) => {
    const response = await api.get(`/knowledge/${id}`);
    return response.data;
  },
  
  addManual: async (data: {
    content: string;
    title?: string;
    tahun?: number;
    tahun_ajaran?: string;
    jenjang?: string;
    kategori?: string;
    cabang?: string;
    keywords?: string[];
    extracted_data?: Record<string, any>;
  }) => {
    const response = await api.post('/knowledge/manual', data);
    return response.data;
  },
  
  update: async (id: string, data: {
    content?: string;
    title?: string;
    keywords?: string[];
  }) => {
    const response = await api.put(`/knowledge/${id}`, data);
    return response.data;
  },
  
  delete: async (id: string, hardDelete: boolean = false) => {
    const response = await api.delete(`/knowledge/${id}`, {
      params: { hard_delete: hardDelete },
    });
    return response.data;
  },
};

// Stats API
export const statsApi = {
  get: async (): Promise<{ success: boolean; statistics: Statistics }> => {
    const response = await api.get('/stats');
    return response.data;
  },
};

// Full Pipeline API
export const pipelineApi = {
  runFull: async (file: File, metadata: Record<string, any>, skipReview: boolean = false) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('skip_review', String(skipReview));
    Object.entries(metadata).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        formData.append(key, String(value));
      }
    });
    
    const response = await api.post('/pipeline/full', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};

export default api;
