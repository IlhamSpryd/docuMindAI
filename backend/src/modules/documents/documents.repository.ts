import { eq, and, desc, sql } from 'drizzle-orm';
import { db } from '../../db';
import { documents, documentChunks } from '../../db/schema';
import { DocumentChunkDraft } from './page-chunker';

export interface CreateDocumentRecordParams {
  userId: string;
  title: string;
  originalFilename: string;
  storagePath: string;
  mimeType: string;
  fileSizeBytes: number;
}

export class DocumentsRepository {
  async create(params: CreateDocumentRecordParams) {
    const [record] = await db
      .insert(documents)
      .values({
        userId: params.userId,
        title: params.title,
        originalFilename: params.originalFilename,
        storagePath: params.storagePath,
        mimeType: params.mimeType,
        fileSizeBytes: params.fileSizeBytes,
        status: 'uploading',
      })
      .returning();

    return record;
  }

  async findByIdScoped(id: string, userId: string) {
    const [record] = await db
      .select()
      .from(documents)
      .where(and(eq(documents.id, id), eq(documents.userId, userId)));

    return record || null;
  }

  async listByUser(userId: string) {
    return db
      .select()
      .from(documents)
      .where(eq(documents.userId, userId))
      .orderBy(desc(documents.createdAt));
  }

  async countByUser(userId: string): Promise<number> {
    const [row] = await db
      .select({ count: sql<number>`count(*)` })
      .from(documents)
      .where(eq(documents.userId, userId));

    return Number(row?.count ?? 0);
  }

  async updateStatus(
    id: string,
    userId: string,
    updates: {
      status: 'uploading' | 'processing' | 'ready' | 'failed';
      pageCount?: number | null;
      errorCode?: string | null;
      errorMessage?: string | null;
    }
  ) {
    const [record] = await db
      .update(documents)
      .set({
        status: updates.status,
        pageCount: updates.pageCount,
        errorCode: updates.errorCode,
        errorMessage: updates.errorMessage,
        updatedAt: new Date(),
      })
      .where(and(eq(documents.id, id), eq(documents.userId, userId)))
      .returning();

    return record || null;
  }

  /**
   * Atomic storage of chunks with embeddings and marking document as ready.
   * If any step fails, entire chunk insertion rolls back (0 partial chunks).
   */
  async storeChunksAndMarkReady(params: {
    documentId: string;
    userId: string;
    pageCount: number;
    chunks: DocumentChunkDraft[];
    embeddings: number[][];
  }) {
    return db.transaction(async (tx) => {
      // 1. Clean existing chunks if retry
      await tx
        .delete(documentChunks)
        .where(
          and(
            eq(documentChunks.documentId, params.documentId),
            eq(documentChunks.userId, params.userId)
          )
        );

      // 2. Insert all chunks
      const chunkRows = params.chunks.map((chunk, idx) => ({
        documentId: params.documentId,
        userId: params.userId,
        chunkIndex: chunk.chunkIndex,
        pageNumber: chunk.pageNumber,
        content: chunk.content,
        tokenEstimate: chunk.tokenEstimate,
        embedding: params.embeddings[idx],
      }));

      if (chunkRows.length > 0) {
        await tx.insert(documentChunks).values(chunkRows);
      }

      // 3. Update document status to ready
      const [updatedDoc] = await tx
        .update(documents)
        .set({
          status: 'ready',
          pageCount: params.pageCount,
          errorCode: null,
          errorMessage: null,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(documents.id, params.documentId),
            eq(documents.userId, params.userId)
          )
        )
        .returning();

      return updatedDoc;
    });
  }

  async deleteScoped(id: string, userId: string) {
    const [deleted] = await db
      .delete(documents)
      .where(and(eq(documents.id, id), eq(documents.userId, userId)))
      .returning();

    return deleted || null;
  }
}
