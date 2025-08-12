import { Dataset } from "@/types/dataset";

const KEY = "sensei:datasets";

function load(): Dataset[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) as Dataset[] : [];
  } catch {
    return [];
  }
}

function save(items: Dataset[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
}

export const datasetService = {
  list(): Dataset[] { return load(); },
  get(id: string): Dataset | undefined { return load().find(d => d.id === id); },
  create(partial: { name: string; description?: string; fileIds?: string[] }): Dataset {
    const now = new Date().toISOString();
    const item: Dataset = {
      id: crypto.randomUUID(),
      name: partial.name,
      description: partial.description || "",
      fileIds: partial.fileIds || [],
      createdAt: now,
      updatedAt: now,
    };
    const items = load();
    items.push(item);
    save(items);
    return item;
  },
  update(id: string, patch: Partial<Dataset>): Dataset | undefined {
    const items = load();
    const idx = items.findIndex(i => i.id === id);
    if (idx === -1) return undefined;
    const updated = { ...items[idx], ...patch, updatedAt: new Date().toISOString() } as Dataset;
    items[idx] = updated;
    save(items);
    return updated;
  },
  remove(id: string): void {
    save(load().filter(i => i.id !== id));
  },
  attachFiles(id: string, fileIds: string[]): Dataset | undefined {
    const ds = this.get(id);
    if (!ds) return undefined;
    const merged = Array.from(new Set([...(ds.fileIds || []), ...fileIds]));
    return this.update(id, { fileIds: merged });
  },
  detachFile(id: string, fileId: string): Dataset | undefined {
    const ds = this.get(id);
    if (!ds) return undefined;
    return this.update(id, { fileIds: (ds.fileIds || []).filter(f => f !== fileId) });
  }
};
