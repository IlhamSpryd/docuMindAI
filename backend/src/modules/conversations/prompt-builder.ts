import { CitedChunkContext } from '../../adapters/ai/ai-provider.interface';

export function sanitizeChunkForPrompt(rawText: string): string {
  return rawText
    .replace(/<\/?document_context[^>]*>/gi, '[escaped_context_tag]')
    .replace(/<\/?source[^>]*>/gi, '[escaped_source_tag]')
    .replace(/<\/?user_question[^>]*>/gi, '[escaped_question_tag]')
    .replace(/<\/?system_instruction[^>]*>/gi, '[escaped_system_tag]');
}

export function buildPromptContext(chunks: CitedChunkContext[]): string {
  return chunks
    .map((chunk) => {
      const sanitizedContent = sanitizeChunkForPrompt(chunk.content);
      return `<source index="${chunk.sourceIndex}" page="${chunk.pageNumber}">\n${sanitizedContent}\n</source>`;
    })
    .join('\n\n');
}
