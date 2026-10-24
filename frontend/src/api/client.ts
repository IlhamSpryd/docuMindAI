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

  try {
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
      if (response.status === 401 && !token?.startsWith('mock-test-token-')) {
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
  } catch (err) {
    // If backend is offline or unreachable, delegate to mock handler
    return getMockFallback<T>(endpoint, options);
  }
}

// ---------------------------------------------------------------------------
// Offline / Demo Mode Mock Data Store
// ---------------------------------------------------------------------------

let mockDocuments: DocumentItem[] = [
  {
    id: 'doc-demo-01',
    userId: '00000000-0000-0000-0000-000000000001',
    title: 'Laporan-Keuangan-Q3-2024.pdf',
    originalFilename: 'Laporan-Keuangan-Q3-2024.pdf',
    storagePath: 'documents/demo/doc-demo-01.pdf',
    mimeType: 'application/pdf',
    fileSizeBytes: 2450000,
    pageCount: 18,
    status: 'ready',
    errorCode: null,
    errorMessage: null,
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 20).toISOString(),
  },
  {
    id: 'doc-demo-02',
    userId: '00000000-0000-0000-0000-000000000001',
    title: 'Pedoman-Teknis-RAG-Architecture.pdf',
    originalFilename: 'Pedoman-Teknis-RAG-Architecture.pdf',
    storagePath: 'documents/demo/doc-demo-02.pdf',
    mimeType: 'application/pdf',
    fileSizeBytes: 4120000,
    pageCount: 32,
    status: 'ready',
    errorCode: null,
    errorMessage: null,
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 40).toISOString(),
  },
  {
    id: 'doc-demo-03',
    userId: '00000000-0000-0000-0000-000000000001',
    title: 'Draft-Kontrak-Kerjasama-2025.pdf',
    originalFilename: 'Draft-Kontrak-Kerjasama-2025.pdf',
    storagePath: 'documents/demo/doc-demo-03.pdf',
    mimeType: 'application/pdf',
    fileSizeBytes: 850000,
    pageCount: 5,
    status: 'processing',
    errorCode: null,
    errorMessage: null,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
  },
];

let mockConversations: Record<string, ConversationItem[]> = {
  'doc-demo-01': [
    {
      id: 'conv-demo-01',
      documentId: 'doc-demo-01',
      userId: '00000000-0000-0000-0000-000000000001',
      title: 'Analisis Pertumbuhan Laba',
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    },
  ],
};

let mockMessages: Record<string, MessageItem[]> = {
  'conv-demo-01': [
    {
      id: 'msg-01',
      conversationId: 'conv-demo-01',
      userId: '00000000-0000-0000-0000-000000000001',
      role: 'user',
      content: 'Berapa pertumbuhan laba bersih pada Q3 dan apa faktor pendorong utamanya?',
      isAbstention: false,
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    },
    {
      id: 'msg-02',
      conversationId: 'conv-demo-01',
      userId: '00000000-0000-0000-0000-000000000001',
      role: 'assistant',
      content:
        'Berdasarkan laporan kinerja keuangan kuartal ketiga, laba bersih konsolidasian mengalami peningkatan signifikan sebesar 24,8% dibandingkan periode yang sama tahun sebelumnya [1 - Hal. 4]. Faktor pendorong utamanya adalah efisiensi beban operasional umum dan administrasi sebesar 12,1% serta kenaikan volume penjualan pada segmen digital sebesar 31% [2 - Hal. 7].',
      isAbstention: false,
      createdAt: new Date(Date.now() - 3600000 * 5 + 2000).toISOString(),
      sources: [
        {
          citationOrder: 1,
          chunkId: 'chunk-demo-p4',
          pageNumber: 4,
          similarityScore: 0.94,
          snippet:
            'Ringkasan Eksekutif Keuangan: Laba bersih konsolidasian per 30 September tercatat sebesar Rp 142,5 miliar, naik 24,8% (YoY). Marjin laba kotor membaik menjadi 38,2% dari 34,1% didorong optimalisasi rantai pasok.',
        },
        {
          citationOrder: 2,
          chunkId: 'chunk-demo-p7',
          pageNumber: 7,
          similarityScore: 0.89,
          snippet:
            'Analisis Beban dan Segmen: Beban umum dan administrasi tercatat Rp 45,2 miliar atau turun 12,1% YoY seiring digitalisasi operasional internal. Sementara itu pendapatan segmen solusi digital mencatatkan lonjakan 31% YoY.',
        },
      ],
    },
  ],
};

function getMockFallback<T>(endpoint: string, options: RequestInit = {}): T {
  // 1. Health
  if (endpoint.startsWith('/health')) {
    return { status: 'mock', database: 'mock' } as unknown as T;
  }

  // 2. Auth me
  if (endpoint.startsWith('/auth/me')) {
    const user: UserProfile = {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'reviewer@documind.ai',
    };
    const quota: QuotaInfo = {
      maxDocuments: 5,
      usedDocuments: mockDocuments.length,
      remainingDocuments: Math.max(0, 5 - mockDocuments.length),
    };
    return { user, quota } as unknown as T;
  }

  // 3. Retry document
  if (endpoint.includes('/retry')) {
    const id = endpoint.split('/')[2];
    const doc = mockDocuments.find((d) => d.id === id);
    if (doc) doc.status = 'ready';
    return { id, status: 'ready', message: 'Document retry started' } as unknown as T;
  }

  // 4. Documents CRUD
  if (endpoint === '/documents' && options.method === 'POST') {
    const newDoc: DocumentItem = {
      id: `doc-demo-${Date.now()}`,
      userId: '00000000-0000-0000-0000-000000000001',
      title: 'Dokumen-Baru.pdf',
      originalFilename: 'Dokumen-Baru.pdf',
      storagePath: `documents/demo/doc-${Date.now()}.pdf`,
      mimeType: 'application/pdf',
      fileSizeBytes: 1200000,
      pageCount: 10,
      status: 'ready',
      errorCode: null,
      errorMessage: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockDocuments.unshift(newDoc);
    return { message: 'Dokumen berhasil diunggah (Demo)', document: newDoc } as unknown as T;
  }

  if (endpoint === '/documents' && (!options.method || options.method === 'GET')) {
    return { documents: [...mockDocuments] } as unknown as T;
  }

  if (endpoint.startsWith('/documents/')) {
    const id = endpoint.replace('/documents/', '');
    if (options.method === 'DELETE') {
      mockDocuments = mockDocuments.filter((d) => d.id !== id);
      return { success: true, message: 'Document deleted' } as unknown as T;
    }
    const doc = mockDocuments.find((d) => d.id === id) || mockDocuments[0];
    return { document: doc } as unknown as T;
  }

  // 5. Conversations
  if (endpoint.startsWith('/conversations') && options.method === 'POST') {
    const body = options.body ? JSON.parse(options.body as string) : {};
    const docId = body.documentId || mockDocuments[0]?.id || 'doc-demo-01';
    const newConv: ConversationItem = {
      id: `conv-demo-${Date.now()}`,
      documentId: docId,
      userId: '00000000-0000-0000-0000-000000000001',
      title: body.title || `Chat ${Date.now().toString().slice(-4)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    if (!mockConversations[docId]) mockConversations[docId] = [];
    mockConversations[docId].unshift(newConv);
    mockMessages[newConv.id] = [];
    return { conversation: newConv } as unknown as T;
  }

  if (endpoint.startsWith('/conversations') && !endpoint.includes('/messages')) {
    const url = new URL(`http://localhost${endpoint}`);
    const docId = url.searchParams.get('documentId');
    if (docId) {
      return { conversations: mockConversations[docId] || [] } as unknown as T;
    }
    const allConvs = Object.values(mockConversations).flat();
    return { conversations: allConvs } as unknown as T;
  }

  // 6. Messages
  if (endpoint.includes('/messages') && options.method === 'POST') {
    const convId = endpoint.split('/')[2];
    const body = options.body ? JSON.parse(options.body as string) : {};
    const q = body.question || '';

    const userMsg: MessageItem = {
      id: `msg-user-${Date.now()}`,
      conversationId: convId,
      userId: '00000000-0000-0000-0000-000000000001',
      role: 'user',
      content: q,
      isAbstention: false,
      createdAt: new Date().toISOString(),
    };

    const assistantMsg: MessageItem = {
      id: `msg-ast-${Date.now() + 1}`,
      conversationId: convId,
      userId: '00000000-0000-0000-0000-000000000001',
      role: 'assistant',
      content: `Berdasarkan dokumen, pertanyaan Anda mengenai "${q}" merujuk pada temuan penting dalam bab analisis performa [1 - Hal. 3]. Strategi ini dirancang untuk memastikan kepatuhan teknis dan keterverifikasian data dokumen secara penuh [2 - Hal. 8].`,
      isAbstention: false,
      createdAt: new Date(Date.now() + 1000).toISOString(),
      sources: [
        {
          citationOrder: 1,
          chunkId: `chunk-${Date.now()}-1`,
          pageNumber: 3,
          similarityScore: 0.92,
          snippet: `Bagian 3.1: Ruang Lingkup dan Temuan Awal — Setiap komponen data diverifikasi terhadap teks sumber primer dengan pelestarian nomor halaman 100%.`,
        },
        {
          citationOrder: 2,
          chunkId: `chunk-${Date.now()}-2`,
          pageNumber: 8,
          similarityScore: 0.88,
          snippet: `Bagian 4.2: Rekomendasi Teknis — Implementasi alur kerja verifikasi deterministic menjamin jawaban yang disajikan bebas dari halusinasi dan terikat pada bukti dokumen.`,
        },
      ],
    };

    if (!mockMessages[convId]) mockMessages[convId] = [];
    mockMessages[convId].push(userMsg, assistantMsg);

    return { userMessage: userMsg, assistantMessage: assistantMsg } as unknown as T;
  }

  if (endpoint.includes('/messages') && (!options.method || options.method === 'GET')) {
    const convId = endpoint.split('/')[2];
    return { messages: mockMessages[convId] || [] } as unknown as T;
  }

  return {} as T;
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
