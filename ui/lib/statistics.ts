// lib/api/statistics.ts
/**
 * Statistics API Client
 * Provides typed API calls for dashboard statistics
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// ==============================
// Types
// ==============================

export interface DocumentStatistics {
  total: number;
  by_status: Record<string, number>;
  by_jenjang: Record<string, number>;
  by_kategori: Record<string, number>;
}

export interface ChunkStatistics {
  total: number;
  embedded: number;
  pending: number;
}

export interface VectorstoreStatistics {
  total: number;
  by_jenjang: Record<string, number>;
  by_kategori: Record<string, number>;
}

export interface KnowledgeEntriesStatistics {
  total: number;
  active: number;
  by_jenjang: Record<string, number>;
  by_kategori: Record<string, number>;
}

export interface StagingStatistics {
  pending_review: number;
  approved: number;
}

export interface Statistics {
  documents: DocumentStatistics;
  knowledge_entries: KnowledgeEntriesStatistics;
  chunks: ChunkStatistics;
  staging: StagingStatistics;
  vectorstore: VectorstoreStatistics;
}

export interface StatisticsResponse {
  success: boolean;
  message: string;
  statistics: Statistics;
}

export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  database?: string;
  vectorstore?: string;
  error?: string;
}

// ==============================
// API Client
// ==============================

class StatisticsAPI {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Get all statistics
   */
  async getAll(): Promise<StatisticsResponse> {
    const response = await fetch(`${this.baseUrl}/api/statistics/`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch statistics: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Get only document statistics
   */
  async getDocuments(): Promise<{ success: boolean; statistics: DocumentStatistics }> {
    const response = await fetch(`${this.baseUrl}/api/statistics/documents`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch document statistics: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Get only chunk statistics
   */
  async getChunks(): Promise<{ success: boolean; statistics: ChunkStatistics }> {
    const response = await fetch(`${this.baseUrl}/api/statistics/chunks`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch chunk statistics: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Get only vectorstore statistics
   */
  async getVectorstore(): Promise<{ success: boolean; statistics: VectorstoreStatistics }> {
    const response = await fetch(`${this.baseUrl}/api/statistics/vectorstore`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch vectorstore statistics: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Get only knowledge entries statistics
   */
  async getKnowledgeEntries(): Promise<{ success: boolean; statistics: KnowledgeEntriesStatistics }> {
    const response = await fetch(`${this.baseUrl}/api/statistics/knowledge-entries`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch knowledge entries statistics: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Health check
   */
  async health(): Promise<HealthCheckResponse> {
    const response = await fetch(`${this.baseUrl}/api/statistics/health`);
    
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.statusText}`);
    }
    
    return response.json();
  }
}

// Export singleton instance
export const statisticsApi = new StatisticsAPI();

// Export class for custom instances
export default StatisticsAPI;