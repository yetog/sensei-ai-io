import { UploadedFile } from '@/types/file';
// Project files service - currently no project files are included in sources

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
  // No project files are included in sources
  return [];
};

export const searchProjectFiles = (query: string): UploadedFile[] => {
  const q = query.toLowerCase();
  return getProjectFiles().filter(f => 
    f.name.toLowerCase().includes(q) || (f.extractedText || '').toLowerCase().includes(q)
  );
};
