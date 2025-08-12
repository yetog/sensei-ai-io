export interface AgentConfig {
  id: string;
  name: string;
  systemPrompt: string;
  temperature?: number; // 0 - 2
  model?: string;
  datasetIds?: string[];
  topK?: number;
  chunkSize?: number;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}
