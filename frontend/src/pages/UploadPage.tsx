import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';

export function UploadPage() {
  const fileInput = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const queryClient = useQueryClient();

  const pick = (picked?: File) => {
    if (!picked) return;
    if (picked.type !== 'application/pdf' && !picked.name.toLowerCase().endsWith('.pdf')) {
      setError('Only PDF files are supported.');
      setFile(null);
      return;
    }
    if (picked.size > 10 * 1024 * 1024) {
      setError('File exceeds the 10 MB limit.');
      setFile(null);
      return;
    }
    setError('');
    setFile(picked);
    if (!title) setTitle(picked.name.replace(/\.pdf$/i, ''));
  };

  const handleUpload = async () => {
    if (!file) return;
    try {
      setIsUploading(true);
      setError('');
      const res = await api.uploadDocument(file, title.trim() || undefined);
      await queryClient.invalidateQueries({ queryKey: ['documents'] });
      refreshUser();
      navigate(`/doc/${res.document.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-[560px] px-4 py-8 sm:px-8 sm:py-16">
        <h1 className="text-[22px] font-semibold tracking-tight sm:text-2xl">Upload PDF</h1>
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            pick(e.dataTransfer.files[0]);
          }}
          className="mt-6 rounded-xl border border-dashed border-border px-6 py-10 text-center"
        >
          <p className="font-medium">Drop a PDF here</p>
          <p className="mb-4 mt-1 text-muted-foreground">or choose a file from your device</p>
          <input
            ref={fileInput}
            type="file"
            accept="application/pdf"
            className="sr-only"
            aria-label="Choose PDF file"
            onChange={(e) => pick(e.target.files?.[0])}
          />
          <Button variant="outline" size="lg" type="button" onClick={() => fileInput.current?.click()}>
            Choose file
          </Button>
        </div>
        {error && (
          <p role="alert" className="mt-3 text-destructive">
            {error}
          </p>
        )}
        {file && (
          <>
            <p className="mt-4 truncate border-b border-border pb-3 font-medium">{file.name}</p>
            <label htmlFor="title" className="mb-1.5 mt-4 block text-[13px] font-medium">
              Title
            </label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </>
        )}
        <div className="mt-6 flex justify-end">
          <Button size="lg" disabled={!file || isUploading} onClick={handleUpload}>
            {isUploading ? 'Uploading…' : 'Upload'}
          </Button>
        </div>
      </div>
    </div>
  );
}
