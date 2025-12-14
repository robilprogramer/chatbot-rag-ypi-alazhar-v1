export interface VectorStoreMetadata {
  chunk_index: number;
  kategori: string;
  total_chunks: number;
  chunk_id: string;
  jenjang: string;
  chunk_strategy: string;
  tahun: string;
  cabang: string;
  source: string;
}

export interface VectorStoreDocument {
  content: string;
  metadata: VectorStoreMetadata;
}

export interface VectorStoreResponse {
  status_code: number;
  message: string;
  data: VectorStoreDocument[];
}