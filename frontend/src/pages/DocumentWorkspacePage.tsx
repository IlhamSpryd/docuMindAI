import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { SourceInspector } from '../components/SourceInspector';
import { CitationSource, MessageItem } from '../types';
import {
  ArrowLeft,
  Send,
  MessageSquare,
  Plus,
  BookOpen,
  AlertTriangle,
  Copy,
  Check,
  Trash2,
  Loader2,
  FileText,
  Layers,
  Sparkles,
} from 'lucide-react';

export const DocumentWorkspacePage: React.FC = () => {
  const { id: documentId } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [questionText, setQuestionText] = useState('');
  const [activeCitation, setActiveCitation] = useState<CitationSource | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Fetch document metadata
  const { data: docData, isLoading: isDocLoading } = useQuery({
    queryKey: ['document', documentId],
    queryFn: () => api.getDocument(documentId!),
    enabled: Boolean(documentId),
  });

  const document = docData?.document;

  // 2. Fetch conversations on this document
  const { data: convData, refetch: refetchConversations } = useQuery({
    queryKey: ['conversations', documentId],
    queryFn: () => api.getConversations(documentId),
    enabled: Boolean(documentId),
  });

  const conversations = convData?.conversations || [];

  // Auto-select or create first conversation
  useEffect(() => {
    if (conversations.length > 0 && !activeConversationId) {
      setActiveConversationId(conversations[0].id);
    }
  }, [conversations, activeConversationId]);

  // 3. Fetch messages for active conversation
  const {
    data: msgData,
    isLoading: isMsgLoading,
  } = useQuery({
    queryKey: ['messages', activeConversationId],
    queryFn: () => api.getMessages(activeConversationId!),
    enabled: Boolean(activeConversationId),
  });

  const messages = msgData?.messages || [];

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 4. Create new conversation mutation
  const createConvMutation = useMutation({
    mutationFn: () =>
      api.createConversation(
        documentId!,
        `Sesi Diskusi #${conversations.length + 1}`
      ),
    onSuccess: (data) => {
      refetchConversations();
      setActiveConversationId(data.conversation.id);
    },
  });

  // 5. Ask question mutation
  const askMutation = useMutation({
    mutationFn: (q: string) => api.askQuestion(activeConversationId!, q),
    onSuccess: () => {
      setQuestionText('');
      queryClient.invalidateQueries({ queryKey: ['messages', activeConversationId] });
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim() || askMutation.isPending || !activeConversationId) return;
    askMutation.mutate(questionText);
  };

  const handleCopy = (msg: MessageItem) => {
    let textToCopy = msg.content;
    if (msg.sources && msg.sources.length > 0) {
      textToCopy += '\n\nSumber Rujukan:';
      msg.sources.forEach((s) => {
        textToCopy += `\n[${s.citationOrder}] Halaman ${s.pageNumber}: "${s.snippet.slice(0, 100)}..."`;
      });
    }
    navigator.clipboard.writeText(textToCopy);
    setCopiedMessageId(msg.id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const handleDeleteConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Hapus sesi percakapan ini?')) return;
    try {
      await api.deleteConversation(convId);
      refetchConversations();
      if (activeConversationId === convId) {
        setActiveConversationId(null);
      }
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus percakapan.');
    }
  };

  if (isDocLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  if (!document) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-4">
        <p>Dokumen tidak ditemukan atau Anda tidak memiliki akses.</p>
        <Link to="/dashboard" className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-bold">
          Kembali ke Pustaka
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col h-screen overflow-hidden">
      {/* Top Workspace Header */}
      <header className="glass-panel border-b border-slate-800 px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Link
            to="/dashboard"
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors"
            title="Kembali ke Pustaka"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 line-clamp-1 max-w-md">
                {document.title}
              </h2>
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <span>{document.originalFilename}</span>
                {document.pageCount && (
                  <>
                    <span>•</span>
                    <span>{document.pageCount} Halaman</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <Sparkles className="w-3 h-3" />
            <span>Strict Grounded Chat</span>
          </span>
        </div>
      </header>

      {/* Main Layout Grid */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Conversations */}
        <aside
          aria-label="Conversation Sessions Sidebar"
          className="w-72 shrink-0 border-r border-slate-800/80 bg-slate-950/80 flex flex-col justify-between hidden md:flex"
        >
          <div className="p-4 flex-1 overflow-y-auto space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Sesi Percakapan
              </span>
              <button
                onClick={() => createConvMutation.mutate()}
                disabled={createConvMutation.isPending}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-emerald-500/10 text-slate-400 hover:text-emerald-400 border border-slate-800 transition-colors"
                title="Percakapan Baru"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              {conversations.map((conv) => {
                const isActive = conv.id === activeConversationId;
                return (
                  <div
                    key={conv.id}
                    onClick={() => setActiveConversationId(conv.id)}
                    className={`group w-full p-3 rounded-xl text-left text-xs font-medium flex items-center justify-between cursor-pointer transition-all ${
                      isActive
                        ? 'bg-slate-850 border border-emerald-500/30 text-emerald-400 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{conv.title}</span>
                    </div>

                    <button
                      onClick={(e) => handleDeleteConversation(conv.id, e)}
                      title="Hapus Percakapan"
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-rose-950/40 text-slate-500 hover:text-rose-400 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}

              {conversations.length === 0 && (
                <div className="text-center py-6 text-xs text-slate-500">
                  Belum ada sesi percakapan.
                  <button
                    onClick={() => createConvMutation.mutate()}
                    className="block mx-auto mt-2 text-emerald-400 underline font-semibold"
                  >
                    + Buat Sesi Baru
                  </button>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Center: Chat Timeline */}
        <section
          aria-label="Chat Conversation Timeline"
          className="flex-1 flex flex-col justify-between bg-slate-900/20 overflow-hidden relative"
        >
          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6">
            {isMsgLoading && (
              <div className="flex justify-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
              </div>
            )}

            {!isMsgLoading && messages.length === 0 && (
              <div className="max-w-md mx-auto text-center py-16 space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
                  <BookOpen className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-slate-200">
                  Mulai Diskusi dengan Dokumen Ini
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Ajukan pertanyaan seputar fakta, argumen, metodologi, tanggal, atau temuan spesifik. Setiap klaim akan disertai referensi nomor halaman asli.
                </p>
                <div className="pt-2 flex flex-wrap gap-2 justify-center">
                  {[
                    'Apa ringkasan utama dari dokumen ini?',
                    'Jelaskan metodologi yang digunakan.',
                    'Apa kesimpulan dan temuan pentingnya?',
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setQuestionText(preset);
                      }}
                      className="text-[11px] px-3 py-1.5 rounded-full bg-slate-850 hover:bg-slate-800 border border-slate-700/60 text-slate-300 transition-colors"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 max-w-3xl ${
                    isUser ? 'ml-auto justify-end' : 'mr-auto justify-start'
                  }`}
                >
                  <div
                    className={`rounded-2xl p-4.5 text-sm leading-relaxed transition-all ${
                      isUser
                        ? 'bg-emerald-600 text-slate-950 font-medium rounded-tr-sm shadow-md shadow-emerald-600/10 max-w-xl'
                        : 'glass-card border border-slate-800/80 text-slate-200 rounded-tl-sm w-full shadow-lg'
                    }`}
                  >
                    {/* Abstention Warning Banner (FR-RAG-002) */}
                    {msg.isAbstention && (
                      <div className="mb-3 p-3 rounded-xl bg-amber-950/40 border border-amber-800/50 flex items-start gap-2.5 text-xs text-amber-300">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold">Informasi Tidak Cukup di Dokumen</span>
                          <p className="text-amber-400/90 text-[11px] mt-0.5">
                            Sistem menolak menjawab secara spekulatif karena bukti tidak ditemukan dalam teks PDF.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Message Body */}
                    <p className="whitespace-pre-wrap">{msg.content}</p>

                    {/* Citation Pills on Assistant Answers (FR-CIT-001) */}
                    {!isUser && msg.sources && msg.sources.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-slate-800/80">
                        <div className="text-[11px] font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Kutipan & Halaman Sumber:</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {msg.sources.map((source) => (
                            <button
                              key={source.chunkId + source.citationOrder}
                              onClick={() => setActiveCitation(source)}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold transition-all hover:scale-105 active:scale-95"
                              title="Klik untuk memeriksa teks sumber asli pada Source Inspector"
                            >
                              <span>[{source.citationOrder} - Hal. {source.pageNumber}]</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Copy Button for Assistant Message (P1) */}
                    {!isUser && (
                      <div className="mt-3 flex justify-end">
                        <button
                          onClick={() => handleCopy(msg)}
                          className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
                          title="Salin jawaban beserta kutipan"
                        >
                          {copiedMessageId === msg.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400">Tersalin!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Salin Jawaban</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Waiting for response loader */}
            {askMutation.isPending && (
              <div className="flex gap-3 max-w-3xl mr-auto justify-start">
                <div className="glass-card border border-slate-800 rounded-2xl p-4 flex items-center gap-3 text-xs text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                  <span>Menganalisis dokumen & memverifikasi sitasi...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Chat Input Form */}
          <div className="glass-panel border-t border-slate-800 p-4 sm:p-5 shrink-0">
            <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex flex-col gap-2">
              <div className="relative flex items-center">
                <textarea
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                  disabled={askMutation.isPending || !activeConversationId}
                  rows={2}
                  maxLength={1000}
                  placeholder="Ketik pertanyaan mengenai isi dokumen ini (Tekan Enter untuk kirim)..."
                  className="w-full pl-4 pr-14 py-3 rounded-2xl bg-slate-900/90 border border-slate-700/80 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 resize-none transition-colors"
                />

                <button
                  type="submit"
                  disabled={!questionText.trim() || askMutation.isPending || !activeConversationId}
                  className="absolute right-3.5 p-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold transition-all shadow-md shadow-emerald-500/20"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
                <span>Rate limit: 15 pertanyaan per menit</span>
                <span>{questionText.length} / 1000 Karakter</span>
              </div>
            </form>
          </div>
        </section>

        {/* Right Drawer: Source Inspector Panel */}
        <SourceInspector
          source={activeCitation}
          documentTitle={document.title}
          onClose={() => setActiveCitation(null)}
        />
      </div>
    </div>
  );
};
