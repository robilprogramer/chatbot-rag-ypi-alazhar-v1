// app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { statsApi, Statistics } from '@/lib/api';
import { 
  FileText, 
  Database, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  TrendingUp,
  Layers
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const [stats, setStats] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await statsApi.get();
      setStats(response.statistics);
    } catch (error) {
      console.error('Failed to load stats:', error);
      // Use mock data for demo
      setStats({
        documents: {
          total: 0,
          by_status: {},
          by_jenjang: {},
          by_kategori: {},
        },
        knowledge_entries: {
          total: 0,
          active: 0,
          by_jenjang: {},
          by_kategori: {},
        },
        chunks: {
          total: 0,
          embedded: 0,
        },
        staging: {
          pending_review: 0,
          approved: 0,
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    color, 
    subtext 
  }: { 
    title: string; 
    value: number | string; 
    icon: any; 
    color: string;
    subtext?: string;
  }) => (
    <div className="card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
          {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      
      <main className="flex-1 p-8 bg-gray-50">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-500">Overview Knowledge Base Management</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Dokumen"
            value={stats?.documents.total || 0}
            icon={FileText}
            color="bg-blue-500"
          />
          <StatCard
            title="Knowledge Entries"
            value={stats?.knowledge_entries.active || 0}
            icon={Database}
            color="bg-green-600"
            subtext={`${stats?.knowledge_entries.total || 0} total`}
          />
          <StatCard
            title="Pending Review"
            value={stats?.staging.pending_review || 0}
            icon={Clock}
            color="bg-yellow-500"
          />
          <StatCard
            title="Chunks Embedded"
            value={stats?.chunks.embedded || 0}
            icon={Layers}
            color="bg-purple-500"
            subtext={`${stats?.chunks.total || 0} total chunks`}
          />
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* By Jenjang */}
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
              Knowledge by Jenjang
            </h3>
            <div className="space-y-3">
              {Object.entries(stats?.knowledge_entries.by_jenjang || {}).length > 0 ? (
                Object.entries(stats?.knowledge_entries.by_jenjang || {}).map(([jenjang, count]) => (
                  <div key={jenjang} className="flex items-center justify-between">
                    <span className="text-gray-600">{jenjang}</span>
                    <div className="flex items-center">
                      <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ 
                            width: `${Math.min(100, (count as number / (stats?.knowledge_entries.total || 1)) * 100)}%` 
                          }}
                        ></div>
                      </div>
                      <span className="font-medium text-gray-800 w-12 text-right">{count as number}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-sm">Belum ada data</p>
              )}
            </div>
          </div>

          {/* By Kategori */}
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
              <Layers className="h-5 w-5 mr-2 text-blue-600" />
              Knowledge by Kategori
            </h3>
            <div className="space-y-3">
              {Object.entries(stats?.knowledge_entries.by_kategori || {}).length > 0 ? (
                Object.entries(stats?.knowledge_entries.by_kategori || {}).map(([kategori, count]) => (
                  <div key={kategori} className="flex items-center justify-between">
                    <span className="text-gray-600 capitalize">{kategori}</span>
                    <div className="flex items-center">
                      <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ 
                            width: `${Math.min(100, (count as number / (stats?.knowledge_entries.total || 1)) * 100)}%` 
                          }}
                        ></div>
                      </div>
                      <span className="font-medium text-gray-800 w-12 text-right">{count as number}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-sm">Belum ada data</p>
              )}
            </div>
          </div>

          {/* Document Status */}
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-purple-600" />
              Document Status
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(stats?.documents.by_status || {}).length > 0 ? (
                Object.entries(stats?.documents.by_status || {}).map(([status, count]) => (
                  <div key={status} className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 uppercase">{status}</p>
                    <p className="text-xl font-bold text-gray-800">{count as number}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-sm col-span-2">Belum ada dokumen</p>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
              Quick Actions
            </h3>
            <div className="space-y-3">
              <a 
                href="/upload" 
                className="block w-full btn-primary text-center"
              >
                Upload Dokumen Baru
              </a>
              <a 
                href="/staging" 
                className="block w-full btn-secondary text-center"
              >
                Review Staging ({stats?.staging.pending_review || 0} pending)
              </a>
              <a 
                href="/processing" 
                className="block w-full btn-secondary text-center"
              >
                Process & Embed
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
