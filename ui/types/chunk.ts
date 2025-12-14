export interface ChunkMetadata {
  [key: string]: any;
}

export interface Chunk {
  content: string;
  metadata: ChunkMetadata | null;
}

export interface ChunkResponse {
  id: number;  
  content: string;
  metadata: ChunkMetadata | null;
}

export interface ChunkUpdateRequest {
  content: string;
  metadata: ChunkMetadata;
}

export interface ChunkingRequestDocument {
  filename: string;
  content: string;
}

export interface ChunkingRequest {
  documents: ChunkingRequestDocument[];
}

export interface ChunkingResponse {
  total_chunks: number;
  chunks: ChunkResponse[];
}

export interface StandardResponse<T = any> {
  status_code: number;
  message: string;
  data: T | null;
}

export interface ChunkWithId extends Chunk {
  id: number;
  filename?: string;
  created_at?: string;
  updated_at?: string;
}

export interface EmbedResponse {
  total_chunks: number;
  message: string;
}