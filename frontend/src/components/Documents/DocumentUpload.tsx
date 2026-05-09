'use client';
import { useRef, useState } from 'react';
import { useUploadDocument } from '@/hooks/useDocuments';
import { Button } from '@/components/Common/Button';
import { ErrorAlert } from '@/components/Common/ErrorAlert';
import { ApiError } from '@/types';

const MAX_MB = 5;

export const DocumentUpload = ({ applicationId }: { applicationId: number }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const mutation = useUploadDocument(applicationId);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`File must be under ${MAX_MB}MB`);
      return;
    }

    setError(null);
    mutation.mutate(file, {
      onError: (err) => setError((err as ApiError).message || 'Upload failed'),
      onSettled: () => { if (inputRef.current) inputRef.current.value = ''; },
    });
  };

  return (
    <div className="space-y-2">
      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}
      {mutation.isSuccess && (
        <p className="text-sm text-green-600">File uploaded successfully.</p>
      )}
      <div className="flex items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.gif"
          onChange={handleChange}
          className="hidden"
          id="doc-upload"
        />
        <Button
          variant="ghost"
          loading={mutation.isPending}
          onClick={() => inputRef.current?.click()}
        >
          Upload Document
        </Button>
        <span className="text-xs text-gray-400">PDF, PNG, JPG — max {MAX_MB}MB</span>
      </div>
    </div>
  );
};
