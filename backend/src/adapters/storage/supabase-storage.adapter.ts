import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { StorageAdapter } from './storage.interface';
import { env } from '../../config/env';
import { AppError } from '../../utils/app-error';
import { logger } from '../../config/logger';

export class SupabaseStorageAdapter implements StorageAdapter {
  private client: SupabaseClient;
  private bucket: string;

  constructor(bucketName = env.SUPABASE_STORAGE_BUCKET) {
    this.bucket = bucketName;
    this.client = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });
  }

  async uploadFile(params: {
    storagePath: string;
    buffer: Buffer;
    contentType: string;
  }): Promise<string> {
    if (env.AI_PROVIDER === 'mock' && env.NODE_ENV === 'test') {
      return params.storagePath;
    }

    const { data, error } = await this.client.storage
      .from(this.bucket)
      .upload(params.storagePath, params.buffer, {
        contentType: params.contentType,
        upsert: true,
      });

    if (error) {
      logger.error({ error, storagePath: params.storagePath }, 'Gagal mengunggah file ke Supabase Storage');
      throw new AppError(500, 'STORAGE_UPLOAD_ERROR', `Gagal mengunggah berkas: ${error.message}`);
    }

    return data.path;
  }

  async deleteFile(storagePath: string): Promise<void> {
    if (env.AI_PROVIDER === 'mock' && env.NODE_ENV === 'test') {
      return;
    }

    const { error } = await this.client.storage
      .from(this.bucket)
      .remove([storagePath]);

    if (error) {
      logger.warn({ error, storagePath }, 'Gagal menghapus file dari Supabase Storage');
      // Do not throw fatal error on delete to allow DB cascade to complete
    }
  }

  async getPublicOrSignedUrl(storagePath: string, expiresInSeconds = 3600): Promise<string> {
    if (env.AI_PROVIDER === 'mock' && env.NODE_ENV === 'test') {
      return `https://mock.storage/${storagePath}`;
    }

    const { data, error } = await this.client.storage
      .from(this.bucket)
      .createSignedUrl(storagePath, expiresInSeconds);

    if (error || !data?.signedUrl) {
      throw new AppError(500, 'STORAGE_URL_ERROR', 'Gagal membuat URL akses dokumen.');
    }

    return data.signedUrl;
  }
}
