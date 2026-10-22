export interface StorageAdapter {
  uploadFile(params: {
    storagePath: string;
    buffer: Buffer;
    contentType: string;
  }): Promise<string>;

  deleteFile(storagePath: string): Promise<void>;

  getPublicOrSignedUrl(storagePath: string, expiresInSeconds?: number): Promise<string>;
}
