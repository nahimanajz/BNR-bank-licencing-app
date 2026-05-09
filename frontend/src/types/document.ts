export interface Document {
  id: number;
  application_id: number;
  filename: string;
  original_name: string;
  file_size: number;
  mime_type: string | null;
  uploader_id: number;
  version: number;
  createdAt: string;
}
