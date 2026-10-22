import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Navbar } from '../components/Navbar';
import { QuotaMeter } from '../components/QuotaMeter';
import { DocumentCard } from '../components/DocumentCard';
import { UploadModal } from '../components/UploadModal';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import {
  Plus,
  RefreshCw,
  Search,
  AlertCircle,
  Inbox,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { quota, refreshUser } = useAuth();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch documents with auto-polling if any document is in processing state
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['documents'],
    queryFn: async () => {
      const res = await api.getDocuments();
      return res.documents;
    },
    refetchInterval: (query) => {
      // Auto-poll every 3 seconds if any document is still uploading or processing
      const hasActiveJobs = query.state.data?.some(
        (doc) => doc.status === 'processing' || doc.status === 'uploading'
      );
      return hasActiveJobs ? 3000 : false;
    },
  });

  const documents = data || [];
  const filteredDocuments = documents.filter(
    (doc) =>
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.originalFilename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUploadSuccess = () => {
    refetch();
    refreshUser();
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 space-y-8">
        {/* Hero Section & Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-800/80">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-3">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Strict Grounding & Provenance Engine</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">
              Pustaka Dokumen Anda
            </h1>
            <p className="mt-1 text-sm text-slate-400 max-w-xl">
              Unggah laporan, manual, atau artikel ilmiah. Ajukan pertanyaan apa pun dan periksa kutipan sumber asli langsung ke nomor halamannya.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              title="Perbarui data"
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin text-emerald-400' : ''}`} />
            </button>

            <button
              onClick={() => setIsUploadOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-600 hover:to-teal-500 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all duration-200 hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4" />
              <span>Unggah Dokumen PDF</span>
            </button>
          </div>
        </div>

        {/* Quota & Search Bar Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            {quota ? (
              <QuotaMeter quota={quota} />
            ) : (
              <div className="glass-card p-4 rounded-xl flex items-center gap-3">
                <Zap className="w-5 h-5 text-emerald-400" />
                <div className="text-xs">
                  <div className="font-semibold text-slate-200">Batas Ukuran & Halaman</div>
                  <div className="text-slate-400">Hingga 10 MB & 50 Halaman per PDF</div>
                </div>
              </div>
            )}
          </div>

          <div className="md:col-span-2 flex items-center">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari berdasarkan judul atau nama berkas..."
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-900/60 border border-slate-800 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Error State */}
        {isError && (
          <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800/60 flex items-start gap-3 text-sm text-rose-300">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Gagal memuat dokumen</p>
              <p className="text-xs text-rose-400/90 mt-0.5">{(error as any)?.message}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card p-5 rounded-2xl h-44 animate-pulse">
                <div className="w-10 h-10 bg-slate-800 rounded-xl mb-4" />
                <div className="w-3/4 h-4 bg-slate-800 rounded mb-2" />
                <div className="w-1/2 h-3 bg-slate-800 rounded" />
              </div>
            ))}
          </div>
        )}

        {/* Document Cards Grid */}
        {!isLoading && filteredDocuments.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocuments.map((doc) => (
              <DocumentCard key={doc.id} document={doc} onRefresh={refetch} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredDocuments.length === 0 && (
          <div className="glass-card rounded-3xl p-12 text-center max-w-xl mx-auto flex flex-col items-center border border-dashed border-slate-800">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 text-slate-500 flex items-center justify-center mb-4">
              <Inbox className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-200">
              {searchQuery ? 'Dokumen tidak ditemukan' : 'Belum ada dokumen di perpustakaan'}
            </h3>
            <p className="mt-1 text-xs text-slate-400 max-w-md">
              {searchQuery
                ? `Tidak ada dokumen yang cocok dengan kata kunci "${searchQuery}".`
                : 'Unggah file PDF pertama Anda untuk mulai menanyakan analisis, metodologi, dan bukti secara otomatis.'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setIsUploadOpen(true)}
                className="mt-6 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Unggah PDF Sekarang</span>
              </button>
            )}
          </div>
        )}
      </main>

      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={handleUploadSuccess}
      />
    </div>
  );
};
