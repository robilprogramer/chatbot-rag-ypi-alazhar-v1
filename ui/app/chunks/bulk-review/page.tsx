"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { chunkService } from "@/services/chunkService"; // Updated import
import { ChunkResponse, ChunkUpdateItem } from "@/types/chunk";
import {
  Loader2,
  Save,
  RotateCcw,
  FileText,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import ChunkReviewCard from "@/components/chunks/ChunkReviewCard";

export default function BulkReviewPage() {
  const searchParams = useSearchParams();
  const filenameParam = searchParams.get("filename");

  const [filename, setFilename] = useState(filenameParam || "");
  const [chunks, setChunks] = useState<ChunkResponse[]>([]);
  const [updates, setUpdates] = useState<Map<number, ChunkUpdateItem>>(
    new Map()
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (filename) {
      fetchChunks();
    }
  }, []);

  const fetchChunks = async () => {
    if (!filename.trim()) {
      toast.error("Masukkan nama file terlebih dahulu");
      return;
    }

    try {
      setLoading(true);
      const response = await chunkService.getChunksByFilename(filename);
      setChunks(response.data || []);
      setUpdates(new Map());
      toast.success(`${response.data?.length || 0} chunks loaded`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Gagal memuat chunks"
      );
      setChunks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChunkUpdate = (
    id: number,
    partialUpdate: Partial<ChunkUpdateItem>
  ) => {
    setUpdates((prev) => {
      const newMap = new Map(prev);
      const existing = newMap.get(id) || { id };
      newMap.set(id, { ...existing, ...partialUpdate });
      return newMap;
    });
  };

  const handleBulkUpdate = async () => {
    if (updates.size === 0) {
      toast.error("Tidak ada perubahan untuk disimpan");
      return;
    }

    if (!confirm(`Update ${updates.size} chunks?`)) return;

    try {
      setSaving(true);
      const updateArray = Array.from(updates.values());
      const response = await chunkService.bulkUpdateByFilename(
        filename,
        updateArray
      );

      toast.success(
        `${response.data?.updated_count || 0} chunks berhasil diupdate!`
      );
      setUpdates(new Map());
      await fetchChunks();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Gagal update chunks"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (updates.size > 0) {
      if (!confirm("Buang semua perubahan?")) return;
    }
    setUpdates(new Map());
    toast.success("Perubahan direset");
  };

  const hasChanges = updates.size > 0;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 bg-gray-50">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Bulk Review & Update
          </h1>
          <p className="text-gray-500">
            Review dan update chunks berdasarkan filename
          </p>
        </div>

        {/* Search Form */}
        <div className="card mb-6">
          <div className="flex gap-3">
            <div className="flex-1">
              <input
                type="text"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchChunks()}
                placeholder="Masukkan nama file (contoh: SK TK 56 MALANG.pdf)"
                className="input-field"
                disabled={loading}
              />
            </div>
            <button
              onClick={fetchChunks}
              disabled={loading || !filename.trim()}
              className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4" />
                  Load Chunks
                </>
              )}
            </button>
          </div>
        </div>

        {/* Action Bar */}
        {chunks.length > 0 && (
          <div className="card mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-sm text-gray-600">Total Chunks</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {chunks.length}
                  </p>
                </div>
                <div className="h-12 w-px bg-gray-300" />
                <div>
                  <p className="text-sm text-gray-600">Modified</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {updates.size}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleReset}
                  disabled={!hasChanges || saving}
                  className="btn-secondary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset Changes
                </button>
                <button
                  onClick={handleBulkUpdate}
                  disabled={!hasChanges || saving}
                  className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save {updates.size} Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Chunks Grid */}
        {loading ? (
          <div className="card text-center py-12">
            <Loader2 className="h-8 w-8 text-gray-400 animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Loading chunks...</p>
          </div>
        ) : chunks.length === 0 ? (
          <div className="card text-center py-12">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              {filename
                ? "No chunks found for this filename"
                : "Enter a filename to load chunks"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {chunks.map((chunk, index) => (
              <ChunkReviewCard
                key={chunk.id}
                chunk={chunk}
                index={index}
                onUpdate={handleChunkUpdate}
                hasChanges={updates.has(chunk.id)}
              />
            ))}
          </div>
        )}

        {/* Bottom Action Bar (Fixed) */}
        {hasChanges && chunks.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg p-4 z-50">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                <span className="font-medium text-gray-700">
                  You have {updates.size} unsaved changes
                </span>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleReset}
                  disabled={saving}
                  className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition disabled:opacity-50"
                >
                  Discard
                </button>
                <button
                  onClick={handleBulkUpdate}
                  disabled={saving}
                  className="px-6 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Save All Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}