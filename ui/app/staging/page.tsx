// app/staging/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { stagingApi, documentApi, ParsedContent, Document } from '@/lib/api';
import { STATUS_COLORS, CONTENT_TYPE_LABELS } from '@/lib/constants';
import { 
  FileText, 
  Check, 
  X, 
  Edit3, 
  Eye,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Table,
  Image,
  AlertCircle,
  Loader2,
  Save
} from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';

export default function StagingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const documentId = searchParams.get('document_id');
  
  const [contents, setContents] = useState<ParsedContent[]>([]);
  const [document, setDocument] = useState<Document | null>(null);
  const [selectedContent, setSelectedContent] = useState<ParsedContent | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [sectionTitle, setSectionTitle] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const perPage = 10;

  useEffect(() => {
    loadContents();
    if (documentId) {
      loadDocument();
    }
  }, [documentId, currentPage]);

  const loadDocument = async () => {
    if (!documentId) return;
    try {
      const response = await documentApi.get(documentId);
      setDocument(response.document);
    } catch (error) {
      console.error('Failed to load document:', error);
    }
  };

  const loadContents = async () => {
    setLoading(true);
    try {
      const response = await stagingApi.list({
        document_id: documentId || undefined,
        page: currentPage,
        per_page: perPage,
      });
      setContents(response.contents);
      setTotalItems(response.total);
    } catch (error) {
      console.error('Failed to load contents:', error);
      toast.error('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectContent = (content: ParsedContent) => {
    setSelectedContent(content);
    setEditedContent(content.edited_content || content.original_content);
    setSectionTitle(content.section_title || '');
    setReviewNotes(content.review_notes || '');
    setEditMode(false);
  };

  const handleSaveEdit = async () => {
    if (!selectedContent) return;
    
    setSaving(true);
    try {
      const response = await stagingApi.edit(selectedContent.id, {
        edited_content: editedContent,
        section_title: sectionTitle,
        review_notes: reviewNotes,
      });
      
      toast.success('Perubahan disimpan');
      setEditMode(false);
      
      // Update local state
      setContents(contents.map(c => 
        c.id === selectedContent.id ? response.content : c
      ));
      setSelectedContent(response.content);
    } catch (error) {
      toast.error('Gagal menyimpan perubahan');
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async (contentId: string) => {
    try {
      await stagingApi.approve(contentId);
      toast.success('Content diapprove');
      
      // Update local state
      setContents(contents.map(c => 
        c.id === contentId ? { ...c, status: 'approved', needs_review: false } : c
      ));
      
      if (selectedContent?.id === contentId) {
        setSelectedContent({ ...selectedContent, status: 'approved', needs_review: false });
      }
    } catch (error) {
      toast.error('Gagal approve content');
    }
  };

  const handleReject = async (contentId: string) => {
    const reason = prompt('Alasan reject (opsional):');
    try {
      await stagingApi.reject(contentId, reason || undefined);
      toast.success('Content direject');
      
      // Update local state
      setContents(contents.map(c => 
        c.id === contentId ? { ...c, status: 'rejected', needs_review: false } : c
      ));
      
      if (selectedContent?.id === contentId) {
        setSelectedContent({ ...selectedContent, status: 'rejected', needs_review: false });
      }
    } catch (error) {
      toast.error('Gagal reject content');
    }
  };

  const handleApproveAll = async () => {
    if (!documentId) {
      toast.error('Pilih dokumen terlebih dahulu');
      return;
    }
    
    if (!confirm('Approve semua content dari dokumen ini?')) return;
    
    try {
      const response = await stagingApi.approveAll(documentId);
      toast.success(`${response.approved_count} content diapprove`);
      loadContents();
    } catch (error) {
      toast.error('Gagal approve semua content');
    }
  };

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'text': return <FileText className="h-4 w-4" />;
      case 'table': return <Table className="h-4 w-4" />;
      case 'image': return <Image className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  // Helper function to check if content can be approved/rejected
  const canApproveOrReject = (status: string) => {
    const finalStatuses = ['approved', 'rejected', 'live'];
    return !finalStatuses.includes(status);
  };

  const totalPages = Math.ceil(totalItems / perPage);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      
      <main className="flex-1 bg-gray-50">
        <div className="flex h-screen">
          {/* Left Panel - Content List */}
          <div className="w-1/3 border-r border-gray-200 bg-white flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
              <h1 className="text-xl font-bold text-gray-800">Staging / Review</h1>
              {document && (
                <p className="text-sm text-gray-500 mt-1">
                  {document.original_filename}
                </p>
              )}
              
              {documentId && (
                <button
                  onClick={handleApproveAll}
                  className="mt-3 w-full btn-success flex items-center justify-center space-x-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>Approve Semua</span>
                </button>
              )}
            </div>
            
            {/* Content List */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center">
                  <Loader2 className="h-8 w-8 text-gray-400 animate-spin mx-auto" />
                </div>
              ) : contents.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p>Tidak ada content di staging</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {contents.map((content, index) => (
                    <div
                      key={content.id}
                      onClick={() => handleSelectContent(content)}
                      className={clsx(
                        'p-4 cursor-pointer hover:bg-gray-50 transition-colors',
                        selectedContent?.id === content.id && 'bg-green-50 border-l-4 border-green-600'
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <div className={clsx(
                            'p-2 rounded-lg',
                            content.content_type === 'text' && 'bg-blue-100 text-blue-600',
                            content.content_type === 'table' && 'bg-purple-100 text-purple-600',
                            content.content_type === 'image' && 'bg-orange-100 text-orange-600',
                          )}>
                            {getContentIcon(content.content_type)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800 text-sm">
                              {content.section_title || `Content #${index + 1}`}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {CONTENT_TYPE_LABELS[content.content_type] || content.content_type}
                              {content.page_number && ` • Hal. ${content.page_number}`}
                            </p>
                            <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                              {(content.edited_content || content.original_content).substring(0, 100)}...
                            </p>
                          </div>
                        </div>
                        <span className={clsx('badge', STATUS_COLORS[content.status])}>
                          {content.status}
                        </span>
                      </div>
                      
                      {/* Quick Actions - Only show if can approve/reject */}
                      {canApproveOrReject(content.status) && (
                        <div className="flex space-x-2 mt-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleApprove(content.id);
                            }}
                            className="flex-1 btn-success text-xs py-1"
                          >
                            <Check className="h-3 w-3 inline mr-1" />
                            Approve
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReject(content.id);
                            }}
                            className="flex-1 btn-danger text-xs py-1"
                          >
                            <X className="h-3 w-3 inline mr-1" />
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-gray-200 flex items-center justify-between">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="btn-secondary text-sm disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm text-gray-600">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="btn-secondary text-sm disabled:opacity-50"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
          
          {/* Right Panel - Content Detail & Editor */}
          <div className="flex-1 flex flex-col">
            {selectedContent ? (
              <>
                {/* Detail Header */}
                <div className="p-4 border-b border-gray-200 bg-white flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold text-gray-800">
                      {selectedContent.section_title || 'Content Detail'}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {CONTENT_TYPE_LABELS[selectedContent.content_type]} 
                      <span className={clsx('ml-2 badge', STATUS_COLORS[selectedContent.status])}>
                        {selectedContent.status}
                      </span>
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {editMode ? (
                      <>
                        <button
                          onClick={() => setEditMode(false)}
                          className="btn-secondary"
                          disabled={saving}
                        >
                          Batal
                        </button>
                        <button
                          onClick={handleSaveEdit}
                          className="btn-primary flex items-center space-x-2"
                          disabled={saving}
                        >
                          {saving ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4" />
                          )}
                          <span>Simpan</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setEditMode(true)}
                          className="btn-secondary flex items-center space-x-2"
                        >
                          <Edit3 className="h-4 w-4" />
                          <span>Edit</span>
                        </button>
                        {canApproveOrReject(selectedContent.status) && (
                          <>
                            <button
                              onClick={() => handleApprove(selectedContent.id)}
                              className="btn-success"
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(selectedContent.id)}
                              className="btn-danger"
                            >
                              <X className="h-4 w-4 mr-1" />
                              Reject
                            </button>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
                
                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-6">
                  {editMode ? (
                    <div className="space-y-4">
                      {/* Section Title */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Judul Section
                        </label>
                        <input
                          type="text"
                          value={sectionTitle}
                          onChange={(e) => setSectionTitle(e.target.value)}
                          className="input-field"
                          placeholder="Contoh: Biaya SPP SD"
                        />
                      </div>
                      
                      {/* Edited Content */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Konten (Edit di sini)
                        </label>
                        <textarea
                          value={editedContent}
                          onChange={(e) => setEditedContent(e.target.value)}
                          className="input-field font-mono text-sm"
                          rows={20}
                        />
                        <p className="text-xs text-gray-400 mt-1">
                          {editedContent.length} karakter
                        </p>
                      </div>
                      
                      {/* Review Notes */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Catatan Review
                        </label>
                        <textarea
                          value={reviewNotes}
                          onChange={(e) => setReviewNotes(e.target.value)}
                          className="input-field"
                          rows={3}
                          placeholder="Catatan perubahan yang dilakukan..."
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Original vs Edited */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Original */}
                        <div>
                          <h3 className="font-medium text-gray-700 mb-2 flex items-center">
                            <Eye className="h-4 w-4 mr-2 text-gray-400" />
                            Konten Asli (Hasil Parsing)
                          </h3>
                          <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600 whitespace-pre-wrap max-h-96 overflow-y-auto border border-gray-200">
                            {selectedContent.original_content}
                          </div>
                        </div>
                        
                        {/* Edited */}
                        <div>
                          <h3 className="font-medium text-gray-700 mb-2 flex items-center">
                            <Edit3 className="h-4 w-4 mr-2 text-green-600" />
                            Konten Setelah Edit
                          </h3>
                          <div className="bg-green-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap max-h-96 overflow-y-auto border border-green-200">
                            {selectedContent.edited_content || selectedContent.original_content}
                          </div>
                        </div>
                      </div>
                      
                      {/* Extracted Entities */}
                      {selectedContent.extracted_entities && Object.keys(selectedContent.extracted_entities).length > 0 && (
                        <div>
                          <h3 className="font-medium text-gray-700 mb-2">
                            Extracted Entities
                          </h3>
                          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                            <pre className="text-xs text-blue-800 overflow-x-auto">
                              {JSON.stringify(selectedContent.extracted_entities, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}
                      
                      {/* Review Notes */}
                      {selectedContent.review_notes && (
                        <div>
                          <h3 className="font-medium text-gray-700 mb-2">
                            Catatan Review
                          </h3>
                          <div className="bg-yellow-50 rounded-lg p-4 text-sm text-yellow-800 border border-yellow-200">
                            {selectedContent.review_notes}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg">Pilih content untuk melihat detail</p>
                  <p className="text-sm mt-1">Klik item di panel kiri</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}