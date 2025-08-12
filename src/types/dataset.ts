export interface Dataset {
  id: string;
  name: string;
  description?: string;
  fileIds: string[];
  createdAt: string; // ISO
  updatedAt: string; // ISO
}
