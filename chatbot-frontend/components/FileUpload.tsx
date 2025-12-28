// File Upload Component
'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X, CheckCircle, AlertCircle } from 'lucide-react';
import { validateFile } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  documentType: string;
  onUpload: (file: File) => Promise<void>;
  label: string;
  description?: string;
}

export default function FileUpload({
  documentType,
  onUpload,
  label,
  description,
}: FileUploadProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      // Validate file
      const validation = validateFile(file);
      if (!validation.valid) {
        setErrorMessage(validation.error || 'File tidak valid');
        setUploadStatus('error');
        return;
      }

      setUploadedFile(file);
      setUploading(true);
      setUploadStatus('idle');
      setErrorMessage('');

      try {
        await onUpload(file);
        setUploadStatus('success');
      } catch (error: any) {
        setUploadStatus('error');
        setErrorMessage(error.message || 'Gagal mengupload file');
      } finally {
        setUploading(false);
      }
    },
    [onUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
    },
    maxFiles: 1,
    disabled: uploading || uploadStatus === 'success',
  });

  const removeFile = () => {
    setUploadedFile(null);
    setUploadStatus('idle');
    setErrorMessage('');
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
        {description && <span className="text-gray-500 ml-2">({description})</span>}
      </label>

      {!uploadedFile ? (
        <div
          {...getRootProps()}
          className={cn(
            'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all',
            isDragActive && 'border-blue-500 bg-blue-50',
            uploadStatus === 'error' && 'border-red-300 bg-red-50',
            !isDragActive && uploadStatus !== 'error' && 'border-gray-300 hover:border-blue-400'
          )}
        >
          <input {...getInputProps()} />
          <Upload className="w-10 h-10 mx-auto mb-3 text-gray-400" />
          {isDragActive ? (
            <p className="text-blue-600 font-medium">Drop file di sini...</p>
          ) : (
            <div>
              <p className="text-gray-600 mb-1">
                <span className="text-blue-600 font-medium">Klik untuk upload</span> atau drag & drop
              </p>
              <p className="text-xs text-gray-500">PDF, JPG, PNG (max 5MB)</p>
            </div>
          )}
        </div>
      ) : (
        <div
          className={cn(
            'border-2 rounded-lg p-4 transition-all',
            uploadStatus === 'success' && 'border-emerald-300 bg-emerald-50',
            uploadStatus === 'error' && 'border-red-300 bg-red-50',
            uploadStatus === 'idle' && 'border-gray-300 bg-gray-50'
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <File className="w-8 h-8 text-gray-600" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {uploadedFile.name}
                </p>
                <p className="text-xs text-gray-500">
                  {(uploadedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {uploading && (
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              )}
              {uploadStatus === 'success' && (
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              )}
              {uploadStatus === 'error' && (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
              {uploadStatus !== 'success' && !uploading && (
                <button
                  onClick={removeFile}
                  className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                  type="button"
                >
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              )}
            </div>
          </div>

          {uploadStatus === 'success' && (
            <p className="text-xs text-emerald-700 mt-2">✓ File berhasil diupload</p>
          )}
          {uploadStatus === 'error' && (
            <p className="text-xs text-red-700 mt-2">✗ {errorMessage}</p>
          )}
        </div>
      )}
    </div>
  );
}
