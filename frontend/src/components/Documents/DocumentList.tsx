'use client';
import { Document } from '@/types';
import { formatDate, formatFileSize } from '@/utils/formatters';
import { documentService } from '@/services/document.service';

interface DocumentListProps {
  documents: Document[];
  applicationId: number;
}

export const DocumentList = ({ documents, applicationId }: DocumentListProps) => {
  if (documents.length === 0) {
    return <p className="text-sm text-gray-400">No documents uploaded yet.</p>;
  }

  return (
    <ul className="space-y-2">
      {documents.map((doc) => (
        <li
          key={doc.id}
          className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-md px-4 py-2 text-sm"
        >
          <div>
            <span className="font-medium text-bnr-dark">{doc.original_name}</span>
            <span className="ml-3 text-gray-400 text-xs">
              {formatFileSize(doc.file_size)} · v{doc.version} · {formatDate(doc.created_at)}
            </span>
          </div>
          <button
            onClick={() => documentService.download(applicationId, doc.id, doc.original_name)}
            className="text-bnr-teal hover:underline text-xs font-medium"
          >
            Download
          </button>
        </li>
      ))}
    </ul>
  );
};
