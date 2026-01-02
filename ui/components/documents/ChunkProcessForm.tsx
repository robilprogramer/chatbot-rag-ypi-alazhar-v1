// src/components/documents/ChunkProcessForm.tsx

"use client";

import { useState } from "react";
import { documentService } from "@/services/documentService";
import { Loader2, Scissors, X } from "lucide-react";
import toast from "react-hot-toast";

interface ChunkProcessFormProps {
  documentId: number;
  filename: string;
  content: string;
  onComplete: () => void;
  onCancel: () => void;
}

export default function ChunkProcessForm({
  documentId,
  filename,
  content,
  onComplete,
  onCancel,
}: ChunkProcessFormProps) {
  const [method, setMethod] = useState<string>("semantic");
  const [chunkSize, setChunkSize] = useState<number>(1500);
  const [overlap, setOverlap] = useState<number>(200);
  const [processing, setProcessing] = useState(false);

  const handleChunk = async () => {
    try {
      setProcessing(true);
      const result = await documentService.chunkDocument(filename, content);
      //  toast.success(
      //   `To Do, Kirim Ke Proses Chunking`
      // );
      toast.success(
        `Berhasil! ${result.metadata_json} chunks telah dibuat`
      );
      onComplete();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Gagal melakukan chunking"
      );
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Scissors className="h-5 w-5 text-indigo-600" />
          Chunk Document
        </h3>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="space-y-4">
        <div hidden>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Chunking Method
          </label>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="input"
          >
            <option value="semantic">Semantic Chunking</option>
            <option value="recursive">Recursive Chunking</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Semantic: Berdasarkan paragraf (lebih baik untuk context)
          </p>
        </div>

        <div hidden>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Chunk Size: {chunkSize} characters
          </label>
          <input
            type="range"
            min="500"
            max="3000"
            step="100"
            value={chunkSize}
            onChange={(e) => setChunkSize(Number(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>500</span>
            <span>3000</span>
          </div>
        </div>

        <div hidden>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Overlap: {overlap} characters
          </label>
          <input
            type="range"
            min="0"
            max="500"
            step="50"
            value={overlap}
            onChange={(e) => setOverlap(Number(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0</span>
            <span>500</span>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            onClick={handleChunk}
            disabled={processing}
            className="btn-primary flex items-center gap-2 flex-1"
          >
            {processing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Scissors className="h-4 w-4" />
                Mulai Chunking
              </>
            )}
          </button>
          <button
            onClick={onCancel}
            disabled={processing}
            className="btn-secondary"
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}