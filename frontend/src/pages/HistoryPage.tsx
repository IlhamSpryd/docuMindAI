import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Input } from '../components/ui/input';
import { api } from '../api/client';
import { historyGroup, relativeTime } from '../lib/utils';

export function HistoryPage() {
  const [query, setQuery] = useState('');
  const { data: convData, isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => api.getConversations(),
  });
  const { data: docs } = useQuery({
    queryKey: ['documents'],
    queryFn: async () => (await api.getDocuments()).documents,
  });

  const groups = useMemo(() => {
    const titles = new Map((docs ?? []).map((doc) => [doc.id, doc.title]));
    const rows = (convData?.conversations ?? [])
      .map((conv) => ({
        id: conv.id,
        documentId: conv.documentId,
        title: conv.title,
        documentTitle: titles.get(conv.documentId) ?? 'Document',
        when: conv.updatedAt,
      }))
      .filter(
        (row) =>
          row.title.toLowerCase().includes(query.toLowerCase()) ||
          row.documentTitle.toLowerCase().includes(query.toLowerCase())
      )
      .sort((a, b) => new Date(b.when).getTime() - new Date(a.when).getTime());

    const order = ['Today', 'Yesterday', 'Older'];
    return order
      .map((label) => ({
        label,
        rows: rows.filter((row) => historyGroup(row.when) === label),
      }))
      .filter((group) => group.rows.length > 0);
  }, [convData, docs, query]);

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-[720px] px-4 py-6 sm:px-8 sm:py-12">
        <h1 className="text-[22px] font-semibold tracking-tight sm:text-2xl">History</h1>
        <Input
          className="mt-5"
          placeholder="Search conversations"
          aria-label="Search conversations"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {isLoading && <p className="py-10 text-center text-muted-foreground">Loading…</p>}
        {!isLoading && groups.length === 0 && (
          <p className="py-10 text-center text-muted-foreground">No conversations yet.</p>
        )}
        {groups.map((group) => (
          <section key={group.label}>
            <h2 className="px-2 pb-1 pt-5 text-xs text-muted-foreground">{group.label}</h2>
            {group.rows.map((row) => (
              <Link
                key={row.id}
                to={`/doc/${row.documentId}`}
                className="flex items-center gap-4 border-b border-border px-2 py-3 hover:bg-muted"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{row.title}</span>
                  <span className="block truncate text-[13px] text-muted-foreground">
                    {row.documentTitle}
                  </span>
                </span>
                <span className="shrink-0 text-[13px] text-muted-foreground">
                  {relativeTime(row.when)}
                </span>
              </Link>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}
