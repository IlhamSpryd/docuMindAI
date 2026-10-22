import {
  DocumentItem,
  ConversationItem,
  MessageItem,
  UserProfile,
  QuotaInfo,
} from '../types';

const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export class ApiError extends Error {
  code: string;
  statusCode: number;
  details?: unknown;

  constructor(statusCode: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('documind_auth_token');

  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Do not set Content-Type if sending FormData (browser sets boundary)
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type');
  let data: any = null;
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  }

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('documind_auth_token');
      localStorage.removeItem('documind_user');
      if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
        window.location.href = '/login';
      }
    }

    const errCode = data?.error?.code || 'UNKNOWN_ERROR';
    const errMsg = data?.error?.message || response.statusText || 'Terjadi kesalahan pada server.';
    throw new ApiError(response.status, errCode, errMsg, data?.error?.details);
  }

  return data as T;
}

export const api = {
  // Health
  getHealth: () => request<{ status: string; database: string }>('/health'),

  // Auth
  getMe: () => request<{ user: UserProfile; quota: QuotaInfo }>('/auth/me'),

  // Documents
  getDocuments: () => request<{ documents: DocumentItem[] }>('/documents'),

  getDocument: (id: string) => request<{ document: DocumentItem }>(`/documents/${id}`),

  uploadDocument: (file: File, title?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (title) formData.append('title', title);

    return request<{ message: string; document: DocumentItem }>('/documents', {
      method: 'POST',
      body: formData,
    });
  },

  retryDocument: (id: string) =>
    request<{ id: string; status: string; message: string }>(`/documents/${id}/retry`, {
      method: 'POST',
    }),

  deleteDocument: (id: string) =>
    request<{ success: boolean; message: string }>(`/documents/${id}`, {
      method: 'DELETE',
    }),

  // Conversations & Chat
  getConversations: (documentId?: string) => {
    const query = documentId ? `?documentId=${encodeURIComponent(documentId)}` : '';
    return request<{ conversations: ConversationItem[] }>(`/conversations${query}`);
  },

  createConversation: (documentId: string, title?: string) =>
    request<{ conversation: ConversationItem }>('/conversations', {
      method: 'POST',
      body: JSON.stringify({ documentId, title }),
    }),

  getMessages: (conversationId: string) =>
    request<{ messages: MessageItem[] }>(`/conversations/${conversationId}/messages`),

  askQuestion: (conversationId: string, question: string) =>
    request<{ userMessage: MessageItem; assistantMessage: MessageItem }>(
      `/conversations/${conversationId}/messages`,
      {
        method: 'POST',
        body: JSON.stringify({ question }),
      }
    ),

  deleteConversation: (conversationId: string) =>
    request<{ success: boolean; message: string }>(`/conversations/${conversationId}`, {
      method: 'DELETE',
    }),
};
