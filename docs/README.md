# Dokumentasi Teknis & Produk — DocuMind AI

Selamat datang di pusat dokumentasi proyek **DocuMind AI**. Seluruh spesifikasi produk, keputusan arsitektur, matriks pengujian, dan manajemen risiko dikelola di dalam direktori ini agar selaras dengan implementasi kode.

## Daftar Dokumen

| Nama Berkas | Deskripsi |
| :--- | :--- |
| [`../PRD.md`](../PRD.md) | **Product Requirements Document (PRD)** utama yang memuat visi, kebutuhan fungsional/non-fungsional, arsitektur RAG, skema data, spesifikasi API `/api/v1`, dan rencana kerja 21 hari. |
| [`mvp-scope.md`](./mvp-scope.md) | Penjaga cakupan (*Scope Guard*) yang memisahkan fitur wajib (**P0**), fitur opsional (**P1**), fitur pasca-MVP (**P2**), dan fitur **Out-of-Scope**. |
| [`requirements-traceability.md`](./requirements-traceability.md) | **Requirement Traceability Matrix (RTM)** yang memetakan `Requirement ID` → `User Story` → `Acceptance Criteria` → `Test Case ID`. |
| [`decision-log.md`](./decision-log.md) | Catatan keputusan produk dan arsitektur (*Decision Log*), alasan pemilihan teknologi (termasuk efisiensi untuk RAM 8 GB), serta *trade-off* teknis. |
| [`risk-register.md`](./risk-register.md) | Daftar risiko proyek (*Risk Register*) beserta probabilitas, dampak, pemicu (*trigger*), mitigasi, dan rencana kontingensi. |
| [`evaluation-plan.md`](./evaluation-plan.md) | Panduan dan protokol evaluasi kualitas sistem RAG (*Recall@5*, *Citation Integrity*, dan *Abstention Accuracy*) menggunakan dataset uji 30–50 pertanyaan. |

## Prinsip Pemeliharaan Dokumentasi
1. Setiap perubahan pada skema database atau kontrak endpoint `/api/v1` wajib diperbarui pada `PRD.md`.
2. Keputusan teknis baru yang diambil selama implementasi wajib dicatat sebagai entri baru pada `decision-log.md`.
3. Jangan pernah menyertakan API key, token JWT, atau kredensial nyata di dalam contoh dokumentasi.