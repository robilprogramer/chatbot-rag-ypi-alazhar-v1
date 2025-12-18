// src/components/documents/DocumentDetailModal.tsx

"use client";

import { Document } from "@/types/document";
import { X, FileText, Calendar, Layers, Image as ImageIcon } from "lucide-react";
import { documentService } from "@/services/documentService";

interface DocumentDetailModalProps {
  document: Document;
  onClose: () => void;
}

export default function DocumentDetailModal({
  document,
  onClose,
}: DocumentDetailModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-indigo-600" />
            <h2 className="text-xl font-bold text-gray-800">Detail Dokumen</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Informasi Dasar
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Nama File</p>
                <p className="font-medium text-gray-900">
                  {document.original_filename}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Ukuran File</p>
                <p className="font-medium text-gray-900">
                  {documentService.formatFileSize(document.file_size)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <span
                  className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${documentService.getStatusColor(
                    document.status
                  )}`}
                >
                  {document.status}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Halaman</p>
                <p className="font-medium text-gray-900">
                  {document.total_pages || "-"}
                </p>
              </div>
            </div>
          </div>

          {/* Extraction Info */}
          {document.status === "completed" && (
            <>
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  Hasil Ekstraksi
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Method</p>
                    <p className="font-medium text-gray-900">
                      {document.extraction_method || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Durasi</p>
                    <p className="font-medium text-gray-900">
                      {document.extraction_duration
                        ? `${document.extraction_duration.toFixed(2)}s`
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Panjang Text</p>
                    <p className="font-medium text-gray-900">
                      {document.text_length?.toLocaleString()} karakter
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">PDF Type</p>
                    <p className="font-medium text-gray-900">
                      {document.is_scanned ? "Scanned" : "Native"}
                    </p>
                  </div>
                  {document.ocr_confidence && (
                    <div>
                      <p className="text-sm text-gray-500">OCR Confidence</p>
                      <p className="font-medium text-gray-900">
                        {(document.ocr_confidence * 100).toFixed(1)}%
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Tables & Images */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  Content Summary
                </h3>
                <div className="flex gap-6">
                  <div className="flex items-center gap-2">
                    <Layers className="h-5 w-5 text-indigo-600" />
                    <div>
                      <p className="text-sm text-gray-500">Tables</p>
                      <p className="font-medium text-gray-900">
                        {document.tables_data?.length || 0}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm text-gray-500">Images</p>
                      <p className="font-medium text-gray-900">
                        {document.images_data?.length || 0}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Raw Text Preview */}
              {document.raw_text && (
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    Preview Raw Text
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                      {document.raw_text.substring(0, 500)}...
                    </pre>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Timestamps */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Timestamps
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Created</p>
                <p className="text-gray-900">
                  {new Date(document.created_at).toLocaleString("id-ID")}
                </p>
              </div>
              {document.processed_at && (
                <div>
                  <p className="text-gray-500">Processed</p>
                  <p className="text-gray-900">
                    {new Date(document.processed_at).toLocaleString("id-ID")}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6">
          <button onClick={onClose} className="btn-primary w-full">
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}