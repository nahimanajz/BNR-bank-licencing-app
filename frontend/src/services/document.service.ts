import { downloadDocument } from "@/utils/downloadDocument";
import apiClient from "../config/api.client";
import { Document } from "@/types";

export const documentService = {
  list: async (applicationId: number): Promise<Document[]> => {
    return (await apiClient.get(`/applications/${applicationId}/documents`))
      .data.data;
  },

  upload: async (applicationId: number, file: File): Promise<Document> => {
    const form = new FormData();
    form.append("file", file);
    return (
      await apiClient.post(`/applications/${applicationId}/documents`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      })
    ).data.data; //FIXME: use object destructuring in this file
  },

  download: async (
    applicationId: number,
    documentId: number,
    filename: string,
  ): Promise<void> => {
    const { data, headers } = await apiClient.get(
      `/applications/${applicationId}/documents/${documentId}/download`,
      { responseType: "blob" },
    );
    downloadDocument(headers, data, filename);
  },
};
