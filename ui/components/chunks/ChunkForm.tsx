"use client";

import { useState } from "react";
import { chunkService } from "@/services/chunkService";
import { ChunkResponse, ChunkUpdateRequest } from "@/types/chunk";
import { Save, X } from "lucide-react";
import toast from "react-hot-toast";

interface ChunkFormProps {
  chunkId: number;
  initialData: ChunkResponse;
  onComplete: () => void;
  onCancel: () => void;
}

export default function ChunkForm({
  chunkId,
  initialData,
  onComplete,
  onCancel,
}: ChunkFormProps) {
  const [content, setContent] = useState(initialData.content);
  const [metadataJson, setMetadataJson] = useState(
    JSON.stringify(initialData.metadata || {}, null, 2)
  );
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const metadata = JSON.parse(metadataJson);
      setLoading(true);

      const payload: ChunkUpdateRequest = {
        content,
        metadata,
      };

      await chunkService.updateChunk(chunkId, payload);
      onComplete();
    } catch (err) {
      if (err instanceof SyntaxError) {
        toast.error("Format JSON metadata tidak valid");
      } else {
        toast.error("Gagal update chunk");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">Edit Chunk #{chunkId}</h2>
        <button
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Content
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={8}
            required
            className="input-field resize-none"
            placeholder="Masukkan content chunk..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Metadata (JSON)
          </label>
          <textarea
            value={metadataJson}
            onChange={(e) => setMetadataJson(e.target.value)}
            rows={10}
            className="input-field font-mono text-sm resize-none"
            placeholder='{"key": "value"}'
          />
          <p className="mt-1 text-sm text-gray-500">
            Format JSON harus valid
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {loading ? "Menyimpan..." : "Update Chunk"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="btn-secondary disabled:opacity-50"
          >
            Batal
          </button>
        </div>
      </form>
    </div>
  );
}