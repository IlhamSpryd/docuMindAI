import { eq, and, desc, asc, sql } from 'drizzle-orm';
import { db } from '../../db';
import {
  conversations,
  messages,
  messageSources,
  documentChunks,
} from '../../db/schema';
import { RetrievedChunkRecord, ValidatedCitationSource } from './citation-mapper';

export interface ScopedRetrievalParams {
  documentId: string;
  userId: string;
  queryEmbedding: number[]; // Length 768
  topK?: number; // Default 5
  minSimilarity?: number; // Default 0.55
}

export class ConversationsRepository {
  async findRelevantChunksScoped(
    params: ScopedRetrievalParams
  ): Promise<RetrievedChunkRecord[]> {
    const topK = params.topK ?? 5;
    const minSimilarity = params.minSimilarity ?? 0.55;
    const vectorLiteral = `[${params.queryEmbedding.join(',')}]`;

    const cosineSimilarityExpr = sql<number>`1 - (${documentChunks.embedding} <=> ${vectorLiteral}::vector)`;

    const rows = await db
      .select({
        id: documentChunks.id,
        documentId: documentChunks.documentId,
        chunkIndex: documentChunks.chunkIndex,
        pageNumber: documentChunks.pageNumber,
        content: documentChunks.content,
        similarityScore: cosineSimilarityExpr,
      })
      .from(documentChunks)
      .where(
        and(
          eq(documentChunks.documentId, params.documentId),
          eq(documentChunks.userId, params.userId),
          sql`${cosineSimilarityExpr} >= ${minSimilarity}`
        )
      )
      .orderBy(sql`${documentChunks.embedding} <=> ${vectorLiteral}::vector ASC`)
      .limit(topK);

    return rows.map((r) => ({
      ...r,
      similarityScore: Number(r.similarityScore) || 0,
    }));
  }

  async createConversation(params: {
    documentId: string;
    userId: string;
    title: string;
  }) {
    const [record] = await db
      .insert(conversations)
      .values({
        documentId: params.documentId,
        userId: params.userId,
        title: params.title,
      })
      .returning();

    return record;
  }

  async findByIdScoped(id: string, userId: string) {
    const [conv] = await db
      .select()
      .from(conversations)
      .where(and(eq(conversations.id, id), eq(conversations.userId, userId)));

    return conv || null;
  }

  async listByUser(userId: string, documentId?: string) {
    const conditions = [eq(conversations.userId, userId)];
    if (documentId) {
      conditions.push(eq(conversations.documentId, documentId));
    }

    return db
      .select()
      .from(conversations)
      .where(and(...conditions))
      .orderBy(desc(conversations.updatedAt));
  }

  async listMessagesByConversation(conversationId: string, userId: string) {
    // 1. Verify user owns conversation
    const conv = await this.findByIdScoped(conversationId, userId);
    if (!conv) return null;

    // 2. Fetch messages
    const msgs = await db
      .select()
      .from(messages)
      .where(
        and(
          eq(messages.conversationId, conversationId),
          eq(messages.userId, userId)
        )
      )
      .orderBy(asc(messages.createdAt));

    // 3. Fetch sources for assistant messages
    const msgIds = msgs.map((m) => m.id);
    const allSources =
      msgIds.length > 0
        ? await db
            .select({
              id: messageSources.id,
              messageId: messageSources.messageId,
              chunkId: messageSources.chunkId,
              citationOrder: messageSources.citationOrder,
              pageNumber: messageSources.pageNumber,
              similarityScore: messageSources.similarityScore,
              snippet: documentChunks.content,
            })
            .from(messageSources)
            .leftJoin(documentChunks, eq(messageSources.chunkId, documentChunks.id))
            .where(sql`${messageSources.messageId} IN ${msgIds}`)
            .orderBy(asc(messageSources.citationOrder))
        : [];

    return msgs.map((msg) => {
      const sourcesForThisMsg = allSources
        .filter((s) => s.messageId === msg.id)
        .map((s) => ({
          citationOrder: s.citationOrder,
          chunkId: s.chunkId,
          pageNumber: s.pageNumber,
          similarityScore: s.similarityScore,
          snippet: s.snippet ?? '',
        }));

      return {
        ...msg,
        sources: sourcesForThisMsg,
      };
    });
  }

  /**
   * Atomically save user message, assistant message, and citation sources in one transaction.
   * If any step fails, nothing is persisted so user can retry cleanly.
   */
  async saveChatTurnAtomic(params: {
    conversationId: string;
    userId: string;
    userQuestion: string;
    assistantAnswer: string;
    isAbstention: boolean;
    sources: ValidatedCitationSource[];
  }) {
    return db.transaction(async (tx) => {
      // 1. Insert user message
      const [userMsg] = await tx
        .insert(messages)
        .values({
          conversationId: params.conversationId,
          userId: params.userId,
          role: 'user',
          content: params.userQuestion,
          isAbstention: false,
        })
        .returning();

      // 2. Insert assistant message
      const [assistantMsg] = await tx
        .insert(messages)
        .values({
          conversationId: params.conversationId,
          userId: params.userId,
          role: 'assistant',
          content: params.assistantAnswer,
          isAbstention: params.isAbstention,
        })
        .returning();

      // 3. Insert citation sources
      if (params.sources.length > 0) {
        const sourceRows = params.sources.map((src) => ({
          messageId: assistantMsg.id,
          chunkId: src.chunkId,
          citationOrder: src.citationOrder,
          pageNumber: src.pageNumber,
          similarityScore: src.similarityScore,
        }));

        await tx.insert(messageSources).values(sourceRows);
      }

      // 4. Update conversation updatedAt timestamp
      await tx
        .update(conversations)
        .set({ updatedAt: new Date() })
        .where(eq(conversations.id, params.conversationId));

      return {
        userMessage: userMsg,
        assistantMessage: {
          ...assistantMsg,
          sources: params.sources,
        },
      };
    });
  }

  async deleteConversationScoped(id: string, userId: string) {
    const [deleted] = await db
      .delete(conversations)
      .where(and(eq(conversations.id, id), eq(conversations.userId, userId)))
      .returning();

    return deleted || null;
  }
}
