import {
  AIProviderAdapter,
  GenerateGroundedAnswerInput,
  RawLLMGradedOutput,
} from './ai-provider.interface';

export class MockAIAdapter implements AIProviderAdapter {
  readonly providerName = 'mock-ai';
  readonly embeddingModelName = 'mock-embedding-768';
  readonly llmModelName = 'mock-llm-flash';
  readonly vectorDimension = 768 as const;

  public shouldFailWithRateLimit = false;
  public mockAbstention = false;
  public customMockAnswer?: string;
  public customMockCitedIndices?: number[];

  /**
   * Deterministic 768-dim pseudo embedding using consistent string hashing.
   */
  private generateDeterministicVector(text: string): number[] {
    const vector = new Array(768).fill(0);
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = (hash << 5) - hash + text.charCodeAt(i);
      hash |= 0;
    }

    let sumSquares = 0;
    for (let i = 0; i < 768; i++) {
      const val = Math.sin(hash + i);
      vector[i] = val;
      sumSquares += val * val;
    }

    // Normalize to unit vector
    const norm = Math.sqrt(sumSquares) || 1;
    return vector.map((v) => Number((v / norm).toFixed(6)));
  }

  async embedQuery(text: string): Promise<number[]> {
    if (this.shouldFailWithRateLimit) {
      const err: any = new Error('Resource has been exhausted (e.g. check quota).');
      err.status = 429;
      throw err;
    }
    return this.generateDeterministicVector(text);
  }

  async embedDocuments(texts: string[]): Promise<number[][]> {
    if (this.shouldFailWithRateLimit) {
      const err: any = new Error('Resource has been exhausted (e.g. check quota).');
      err.status = 429;
      throw err;
    }
    return texts.map((t) => this.generateDeterministicVector(t));
  }

  async generateGroundedAnswer(
    input: GenerateGroundedAnswerInput
  ): Promise<RawLLMGradedOutput> {
    if (this.shouldFailWithRateLimit) {
      const err: any = new Error('Resource has been exhausted.');
      err.status = 429;
      throw err;
    }

    if (this.mockAbstention || input.contextChunks.length === 0) {
      return {
        answer: 'Informasi tidak ditemukan di dalam dokumen ini.',
        isAbstention: true,
        citedSourceIndices: [],
      };
    }

    if (this.customMockAnswer !== undefined) {
      return {
        answer: this.customMockAnswer,
        isAbstention: false,
        citedSourceIndices: this.customMockCitedIndices ?? [1],
      };
    }

    // Default grounded answer referencing first chunk
    const firstChunk = input.contextChunks[0];
    return {
      answer: `Berdasarkan dokumen pada halaman ${firstChunk.pageNumber}, ${firstChunk.content.slice(0, 100)}... [1]`,
      isAbstention: false,
      citedSourceIndices: [1],
    };
  }
}
