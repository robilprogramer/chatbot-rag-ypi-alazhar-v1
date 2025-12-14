// app/processing/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { documentApi, processingApi, Document } from '@/lib/api';
import { STATUS_COLORS } from '@/lib/constants';
import { 
  Cog, Play, CheckCircle, AlertCircle, Loader2,
  FileText, Database, Layers, ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';

interface ProcessingStatus {
  step: 'idle' | 'processing' | 'embedding' | 'complete' | 'error';
  message: string;
  progress: number;
  details?: any;
}

export default function ProcessingPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>({
    step: 'idle', message: '', progress: 0,
  });
  
  const [chunkSize, setChunkSize] = useState(1000);
  const [chunkOverlap, setChunkOverlap] = useState(200);
  const [batchSize, setBatchSize] = useState(100);

  useEffect(() => { loadDocuments(); }, []);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const response = await documentApi.list({ per_page: 100 });
      console.log('Fetched documents:', response.documents);
      const docsWithApproved = response.documents.filter(
        (d: Document) => d.approved_contents > 0 || d.status === 'approved'
      );
      setDocuments(docsWithApproved);
    } catch (error) {
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleProcess = async () => {
    if (!selectedDocId) { toast.error('Pilih dokumen terlebih dahulu'); return; }

    setProcessingStatus({ step: 'processing', message: 'Memproses...', progress: 20 });

    try {
      const processResponse = await processingApi.process(selectedDocId, chunkSize, chunkOverlap);
      if (processResponse.entries_created === 0) {
        setProcessingStatus({ step: 'idle', message: '', progress: 0 });
        toast.error('Tidak ada konten untuk diproses');
        return;
      }

      setProcessingStatus({ step: 'embedding', message: `${processResponse.entries_created} entries dibuat. Embedding...`, progress: 50 });

      const embedResponse = await processingApi.embed(undefined, batchSize);
      setProcessingStatus({
        step: 'complete',
        message: `Selesai! ${embedResponse.embedded_count} chunks di-embed.`,
        progress: 100,
        details: { entries: processResponse.entries_created, chunks: embedResponse.embedded_count },
      });
      toast.success('Processing selesai!');
      loadDocuments();
    } catch (error: any) {
      setProcessingStatus({ step: 'error', message: error.response?.data?.detail || 'Error', progress: 0 });
      toast.error('Processing gagal');
    }
  };

  const handleProcessAll = async () => {
    if (!confirm('Process semua dokumen approved?')) return;
    setProcessingStatus({ step: 'processing', message: 'Memproses semua...', progress: 20 });

    try {
      const processResponse = await processingApi.process(undefined, chunkSize, chunkOverlap);
      setProcessingStatus({ step: 'embedding', message: `${processResponse.entries_created} entries. Embedding...`, progress: 50 });
      const embedResponse = await processingApi.embed(undefined, batchSize);
      setProcessingStatus({
        step: 'complete', message: `Selesai! ${embedResponse.embedded_count} chunks.`, progress: 100,
        details: { entries: processResponse.entries_created, chunks: embedResponse.embedded_count },
      });
      toast.success('Selesai!');
      loadDocuments();
    } catch (error: any) {
      setProcessingStatus({ step: 'error', message: error.response?.data?.detail || 'Error', progress: 0 });
    }
  };

  const handleEmbedOnly = async () => {
    setProcessingStatus({ step: 'embedding', message: 'Embedding...', progress: 50 });
    try {
      const embedResponse = await processingApi.embed(undefined, batchSize);
      setProcessingStatus({ step: 'complete', message: `${embedResponse.embedded_count} chunks di-embed.`, progress: 100 });
      toast.success('Embedding selesai!');
    } catch (error: any) {
      setProcessingStatus({ step: 'error', message: error.response?.data?.detail || 'Error', progress: 0 });
    }
  };

  const isProcessing = processingStatus.step === 'processing' || processingStatus.step === 'embedding';

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-800">Processing</h1>
            <p className="text-gray-500">Proses konten approved ke Knowledge Base</p>
          </div>

          {/* Pipeline */}
          <div className="card mb-6">
            <h2 className="font-semibold text-gray-800 mb-4">Pipeline</h2>
            <div className="flex items-center justify-between">
              <div className={clsx('flex-1 text-center p-4 rounded-lg border-2', processingStatus.step === 'processing' ? 'border-blue-500 bg-blue-50' : processingStatus.progress > 20 ? 'border-green-500 bg-green-50' : 'border-gray-200')}>
                <Cog className={clsx('h-8 w-8 mx-auto mb-2', processingStatus.step === 'processing' ? 'text-blue-600 animate-spin' : 'text-gray-400')} />
                <p className="font-medium text-sm">1. Process</p>
              </div>
              <ArrowRight className="h-6 w-6 text-gray-300 mx-2" />
              <div className={clsx('flex-1 text-center p-4 rounded-lg border-2', processingStatus.step === 'embedding' ? 'border-blue-500 bg-blue-50' : processingStatus.progress > 50 ? 'border-green-500 bg-green-50' : 'border-gray-200')}>
                <Database className={clsx('h-8 w-8 mx-auto mb-2', processingStatus.step === 'embedding' ? 'text-blue-600 animate-pulse' : 'text-gray-400')} />
                <p className="font-medium text-sm">2. Embed</p>
              </div>
              <ArrowRight className="h-6 w-6 text-gray-300 mx-2" />
              <div className={clsx('flex-1 text-center p-4 rounded-lg border-2', processingStatus.step === 'complete' ? 'border-green-500 bg-green-50' : 'border-gray-200')}>
                <CheckCircle className={clsx('h-8 w-8 mx-auto mb-2', processingStatus.step === 'complete' ? 'text-green-600' : 'text-gray-400')} />
                <p className="font-medium text-sm">3. Complete</p>
              </div>
            </div>
          </div>

          {/* Status */}
          {processingStatus.step !== 'idle' && (
            <div className={clsx('card mb-6', processingStatus.step === 'error' && 'border-red-200 bg-red-50', processingStatus.step === 'complete' && 'border-green-200 bg-green-50')}>
              <div className="flex items-start space-x-3">
                {processingStatus.step === 'error' ? <AlertCircle className="h-6 w-6 text-red-600" /> : processingStatus.step === 'complete' ? <CheckCircle className="h-6 w-6 text-green-600" /> : <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />}
                <div className="flex-1">
                  <p className="font-medium">{processingStatus.message}</p>
                  {processingStatus.details && (
                    <div className="mt-2 text-sm text-gray-600">
                      {processingStatus.details.entries && <p>• {processingStatus.details.entries} knowledge entries</p>}
                      {processingStatus.details.chunks && <p>• {processingStatus.details.chunks} chunks embedded</p>}
                    </div>
                  )}
                  {isProcessing && (
                    <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${processingStatus.progress}%` }}></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Document Selection */}
          <div className="card mb-6">
            <h2 className="font-semibold text-gray-800 mb-4">Pilih Dokumen</h2>
            {loading ? (
              <div className="text-center py-8"><Loader2 className="h-8 w-8 text-gray-400 animate-spin mx-auto" /></div>
            ) : documents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p>Tidak ada dokumen dengan konten approved</p>
                <a href="/staging" className="text-green-600 hover:underline text-sm">Ke Staging</a>
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {documents.map((doc) => (
                  <div key={doc.id} onClick={() => setSelectedDocId(doc.id)}
                    className={clsx('p-3 rounded-lg border cursor-pointer', selectedDocId === doc.id ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300')}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-800 text-sm">{doc.original_filename}</p>
                        <p className="text-xs text-gray-500">{doc.jenjang} • {doc.kategori} • {doc.tahun}</p>
                      </div>
                      <div className="text-right">
                        <span className={clsx('badge', STATUS_COLORS[doc.status])}>{doc.status}</span>
                        <p className="text-xs text-gray-500 mt-1">{doc.approved_contents}/{doc.total_contents} approved</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Options */}
          <div className="card mb-6">
            <h2 className="font-semibold text-gray-800 mb-4">Opsi</h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Chunk Size</label>
                <input type="number" value={chunkSize} onChange={(e) => setChunkSize(parseInt(e.target.value))} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Chunk Overlap</label>
                <input type="number" value={chunkOverlap} onChange={(e) => setChunkOverlap(parseInt(e.target.value))} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Batch Size</label>
                <input type="number" value={batchSize} onChange={(e) => setBatchSize(parseInt(e.target.value))} className="input-field" />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="card">
            <div className="grid grid-cols-3 gap-4">
              <button onClick={handleProcess} disabled={!selectedDocId || isProcessing} className="btn-primary py-4 disabled:opacity-50 flex items-center justify-center space-x-2">
                <Play className="h-5 w-5" /><span>Process</span>
              </button>
              <button onClick={handleProcessAll} disabled={isProcessing} className="btn-success py-4 disabled:opacity-50 flex items-center justify-center space-x-2">
                <Layers className="h-5 w-5" /><span>Process All</span>
              </button>
              <button onClick={handleEmbedOnly} disabled={isProcessing} className="btn-secondary py-4 disabled:opacity-50 flex items-center justify-center space-x-2">
                <Database className="h-5 w-5" /><span>Embed Only</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
