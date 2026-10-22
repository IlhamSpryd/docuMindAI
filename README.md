# DocuMind AI 🧠📄
> **Verifiable Document Intelligence with Page-Level RAG & Deterministic Citation Engine**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-LTS-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![React](https://img.shields.io/badge/React-18+-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-0.38+-C5F74F?logo=drizzle&logoColor=black)](https://orm.drizzle.team/)
[![PostgreSQL](https://img.shields.io/badge/pgvector-768--dim-4169E1?logo=postgresql&logoColor=white)](https://github.com/pgvector/pgvector)
[![Supabase](https://img.shields.io/badge/Supabase-Auth_%26_Storage-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Gemini API](https://img.shields.io/badge/Gemini_API-2.5--Flash_%26_Embeddings-4285F4?logo=google&logoColor=white)](https://ai.google.dev/)

---

## 📌 Ringkasan Produk (Executive Summary)

**DocuMind AI** adalah platform penelaah dokumen PDF berbasis web yang mengutamakan **keterverifikasian di atas kefasihan semata (*Verifiability over Fluency*)**. Sistem ini memproses dokumen PDF teks (hingga 10 MB dan 50 halaman), mengindeksnya dengan pelestarian nomor halaman 100%, dan memungkinkan pengguna mengajukan pertanyaan dalam bahasa alami dengan jaminan:
1. **Strict Grounding:** Jawaban hanya dirumuskan dari isi dokumen aktual.
2. **Deterministic Citation Mapping:** Setiap kutipan atau referensi halaman dipetakan secara matematis di backend dari database, bukan hasil karangan LLM.
3. **Explicit Abstention:** Sistem menyatakan secara jujur apabila dokumen tidak memuat informasi atau bukti yang cukup untuk menjawab pertanyaan.
4. **Zero Cross-User Data Leakage:** Seluruh data (dokumen, chunks vektor, percakapan, dan pesan) terisolasi penuh dengan autentikasi JWT dan filter kepemilikan scoped.

---

## 🏗️ Arsitektur Sistem

```
┌─────────────────────────────────────────────────────────────┐
│                       Client Layer                          │
│        React SPA (Vite + TypeScript + Tailwind CSS)         │
│  - Document Library (Quota meter, upload dropzone)          │
│  - Chat Workspace with Inline Citations [1 - Hal. X]        │
│  - Side-by-Side Source Inspector Drawer                     │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS (REST /api/v1 + Bearer JWT)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                       Backend API                           │
│                 Node.js + Express + TypeScript              │
│  - Auth Middleware (Supabase Bearer JWT verification)       │
│  - Rate Limiter (Chat: 15/min, Upload: 5/10min)             │
│  - Page-Aware PDF Extractor (pdfjs-dist legacy)             │
│  - Page-Scoped Chunker (800 chars, 150 overlap, 100 bridge) │
│  - Deterministic Citation Mapper & Injection Sanitizer      │
└──────────────┬──────────────────┬─────────────────┬─────────┘
               │                  │                 │
               ▼                  ▼                 ▼
     ┌──────────────────┐ ┌───────────────┐ ┌────────────────┐
     │ Supabase Storage │ │  PostgreSQL   │ │   Gemini API   │
     │  Private PDF     │ │   pgvector    │ │ Batch Embed    │
     │     Bucket       │ │  Drizzle ORM  │ │ 768-dim &      │
     │                  │ │ (768-dim HNSW)│ │ 2.5-Flash LLM  │
     └──────────────────┘ └───────────────┘ └────────────────┘
```

---

## 📁 Struktur Monorepo

```text
docuMindAI/
├── PRD.md                          # Product Requirements Document
├── docs/                           # Dokumentasi teknis & perencanaan
│   ├── README.md                   # Indeks dokumentasi
│   ├── technical-design.md         # Technical Design Document (TDD)
│   ├── decision-log.md             # Architecture & Product Decision Log
│   ├── mvp-scope.md                # MVP Scope Matrix (P0/P1/P2/Out-of-Scope)
│   ├── requirements-traceability.md# Requirement Traceability Matrix (RTM)
│   ├── risk-register.md            # Risk Register & Mitigasi
│   └── evaluation-plan.md          # RAG Evaluation Plan (Recall@5, Citations)
├── backend/                        # Backend API Server
│   ├── src/
│   │   ├── index.ts                # Server bootstrap & graceful shutdown
│   │   ├── app.ts                  # Express application setup
│   │   ├── config/                 # Env validation (Zod) & Pino logger
│   │   ├── db/                     # Drizzle ORM schema & pgvector client
│   │   ├── middlewares/            # Auth, rate-limit, upload, error-handler
│   │   ├── adapters/               # Gemini AI & Supabase Storage adapters
│   │   ├── modules/
│   │   │   ├── health/             # GET /api/v1/health
│   │   │   ├── auth/               # GET /api/v1/auth/me
│   │   │   ├── documents/          # Upload, PDF extract, chunker, retry, CRUD
│   │   │   └── conversations/      # RAG Q&A, prompt builder, citation mapper
│   │   └── utils/                  # AppError, retry with backoff
│   └── tests/                      # Unit & integration tests
└── frontend/                       # Frontend SPA (React + Vite + Tailwind)
    ├── src/
    │   ├── api/                    # API client with Bearer auth
    │   ├── components/             # Reusable UI components
    │   ├── context/                # Auth & Document context
    │   ├── pages/                  # Login, Register, Dashboard, Workspace
    │   └── types/                  # Shared data models & API responses
```

---

## ⚡ Memulai Pengembangan (Quick Start)

### 1. Prasyarat
- **Node.js**: LTS (v20+ disarankan)
- **Database**: PostgreSQL dengan ekstensi `pgvector` aktif (misal: Supabase Free Tier)
- **AI API**: Google Gemini API Key ([Google AI Studio](https://aistudio.google.com/))

### 2. Konfigurasi Environment Variables
Salin berkas template lingkungan pada backend:
```bash
cp backend/.env.example backend/.env
```
Isi konfigurasi berikut:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres
SUPABASE_URL=https://[PROJECT-REF].supabase.co
SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
SUPABASE_STORAGE_BUCKET=documents
GEMINI_API_KEY=AIzaSy...
GEMINI_EMBEDDING_MODEL=text-embedding-004
GEMINI_LLM_MODEL=gemini-2.5-flash
FRONTEND_URL=http://localhost:5173
```

### 3. Instalasi & Migrasi Database
```bash
# Di direktori root proyek
npm install

# Jalankan migrasi database Drizzle
npm run db:push --workspace=backend
```

### 4. Menjalankan Aplikasi Secara Lokal
```bash
# Menjalankan backend dan frontend secara bersamaan
npm run dev

# Atau jalankan secara terpisah:
npm run dev:backend   # Berjalan di http://localhost:5000
npm run dev:frontend  # Berjalan di http://localhost:5173
```

---

## 🧪 Pengujian Otomatis

```bash
# Menjalankan seluruh test suite backend (Vitest)
npm run test --workspace=backend

# Menjalankan unit tests
npm run test:unit --workspace=backend

# Menjalankan integration & security tests
npm run test:integration --workspace=backend
```

---

## 📚 Indeks Dokumentasi Teknis

| Dokumen | Deskripsi |
| :--- | :--- |
| [PRD.md](PRD.md) | Spesifikasi lengkap produk, alur kerja, dan kriteria penerimaan. |
| [TDD](docs/technical-design.md) | Desain teknis modular, algoritma chunking, dan citation mapping. |
| [MVP Scope](docs/mvp-scope.md) | Pembagian prioritas P0, P1, P2, dan batasan Out-of-Scope. |
| [Decision Log](docs/decision-log.md) | Rekaman keputusan teknis & trade-off arsitektur. |
| [Risk Register](docs/risk-register.md) | Mitigasi risiko kuota AI, batas RAM, dan cold start. |
| [Evaluation Plan](docs/evaluation-plan.md) | Protokol evaluasi Recall@5, Citation Integrity, dan Abstention. |
| [Traceability Matrix](docs/requirements-traceability.md) | Pemetaan kebutuhan ke kasus uji otomatis. |

---

## 🔒 Keamanan & Privasi
- **Zero Trust**: User ID selalu diverifikasi dari Bearer JWT Supabase pada setiap request.
- **Strict Data Isolation**: Seluruh query data dan pencarian vektor membatasi lingkup pada `user_id` pemilik.
- **Redaksi Rahasia**: Logger Pino otomatis menyensor token JWT, API keys, dan header sensitif.
- **Prompt Injection Defense**: Karakter pembatas `<document_context>` di-escape dari teks PDF dan sitasi dipetakan secara deterministik di backend.

---

## 📄 Lisensi
Didistribusikan di bawah lisensi MIT.
Dikembangkan oleh **Ilham Sepriyadi**.
