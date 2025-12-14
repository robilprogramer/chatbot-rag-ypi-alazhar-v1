// app/upload/page.tsx
"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { documentApi, pipelineApi } from "@/lib/api";
import {
  JENJANG_OPTIONS,
  KATEGORI_OPTIONS,
  CABANG_OPTIONS,
  TAHUN_OPTIONS,
} from "@/lib/constants";
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Metadata form
  const [metadata, setMetadata] = useState({
    tahun_ajaran: "",
    tahun: "",
    jenjang: "",
    kategori: "",
    cabang: "",
    title: "",
    description: "",
  });

  // Options
  const [skipReview, setSkipReview] = useState(false);
  const [autoParse, setAutoParse] = useState(true);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === "application/pdf") {
        setFile(droppedFile);
      } else {
        toast.error("Hanya file PDF yang didukung");
      }
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === "application/pdf") {
        setFile(selectedFile);
      } else {
        toast.error("Hanya file PDF yang didukung");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      toast.error("Pilih file PDF terlebih dahulu");
      return;
    }

    setUploading(true);
    setUploadProgress(10);

    try {
      const uploadMetadata = {
        ...metadata,
        tahun: metadata.tahun ? parseInt(metadata.tahun) : undefined,
        auto_parse: autoParse,
      };

      setUploadProgress(30);

      let response;
      if (skipReview) {
        // Full pipeline (skip review)
        response = await pipelineApi.runFull(file, uploadMetadata, true);
        setUploadProgress(100);
        toast.success(
          `Dokumen berhasil diproses! ${
            response.entries_created || 0
          } knowledge entries dibuat.`
        );
        router.push("/knowledge");
      } else {
        // Normal upload (with review)
        response = await documentApi.upload(file, uploadMetadata);
        setUploadProgress(100);
        toast.success("Dokumen berhasil diupload! Silakan review di Staging.");
        router.push(`/staging?document_id=${response.document.id}`);
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(
        error.response?.data?.detail || "Gagal mengupload dokumen" + error
      );
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="flex-1 p-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-800">Upload Dokumen</h1>
            <p className="text-gray-500">
              Upload dokumen PDF untuk ditambahkan ke Knowledge Base
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* File Upload Area */}
            <div className="card mb-6">
              <h2 className="font-semibold text-gray-800 mb-4">File PDF</h2>

              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                  dragActive
                    ? "border-green-500 bg-green-50"
                    : file
                    ? "border-green-500 bg-green-50"
                    : "border-gray-300 hover:border-gray-400"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                {file ? (
                  <div className="flex items-center justify-center space-x-4">
                    <FileText className="h-12 w-12 text-green-600" />
                    <div className="text-left">
                      <p className="font-medium text-gray-800">{file.name}</p>
                      <p className="text-sm text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <button
                        type="button"
                        onClick={() => setFile(null)}
                        className="text-sm text-red-600 hover:text-red-700 mt-1"
                      >
                        Hapus file
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">
                      Drag & drop file PDF di sini, atau
                    </p>
                    <label className="btn-primary cursor-pointer inline-block">
                      Pilih File
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                    <p className="text-xs text-gray-400 mt-4">
                      Hanya file PDF, maksimal 50MB
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Metadata Form */}
            <div className="card mb-6">
              <h2 className="font-semibold text-gray-800 mb-4">
                Metadata Dokumen
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Title */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Judul Dokumen
                  </label>
                  <input
                    type="text"
                    value={metadata.title}
                    onChange={(e) =>
                      setMetadata({ ...metadata, title: e.target.value })
                    }
                    className="input-field"
                    placeholder="Contoh: Biaya Pendidikan SD Tahun 2024/2025"
                  />
                </div>

                {/* Tahun Ajaran */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tahun Ajaran
                  </label>
                  <input
                    type="text"
                    value={metadata.tahun_ajaran}
                    onChange={(e) =>
                      setMetadata({ ...metadata, tahun_ajaran: e.target.value })
                    }
                    className="input-field"
                    placeholder="Contoh: 2024/2025"
                  />
                </div>

                {/* Tahun */}
                {/* <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tahun
                  </label>
                  <select
                    value={metadata.tahun}
                    onChange={(e) => setMetadata({ ...metadata, tahun: e.target.value })}
                    className="select-field"
                  >
                    {TAHUN_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div> */}

                {/* Tahun */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tahun
                  </label>
                  <input
                    type="text"
                    value={metadata.tahun}
                    onChange={(e) =>
                      setMetadata({ ...metadata, tahun: e.target.value })
                    }
                    className="input-field"
                    placeholder="Contoh: 2025"
                  />
                </div>

                {/* Jenjang */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Jenjang Pendidikan
                  </label>
                  <select
                    value={metadata.jenjang}
                    onChange={(e) =>
                      setMetadata({ ...metadata, jenjang: e.target.value })
                    }
                    className="select-field"
                  >
                    {JENJANG_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Kategori */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kategori
                  </label>
                  <select
                    value={metadata.kategori}
                    onChange={(e) =>
                      setMetadata({ ...metadata, kategori: e.target.value })
                    }
                    className="select-field"
                  >
                    {KATEGORI_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Cabang */}
                {/* <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cabang
                  </label>
                  <select
                    value={metadata.cabang}
                    onChange={(e) =>
                      setMetadata({ ...metadata, cabang: e.target.value })
                    }
                    className="select-field"
                  >
                    {CABANG_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div> */}

                {/* Cabang */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cabang
                  </label>
                  <input
                    type="text"
                    value={metadata.cabang}
                    onChange={(e) =>
                      setMetadata({ ...metadata, cabang: e.target.value })
                    }
                    className="input-field"
                    placeholder="Contoh: Jakarta Barat"
                  />
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Deskripsi (opsional)
                  </label>
                  <textarea
                    value={metadata.description}
                    onChange={(e) =>
                      setMetadata({ ...metadata, description: e.target.value })
                    }
                    className="input-field"
                    rows={3}
                    placeholder="Deskripsi singkat tentang isi dokumen..."
                  />
                </div>
              </div>
            </div>

            {/* Options */}
            <div className="card mb-6">
              <h2 className="font-semibold text-gray-800 mb-4">
                Opsi Processing
              </h2>

              <div className="space-y-4">
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoParse}
                    onChange={(e) => setAutoParse(e.target.checked)}
                    className="mt-1 h-4 w-4 text-green-600 rounded"
                  />
                  <div>
                    <p className="font-medium text-gray-800">Auto Parse</p>
                    <p className="text-sm text-gray-500">
                      Otomatis parse dokumen setelah upload
                    </p>
                  </div>
                </label>

                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={skipReview}
                    onChange={(e) => setSkipReview(e.target.checked)}
                    className="mt-1 h-4 w-4 text-green-600 rounded"
                  />
                  <div>
                    <p className="font-medium text-gray-800">
                      Skip Review (Full Pipeline)
                    </p>
                    <p className="text-sm text-gray-500">
                      Langsung proses tanpa review manual. Tidak disarankan
                      untuk dokumen penting.
                    </p>
                  </div>
                </label>
              </div>

              {skipReview && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-800">Perhatian</p>
                    <p className="text-sm text-yellow-700">
                      Mode Skip Review akan langsung memproses dokumen tanpa
                      review. Pastikan dokumen sudah benar sebelum upload.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Progress Bar */}
            {uploading && (
              <div className="card mb-6">
                <div className="flex items-center space-x-3 mb-2">
                  <Loader2 className="h-5 w-5 text-green-600 animate-spin" />
                  <span className="text-gray-700">
                    Mengupload dan memproses...
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="btn-secondary"
                disabled={uploading}
              >
                Batal
              </button>
              <button
                type="submit"
                className="btn-primary flex items-center space-x-2"
                disabled={!file || uploading}
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Mengupload...</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    <span>
                      {skipReview ? "Upload & Process" : "Upload & Review"}
                    </span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
