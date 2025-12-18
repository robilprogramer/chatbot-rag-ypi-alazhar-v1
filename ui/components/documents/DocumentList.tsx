// src/components/documents/DocumentList.tsx

"use client";

import { Document } from "@/types/document";
import { documentService } from "@/services/documentService";
import {
  FileText,
  Eye,
  Trash2,
  Play,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  Scissors,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";

interface DocumentListProps {
  documents: Document[];
  loading: boolean;
  onView: (document: Document) => void;
  onViewRawText: (document: Document) => void;
  onProcess: (documentId: number) => void;
  onChunk: (documentId: number) => void;
  onDelete: (documentId: number) => void;
  processingIds: number[];
}

export default function DocumentList({
  documents,
  loading,
  onView,
  onViewRawText,
  onProcess,
  onChunk,
  onDelete,
  processingIds,
}: DocumentListProps) {
  if (loading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="h-8 w-8 text-gray-400 animate-spin mx-auto" />
        <p className="text-gray-500 mt-4">Loading documents...</p>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">Belum ada dokumen</p>
        <p className="text-sm text-gray-400 mt-2">
          Upload dokumen PDF untuk memulai
        </p>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "processing":
        return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />;
      case "failed":
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-600" />;
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Dokumen
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Info
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Dibuat
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Aksi
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {documents.map((doc) => (
            <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-indigo-600" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {doc.original_filename}
                    </p>
                    <p className="text-sm text-gray-500">
                      {documentService.formatFileSize(doc.file_size)}
                    </p>
                  </div>
                </div>
              </td>

              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  {getStatusIcon(doc.status)}
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${documentService.getStatusColor(
                      doc.status
                    )}`}
                  >
                    {doc.status}
                  </span>
                </div>
                {doc.error_message && (
                  <p className="text-xs text-red-600 mt-1">
                    {doc.error_message}
                  </p>
                )}
              </td>

              <td className="px-6 py-4">
                {doc.status === "completed" ? (
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>📄 {doc.total_pages} halaman</p>
                    <p>📝 {doc.text_length?.toLocaleString()} karakter</p>
                    {doc.tables_data && doc.tables_data.length > 0 && (
                      <p>📊 {doc.tables_data.length} tabel</p>
                    )}
                    {doc.extraction_method && (
                      <p className="text-xs text-gray-500">
                        Method: {doc.extraction_method}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">-</p>
                )}
              </td>

              <td className="px-6 py-4 text-sm text-gray-500">
                {formatDistanceToNow(new Date(doc.created_at), {
                  addSuffix: true,
                  locale: idLocale,
                })}
              </td>

              <td className="px-6 py-4">
                <div className="flex items-center justify-end gap-2">
                  {doc.status === "pending" && (
                    <button
                      onClick={() => onProcess(doc.id)}
                      disabled={processingIds.includes(doc.id)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Process Document"
                    >
                      {processingIds.includes(doc.id) ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </button>
                  )}

                  {doc.status === "completed" && (
                    <>
                      <button
                        onClick={() => onView(doc)}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onViewRawText(doc)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="View Raw Text"
                      >
                        <FileText className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onChunk(doc.id)}
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="Chunk Document"
                      >
                        <Scissors className="h-4 w-4" />
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => onDelete(doc.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}