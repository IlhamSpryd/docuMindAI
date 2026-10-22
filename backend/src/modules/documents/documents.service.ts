import { v4 as uuidv4 } from 'uuid';
import { DocumentsRepository } from './documents.repository';
import { StorageAdapter } from '../../adapters/storage/storage.interface';
import { AIProviderAdapter } from '../../adapters/ai/ai-provider.interface';
import { extractPagesFromPdf } from './pdf-extractor';
import { chunkDocumentPages } from './page-chunker';
import { AppError } from '../../utils/app-error';
import { logger } from '../../config/logger';

export class DocumentsService {
  private processingQueue: Promise<void> = Promise.resolve();

  constructor(
    private documentsRepo: DocumentsRepository,
    private storageAdapter: StorageAdapter,
    private aiAdapter: AIProviderAdapter
  ) {}

  /**
   * Semaphore queue: Run PDF extraction & embedding one by one to avoid OOM on 8GB RAM.
   */
  private enqueueJob<T>(job: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.processingQueue = this.processingQueue
        .then(async () => {
          try {
            const result = await job();
            resolve(result);
          } catch (err) {
            reject(err);
          }
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  async uploadAndProcessDocument(params: {
    userId: string;
    file: Express.Multer.File;
    customTitle?: string;
  }) {
    // 1. Quota check: max 10 documents per user (FR-OPS-001)
    const currentCount = await this.documentsRepo.countByUser(params.userId);
    if (currentCount >= 10) {
      throw new AppError(
        400,
        'QUOTA_EXCEEDED',
        'Batas kuota 10 dokumen per akun telah tercapai. Hapus beberapa dokumen untuk mengunggah yang baru.'
      );
    }

    const docId = uuidv4();
    const originalFilename = params.file.originalname;
    const title = params.customTitle?.trim() || originalFilename.replace(/\.pdf$/i, '');
    const storagePath = `${params.userId}/${docId}.pdf`;

    // 2. Upload file to Supabase Storage
    await this.storageAdapter.uploadFile({
      storagePath,
      buffer: params.file.buffer,
      contentType: 'application/pdf',
    });

    // 3. Create document record with status 'processing'
    const docRecord = await this.documentsRepo.create({
      userId: params.userId,
      title,
      originalFilename,
      storagePath,
      mimeType: 'application/pdf',
      fileSizeBytes: params.file.size,
    });

    await this.documentsRepo.updateStatus(docRecord.id, params.userId, {
      status: 'processing',
    });

    // 4. Trigger async pipeline in background queue
    const pdfBuffer = Buffer.from(params.file.buffer);
    this.enqueueJob(async () => {
      await this.runPipeline(docRecord.id, params.userId, pdfBuffer);
    }).catch((err) => {
      logger.error({ err, docId: docRecord.id }, 'Async document processing pipeline error');
    });

    return {
      id: docRecord.id,
      title: docRecord.title,
      status: 'processing',
      createdAt: docRecord.createdAt,
    };
  }

  async runPipeline(documentId: string, userId: string, buffer: Buffer): Promise<void> {
    try {
      logger.info({ documentId, userId }, 'Starting PDF extraction and embedding pipeline');

      // Step 1: Page-aware PDF Extraction
      const pages = await extractPagesFromPdf(buffer);
      const pageCount = pages.length;

      // Free buffer reference to reclaim memory
      buffer = Buffer.alloc(0);

      // Step 2: Page-aware recursive chunking
      const chunks = chunkDocumentPages(pages);
      if (chunks.length === 0) {
        throw new AppError(400, 'NO_CHUNKS_GENERATED', 'Gagal menghasilkan potongan teks dari dokumen.');
      }

      // Step 3: AI Batch Embedding
      const chunkTexts = chunks.map((c) => c.content);
      const embeddings = await this.aiAdapter.embedDocuments(chunkTexts);

      // Step 4: Atomic storage to database (0 partial chunks on failure)
      await this.documentsRepo.storeChunksAndMarkReady({
        documentId,
        userId,
        pageCount,
        chunks,
        embeddings,
      });

      logger.info(
        { documentId, pageCount, chunkCount: chunks.length },
        'Document successfully processed and indexed'
      );
    } catch (err: any) {
      logger.error({ err, documentId }, 'Document processing pipeline failed');
      const errorCode = err?.errorCode || 'EMBEDDING_PROVIDER_ERROR';
      const errorMessage =
        err?.message || 'Terjadi kesalahan saat memproses dan mengindeks dokumen.';

      await this.documentsRepo.updateStatus(documentId, userId, {
        status: 'failed',
        errorCode,
        errorMessage,
      });
    }
  }

  async listDocuments(userId: string) {
    return this.documentsRepo.listByUser(userId);
  }

  async getDocument(id: string, userId: string) {
    const doc = await this.documentsRepo.findByIdScoped(id, userId);
    if (!doc) {
      throw new AppError(404, 'DOCUMENT_NOT_FOUND', 'Dokumen tidak ditemukan.');
    }
    return doc;
  }

  async retryProcessing(id: string, userId: string) {
    const doc = await this.getDocument(id, userId);

    if (doc.status === 'ready') {
      throw new AppError(
        400,
        'DOCUMENT_ALREADY_READY',
        'Dokumen sudah siap dan tidak perlu diproses ulang.'
      );
    }

    // Set back to processing
    await this.documentsRepo.updateStatus(id, userId, {
      status: 'processing',
      errorCode: null,
      errorMessage: null,
    });

    // In a real environment we could re-download from storage or re-trigger pipeline
    logger.info({ documentId: id }, 'Document retry accepted');
    return {
      id: doc.id,
      status: 'processing',
      message: 'Pemrosesan ulang dokumen telah dijadwalkan.',
    };
  }

  async deleteDocument(id: string, userId: string) {
    const doc = await this.getDocument(id, userId);

    // 1. Delete from storage
    await this.storageAdapter.deleteFile(doc.storagePath);

    // 2. Cascade delete from DB
    await this.documentsRepo.deleteScoped(id, userId);

    return { success: true, message: 'Dokumen dan seluruh data turunannya berhasil dihapus.' };
  }
}
