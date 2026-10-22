# Architecture & Product Decision Log — DocuMind AI

Dokumen ini mencatat keputusan produk dan teknis yang telah ditetapkan maupun asumsi yang harus diverifikasi sebelum/selama implementasi.

## 1. Keputusan yang Telah Ditetapkan

| ID | Versi | Keputusan | Alasan (Rationale) | Status | Konsekuensi & Trade-off |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **DEC-001** | `v1.0.0-draft` | **Menggunakan Cloud Supabase Free Tier secara langsung selama pengembangan (Tanpa Docker Supabase Lokal).** | Mesin pengembangan menggunakan laptop RAM 8 GB (Arch Linux + Hyprland). Menjalankan container Docker Supabase lokal memakan 2,5–4 GB RAM yang akan memicu *out-of-memory* saat dijalankan bersama browser, editor, dan server Node.js. | **Active** | Membutuhkan koneksi internet saat pengembangan, namun menjaga konsumsi RAM lokal tetap di bawah batas aman. |
| **DEC-002** | `v1.0.0-draft` | **Memilih Drizzle ORM sebagai lapisan akses database tunggal (Tidak menggunakan Prisma).** | Drizzle ORM bekerja murni di atas TypeScript tanpa *Rust binary query engine* yang berat di memori, mendukung tipe `pgvector` secara langsung, dan memiliki waktu *startup* yang jauh lebih ringan. | **Active** | Skema dan migrasi dikelola sepenuhnya dengan `drizzle-orm` dan `drizzle-kit`. |
| **DEC-003** | `v1.0.0-draft` | **Mengunci percakapan pada Satu Dokumen Tunggal per Sesi (*Single-Document Scoped Chat*) untuk MVP.** | Menjamin keakuratan pengambilan konteks (*retrieval*) dan kejelasan sitasi halaman dalam batas waktu pengerjaan 21 hari oleh 1 developer. | **Active** | Setiap record `conversations` terikat pada satu `document_id`. Pengguna tetap dapat membuat banyak percakapan pada satu dokumen. |
| **DEC-004** | `v1.0.0-draft` | **Ekstraksi teks PDF dilakukan per halaman menggunakan `pdfjs-dist` (legacy build).** | Menggabungkan seluruh teks PDF sebelum chunking akan menghilangkan batas halaman sehingga nomor halaman sitasi menjadi tidak akurat. Ekstraksi per halaman menjamin setiap chunk memiliki `page_number` deterministik. | **Active** | Memerlukan jembatan konteks ringan (*cross-page context bridge* 100 karakter) di perbatasan halaman agar kalimat yang terpotong tetap utuh maknanya. |
| **DEC-005** | `v1.0.0-draft` | **Menetapkan batas ukuran PDF <= 10 MB, <= 50 halaman, dan tanpa OCR pada MVP.** | Mencegah lonjakan memori (OOM) pada hosting backend gratis (RAM 512 MB) dan menjaga kuota gratis API Embedding tidak habis oleh satu dokumen besar. | **Active** | PDF hasil pemindaian kamera (*scanned PDF*) akan ditolak secara terkontrol dengan status `failed` (`EMPTY_EXTRACTED_TEXT`). |
| **DEC-006** | `v1.0.0-draft` | **Mengunci dimensi vektor embedding pada 768 dimensi (`vector(768)`).** | Menghemat penggunaan ruang penyimpanan database 500 MB Supabase Free Tier hingga 75% dibanding vektor 3072 dimensi tanpa mengorbankan kualitas pencarian semantik secara signifikan. | **Active** | Pemanggilan API Embedding wajib menyertakan konfigurasi dimensi `768` secara konsisten saat mengindeks dokumen maupun pertanyaan. |
| **DEC-007** | `v1.0.0-draft` | **Pemetaan sitasi dilakukan secara deterministik di Backend menggunakan indeks integer (`[1..K]`).** | Mencegah LLM mengarang nama dokumen, nomor halaman, atau kutipan palsu. LLM hanya memilih nomor indeks sumber yang dikirim di dalam `<document_context>`, lalu backend memetakannya ke baris `document_chunks` asli. | **Active** | Menjamin integritas nomor halaman dan teks sitasi 100% sesuai isi database. |
| **DEC-008** | `v1.0.0-draft` | **Respons endpoint Chat menggunakan JSON terstruktur penuh (Non-Streaming) pada MVP.** | Memungkinkan validasi skema JSON dan pemetaan sitasi diselesaikan secara utuh di backend sebelum pesan disimpan ke DB dan dikirim ke klien. | **Active** | Pengguna melihat indikator *loading* selama 2–6 detik sebelum jawaban muncul utuh. Streaming SSE ditangguhkan ke P2. |

---

## 2. Daftar Verifikasi Pra-Implementasi (Hari ke-1)

Hal-hal berikut wajib diverifikasi dan dicatat hasilnya pada Hari ke-1 sebelum mengimplementasikan modul terkait:
1. **Nama Model & Kuota Aktif Gemini API:** Memastikan string model embedding (misal `gemini-embedding-001` / `text-embedding-004`) dan model generasi (`gemini-2.5-flash`) yang aktif pada Google AI Studio Free Tier beserta batas pasti RPM/RPD.
2. **Kebijakan Konfirmasi Email Supabase Auth:** Memutuskan apakah *Confirm Email* dinonaktifkan selama periode demo portofolio agar penguji dapat langsung mendaftar dan mencoba aplikasi tanpa hambatan pengiriman email.
3. **Target Hosting Deployment:** Memverifikasi persyaratan akun pada platform hosting kandidat (Vercel/Cloudflare Pages untuk frontend, Render/Koyeb Free Tier untuk backend).