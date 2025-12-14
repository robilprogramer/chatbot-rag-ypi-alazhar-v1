import { VectorStoreResponse } from "@/types/vectorstore";
import { ChunkingRequest, ChunkingResponse, EmbedResponse } from "@/types/chunk";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export class VectorStoreService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${API_BASE_URL}/api/vectorstore/`;
  }

  // GET - Fetch all documents from vectorstore
  async getAllDocuments(): Promise<VectorStoreResponse> {
    const response = await fetch(this.baseUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to fetch vectorstore documents");
    }

    return response.json();
  }

  // Process documents to chunks
  async processToChunks(
    payload: ChunkingRequest
  ): Promise<EmbedResponse> {
    const response = await fetch(`${API_BASE_URL}/api/embed`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      // body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to process documents");
    }

    return response.json();
  }
}

export const vectorStoreService = new VectorStoreService();