// app/documents/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { documentApi, Document } from '@/lib/api';
import { JENJANG_OPTIONS, KATEGORI_OPTIONS, STATUS_COLORS, STATUS_OPTIONS } from '@/lib/constants';
import { FileText, Search, Filter, Trash2, Eye, MoreVertical, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { format } from 'date-fns';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', jenjang: '', kategori: '', tahun: '' });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const perPage = 20;

  useEffect(() => { loadDocuments(); }, [filters, page]);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const response = await documentApi.list({
        status: filters.status || undefined,
        jenjang: filters.jenjang || undefined,
        kategori: filters.kategori || undefined,
        tahun: filters.tahun ? parseInt(filters.tahun) : undefined,
        page,
        per_page: perPage,
      });
      setDocuments(response.documents);
      setTotal(response.total);
    } catch (error) {
      toast.error('Gagal memuat dokumen');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus dokumen ini?')) return;
    try {
      await documentApi.delete(id);
      toast.success('Dokumen dihapus');
      loadDocuments();
    } catch (error) {
      toast.error('Gagal menghapus');
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 bg-gray-50">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Dokumen</h1>
            <p className="text-gray-500">{total} dokumen</p>
          </div>
          <a href="/upload" className="btn-primary">Upload Baru</a>
        </div>

        {/* Filters */}
        <div className="card mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="select-field">
              {STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
            <select value={filters.jenjang} onChange={(e) => setFilters({ ...filters, jenjang: e.target.value })} className="select-field">
              {JENJANG_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
            <select value={filters.kategori} onChange={(e) => setFilters({ ...filters, kategori: e.target.value })} className="select-field">
              {KATEGORI_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
            <select value={filters.tahun} onChange={(e) => setFilters({ ...filters, tahun: e.target.value })} className="select-field">
              <option value="">Semua Tahun</option>
              <option value="2024">2024</option>
              <option value="2025">2025</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          {loading ? (
            <div className="text-center py-12"><Loader2 className="h-8 w-8 text-gray-400 animate-spin mx-auto" /></div>
          ) : documents.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p>Tidak ada dokumen</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Nama File</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Jenjang</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Kategori</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Tahun</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Contents</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <p className="font-medium text-gray-800 text-sm">{doc.original_filename}</p>
                      {doc.title && <p className="text-xs text-gray-500">{doc.title}</p>}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{doc.jenjang || '-'}</td>
                    <td className="py-3 px-4 text-sm text-gray-600 capitalize">{doc.kategori || '-'}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{doc.tahun || '-'}</td>
                    <td className="py-3 px-4">
                      <span className={clsx('badge', STATUS_COLORS[doc.status])}>{doc.status}</span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {doc.approved_contents}/{doc.total_contents}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <a href={`/staging?document_id=${doc.id}`} className="text-blue-600 hover:text-blue-700 mr-3">
                        <Eye className="h-4 w-4 inline" />
                      </a>
                      <button onClick={() => handleDelete(doc.id)} className="text-red-600 hover:text-red-700">
                        <Trash2 className="h-4 w-4 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
