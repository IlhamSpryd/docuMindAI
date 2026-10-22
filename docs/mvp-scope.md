# MVP Scope Matrix — DocuMind AI

Dokumen ini mendefinisikan batas tegas antara fitur yang wajib diselesaikan dalam 21 hari (**P0**), peningkatan opsional (**P1**), pengembangan masa depan (**P2**), dan fitur yang dilarang dikerjakan selama siklus MVP (**Out of Scope**).

## 1. P0 — Wajib untuk Kelulusan MVP
Tidak ada kompromi pada kualitas dan pengujian fitur P0 berikut:

| Kode | Fitur | Cakupan Spesifik MVP |
| :--- | :--- | :--- |
| **F-01** | **Authentication** | Registrasi, login, logout, pemeriksaan sesi (`/api/v1/auth/me`), penanganan sesi kedaluwarsa (`401`), dan proteksi penuh pada seluruh endpoint privat. |
| **F-02** | **Document Library** | Melihat daftar dokumen milik sendiri, mengunggah PDF (<= 10 MB), melihat status (`uploading`, `processing`, `ready`, `failed`), dan menghapus dokumen beserta seluruh data turunannya. |
| **F-03** | **PDF Processing** | Validasi tipe MIME & *magic bytes* (`%PDF-`), batas <= 50 halaman, ekstraksi teks per halaman, chunking (800 karakter, overlap 150), pembuatan embedding batch (768-dim), penyimpanan ke `pgvector`, serta mekanisme **Retry** dokumen gagal. |
| **F-04** | **AI Document Chat** | Tanya-jawab berbasis RAG pada satu dokumen (*single-document scoped chat*), penyimpanan riwayat percakapan & pesan, serta kemampuan menyatakan bukti tidak cukup (*abstention*). |
| **F-05** | **Source Citations** | Pemetaan sitasi deterministik ke `chunk_id` dan `page_number`, lencana sitasi interaktif pada jawaban, dan panel *Source Inspector* untuk memeriksa potongan teks sumber asli. |
| **F-06** | **User Data Isolation** | Penegakan otorisasi berbasis JWT di backend dan RLS di database/storage sehingga pengguna tidak pernah dapat mengakses dokumen atau chat milik pengguna lain. |
| **F-07** | **Operational Feedback** | Indikator state UI (*loading*, *empty*, *error*, *processing*), pesan kegagalan yang aman, kuota maksimal 10 dokumen per akun, dan *rate limiting* API. |
| **F-08** | **Basic Observability** | Endpoint `GET /api/v1/health` dan *structured logging* dengan redaksi otomatis terhadap kredensial dan data sensitif. |

---

## 2. P1 — Dikerjakan Hanya Jika Seluruh P0 Lulus Uji Sebelum Hari ke-18
1. **Penghapusan & Pengubahan Judul Sesi Percakapan (`FR-OPS-003`):** Menghapus riwayat percakapan tertentu pada dokumen tanpa menghapus file PDF-nya.
2. **Salin Jawaban Beserta Kutipan:** Tombol *Copy with Citations* pada balon jawaban asisten.
3. **Tombol Akun Demo Instan:** Akses 1-klik di halaman login bagi penguji portofolio untuk mencoba dokumen sampel yang sudah berstatus `ready`.

---

## 3. P2 — Ditangguhkan ke Pasca-MVP (v1.1+)
1. *Token streaming* jawaban secara *real-time* menggunakan *Server-Sent Events* (SSE).
2. Penampil kanvas PDF visual tersemat (*Embedded PDF Viewer*) dengan penyorotan koordinat kalimat (*bounding-box highlight*).
3. Ekspor riwayat tanya-jawab ke format Markdown/PDF.

---

## 4. Out of Scope (Dikeluarkan Secara Eksplisit dari MVP)
- OCR untuk PDF hasil pemindaian kamera/scanner.
- Dukungan format DOCX, XLSX, PPTX, TXT, HTML, atau gambar.
- Percakapan lintas banyak dokumen sekaligus (*Multi-document chat*).
- Billing, langganan berbayar, dan integrasi payment gateway.
- Kolaborasi tim, berbagi dokumen antar-pengguna, dan RBAC kompleks.
- *Fine-tuning* model bahasa atau *multi-agent orchestration*.
- *Hybrid search* kompleks (BM25 + Dense Vector + Cross-Encoder Reranker).
- Penggunaan beberapa provider AI aktif sekaligus atau LLM lokal sebagai jalur utama.
- Aplikasi mobile native (iOS/Android) dan *real-time collaborative chat*.