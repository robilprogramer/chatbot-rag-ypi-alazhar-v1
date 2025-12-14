"use client";

import { useState } from "react";
import { chunkService } from "@/services/chunkService";
import { ChunkingRequestDocument } from "@/types/chunk";
import { Upload, Plus, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";

interface ProcessDocumentFormProps {
  onComplete: () => void;
}

export default function ProcessDocumentForm({
  onComplete,
}: ProcessDocumentFormProps) {
  const [documents, setDocuments] = useState<ChunkingRequestDocument[]>([
    { filename: "", content: "" },
  ]);
  const [loading, setLoading] = useState(false);

  const handleAddDocument = () => {
    setDocuments([...documents, { filename: "", content: "" }]);
  };

  const handleRemoveDocument = (index: number) => {
    setDocuments(documents.filter((_, i) => i !== index));
  };

  const handleDocumentChange = (
    index: number,
    field: "filename" | "content",
    value: string
  ) => {
    const updated = [...documents];
    updated[index][field] = value;
    setDocuments(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    const validDocs = documents.filter(
      (doc) => doc.filename.trim() && doc.content.trim()
    );

    if (validDocs.length === 0) {
      toast.error("Minimal tambahkan 1 dokumen dengan filename dan content");
      return;
    }

    try {
      setLoading(true);
      const response = await chunkService.processDocuments({
        documents: validDocs,
      });

      toast.success(
        `Berhasil memproses ${response.total_chunks} chunks dari ${validDocs.length} dokumen`
      );

      // Reset form
      setDocuments([{ filename: "", content: "" }]);

      // Call onComplete after a short delay
      setTimeout(() => {
        onComplete();
      }, 1500);
    } catch (err) {
      toast.error("Gagal memproses dokumen");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">Process Dokumen Baru</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {documents.map((doc, index) => (
          <div
            key={index}
            className="p-4 border border-gray-200 rounded-lg space-y-4 bg-gray-50"
          >
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-semibold text-gray-700">
                Dokumen #{index + 1}
              </h3>
              {documents.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveDocument(index)}
                  className="text-red-600 hover:text-red-700 flex items-center gap-1 text-sm"
                >
                  <Trash2 className="h-4 w-4" />
                  Hapus
                </button>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filename
              </label>
              <input
                type="text"
                value={doc.filename}
                onChange={(e) =>
                  handleDocumentChange(index, "filename", e.target.value)
                }
                className="input-field"
                placeholder="e.g., SK_Biaya_Jakarta_2024.pdf"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content
              </label>
              <textarea
                value={doc.content}
                onChange={(e) =>
                  handleDocumentChange(index, "content", e.target.value)
                }
                rows={6}
                className="input-field resize-none"
                placeholder="Paste content dokumen di sini..."
              />
            </div>
          </div>
        ))}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleAddDocument}
            className="btn-secondary flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Tambah Dokumen
          </button>
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex items-center gap-2 disabled:opacity-50"
          >
            <Upload className="h-4 w-4" />
            {loading ? "Memproses..." : "Process Dokumen"}
          </button>
        </div>
      </form>
    </div>
  );
}