"use client";

import { useState, useEffect } from "react";
import { Document } from "@/types/document";
import { documentService } from "@/services/documentService";
import {
  X,
  Copy,
  Download,
  Loader2,
  CheckCircle,
  Edit2,
  Save,
  RotateCcw,
  Maximize2,
  Minimize2,
} from "lucide-react";
import toast from "react-hot-toast";

interface RawTextModalProps {
  document: Document;
  onClose: () => void;
  onUpdate?: () => void;
}

export default function RawTextModal({
  document,
  onClose,
  onUpdate,
}: RawTextModalProps) {
  const [rawText, setRawText] = useState<string>("");
  const [editedText, setEditedText] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false); // New state

  useEffect(() => {
    fetchRawText();
  }, [document.id]);

  const fetchRawText = async () => {
    try {
      setLoading(true);
      const response = await documentService.getRawText(document.id);
      setRawText(response.raw_text);
      setEditedText(response.raw_text);
    } catch (err) {
      toast.error("Gagal memuat raw text");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (editedText.trim() === "") {
      toast.error("Raw text tidak boleh kosong");
      return;
    }

    if (editedText === rawText) {
      toast.error("Tidak ada perubahan untuk disimpan");
      return;
    }

    try {
      setSaving(true);
      await documentService.updateRawText(document.id, {
        raw_text: editedText,
      });

      setRawText(editedText);
      setIsEditing(false);
      toast.success("Raw text berhasil diupdate!");

      if (onUpdate) {
        onUpdate();
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Gagal update raw text"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedText(rawText);
    setIsEditing(false);
  };

  const handleReset = () => {
    if (confirm("Reset ke raw text original?")) {
      setEditedText(rawText);
      toast.success("Raw text direset");
    }
  };

  const handleCopy = async () => {
    try {
      const textToCopy = isEditing ? editedText : rawText;
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      toast.success("Text berhasil dicopy!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Gagal copy text");
    }
  };

  const handleDownload = () => {
    const textToDownload = isEditing ? editedText : rawText;
    const blob = new Blob([textToDownload], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${document.original_filename.replace(
      ".pdf",
      ""
    )}_raw_text.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("File berhasil didownload!");
  };

  const hasChanges = editedText !== rawText;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        className={`bg-white rounded-lg flex flex-col transition-all ${
          isFullscreen
            ? "w-full h-full max-w-none"
            : "max-w-6xl w-full max-h-[90vh]"
        }`}
      >
        {/* Header */}
        <div className="border-b border-gray-200 p-6 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              {isEditing ? "Edit Raw Text" : "Raw Text"}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {document.original_filename}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isEditing && (
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="btn-secondary flex items-center gap-2"
                title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              >
                {isFullscreen ? (
                  <>
                    <Minimize2 className="h-4 w-4" />
                    Exit Fullscreen
                  </>
                ) : (
                  <>
                    <Maximize2 className="h-4 w-4" />
                    Fullscreen
                  </>
                )}
              </button>
            )}
            {isEditing ? (
              <>
                <button
                  onClick={handleReset}
                  disabled={saving}
                  className="btn-secondary flex items-center gap-2"
                  title="Reset to original"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </button>
                <button
                  onClick={handleCancel}
                  disabled={saving}
                  className="btn-secondary flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !hasChanges}
                  className="btn-primary flex items-center gap-2 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleCopy}
                  disabled={loading}
                  className="btn-secondary flex items-center gap-2"
                >
                  {copied ? (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy
                    </>
                  )}
                </button>
                <button
                  onClick={handleDownload}
                  disabled={loading}
                  className="btn-secondary flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download
                </button>
                <button
                  onClick={() => setIsEditing(true)}
                  disabled={loading}
                  className="btn-primary flex items-center gap-2"
                >
                  <Edit2 className="h-4 w-4" />
                  Edit
                </button>
              </>
            )}
            {!isEditing && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors ml-2"
              >
                <X className="h-6 w-6" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
            </div>
          ) : isEditing ? (
            <div className="h-full">
              <textarea
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                className="w-full h-full p-4 bg-gray-50 rounded-lg text-sm text-gray-700 font-mono leading-relaxed resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 border border-gray-300"
                placeholder="Enter raw text..."
              />
              {hasChanges && (
                <div className="mt-2 flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                  <span className="text-yellow-700 font-medium">
                    Unsaved changes
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-6">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">
                {rawText}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        {!loading && (
          <div className="border-t border-gray-200 p-4 bg-gray-50 flex-shrink-0">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                {(isEditing ? editedText : rawText).length.toLocaleString()}{" "}
                karakter • {document.total_pages} halaman
              </p>
              {isEditing && hasChanges && (
                <p className="text-sm text-yellow-600 font-medium">
                  {Math.abs(editedText.length - rawText.length)} karakter{" "}
                  {editedText.length > rawText.length
                    ? "ditambahkan"
                    : "dihapus"}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}