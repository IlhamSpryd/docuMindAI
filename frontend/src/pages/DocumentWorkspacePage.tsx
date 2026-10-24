import React, { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowUp, Copy, Check, Plus } from 'lucide-react';
import { api } from '../api/client';
import { SourceInspector } from '../components/SourceInspector';
import { CitationSource, MessageItem } from '../types';
import { cn } from '../lib/utils';

export const DocumentWorkspacePage: React.FC = () => {
  const { id: documentId } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'doc' | 'chat'>('chat');
  const [draft, setDraft] = useState('');
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [activeCitation, setActiveCitation] = useState<CitationSource | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: docData, isLoading: isDocLoading } = useQuery({
    queryKey: ['document', documentId],
    queryFn: () => api.getDocument(documentId!),
    enabled: Boolean(documentId),
  });

  const document = docData?.document;

  const { data: convData, refetch: refetchConversations } = useQuery({
    queryKey: ['conversations', documentId],
    queryFn: () => api.getConversations(documentId),
    enabled: Boolean(documentId),
  });

  const conversations = convData?.conversations || [];

  useEffect(() => {
    if (conversations.length > 0 && !activeConversationId) {
      setActiveConversationId(conversations[0].id);
    }
  }, [conversations, activeConversationId]);

  const { data: msgData, isLoading: isMsgLoading } = useQuery({
    queryKey: ['messages', activeConversationId],
    queryFn: () => api.getMessages(activeConversationId!),
    enabled: Boolean(activeConversationId),
  });

  const messages = msgData?.messages || [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const createConvMutation = useMutation({
    mutationFn: () =>
      api.createConversation(documentId!, `Chat ${conversations.length + 1}`),
    onSuccess: (data) => {
      refetchConversations();
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setActiveConversationId(data.conversation.id);
    },
  });

  const askMutation = useMutation({
    mutationFn: async (question: string) => {
      let conversationId = activeConversationId;
      if (!conversationId) {
        const created = await api.createConversation(documentId!, 'Chat 1');
        conversationId = created.conversation.id;
        setActiveConversationId(conversationId);
        refetchConversations();
      }
      const result = await api.askQuestion(conversationId, question);
      await queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      await queryClient.invalidateQueries({ queryKey: ['conversations'] });
      return result;
    },
    onSuccess: () => setDraft(''),
  });

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim() || askMutation.isPending) return;
    askMutation.mutate(draft.trim());
  };

  const handleCopy = (msg: MessageItem) => {
    let textToCopy = msg.content;
    if (msg.sources && msg.sources.length > 0) {
      textToCopy += '\n\nSources:';
      msg.sources.forEach((source) => {
        textToCopy += `\n[${source.citationOrder}] p. ${source.pageNumber}: "${source.snippet.slice(0, 100)}..."`;
      });
    }
    navigator.clipboard.writeText(textToCopy);
    setCopiedMessageId(msg.id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  if (isDocLoading) {
    return <p className="p-8 text-muted-foreground">Loading document…</p>;
  }

  if (!document) {
    return (
      <p className="p-8 text-muted-foreground">
        Document not found.{' '}
        <Link to="/" className="underline">
          Back to documents
        </Link>
      </p>
    );
  }

  return (
    <div className="relative flex h-full flex-col lg:flex-row">
      <div role="tablist" className="flex shrink-0 border-b border-border px-4 lg:hidden">
        {(['doc', 'chat'] as const).map((item) => (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={tab === item}
            onClick={() => setTab(item)}
            className={cn(
              '-mb-px min-h-11 flex-1 border-b-2 border-transparent text-muted-foreground',
              tab === item && 'border-foreground font-medium text-foreground'
            )}
          >
            {item === 'doc' ? 'Document' : 'Chat'}
          </button>
        ))}
      </div>

      <section
        aria-label="Document"
        className={cn('min-h-0 min-w-0 flex-1 flex-col bg-muted lg:flex', tab === 'doc' ? 'flex' : 'hidden')}
      >
        <div className="flex h-12 shrink-0 items-center px-4">
          <span className="min-w-0 flex-1 truncate font-medium">{document.title}</span>
        </div>
        <div className="min-h-0 flex-1 overflow-auto p-4">
          <div className="mx-auto max-w-[560px] border border-border bg-background p-10 text-muted-foreground">
            {document.status === 'ready'
              ? 'PDF viewer goes here. Ask in chat — citations still map to page numbers.'
              : document.status === 'failed'
                ? document.errorMessage || 'Processing failed.'
                : 'This document is still processing. Chat will be available when it is ready.'}
          </div>
        </div>
      </section>

      <section
        aria-label="Chat"
        className={cn(
          'relative min-h-0 min-w-0 flex-1 flex-col border-border lg:flex lg:w-[420px] lg:flex-none lg:border-l xl:w-[480px]',
          tab === 'chat' ? 'flex' : 'hidden'
        )}
      >
        {conversations.length > 0 && (
          <div className="flex shrink-0 items-center gap-1 overflow-x-auto border-b border-border px-3">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                type="button"
                onClick={() => setActiveConversationId(conv.id)}
                className={cn(
                  'min-h-11 shrink-0 px-2 text-[13px] text-muted-foreground',
                  conv.id === activeConversationId && 'font-medium text-foreground'
                )}
              >
                {conv.title}
              </button>
            ))}
            <button
              type="button"
              aria-label="New chat"
              onClick={() => createConvMutation.mutate()}
              className="grid size-11 shrink-0 place-items-center text-muted-foreground hover:text-foreground"
            >
              <Plus className="size-4" />
            </button>
          </div>
        )}

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-5 sm:px-6" aria-live="polite">
          {isMsgLoading && <p className="text-muted-foreground">Loading messages…</p>}
          {!isMsgLoading && messages.length === 0 && (
            <p className="text-muted-foreground">Ask a question about this document.</p>
          )}
          {messages.map((msg) =>
            msg.role === 'user' ? (
              <p key={msg.id} className="ml-auto w-fit max-w-[85%] break-words rounded-xl bg-muted px-3.5 py-2">
                {msg.content}
              </p>
            ) : (
              <div key={msg.id} className="break-words">
                {msg.isAbstention && (
                  <p className="mb-2 text-[13px] text-muted-foreground">Not enough evidence in the document.</p>
                )}
                <p className="whitespace-pre-wrap">{msg.content}</p>
                {msg.sources && msg.sources.length > 0 && (
                  <ol className="mt-3 space-y-0.5 text-[13px] text-muted-foreground">
                    {msg.sources.map((source) => (
                      <li key={source.chunkId + source.citationOrder}>
                        <button
                          type="button"
                          className="text-left hover:text-foreground"
                          onClick={() => setActiveCitation(source)}
                        >
                          {source.citationOrder} · {document.title}, p. {source.pageNumber}
                        </button>
                      </li>
                    ))}
                  </ol>
                )}
                <button
                  type="button"
                  onClick={() => handleCopy(msg)}
                  className="mt-2 inline-flex items-center gap-1 text-[13px] text-muted-foreground hover:text-foreground"
                >
                  {copiedMessageId === msg.id ? (
                    <>
                      <Check className="size-3.5" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5" />
                      Copy
                    </>
                  )}
                </button>
              </div>
            )
          )}
          {askMutation.isPending && <p className="text-muted-foreground">Analyzing document…</p>}
          <div ref={messagesEndRef} />
        </div>

        <form
          onSubmit={send}
          className="shrink-0 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2 sm:px-6"
        >
          <div className="flex items-end gap-2 rounded-xl border border-border py-2.5 pl-4 pr-2.5">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send(e);
                }
              }}
              disabled={askMutation.isPending || document.status !== 'ready'}
              rows={1}
              maxLength={1000}
              aria-label="Message"
              placeholder={
                document.status === 'ready' ? 'Ask about this document' : 'Document is not ready yet'
              }
              className="max-h-40 min-w-0 flex-1 resize-none bg-transparent py-2 outline-none placeholder:text-muted-foreground"
            />
            <button
              type="submit"
              aria-label="Send"
              disabled={!draft.trim() || askMutation.isPending || document.status !== 'ready'}
              className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground disabled:opacity-40"
            >
              <ArrowUp className="size-4" />
            </button>
          </div>
        </form>
      </section>

      <SourceInspector
        source={activeCitation}
        documentTitle={document.title}
        onClose={() => setActiveCitation(null)}
      />
    </div>
  );
};
