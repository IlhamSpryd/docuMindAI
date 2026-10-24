import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { DocumentItem, DocumentStatus } from '../types';

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export function statusLabel(status: DocumentStatus): 'Ready' | 'Processing' | 'Failed' {
  if (status === 'ready') return 'Ready';
  if (status === 'failed') return 'Failed';
  return 'Processing';
}

export function formatDocMeta(doc: DocumentItem): string {
  const dateStr = new Date(doc.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  const pages = doc.pageCount ? `${doc.pageCount} pages` : formatFileSize(doc.fileSizeBytes);
  return `${pages} · ${dateStr}`;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function historyGroup(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfYesterday = new Date(startOfToday.getTime() - 86_400_000);
  if (date >= startOfToday) return 'Today';
  if (date >= startOfYesterday) return 'Yesterday';
  return 'Older';
}
