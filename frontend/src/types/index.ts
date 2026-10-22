export type DocumentStatus = 'uploading' | 'processing' | 'ready' | 'failed';

export interface DocumentItem {
  id: string;
  userId: string;
  title: string;
  originalFilename: string;
  storagePath: string;
  mimeType: string;
  fileSizeBytes: number;
  pageCount: number | null;
  status: DocumentStatus;
  errorCode: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationItem {
  id: string;
  documentId: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface CitationSource {
  citationOrder: number;
  chunkId: string;
  pageNumber: number;
  similarityScore: number;
  snippet: string;
}

export interface MessageItem {
  id: string;
  conversationId: string;
  userId: string;
  role: 'user' | 'assistant';
  content: string;
  isAbstention: boolean;
  createdAt: string;
  sources?: CitationSource[];
}

export interface UserProfile {
  id: string;
  email: string;
}

export interface QuotaInfo {
  maxDocuments: number;
  usedDocuments: number;
  remainingDocuments: number;
}
