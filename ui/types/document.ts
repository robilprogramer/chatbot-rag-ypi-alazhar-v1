// src/types/document.ts

export enum DocumentStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
}

export enum ExtractionMethod {
  NATIVE = "NATIVE",
  OCR = "OCR",
  HYBRID = "HYBRID",
}

export interface Document {
  id: number;
  filename: string;
  original_filename: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  total_pages: number | null;
  is_scanned: boolean;
  extraction_method: ExtractionMethod | null;
  raw_text: string | null;
  text_length: number | null;
  tables_data: any[] | null;
  images_data: any[] | null;
  layout_info: any | null;
  ocr_confidence: number | null;
  extraction_duration: number | null;
  status: DocumentStatus;
  error_message: string | null;
  created_at: string;
  updated_at: string | null;
  processed_at: string | null;
  extra_metadata: any | null;
}

export interface DocumentUploadResponse {
  success: boolean;
  message: string;
  document_id: number;
  filename: string;
  status: string;
}

export interface DocumentProcessResponse {
  success: boolean;
  message: string;
  document_id: number;
  raw_text_preview: string | null;
  total_pages: number | null;
  text_length: number | null;
  tables_count: number | null;
  images_count: number | null;
}

export interface DocumentListResponse {
  total: number;
  documents: Document[];
  page: number;
  page_size: number;
  total_pages: number;
}

export interface RawTextResponse {
  document_id: number;
  filename: string;
  raw_text: string;
  text_length: number;
}