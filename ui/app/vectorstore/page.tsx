"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { vectorStoreService } from "@/services/vectorStoreService";
import { VectorStoreDocument } from "@/types/vectorstore";
import { Loader2, RefreshCw, PackagePlus } from "lucide-react";
import toast from "react-hot-toast";
import VectorStoreTable from "@/components/vectorstore/VectorStoreTable";

export default function VectorStorePage() {
  const [documents, setDocuments] = useState<VectorStoreDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await vectorStoreService.getAllDocuments();
      setDocuments(response.data || []);
      toast.success(response.message);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Gagal memuat dokumen"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleProcessToChunks = async () => {
    try {
      setProcessing(true);

      // Transform vectorstore documents to chunking request format
      const chunkingDocuments = documents.map((doc) => ({
        filename: doc.metadata.source || "unknown",
        content: doc.content,
      }));

      const response = await vectorStoreService.processToChunks({
        documents: chunkingDocuments,
      });

      toast.success(response.message);

      // Optional: Auto refresh setelah berhasil
      await fetchDocuments();
      
      // Optional: redirect to chunks page
      // router.push('/chunks');
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Gagal memproses dokumen ke chunks"
      );
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 bg-gray-50">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Vector Store Documents
            </h1>
            <p className="text-gray-500 mt-1">
              {documents.length} dokumen dalam vector store
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchDocuments}
              disabled={loading}
              className="btn-secondary flex items-center gap-2 disabled:opacity-50"
              title="Refresh data"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
            <button
              onClick={handleProcessToChunks}
              disabled={processing}
              className="btn-primary flex items-center gap-2 disabled:opacity-50"
              title="Proses dokumen menjadi chunks untuk knowledge base"
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <PackagePlus className="h-4 w-4" />
                  Add Knowledge Base
                </>
              )}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="card overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 text-gray-400 animate-spin mx-auto mb-4" />
              <p className="text-gray-500 text-sm">Memuat dokumen...</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-12">
              <PackagePlus className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">
                Tidak ada dokumen dalam vector store
              </p>
              <p className="text-gray-400 text-sm mt-2">
                Upload dokumen terlebih dahulu atau sinkronisasi data
              </p>
            </div>
          ) : (
            <VectorStoreTable documents={documents} />
          )}
        </div>

        {/* Info Footer */}
        {documents.length > 0 && !loading && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-blue-600 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-blue-900 mb-1">
                  Tentang Add Knowledge Base
                </h4>
                <p className="text-sm text-blue-700">
                  Klik <strong>Add Knowledge Base</strong> untuk memproses{" "}
                  {documents.length} dokumen menjadi chunks yang dapat digunakan
                  untuk chatbot RAG. Proses ini akan membuat chunks baru di
                  database berdasarkan dokumen yang ada di vector store.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}