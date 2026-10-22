import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Trash2,
  MessageSquare,
  Loader2,
} from 'lucide-react';
import { DocumentItem } from '../types';
import { api } from '../api/client';

interface DocumentCardProps {
  document: DocumentItem;
  onRefresh: () => void;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({ document, onRefresh }) => {
  const navigate = useNavigate();
  const [isRetrying, setIsRetrying] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleRetry = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setIsRetrying(true);
      await api.retryDocument(document.id);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Gagal memicu ulang proses dokumen.');
    } finally {
      setIsRetrying(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (
      !window.confirm(
        `Apakah Anda yakin ingin menghapus dokumen "${document.title}" beserta seluruh riwayat chatnya?`
      )
    ) {
      return;
    }

    try {
      setIsDeleting(true);
      await api.deleteDocument(document.id);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus dokumen.');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const renderStatusBadge = () => {
    switch (document.status) {
      case 'ready':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Siap Ditanyakan</span>
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold animate-pulse">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Memproses Ekstraksi & Vektor...</span>
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Gagal Diproses</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
            <Clock className="w-3.5 h-3.5" />
            <span>Mengunggah...</span>
          </span>
        );
    }
  };

  return (
    <div
      onClick={() => document.status === 'ready' && navigate(`/documents/${document.id}`)}
      className={`glass-card p-5 rounded-2xl flex flex-col justify-between transition-all duration-300 ${
        document.status === 'ready'
          ? 'cursor-pointer hover:-translate-y-1'
          : 'opacity-95'
      }`}
    >
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="p-3 rounded-xl bg-slate-800 text-emerald-400 shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div className="flex items-center gap-2">
            {renderStatusBadge()}
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              title="Hapus Dokumen"
              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <h4 className="text-base font-bold text-slate-100 line-clamp-1 mb-1">
          {document.title}
        </h4>
        <p className="text-xs text-slate-400 line-clamp-1 mb-4 font-mono">
          {document.originalFilename}
        </p>

        {/* Failure message if failed */}
        {document.status === 'failed' && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/40 border border-rose-800/40 text-xs text-rose-300">
            <p className="font-semibold">{document.errorCode || 'PROSES_GAGAL'}</p>
            <p className="mt-0.5 text-rose-400/90">{document.errorMessage || 'Gagal memproses dokumen PDF.'}</p>
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-3">
          <span>{formatFileSize(document.fileSizeBytes)}</span>
          {document.pageCount && (
            <>
              <span>•</span>
              <span>{document.pageCount} Halaman</span>
            </>
          )}
        </div>

        {document.status === 'ready' && (
          <button
            onClick={() => navigate(`/documents/${document.id}`)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-semibold transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Tanya AI</span>
          </button>
        )}

        {document.status === 'failed' && (
          <button
            onClick={handleRetry}
            disabled={isRetrying}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-semibold transition-colors"
          >
            {isRetrying ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RotateCcw className="w-3.5 h-3.5" />
            )}
            <span>Coba Lagi</span>
          </button>
        )}
      </div>
    </div>
  );
};
