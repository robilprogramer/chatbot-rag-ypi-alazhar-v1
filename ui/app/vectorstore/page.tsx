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
    if (documents.length === 0) {
      toast.error("Tidak ada dokumen untuk diproses");
      return;
    }

    if (
      !confirm(
        `Proses ${documents.length} dokumen menjadi chunks? Ini akan membuat chunks baru di database.`
      )
    ) {
      return;
    }

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

      toast.success(
        `${response.message} `
      );

      // Optional: redirect to chunks page
      // router.push('/chunks');
    } catch (err) {
      toast.error("Gagal memproses dokumen ke chunks");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 bg-gray-50">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Vector Store Documents
            </h1>
            <p className="text-gray-500">{documents.length} dokumen</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchDocuments}
              disabled={loading}
              className="btn-secondary flex items-center gap-2"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
            <button
              onClick={handleProcessToChunks}
              disabled={processing || documents.length === 0}
              className="btn-primary flex items-center gap-2 disabled:opacity-50"
            >
              <PackagePlus className="h-4 w-4" />
              {processing ? "Memproses..." : "Add Knowledge Base"}
            </button>
          </div>
        </div>

        <div className="card overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 text-gray-400 animate-spin mx-auto" />
            </div>
          ) : (
            <VectorStoreTable documents={documents} />
          )}
        </div>
      </main>
    </div>
  );
}