import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { buttonVariants } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { cn, formatDocMeta, statusLabel } from '../lib/utils';

const tabs = ['All', 'Ready', 'Processing'] as const;

export const DashboardPage: React.FC = () => {
  const { refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<(typeof tabs)[number]>('All');

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['documents'],
    queryFn: async () => (await api.getDocuments()).documents,
    refetchInterval: (result) => {
      const hasActiveJobs = result.state.data?.some(
        (doc) => doc.status === 'processing' || doc.status === 'uploading'
      );
      return hasActiveJobs ? 3000 : false;
    },
  });

  const documents = data ?? [];
  const list = documents.filter((doc) => {
    const matchesQuery =
      doc.title.toLowerCase().includes(query.toLowerCase()) ||
      doc.originalFilename.toLowerCase().includes(query.toLowerCase());
    const label = statusLabel(doc.status);
    return matchesQuery && (tab === 'All' || label === tab);
  });

  const handleRetry = async (id: string) => {
    await api.retryDocument(id);
    queryClient.invalidateQueries({ queryKey: ['documents'] });
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Delete “${title}” and its conversations?`)) return;
    await api.deleteDocument(id);
    queryClient.invalidateQueries({ queryKey: ['documents'] });
    refreshUser();
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-[880px] px-4 py-6 sm:px-8 sm:py-10 xl:py-12">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-[22px] font-semibold tracking-tight sm:text-2xl">Documents</h1>
          <Link to="/upload" className={cn(buttonVariants({ size: 'lg' }), 'w-full sm:w-auto')}>
            Upload PDF
          </Link>
        </div>
        <Input
          className="mt-5"
          placeholder="Search documents"
          aria-label="Search documents"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div role="tablist" className="mt-3 flex gap-5 border-b border-border">
          {tabs.map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={tab === item}
              onClick={() => setTab(item)}
              className={cn(
                '-mb-px min-h-11 border-b-2 border-transparent text-muted-foreground',
                tab === item && 'border-foreground font-medium text-foreground'
              )}
            >
              {item}
            </button>
          ))}
        </div>
        {isError && (
          <p role="alert" className="py-6 text-destructive">
            {(error as Error)?.message || 'Could not load documents.'}
          </p>
        )}
        {isLoading && <p className="py-10 text-center text-muted-foreground">Loading documents…</p>}
        <ul>
          {list.map((doc) => {
            const status = statusLabel(doc.status);
            const ready = doc.status === 'ready';
            const rowClass =
              'flex items-center gap-4 border-b border-border px-2 py-3 hover:bg-muted';
            const body = (
              <>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{doc.title}</span>
                  <span className="block text-[13px] text-muted-foreground">{formatDocMeta(doc)}</span>
                </span>
                <span
                  className={cn(
                    'shrink-0 text-[13px] text-muted-foreground',
                    status === 'Failed' && 'text-destructive'
                  )}
                >
                  {status}
                </span>
              </>
            );
            return (
              <li key={doc.id} className="group">
                <div className="flex items-stretch">
                  {ready ? (
                    <Link to={`/doc/${doc.id}`} className={cn(rowClass, 'min-w-0 flex-1')}>
                      {body}
                    </Link>
                  ) : (
                    <div className={cn(rowClass, 'min-w-0 flex-1')}>{body}</div>
                  )}
                  <div className="flex items-center gap-1 border-b border-border pr-1">
                    {doc.status === 'failed' && (
                      <button
                        type="button"
                        className="min-h-11 px-2 text-[13px] text-muted-foreground hover:text-foreground"
                        onClick={() => handleRetry(doc.id)}
                      >
                        Retry
                      </button>
                    )}
                    <button
                      type="button"
                      className="min-h-11 px-2 text-[13px] text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(doc.id, doc.title)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        {!isLoading && !list.length && (
          <p className="py-10 text-center text-muted-foreground">No documents match.</p>
        )}
      </div>
    </div>
  );
};
