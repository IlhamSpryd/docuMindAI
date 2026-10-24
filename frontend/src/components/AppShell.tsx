import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { LogOut, Menu, Plus } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

const item = 'flex min-h-11 items-center gap-2.5 truncate rounded-lg px-2.5 xl:min-h-9 hover:bg-accent/60';

function Sidebar() {
  const { user, quota, logout } = useAuth();
  const navigate = useNavigate();
  const { data } = useQuery({
    queryKey: ['documents'],
    queryFn: async () => (await api.getDocuments()).documents,
  });

  const recent = (data ?? [])
    .filter((doc) => doc.status === 'ready')
    .slice(0, 8)
    .map((doc) => ({ id: doc.id, title: doc.title.replace(/\.pdf$/i, '') }));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav aria-label="Main" className="flex h-full flex-col gap-0.5">
      <Link to="/" className="px-2.5 pb-3 pt-2 text-[15px] font-semibold">
        DocuMind
      </Link>
      <Link to="/upload" className={item}>
        <Plus className="size-4" />
        New chat
      </Link>
      {(
        [
          ['/', 'Documents'],
          ['/history', 'History'],
        ] as const
      ).map(([to, label]) => (
        <NavLink
          key={to}
          to={to}
          end
          className={({ isActive }) => cn(item, isActive && 'bg-accent font-medium')}
        >
          {label}
        </NavLink>
      ))}
      <p className="px-2.5 pb-1 pt-4 text-xs text-muted-foreground">Recent</p>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {recent.map((entry) => (
          <Link
            key={entry.id}
            to={`/doc/${entry.id}`}
            className={cn(item, 'text-muted-foreground')}
          >
            {entry.title}
          </Link>
        ))}
        {recent.length === 0 && (
          <p className="px-2.5 py-2 text-[13px] text-muted-foreground">No documents yet.</p>
        )}
      </div>
      <div className="mt-auto border-t border-border pt-3">
        {quota && (
          <p className="px-2.5 pb-2 text-xs text-muted-foreground">
            {quota.usedDocuments} / {quota.maxDocuments} documents
          </p>
        )}
        <div className="flex items-center gap-1">
          <span className="min-w-0 flex-1 truncate px-2.5 text-[13px] text-muted-foreground">
            {user?.email}
          </span>
          <button
            type="button"
            aria-label="Sign out"
            onClick={handleLogout}
            className="grid size-11 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground xl:size-9"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </nav>
  );
}

/** Fixed sidebar from xl (1280px). Below: compact header + drawer, so tablets keep room for the split reader. */
export function AppShell() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false);
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="flex h-dvh">
      <aside className="hidden w-[260px] shrink-0 bg-muted p-3 xl:block">
        <Sidebar />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-[52px] shrink-0 items-center border-b border-border pl-1 xl:hidden">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setOpen(true)}
            className="grid size-11 place-items-center"
          >
            <Menu className="size-5" />
          </button>
          <span className="font-semibold">DocuMind</span>
        </header>
        <main className="min-h-0 flex-1 overflow-hidden">
          <Outlet />
        </main>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 xl:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-black/20"
            onClick={() => setOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            className="absolute inset-y-0 left-0 w-[280px] max-w-[85vw] bg-muted p-3"
          >
            <Sidebar />
          </div>
        </div>
      )}
    </div>
  );
}
