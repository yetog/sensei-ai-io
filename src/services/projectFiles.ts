import { UploadedFile } from '@/types/file';
// Import project files as raw strings (Vite '?raw')
// We know READthis.md exists in the project root
// If it is ever removed, build will still succeed but file list will be empty.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - Vite provides type for '?raw' at runtime
import READTHIS_MD from '../../READthis.md?raw';

function toUploadedFile(name: string, content: string): UploadedFile {
  return {
    id: `project_${name}`,
    name,
    type: name.toLowerCase().endsWith('.md') ? 'text/markdown' : 'text/plain',
    size: new TextEncoder().encode(content).length,
    content,
    extractedText: content,
    uploadDate: new Date(0),
    projectId: 'project'
  };
}

export const getProjectFiles = (): UploadedFile[] => {
  const files: UploadedFile[] = [];
  try {
    if (READTHIS_MD) files.push(toUploadedFile('READthis.md', READTHIS_MD as string));
  } catch (e) {
    // ignore if file is not present
  }
  return files;
};

export const searchProjectFiles = (query: string): UploadedFile[] => {
  const q = query.toLowerCase();
  return getProjectFiles().filter(f => 
    f.name.toLowerCase().includes(q) || (f.extractedText || '').toLowerCase().includes(q)
  );
};
