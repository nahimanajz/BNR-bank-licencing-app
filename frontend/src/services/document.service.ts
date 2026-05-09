import apiClient from '../config/api.client';
import { Document } from '@/types';

export const documentService = {
  list: async (applicationId: number): Promise<Document[]> => {
    const { data } = await apiClient.get(`/applications/${applicationId}/documents`);
    return data.data;
  },

  upload: async (applicationId: number, file: File): Promise<Document> => {
    const form = new FormData();
    form.append('file', file);
    const { data } = await apiClient.post(`/applications/${applicationId}/documents`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data;
  },

  download: async (applicationId: number, documentId: number, filename: string): Promise<void> => {
    const { data, headers } = await apiClient.get(
      `/applications/${applicationId}/documents/${documentId}/download`,
      { responseType: 'blob' }
    );
    const mimeType = String(headers['content-type'] || 'application/octet-stream');
    // @ts-ignore - TS complains about Blob constructor but it works fine in browser
    const url = URL.createObjectURL(new Blob([data], { type: mimeType }));
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  },
};
