// src/app/documents/page.tsx

"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { documentService } from "@/services/documentService";
import { Document, DocumentStatus } from "@/types/document";
import DocumentList from "@/components/documents/DocumentList";
import DocumentUploadForm from "@/components/documents/DocumentUploadForm";
import DocumentDetailModal from "@/components/documents/DocumentDetailModal";
import RawTextModal from "@/components/documents/RawTextModal";
import ChunkProcessForm from "@/components/documents/ChunkProcessForm";
import {
  Upload,
  RefreshCw,
  X,
  Filter,
} from "lucide-react";
import toast from "react-hot-toast";

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string>("");

  const [showUploadForm, setShowUploadForm] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [viewRawText, setViewRawText] = useState<Document | null>(null);
  const [chunkingDocument, setChunkingDocument] = useState<number | null>(null);
  const [processingIds, setProcessingIds] = useState<number[]>([]);

  useEffect(() => {
    fetchDocuments();
  }, [page, statusFilter]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await documentService.getAllDocuments(
        page,
        pageSize,
        statusFilter
      );
      setDocuments(response.documents);
      setTotalPages(response.total_pages);
    } catch (err) {
      toast.error("Gagal memuat dokumen");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadComplete = async () => {
    setShowUploadForm(false);
    await fetchDocuments();
  };

  const handleProcess = async (documentId: number) => {
    try {
      setProcessingIds((prev) => [...prev, documentId]);
      await documentService.processDocument(documentId);
      toast.success("Dokumen berhasil diproses!");
      await fetchDocuments();
    } catch (err) {
      toast.error("Gagal memproses dokumen");
    } finally {
      setProcessingIds((prev) => prev.filter((id) => id !== documentId));
    }
  };

  const handleDelete = async (documentId: number) => {
    if (!confirm("Hapus dokumen ini?")) return;

    try {
      await documentService.deleteDocument(documentId);
      toast.success("Dokumen berhasil dihapus");
      await fetchDocuments();
    } catch (err) {
      toast.error("Gagal menghapus dokumen");
    }
  };

  const handleChunkComplete = async () => {
    setChunkingDocument(null);
    toast.success("Chunking berhasil!");
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 bg-gray-50">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Document Management
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
                onClick={() => {
                  setShowUploadForm(!showUploadForm);
                  setChunkingDocument(null);
                }}
                className="btn-primary flex items-center gap-2"
              >
                {showUploadForm ? (
                  <>
                    <X className="h-4 w-4" />
                    Tutup
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Upload PDF
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Filter */}
          <div className="flex items-center gap-3">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="input max-w-xs"
            >
              <option value="">Semua Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>

        {/* Upload Form */}
        {showUploadForm && (
          <div className="mb-6">
            <DocumentUploadForm
              onUploadComplete={handleUploadComplete}
              onCancel={() => setShowUploadForm(false)}
            />
          </div>
        )}

        {/* Chunking Form */}
        {chunkingDocument !== null && (
          <div className="mb-6">
            <ChunkProcessForm
              documentId={chunkingDocument}
              onComplete={handleChunkComplete}
              onCancel={() => setChunkingDocument(null)}
            />
          </div>
        )}

        {/* Document List */}
        <div className="card overflow-hidden">
          <DocumentList
            documents={documents}
            loading={loading}
            onView={(doc) => setSelectedDocument(doc)}
            onViewRawText={(doc) => setViewRawText(doc)}
            onProcess={handleProcess}
            onChunk={(id) => setChunkingDocument(id)}
            onDelete={handleDelete}
            processingIds={processingIds}
          />
        </div>

        {/* Pagination */}
        {documents.length > 0 && (
          <div className="mt-6 flex justify-between items-center">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-gray-600 text-sm">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || loading}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </main>

      {/* Modals */}
      {selectedDocument && (
        <DocumentDetailModal
          document={selectedDocument}
          onClose={() => setSelectedDocument(null)}
        />
      )}

      {viewRawText && (
        <RawTextModal
          document={viewRawText}
          onClose={() => setViewRawText(null)}
        />
      )}
    </div>
  );
}