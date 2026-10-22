# RAG Quality & Citation Evaluation Plan — DocuMind AI

Dokumen ini mendefinisikan metodologi evaluasi kuantitatif dan kualitatif untuk memastikan pipeline Retrieval-Augmented Generation (RAG) pada DocuMind AI diuji secara objektif, bukan hanya diklaim berhasil secara subjektif.

## 1. Tujuan Evaluasi
Memisahkan dan mengukur tiga aspek kualitas sistem RAG secara independen:
1. **Retrieval Relevance (Recall@5):** Apakah pencarian vektor `pgvector` berhasil menemukan halaman/potongan teks yang memuat jawaban?
2. **Source Traceability (Citation Integrity):** Apakah setiap sitasi yang dikembalikan sistem benar-benar merujuk pada `chunk_id` dan `page_number` yang valid di dalam database?
3. **Groundedness & Abstention Accuracy:** Apakah LLM menjawab sesuai bukti yang diberikan dan menolak menjawab (*abstain*) ketika ditanya hal di luar isi dokumen?

---

## 2. Komposisi Dataset Evaluasi Internal (`eval-dataset.json`)

Evaluasi dijalankan pada Minggu ke-3 (Hari ke-17) menggunakan **3 dokumen PDF uji** berbasis teks (berbahasa Indonesia dan Inggris) dengan total **40 pertanyaan terkurasi**:

| Kategori Pertanyaan | Jumlah Pertanyaan | Karakteristik | Output yang Diharapkan |
| :--- | :--- | :--- | :--- |
| **A. Fakta Spesifik (Single-Page Fact)** | 20 pertanyaan | Jawaban terletak jelas pada 1 halaman tertentu (angka, definisi, tanggal, metode). | `isAbstention: false`, halaman target masuk dalam Top-5 retrieval, jawaban sesuai fakta, dan sitasi memuat `expectedPageNumber`. |
| **B. Sintesis Lintas Bagian (Multi-Chunk / Multi-Page)** | 10 pertanyaan | Jawaban membutuhkan penggabungan informasi dari 2 paragraf/halaman berbeda di dokumen yang sama. | `isAbstention: false`, minimal salah satu halaman target masuk Top-5 retrieval, dan sitasi merujuk ke halaman yang relevan. |
| **C. Pertanyaan di Luar Dokumen (Out-of-Scope / Unanswerable)** | 10 pertanyaan | Pertanyaan yang topiknya mirip atau sama sekali berbeda, tetapi jawabannya **tidak ada** di dalam dokumen PDF. | `isAbstention: true` dan `sources: []` (tidak mengarang fakta dan tidak menampilkan sitasi palsu). |

---

## 3. Definisi Metrik & Target Awal MVP

> **Catatan:** Angka di bawah ini adalah target rekayasa awal untuk mengukur kesiapan MVP pada dataset internal, bukan klaim performa universal untuk seluruh jenis dokumen PDF.

1. **Retrieval Recall@5 (Target: `>= 80%` pada Kategori A & B):**
   $$\text{Recall@5} = \frac{\text{Jumlah pertanyaan (A+B) di mana } \text{expectedPage} \in \text{Top 5 Retrieved Chunks}}{\text{Total pertanyaan (A+B)}}$$
2. **Citation Integrity Rate (Target: `100%`):**
   $$\text{Citation Integrity} = \frac{\text{Jumlah sitasi yang memiliki chunk\_id & page\_number valid di DB}}{\text{Total sitasi yang dihasilkan sistem}}$$
3. **Abstention Accuracy (Target: `>= 90%` pada Kategori C):**
   $$\text{Abstention Accuracy} = \frac{\text{Jumlah pertanyaan Kategori C yang menghasilkan } \text{isAbstention} = \text{true}}{\text{Total pertanyaan Kategori C}}$$

---

## 4. Prosedur Eksekusi Hemat Kuota (Rate-Limit Safe Execution)
Agar eksekusi 40 pertanyaan evaluasi tidak memicu error `429 Too Many Requests` pada Gemini API Free Tier:
- Ketiga dokumen PDF diindeks satu kali terlebih dahulu sebelum script tanya-jawab dijalankan.
- Script evaluasi CLI menjalankan pertanyaan secara sekuensial dengan jeda (*throttling delay*) **4 hingga 5 detik per pertanyaan**.
- Hasil evaluasi disimpan secara otomatis ke dalam berkas laporan `docs/evaluation-report.md` yang mencantumkan skor aktual, analisis kegagalan (*error analysis*), dan batasan temuan.