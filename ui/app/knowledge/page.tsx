// app/knowledge/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { knowledgeApi, KnowledgeEntry } from '@/lib/api';
import { JENJANG_OPTIONS, KATEGORI_OPTIONS } from '@/lib/constants';
import { Database, Search, Plus, Edit3, Trash2, Eye, Loader2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';

export default function KnowledgePage() {
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({ jenjang: '', kategori: '', tahun: '' });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<KnowledgeEntry | null>(null);
  const perPage = 20;

  // Form state for manual entry
  const [formData, setFormData] = useState({
    content: '', title: '', tahun: '', tahun_ajaran: '', jenjang: '', kategori: '', cabang: '', keywords: ''
  });

  useEffect(() => { loadEntries(); }, [filters, page, searchQuery]);

  const loadEntries = async () => {
    setLoading(true);
    try {
      const response = await knowledgeApi.list({
        query: searchQuery || undefined,
        jenjang: filters.jenjang || undefined,
        kategori: filters.kategori || undefined,
        tahun: filters.tahun ? parseInt(filters.tahun) : undefined,
        page,
        per_page: perPage,
      });
      setEntries(response.entries);
      setTotal(response.total);
    } catch (error) {
      toast.error('Gagal memuat knowledge');
    } finally {
      setLoading(false);
    }
  };

  const handleAddManual = async () => {
    if (!formData.content) {
      toast.error('Konten tidak boleh kosong');
      return;
    }
    try {
      await knowledgeApi.addManual({
        content: formData.content,
        title: formData.title || undefined,
        tahun: formData.tahun ? parseInt(formData.tahun) : undefined,
        tahun_ajaran: formData.tahun_ajaran || undefined,
        jenjang: formData.jenjang || undefined,
        kategori: formData.kategori || undefined,
        cabang: formData.cabang || undefined,
        keywords: formData.keywords ? formData.keywords.split(',').map(k => k.trim()) : undefined,
      });
      toast.success('Knowledge berhasil ditambahkan');
      setShowAddModal(false);
      setFormData({ content: '', title: '', tahun: '', tahun_ajaran: '', jenjang: '', kategori: '', cabang: '', keywords: '' });
      loadEntries();
    } catch (error) {
      toast.error('Gagal menambahkan knowledge');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus knowledge ini?')) return;
    try {
      await knowledgeApi.delete(id);
      toast.success('Knowledge dihapus');
      loadEntries();
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
            <h1 className="text-2xl font-bold text-gray-800">Knowledge Base</h1>
            <p className="text-gray-500">{total} knowledge entries</p>
          </div>
          <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center space-x-2">
            <Plus className="h-4 w-4" /><span>Tambah Manual</span>
          </button>
        </div>

        {/* Search & Filters */}
        <div className="card mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari knowledge..."
                className="input-field pl-10"
              />
            </div>
            <select value={filters.jenjang} onChange={(e) => setFilters({ ...filters, jenjang: e.target.value })} className="select-field w-40">
              {JENJANG_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
            <select value={filters.kategori} onChange={(e) => setFilters({ ...filters, kategori: e.target.value })} className="select-field w-40">
              {KATEGORI_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
        </div>

        {/* Entries Grid */}
        {loading ? (
          <div className="text-center py-12"><Loader2 className="h-8 w-8 text-gray-400 animate-spin mx-auto" /></div>
        ) : entries.length === 0 ? (
          <div className="card text-center py-12 text-gray-500">
            <Database className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p>Tidak ada knowledge entries</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {entries.map((entry) => (
              <div key={entry.id} className="card hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-medium text-gray-800 text-sm line-clamp-1">
                      {entry.title || 'Untitled'}
                    </h3>
                    <div className="flex items-center space-x-2 mt-1">
                      {entry.jenjang && <span className="badge badge-green">{entry.jenjang}</span>}
                      {entry.kategori && <span className="badge badge-blue capitalize">{entry.kategori}</span>}
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <button onClick={() => setSelectedEntry(entry)} className="p-1 text-gray-400 hover:text-blue-600">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(entry.id)} className="p-1 text-gray-400 hover:text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-600 line-clamp-3">{entry.content}</p>
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                  <span>{entry.tahun_ajaran || entry.tahun || '-'}</span>
                  <span>v{entry.version}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b flex items-center justify-between">
                <h2 className="text-lg font-semibold">Tambah Knowledge Manual</h2>
                <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Judul</label>
                  <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="input-field" placeholder="Judul knowledge" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Konten *</label>
                  <textarea value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} className="input-field" rows={6} placeholder="Isi konten knowledge..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tahun Ajaran</label>
                    <input type="text" value={formData.tahun_ajaran} onChange={(e) => setFormData({ ...formData, tahun_ajaran: e.target.value })} className="input-field" placeholder="2024/2025" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tahun</label>
                    <input type="number" value={formData.tahun} onChange={(e) => setFormData({ ...formData, tahun: e.target.value })} className="input-field" placeholder="2024" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Jenjang</label>
                    <select value={formData.jenjang} onChange={(e) => setFormData({ ...formData, jenjang: e.target.value })} className="select-field">
                      {JENJANG_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                    <select value={formData.kategori} onChange={(e) => setFormData({ ...formData, kategori: e.target.value })} className="select-field">
                      {KATEGORI_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Keywords (pisahkan dengan koma)</label>
                  <input type="text" value={formData.keywords} onChange={(e) => setFormData({ ...formData, keywords: e.target.value })} className="input-field" placeholder="biaya, spp, sd" />
                </div>
              </div>
              <div className="p-6 border-t flex justify-end space-x-3">
                <button onClick={() => setShowAddModal(false)} className="btn-secondary">Batal</button>
                <button onClick={handleAddManual} className="btn-primary">Simpan</button>
              </div>
            </div>
          </div>
        )}

        {/* View Modal */}
        {selectedEntry && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b flex items-center justify-between">
                <h2 className="text-lg font-semibold">{selectedEntry.title || 'Knowledge Detail'}</h2>
                <button onClick={() => setSelectedEntry(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-6">
                <div className="flex space-x-2 mb-4">
                  {selectedEntry.jenjang && <span className="badge badge-green">{selectedEntry.jenjang}</span>}
                  {selectedEntry.kategori && <span className="badge badge-blue capitalize">{selectedEntry.kategori}</span>}
                  {selectedEntry.tahun && <span className="badge badge-gray">{selectedEntry.tahun}</span>}
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap">
                  {selectedEntry.content}
                </div>
                {selectedEntry.keywords && selectedEntry.keywords.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs text-gray-500 mb-2">Keywords:</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedEntry.keywords.map((kw, i) => (
                        <span key={i} className="badge badge-gray">{kw}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
