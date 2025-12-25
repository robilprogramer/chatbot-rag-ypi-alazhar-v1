"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { chunkService } from "@/services/chunkService";
import { ChunkResponse } from "@/types/chunk";
import ChunkList from "@/components/chunks/ChunkList";
import ChunkForm from "@/components/chunks/ChunkForm";
import ProcessDocumentForm from "@/components/chunks/ProcessDocumentForm";
import { Loader2, RefreshCw, Plus, X } from "lucide-react";
import toast from "react-hot-toast";
import { Eye } from "lucide-react";
import { useRouter } from "next/navigation";
export default function ChunksPage() {
  const router = useRouter();
  const [chunks, setChunks] = useState<ChunkResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedChunk, setSelectedChunk] = useState<{
    id: number;
    chunk: ChunkResponse;
  } | null>(null);
  const [showProcessForm, setShowProcessForm] = useState(false);
  const [skip, setSkip] = useState(0);
  const [limit] = useState(50);

  useEffect(() => {
    fetchChunks();
  }, [skip]);

  const fetchChunks = async () => {
    try {
      setLoading(true);
      const response = await chunkService.getAllChunks(skip, limit);
      setChunks(response.data || []);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Gagal memuat chunks"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (chunkId: number) => {
    if (!confirm("Hapus chunk ini?")) return;

    try {
      await chunkService.deleteChunk(chunkId);
      toast.success("Chunk dihapus");
      await fetchChunks();
    } catch (err) {
      toast.error("Gagal menghapus chunk");
    }
  };

  const handleEdit = (chunkId: number, chunk: ChunkResponse) => {
    setSelectedChunk({ id: chunkId, chunk });
    setShowProcessForm(false);
  };

  const handleUpdate = async () => {
    setSelectedChunk(null);
    toast.success("Chunk berhasil diupdate");
    await fetchChunks();
  };

  const handleProcessComplete = async () => {
    setShowProcessForm(false);
    await fetchChunks();
  };
  const handleReviewClick = () => {
    router.push(`/chunks/bulk-review`);
  };
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 bg-gray-50">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Document Chunks</h1>
            <p className="text-gray-500">{chunks.length} chunks</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleReviewClick}
              className="btn-secondary flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              Review
            </button>
            <button
              onClick={fetchChunks}
              disabled={loading}
              className="btn-secondary flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              onClick={() => {
                setShowProcessForm(!showProcessForm);
                setSelectedChunk(null);
              }}
              className="btn-primary flex items-center gap-2"
            >
              {showProcessForm ? (
                <>
                  <X className="h-4 w-4" />
                  Tutup Form
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Process Dokumen
                </>
              )}
            </button>
          </div>
        </div>

        {showProcessForm && (
          <div className="mb-6">
            <ProcessDocumentForm onComplete={handleProcessComplete} />
          </div>
        )}

        {selectedChunk && (
          <div className="mb-6">
            <ChunkForm
              chunkId={selectedChunk.id}
              initialData={selectedChunk.chunk}
              onComplete={handleUpdate}
              onCancel={() => setSelectedChunk(null)}
            />
          </div>
        )}

        <div className="card overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 text-gray-400 animate-spin mx-auto" />
            </div>
          ) : (
            <ChunkList
              chunks={chunks}
              loading={loading}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
        </div>

        {chunks.length > 0 && (
          <div className="mt-6 flex justify-between items-center">
            <button
              onClick={() => setSkip(Math.max(0, skip - limit))}
              disabled={skip === 0 || loading}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-gray-600 text-sm">
              Showing {skip + 1} - {skip + chunks.length}
            </span>
            <button
              onClick={() => setSkip(skip + limit)}
              disabled={chunks.length < limit || loading}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </main>
    </div>
  );
}