import React, { useState, useRef } from 'react';
import { UploadCloud, X, FileText, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../api/client';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [customTitle, setCustomTitle] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const validateAndSetFile = (selectedFile: File) => {
    setErrorMessage(null);

    if (!selectedFile.name.toLowerCase().endsWith('.pdf') && selectedFile.type !== 'application/pdf') {
      setErrorMessage('Hanya berkas format PDF yang diperbolehkan.');
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setErrorMessage('Ukuran file melebihi batas maksimal 10 MB.');
      return;
    }

    setFile(selectedFile);
    if (!customTitle) {
      setCustomTitle(selectedFile.name.replace(/\.pdf$/i, ''));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setErrorMessage('Silakan pilih berkas PDF terlebih dahulu.');
      return;
    }

    try {
      setIsUploading(true);
      setErrorMessage(null);
      await api.uploadDocument(file, customTitle.trim() || undefined);
      onSuccess();
      onClose();
      // Reset state
      setFile(null);
      setCustomTitle('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal mengunggah dokumen.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg glass-panel p-6 rounded-2xl border border-slate-700/60 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <UploadCloud className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-100">Unggah Dokumen PDF</h3>
          </div>
          <button
            onClick={onClose}
            disabled={isUploading}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="mt-4 p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 flex items-start gap-2.5 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleUpload} className="mt-5 space-y-4">
          {/* Dropzone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${
              isDragOver
                ? 'border-emerald-500 bg-emerald-500/5'
                : 'border-slate-700 hover:border-slate-600 bg-slate-900/40'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,application/pdf"
              className="hidden"
            />

            {file ? (
              <div className="flex flex-col items-center gap-2">
                <div className="p-3 rounded-full bg-emerald-500/10 text-emerald-400">
                  <FileText className="w-8 h-8" />
                </div>
                <div className="text-sm font-semibold text-slate-200">{file.name}</div>
                <div className="text-xs text-slate-400">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </div>
                <span className="text-[11px] text-emerald-400 font-medium">Klik untuk mengganti</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-slate-400">
                <UploadCloud className="w-10 h-10 text-slate-500" />
                <div className="text-sm font-medium text-slate-300">
                  Tarik berkas PDF ke sini atau <span className="text-emerald-400 underline">pilih dari perangkat</span>
                </div>
                <div className="text-xs text-slate-500">
                  Maksimal 10 MB • Hingga 50 Halaman • PDF Teks (Bukan Scan Gambar)
                </div>
              </div>
            )}
          </div>

          {/* Title Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Judul Dokumen (Opsional)
            </label>
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="Contoh: Laporan Tahunan 2026"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2 rounded-xl border border-slate-700 text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={!file || isUploading}
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-bold text-slate-950 flex items-center gap-2 transition-colors shadow-lg shadow-emerald-500/20"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Mengunggah...</span>
                </>
              ) : (
                <span>Mulai Proses Dokumen</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
