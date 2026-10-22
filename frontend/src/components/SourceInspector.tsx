import React from 'react';
import { X, BookOpen, Layers, CheckCircle2, Hash } from 'lucide-react';
import { CitationSource } from '../types';

interface SourceInspectorProps {
  source: CitationSource | null;
  documentTitle: string;
  onClose: () => void;
}

export const SourceInspector: React.FC<SourceInspectorProps> = ({
  source,
  documentTitle,
  onClose,
}) => {
  if (!source) return null;

  const similarityPercent = Math.min(100, Math.round(source.similarityScore * 100));

  return (
    <aside
      aria-label="Source Inspector Panel"
      className="fixed inset-y-0 right-0 z-50 w-full sm:w-[450px] glass-panel border-l border-slate-800 p-6 flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-300"
    >
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Source Inspector</h3>
              <p className="text-xs text-slate-400">Verifikasi Potongan Teks Sumber Asli</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Provenance Metadata Card */}
        <div className="mt-5 space-y-4">
          <div className="glass-card p-4 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-bold font-mono">
                <Hash className="w-3.5 h-3.5" />
                <span>Sitasi #{source.citationOrder}</span>
              </span>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-semibold text-slate-200">Halaman {source.pageNumber}</span>
              </div>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                Dokumen Sumber
              </span>
              <p className="text-sm font-medium text-slate-200 truncate">{documentTitle}</p>
            </div>

            {/* Similarity Score Meter */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-400">Skor Kemiripan Kosinus:</span>
                <span className="font-mono font-bold text-emerald-400">
                  {similarityPercent}% ({source.similarityScore.toFixed(4)})
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-300"
                  style={{ width: `${similarityPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Verbatim Chunk Content */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-300">
                Potongan Kalimat Terverifikasi di Database
              </label>
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
                <CheckCircle2 className="w-3 h-3" />
                <span>Database Provenance</span>
              </span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-200 leading-relaxed font-mono whitespace-pre-wrap max-h-[380px] overflow-y-auto selection:bg-emerald-500/30">
              {source.snippet}
            </div>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-800">
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-colors"
        >
          Tutup Inspector
        </button>
      </div>
    </aside>
  );
};
