import {
  ChunkingRequest,
  ChunkingResponse,
  ChunkUpdateRequest,
  StandardResponse,
  ChunkResponse,
} from "@/types/chunk";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export class ChunkService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${API_BASE_URL}/api/chunks`;
  }

  // CREATE - Process and chunk documents
  async processDocuments(
    payload: ChunkingRequest
  ): Promise<ChunkingResponse> {
    const response = await fetch(`${this.baseUrl}/process`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to process documents");
    }

    return response.json();
  }

  // READ - Get all chunks
  async getAllChunks(
    skip: number = 0,
    limit: number = 100
  ): Promise<StandardResponse<ChunkResponse[]>> {
    const response = await fetch(
      `${this.baseUrl}/?skip=${skip}&limit=${limit}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to fetch chunks");
    }

    return response.json();
  }

  // READ - Get chunk by ID
  async getChunkById(
    chunkId: number
  ): Promise<StandardResponse<ChunkResponse>> {
    const response = await fetch(`${this.baseUrl}/${chunkId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to fetch chunk");
    }

    return response.json();
  }

  // UPDATE - Update chunk
  async updateChunk(
    chunkId: number,
    payload: ChunkUpdateRequest
  ): Promise<StandardResponse<ChunkResponse>> {
    const response = await fetch(`${this.baseUrl}/${chunkId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to update chunk");
    }

    return response.json();
  }

  // DELETE - Delete chunk
  async deleteChunk(chunkId: number): Promise<StandardResponse<null>> {
    const response = await fetch(`${this.baseUrl}/${chunkId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to delete chunk");
    }

    return response.json();
  }
}

export const chunkService = new ChunkService();