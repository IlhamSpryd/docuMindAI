export type EmbeddingTaskType = 'RETRIEVAL_DOCUMENT' | 'RETRIEVAL_QUERY';

export interface CitedChunkContext {
  sourceIndex: number; // 1-indexed (1..K)
  chunkId: string;
  pageNumber: number;
  content: string;
}

export interface ChatHistoryTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface GenerateGroundedAnswerInput {
  question: string;
  contextChunks: CitedChunkContext[];
  recentHistory?: ChatHistoryTurn[];
}

export interface RawLLMGradedOutput {
  answer: string;
  isAbstention: boolean;
  citedSourceIndices: number[];
}

export interface EmbeddingProvider {
  /**
   * Menghasilkan vektor embedding untuk satu teks (digunakan saat query pertanyaan).
   * Wajib mengembalikan array sepanjang tepat 768 elemen.
   */
  embedQuery(text: string): Promise<number[]>;

  /**
   * Menghasilkan vektor embedding secara batch untuk daftar potongan dokumen.
   * Menangani pemecahan batch internal (maks 20 teks per panggilan API) & retry.
   */
  embedDocuments(texts: string[]): Promise<number[][]>;
}

export interface LLMProvider {
  /**
   * Menghasilkan jawaban berbasis konteks dokumen dengan output JSON terstruktur.
   */
  generateGroundedAnswer(
    input: GenerateGroundedAnswerInput
  ): Promise<RawLLMGradedOutput>;
}

export interface AIProviderAdapter extends EmbeddingProvider, LLMProvider {
  readonly providerName: string;
  readonly embeddingModelName: string;
  readonly llmModelName: string;
  readonly vectorDimension: 768;
}
