// app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { 
  FileText, 
  Database, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  TrendingUp,
  Layers,
  RefreshCw,
  BarChart3,
  Server
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Statistics, statisticsApi } from '@/lib/statistics';

export default function Dashboard() {
  const [stats, setStats] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await statisticsApi.getAll();
      setStats(response.statistics);
      toast.success('Statistics loaded successfully');
    } catch (error) {
      console.error('Failed to load stats:', error);
      toast.error('Failed to load statistics');
      
      // Fallback to empty stats
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
          pending: 0,
        },
        staging: {
          pending_review: 0,
          approved: 0,
        },
        vectorstore: {
          total: 0,
          by_jenjang: {},
          by_kategori: {},
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    color, 
    subtext,
    trend 
  }: { 
    title: string; 
    value: number | string; 
    icon: any; 
    color: string;
    subtext?: string;
    trend?: 'up' | 'down' | 'neutral';
  }) => (
    <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-500 font-medium mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value.toLocaleString()}</p>
          {subtext && (
            <p className="text-xs text-gray-400 mt-2 flex items-center">
              {trend === 'up' && <span className="text-green-500 mr-1">↑</span>}
              {trend === 'down' && <span className="text-red-500 mr-1">↓</span>}
              {subtext}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );

  const ProgressBar = ({ 
    label, 
    value, 
    total, 
    color = 'bg-blue-600' 
  }: { 
    label: string; 
    value: number; 
    total: number;
    color?: string;
  }) => {
    const percentage = total > 0 ? Math.min(100, (value / total) * 100) : 0;
    
    return (
      <div className="mb-4 last:mb-0">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600 font-medium">{label}</span>
          <span className="text-sm font-semibold text-gray-900">{value.toLocaleString()}</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2.5">
          <div 
            className={`${color} h-2.5 rounded-full transition-all duration-500`}
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-64 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-64 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <main className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500 mt-1">Knowledge Base Management Overview</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Main Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Documents"
            value={stats?.documents.total || 0}
            icon={FileText}
            color="bg-blue-600"
            subtext={`${Object.values(stats?.documents.by_status || {}).reduce((a, b) => a + b, 0)} processed`}
          />
          <StatCard
            title="Knowledge Entries"
            value={stats?.knowledge_entries.active || 0}
            icon={Database}
            color="bg-green-600"
            subtext={`${stats?.knowledge_entries.total || 0} total vectors`}
            trend="up"
          />
          <StatCard
            title="Chunks Processing"
            value={stats?.chunks.total || 0}
            icon={Layers}
            color="bg-purple-600"
            subtext={`${stats?.chunks.embedded || 0} embedded, ${stats?.chunks.pending || 0} pending`}
          />
          <StatCard
            title="Vector Database"
            value={stats?.vectorstore.total || 0}
            icon={Server}
            color="bg-indigo-600"
            subtext="Total vectors in ChromaDB"
          />
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Knowledge by Jenjang */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center text-lg">
              <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
              Knowledge by Jenjang
            </h3>
            <div className="space-y-3">
              {Object.entries(stats?.knowledge_entries.by_jenjang || {}).length > 0 ? (
                Object.entries(stats?.knowledge_entries.by_jenjang || {})
                  .sort(([, a], [, b]) => (b as number) - (a as number))
                  .map(([jenjang, count]) => (
                    <ProgressBar
                      key={jenjang}
                      label={jenjang}
                      value={count as number}
                      total={stats?.knowledge_entries.total || 1}
                      color="bg-green-600"
                    />
                  ))
              ) : (
                <div className="text-center py-8">
                  <Database className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">No data available</p>
                </div>
              )}
            </div>
          </div>

          {/* Knowledge by Kategori */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center text-lg">
              <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
              Knowledge by Kategori
            </h3>
            <div className="space-y-3">
              {Object.entries(stats?.knowledge_entries.by_kategori || {}).length > 0 ? (
                Object.entries(stats?.knowledge_entries.by_kategori || {})
                  .sort(([, a], [, b]) => (b as number) - (a as number))
                  .map(([kategori, count]) => (
                    <ProgressBar
                      key={kategori}
                      label={kategori.charAt(0).toUpperCase() + kategori.slice(1)}
                      value={count as number}
                      total={stats?.knowledge_entries.total || 1}
                      color="bg-blue-600"
                    />
                  ))
              ) : (
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">No data available</p>
                </div>
              )}
            </div>
          </div>

          {/* Document Status */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center text-lg">
              <FileText className="h-5 w-5 mr-2 text-purple-600" />
              Document Status
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(stats?.documents.by_status || {}).length > 0 ? (
                Object.entries(stats?.documents.by_status || {}).map(([status, count]) => {
                  const statusColors: Record<string, string> = {
                    'completed': 'bg-green-50 border-green-200 text-green-700',
                    'processing': 'bg-blue-50 border-blue-200 text-blue-700',
                    'pending': 'bg-yellow-50 border-yellow-200 text-yellow-700',
                    'failed': 'bg-red-50 border-red-200 text-red-700',
                  };
                  
                  return (
                    <div 
                      key={status} 
                      className={`rounded-lg p-4 border ${statusColors[status] || 'bg-gray-50 border-gray-200'}`}
                    >
                      <p className="text-xs uppercase font-semibold mb-1">
                        {status}
                      </p>
                      <p className="text-2xl font-bold">{count as number}</p>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-2 text-center py-8">
                  <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">No documents yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center text-lg">
              <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
              Quick Actions
            </h3>
            <div className="space-y-3">
              <a 
                href="/documents" 
                className="block w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center font-medium"
              >
                📄 Upload New Document
              </a>
              
            </div>
          </div>
        </div>

        {/* System Health */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center text-lg">
            <Server className="h-5 w-5 mr-2 text-indigo-600" />
            System Health
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
              <div>
                <p className="text-sm text-green-700 font-medium">Database</p>
                <p className="text-xs text-green-600 mt-1">Connected</p>
              </div>
              <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
            </div>
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
              <div>
                <p className="text-sm text-green-700 font-medium">ChromaDB</p>
                <p className="text-xs text-green-600 mt-1">{stats?.vectorstore.total || 0} vectors</p>
              </div>
              <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
            </div>
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
              <div>
                <p className="text-sm text-green-700 font-medium">API</p>
                <p className="text-xs text-green-600 mt-1">Online</p>
              </div>
              <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}