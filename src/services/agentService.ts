import { AgentConfig } from "@/types/agent";

const KEY = "sensei:agents";

function load(): AgentConfig[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) as AgentConfig[] : [];
  } catch {
    return [];
  }
}

function save(items: AgentConfig[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
}

export const agentService = {
  list(): AgentConfig[] { return load(); },
  get(id: string): AgentConfig | undefined { return load().find(a => a.id === id); },
  create(partial: { name: string; systemPrompt: string; temperature?: number; model?: string; datasetIds?: string[]; topK?: number; chunkSize?: number; }): AgentConfig {
    const now = new Date().toISOString();
    const item: AgentConfig = {
      id: crypto.randomUUID(),
      name: partial.name,
      systemPrompt: partial.systemPrompt,
      temperature: partial.temperature ?? 1,
      model: partial.model || "gpt-4.1",
      datasetIds: partial.datasetIds || [],
      topK: partial.topK ?? 4,
      chunkSize: partial.chunkSize ?? 800,
      createdAt: now,
      updatedAt: now,
    };
    const items = load();
    items.push(item);
    save(items);
    return item;
  },
  update(id: string, patch: Partial<AgentConfig>): AgentConfig | undefined {
    const items = load();
    const idx = items.findIndex(i => i.id === id);
    if (idx === -1) return undefined;
    const updated = { ...items[idx], ...patch, updatedAt: new Date().toISOString() } as AgentConfig;
    items[idx] = updated;
    save(items);
    return updated;
  },
  remove(id: string): void {
    save(load().filter(i => i.id !== id));
  }
};
