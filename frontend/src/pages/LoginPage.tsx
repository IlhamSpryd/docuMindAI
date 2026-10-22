import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FileText, Lock, Mail, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login, loginDemo } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      // Connect to Supabase Auth using client credentials
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

      if (!supabaseUrl || !supabaseAnonKey) {
        // Fallback for local demo if supabase env vars are not set on client
        login('mock-test-token-demo-reviewer', {
          id: '00000000-0000-0000-0000-000000000001',
          email: email || 'user@documind.ai',
        });
        navigate('/dashboard');
        return;
      }

      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.session && data.user) {
        login(data.session.access_token, {
          id: data.user.id,
          email: data.user.email ?? email,
        });
        navigate('/dashboard');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal masuk. Periksa kembali email dan kata sandi Anda.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoAccess = () => {
    loginDemo();
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 shadow-xl shadow-emerald-500/20 mb-4">
            <FileText className="w-7 h-7 text-slate-950 font-bold" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-slate-100 to-emerald-400 bg-clip-text text-transparent">
            Masuk ke DocuMind AI
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Penelaah Dokumen PDF Berbasis Fakta & Sitasi Presisi
          </p>
        </div>

        {/* Login Card */}
        <div className="glass-panel p-7 rounded-2xl border border-slate-800 shadow-2xl">
          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/60 flex items-start gap-2.5 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Alamat Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Kata Sandi
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 mt-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-xs font-bold text-slate-950 flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-500/20"
            >
              <span>{isLoading ? 'Memeriksa...' : 'Masuk ke Akun'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Button (P1 / Portfolio Evaluator shortcut) */}
          <div className="mt-5 pt-5 border-t border-slate-800 text-center">
            <button
              onClick={handleDemoAccess}
              type="button"
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center justify-center gap-2 transition-all hover:border-emerald-500/60 shadow-sm"
            >
              <Sparkles className="w-4 h-4" />
              <span>Akses Instan Akun Demo (Reviewer)</span>
            </button>
            <p className="mt-2 text-[11px] text-slate-500">
              1-klik login untuk langsung menguji fungsionalitas RAG tanpa mendaftar
            </p>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-6 text-center text-xs text-slate-400">
          Belum memiliki akun?{' '}
          <Link to="/register" className="text-emerald-400 font-semibold hover:underline">
            Daftar sekarang
          </Link>
        </div>
      </div>
    </div>
  );
};
