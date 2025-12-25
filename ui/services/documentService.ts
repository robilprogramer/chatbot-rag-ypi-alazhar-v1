// src/services/documentService.ts

import axios from "axios";
import {
  Document,
  DocumentUploadResponse,
  DocumentProcessResponse,
  DocumentListResponse,
  RawTextResponse,
  DocumentRawTextUpdateRequest,
} from "@/types/document";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

class DocumentService {
  private baseUrl = `${API_BASE_URL}/api/documents`;

  /**
   * Upload PDF document
   */
  async uploadDocument(file: File): Promise<DocumentUploadResponse> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await axios.post<DocumentUploadResponse>(
      `${this.baseUrl}/upload`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return response.data;
  }

  /**
   * Process document (extract content)
   */
  async processDocument(documentId: number): Promise<DocumentProcessResponse> {
    const response = await axios.post<DocumentProcessResponse>(
      `${this.baseUrl}/${documentId}/process`
    );

    return response.data;
  }

  /**
   * Get all documents with pagination
   */
  async getAllDocuments(
    page: number = 1,
    pageSize: number = 10,
    status?: string
  ): Promise<DocumentListResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
    });

    if (status) {
      params.append("status", status);
    }

    const response = await axios.get<DocumentListResponse>(
      `${this.baseUrl}?${params}`
    );

    return response.data;
  }

  /**
   * Get document by ID
   */
  async getDocument(documentId: number): Promise<Document> {
    const response = await axios.get<Document>(
      `${this.baseUrl}/${documentId}`
    );

    return response.data;
  }

  /**
   * Get raw text from document
   */
  async getRawText(documentId: number): Promise<RawTextResponse> {
    const response = await axios.get<RawTextResponse>(
      `${this.baseUrl}/${documentId}/raw-text`
    );

    return response.data;
  }

  /**
   * Delete document
   */
  async deleteDocument(documentId: number): Promise<void> {
    await axios.delete(`${this.baseUrl}/${documentId}`);
  }

  /**
   * Chunk document
   */
  async chunkDocumentOld(
    documentId: number,
    method: string = "semantic",
    chunkSize: number = 1500,
    overlap: number = 200
  ): Promise<any> {
    const response = await axios.post(
      `${this.baseUrl}/${documentId}/process`,
      null,
      {
        params: {
          method,
          chunk_size: chunkSize,
          overlap,
        },
      }
    );

    return response.data;
  }
  async chunkDocument(filename: string, content: string): Promise<any> {
    console.log("chunkDocument called with:", { filename, content });
    const response = await axios.post(
      `${API_BASE_URL}/api/chunks/process`,
      {
        documents: [
          {
            filename: filename,
            content: content
          }
        ]
      }
    );

    return response.data;
  }


  /**
   * Get chunks for document
   */
  async getDocumentChunks(documentId: number): Promise<any> {
    const response = await axios.get(
      `${this.baseUrl}/${documentId}/chunks`
    );

    return response.data;
  }

  /**
   * Format file size
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  }

  /**
   * Get status badge color
   */
  getStatusColor(status: string): string {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }

  // UPDATE - Update raw text
  async updateRawText(
    documentId: number,
    payload: DocumentRawTextUpdateRequest
  ): Promise<Document> {
    const response = await fetch(`${this.baseUrl}/${documentId}/raw-text`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to update raw text");
    }

    return response.json();
  }
}

export const documentService = new DocumentService();