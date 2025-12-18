// src/components/documents/DocumentUploadForm.tsx

"use client";

import { useState } from "react";
import { Upload, X, FileText, Loader2 } from "lucide-react";
import { documentService } from "@/services/documentService";
import toast from "react-hot-toast";

interface DocumentUploadFormProps {
  onUploadComplete: () => void;
  onCancel?: () => void;
}

export default function DocumentUploadForm({
  onUploadComplete,
  onCancel,
}: DocumentUploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === "application/pdf") {
        setFile(droppedFile);
      } else {
        toast.error("Hanya file PDF yang diperbolehkan");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === "application/pdf") {
        setFile(selectedFile);
      } else {
        toast.error("Hanya file PDF yang diperbolehkan");
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Pilih file terlebih dahulu");
      return;
    }

    try {
      setUploading(true);
      const response = await documentService.uploadDocument(file);
      
      toast.success(`File berhasil diupload! ID: ${response.document_id}`);
      setFile(null);
      onUploadComplete();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Gagal mengupload file"
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Upload Dokumen PDF</h2>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? "border-indigo-500 bg-indigo-50"
            : "border-gray-300 bg-gray-50"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {file ? (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-3 text-gray-700">
              <FileText className="h-8 w-8 text-indigo-600" />
              <div className="text-left">
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-gray-500">
                  {documentService.formatFileSize(file.size)}
                </p>
              </div>
            </div>
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="btn-primary flex items-center gap-2"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Upload
                  </>
                )}
              </button>
              <button
                onClick={() => setFile(null)}
                disabled={uploading}
                className="btn-secondary"
              >
                Ganti File
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Upload className="h-12 w-12 text-gray-400 mx-auto" />
            <div>
              <p className="text-gray-600 mb-2">
                Drag & drop file PDF di sini, atau
              </p>
              <label className="btn-primary cursor-pointer inline-block">
                Pilih File
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-sm text-gray-500">
              Hanya file PDF yang diperbolehkan (Max 50MB)
            </p>
          </div>
        )}
      </div>
    </div>
  );
}