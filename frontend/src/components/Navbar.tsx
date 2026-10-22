import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FileText, LogOut } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, quota, serverReady, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80 px-4 sm:px-8 py-3.5 flex items-center justify-between">
      <Link to="/dashboard" className="flex items-center gap-3 group">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform duration-200">
          <FileText className="w-5 h-5 text-slate-950 font-bold" />
        </div>
        <div>
          <span className="text-lg font-bold bg-gradient-to-r from-white via-slate-100 to-emerald-400 bg-clip-text text-transparent">
            DocuMind AI
          </span>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Verifiable RAG Engine</span>
          </div>
        </div>
      </Link>

      <div className="flex items-center gap-4">
        {/* Server Status Pill */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-xs">
          <span
            className={`w-2 h-2 rounded-full ${
              serverReady ? 'bg-emerald-400' : 'bg-amber-400 animate-ping'
            }`}
          />
          <span className="text-slate-300">
            {serverReady ? 'API Aktif' : 'Menghubungkan...'}
          </span>
        </div>

        {user && (
          <div className="flex items-center gap-3">
            {quota && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800/60 text-xs text-slate-300">
                <span className="text-slate-400">Kuota:</span>
                <span className="font-semibold text-emerald-400">
                  {quota.usedDocuments} / {quota.maxDocuments}
                </span>
                <span className="text-slate-400">Dokumen</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-300 hidden lg:inline-block max-w-[150px] truncate">
                {user.email}
              </span>
              <button
                onClick={handleLogout}
                title="Keluar"
                className="p-2 rounded-lg bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-900/50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
