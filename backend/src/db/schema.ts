import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  pgEnum,
  boolean,
  doublePrecision,
  customType,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Custom type for pgvector(768)
export const vector768 = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return 'vector(768)';
  },
  toDriver(value: number[]): string {
    return `[${value.join(',')}]`;
  },
  fromDriver(value: string): number[] {
    if (typeof value !== 'string') return [];
    return value
      .replace(/^\[|\]$/g, '')
      .split(',')
      .map(Number);
  },
});

export const documentStatusEnum = pgEnum('document_status', [
  'uploading',
  'processing',
  'ready',
  'failed',
]);

export const messageRoleEnum = pgEnum('message_role', ['user', 'assistant']);

// 1. Documents Table
export const documents = pgTable('documents', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(),
  title: text('title').notNull(),
  originalFilename: text('original_filename').notNull(),
  storagePath: text('storage_path').notNull().unique(),
  mimeType: text('mime_type').notNull(),
  fileSizeBytes: integer('file_size_bytes').notNull(),
  pageCount: integer('page_count'),
  status: documentStatusEnum('status').default('uploading').notNull(),
  errorCode: text('error_code'),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 2. Document Chunks Table (with 768-dim vector)
export const documentChunks = pgTable(
  'document_chunks',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    documentId: uuid('document_id')
      .notNull()
      .references(() => documents.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull(),
    chunkIndex: integer('chunk_index').notNull(),
    pageNumber: integer('page_number').notNull(),
    content: text('content').notNull(),
    tokenEstimate: integer('token_estimate').notNull(),
    embedding: vector768('embedding'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('doc_chunk_idx').on(table.documentId, table.chunkIndex),
    index('doc_chunks_user_idx').on(table.userId),
    index('doc_chunks_doc_idx').on(table.documentId),
  ]
);

// 3. Conversations Table
export const conversations = pgTable(
  'conversations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    documentId: uuid('document_id')
      .notNull()
      .references(() => documents.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull(),
    title: text('title').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('conversations_doc_idx').on(table.documentId),
    index('conversations_user_idx').on(table.userId),
  ]
);

// 4. Messages Table
export const messages = pgTable(
  'messages',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    conversationId: uuid('conversation_id')
      .notNull()
      .references(() => conversations.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull(),
    role: messageRoleEnum('role').notNull(),
    content: text('content').notNull(),
    isAbstention: boolean('is_abstention').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('messages_conversation_idx').on(table.conversationId),
    index('messages_user_idx').on(table.userId),
  ]
);

// 5. Message Sources Table (Citation Provenance)
export const messageSources = pgTable(
  'message_sources',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    messageId: uuid('message_id')
      .notNull()
      .references(() => messages.id, { onDelete: 'cascade' }),
    chunkId: uuid('chunk_id')
      .notNull()
      .references(() => documentChunks.id, { onDelete: 'cascade' }),
    citationOrder: integer('citation_order').notNull(),
    pageNumber: integer('page_number').notNull(),
    similarityScore: doublePrecision('similarity_score').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('sources_message_idx').on(table.messageId)]
);

// Relations
export const documentsRelations = relations(documents, ({ many }) => ({
  chunks: many(documentChunks),
  conversations: many(conversations),
}));

export const documentChunksRelations = relations(documentChunks, ({ one, many }) => ({
  document: one(documents, {
    fields: [documentChunks.documentId],
    references: [documents.id],
  }),
  messageSources: many(messageSources),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  document: one(documents, {
    fields: [conversations.documentId],
    references: [documents.id],
  }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one, many }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
  sources: many(messageSources),
}));

export const messageSourcesRelations = relations(messageSources, ({ one }) => ({
  message: one(messages, {
    fields: [messageSources.messageId],
    references: [messages.id],
  }),
  chunk: one(documentChunks, {
    fields: [messageSources.chunkId],
    references: [documentChunks.id],
  }),
}));
