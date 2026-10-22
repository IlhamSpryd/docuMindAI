import React from 'react';
import { QuotaInfo } from '../types';

interface QuotaMeterProps {
  quota: QuotaInfo;
}

export const QuotaMeter: React.FC<QuotaMeterProps> = ({ quota }) => {
  const percentage = Math.min(100, Math.round((quota.usedDocuments / quota.maxDocuments) * 100));
  const isNearLimit = quota.usedDocuments >= 8;

  return (
    <div className="glass-card p-4 rounded-xl flex flex-col gap-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-400 font-medium">Penggunaan Kuota Penyimpanan</span>
        <span className="font-semibold text-slate-200">
          {quota.usedDocuments} / {quota.maxDocuments} Dokumen
        </span>
      </div>
      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full transition-all duration-500 rounded-full ${
            isNearLimit ? 'bg-amber-500' : 'bg-gradient-to-r from-emerald-500 to-teal-400'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="flex justify-between text-[11px] text-slate-500">
        <span>Tersisa: {quota.remainingDocuments} slot</span>
        <span>Batas Free Tier: 10 Dokumen</span>
      </div>
    </div>
  );
};
