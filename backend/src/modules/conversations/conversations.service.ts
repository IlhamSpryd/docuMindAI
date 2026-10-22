import { ConversationsRepository } from './conversations.repository';
import { DocumentsRepository } from '../documents/documents.repository';
import { AIProviderAdapter } from '../../adapters/ai/ai-provider.interface';
import { mapAndValidateCitations } from './citation-mapper';
import { AppError } from '../../utils/app-error';
import { logger } from '../../config/logger';

export class ConversationsService {
  constructor(
    private conversationsRepo: ConversationsRepository,
    private documentsRepo: DocumentsRepository,
    private aiAdapter: AIProviderAdapter
  ) {}

  async createConversation(params: {
    documentId: string;
    userId: string;
    title?: string;
  }) {
    // 1. Verify document exists, belongs to user, and is ready
    const doc = await this.documentsRepo.findByIdScoped(params.documentId, params.userId);
    if (!doc) {
      throw new AppError(404, 'DOCUMENT_NOT_FOUND', 'Dokumen tidak ditemukan.');
    }

    if (doc.status !== 'ready') {
      throw new AppError(
        400,
        'DOCUMENT_NOT_READY',
        `Dokumen sedang berstatus '${doc.status}' dan belum siap untuk ditanyakan.`
      );
    }

    const defaultTitle = `Diskusi ${doc.title}`;
    const title = params.title?.trim() || defaultTitle;

    return this.conversationsRepo.createConversation({
      documentId: params.documentId,
      userId: params.userId,
      title,
    });
  }

  async listConversations(userId: string, documentId?: string) {
    return this.conversationsRepo.listByUser(userId, documentId);
  }

  async getMessages(conversationId: string, userId: string) {
    const messages = await this.conversationsRepo.listMessagesByConversation(
      conversationId,
      userId
    );
    if (!messages) {
      throw new AppError(404, 'CONVERSATION_NOT_FOUND', 'Sesi percakapan tidak ditemukan.');
    }
    return messages;
  }

  async askQuestion(params: {
    conversationId: string;
    userId: string;
    question: string;
  }) {
    const question = params.question.trim();
    if (question.length < 2 || question.length > 1000) {
      throw new AppError(
        400,
        'INVALID_QUESTION_LENGTH',
        'Panjang pertanyaan harus antara 2 hingga 1.000 karakter.'
      );
    }

    // 1. Verify conversation ownership
    const conv = await this.conversationsRepo.findByIdScoped(params.conversationId, params.userId);
    if (!conv) {
      throw new AppError(404, 'CONVERSATION_NOT_FOUND', 'Sesi percakapan tidak ditemukan.');
    }

    // 2. Verify document status
    const doc = await this.documentsRepo.findByIdScoped(conv.documentId, params.userId);
    if (!doc || doc.status !== 'ready') {
      throw new AppError(
        400,
        'DOCUMENT_NOT_READY',
        'Dokumen belum siap untuk sesi tanya-jawab.'
      );
    }

    logger.info(
      { conversationId: conv.id, documentId: doc.id, userId: params.userId },
      'Processing user question with RAG pipeline'
    );

    // 3. Generate query embedding (768-dim)
    const queryEmbedding = await this.aiAdapter.embedQuery(question);

    // 4. Scoped vector similarity search (pgvector)
    const relevantChunks = await this.conversationsRepo.findRelevantChunksScoped({
      documentId: doc.id,
      userId: params.userId,
      queryEmbedding,
      topK: 5,
      minSimilarity: 0.55,
    });

    // 5. Short-circuit: 0 chunks -> Direct Abstention without calling LLM
    if (relevantChunks.length === 0) {
      logger.info({ conversationId: conv.id }, 'Zero chunks above threshold: Direct Abstention');
      const abstentionAnswer =
        'Maaf, saya tidak menemukan informasi atau bukti yang cukup di dalam dokumen ini untuk menjawab pertanyaan tersebut.';

      return this.conversationsRepo.saveChatTurnAtomic({
        conversationId: conv.id,
        userId: params.userId,
        userQuestion: question,
        assistantAnswer: abstentionAnswer,
        isAbstention: true,
        sources: [],
      });
    }

    // 6. Build cited context chunks for LLM
    const contextChunks = relevantChunks.map((chunk, index) => ({
      sourceIndex: index + 1, // 1-indexed (1..K)
      chunkId: chunk.id,
      pageNumber: chunk.pageNumber,
      content: chunk.content,
    }));

    // 7. Call LLM for grounded answer
    const rawLLMOutput = await this.aiAdapter.generateGroundedAnswer({
      question,
      contextChunks,
    });

    // 8. Deterministic citation mapping & validation
    const mappedResult = mapAndValidateCitations(rawLLMOutput, relevantChunks, doc.title);

    // 9. Atomic DB save of user message, assistant message, and citations
    const turnResult = await this.conversationsRepo.saveChatTurnAtomic({
      conversationId: conv.id,
      userId: params.userId,
      userQuestion: question,
      assistantAnswer: mappedResult.answer,
      isAbstention: mappedResult.isAbstention,
      sources: mappedResult.sources,
    });

    return turnResult;
  }

  async deleteConversation(id: string, userId: string) {
    const deleted = await this.conversationsRepo.deleteConversationScoped(id, userId);
    if (!deleted) {
      throw new AppError(404, 'CONVERSATION_NOT_FOUND', 'Percakapan tidak ditemukan.');
    }
    return { success: true, message: 'Percakapan berhasil dihapus.' };
  }
}
