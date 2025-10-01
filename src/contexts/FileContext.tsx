import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UploadedFile } from '@/types/file';
import { fileService } from '@/services/fileService';
import { getProjectFiles } from '@/services/projectFiles';

interface FileContextType {
  files: UploadedFile[];
  isLoading: boolean;
  addFiles: (newFiles: UploadedFile[]) => void;
  removeFile: (fileId: string) => void;
  getFileContent: (fileId: string) => string | null;
  searchFiles: (query: string) => UploadedFile[];
  getRelevantFileContext: (query: string, maxChars?: number) => string;
  getRelevantFileContextDetailed: (query: string, maxChars?: number) => { context: string; files: UploadedFile[]; suggestions: string[] };
  getAllFilesContext: (maxChars?: number) => string;
  listAllFiles: () => UploadedFile[];
  getContextForFiles: (fileIds: string[], maxChars?: number) => { context: string; files: UploadedFile[] };
  getStats: () => { totalFiles: number; totalSize: number; totalWords: number; fileTypes: string[] };
}

const FileContext = createContext<FileContextType | undefined>(undefined);

interface FileProviderProps {
  children: ReactNode;
  projectId?: string;
}

export const FileProvider: React.FC<FileProviderProps> = ({ children, projectId }) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load files on mount and when projectId changes
  useEffect(() => {
    const loadFiles = () => {
      const allFiles = fileService.getStoredFiles();
      const filteredFiles = projectId 
        ? allFiles.filter(file => file.projectId === projectId)
        : allFiles;
      setFiles(filteredFiles);
    };

    loadFiles();

    // Listen for storage changes to sync across components
    const handleStorageChange = () => {
      loadFiles();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('fileUploaded', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('fileUploaded', handleStorageChange);
    };
  }, [projectId]);

  const addFiles = (newFiles: UploadedFile[]) => {
    setFiles(prev => [...prev, ...newFiles]);
    // Dispatch custom event for cross-component sync
    window.dispatchEvent(new CustomEvent('fileUploaded'));
  };

  const removeFile = (fileId: string) => {
    fileService.deleteFile(fileId);
    setFiles(prev => prev.filter(file => file.id !== fileId));
    window.dispatchEvent(new CustomEvent('fileUploaded'));
  };

  const getFileContent = (fileId: string): string | null => {
    return fileService.getFileContent(fileId);
  };

  const searchFiles = (query: string): UploadedFile[] => {
    if (!query.trim()) return files; // preserve original behavior for empty queries

    const q = query.toLowerCase().trim();
    const projectFiles = getProjectFiles();
    const combined = [...files, ...projectFiles];

    // Simple aliases to help match common intents like "readme"
    const aliases = ['readme', 'read me', 'read-me', 'read_this', 'readthis'];
    const hasReadmeIntent = aliases.some(a => q.includes(a));

    const levenshtein = (a: string, b: string) => {
      const m = a.length, n = b.length;
      const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
      for (let i = 0; i <= m; i++) dp[i][0] = i;
      for (let j = 0; j <= n; j++) dp[0][j] = j;
      for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
          const cost = a[i - 1] === b[j - 1] ? 0 : 1;
          dp[i][j] = Math.min(
            dp[i - 1][j] + 1,
            dp[i][j - 1] + 1,
            dp[i - 1][j - 1] + cost
          );
        }
      }
      return dp[m][n];
    };

    const score = (file: UploadedFile) => {
      const name = file.name.toLowerCase();
      const content = (file.extractedText || file.content || '').toLowerCase();
      let s = 0;

      if (name === q) s += 100;
      if (name.startsWith(q)) s += 60;
      if (name.includes(q)) s += 50;
      if (hasReadmeIntent && (name.includes('readme') || name.includes('readthis'))) s += 40;

      const words = q.split(/\s+/).filter(Boolean);
      const hits = words.reduce((acc, w) => acc + (content.includes(w) ? 1 : 0), 0);
      s += hits * 5;

      // Edit distance bonus on filename
      const dist = levenshtein(q, name);
      s += Math.max(0, 30 - Math.min(30, dist));

      return s;
    };

    const results = combined
      .map((f) => ({ f, s: score(f) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 5)
      .map((x) => x.f);

    if (results.length === 0) {
      return combined.filter(file => {
        const name = file.name.toLowerCase();
        const content = (file.extractedText || file.content || '').toLowerCase();
        return name.includes(q) || content.includes(q);
      }).slice(0, 5);
    }

    return results;
  };

const getRelevantFileContext = (query: string, maxChars: number = 2000): string => {
  return getRelevantFileContextDetailed(query, maxChars).context;
};

// Simple cache for file contexts to avoid repeated processing
const contextCache = new Map<string, { context: string; files: UploadedFile[]; suggestions: string[]; timestamp: number }>();
const CACHE_TTL = 30000; // 30 seconds

const getRelevantFileContextDetailed = (query: string, maxChars: number = 2000) => {
  // Check cache first
  const cacheKey = `${query}_${maxChars}`;
  const cached = contextCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    return { context: cached.context, files: cached.files, suggestions: cached.suggestions };
  }

  const relevantFiles = searchFiles(query).slice(0, 3);

  // Build suggestions if no results
  const suggestions: string[] = [];
  if (relevantFiles.length === 0) {
    const all = [...files, ...getProjectFiles()];
    const q = query.toLowerCase();
    const uniqueNames = Array.from(new Set(all.map(f => f.name)));
    const scored = uniqueNames.map(name => {
      const n = name.toLowerCase();
      const common = ['readme.md', 'readme', 'readthis.md', 'readthis'];
      let s = 0;
      if (common.some(c => n.includes(c) || q.includes(c))) s += 10;
      const starts = n.startsWith(q) ? 8 : 0;
      const incl = n.includes(q) ? 6 : 0;
      return { name, score: s + starts + incl };
    }).filter(x => x.score > 0).sort((a, b) => b.score - a.score).slice(0, 3);

    suggestions.push(...scored.map(x => x.name));
  }

  if (relevantFiles.length === 0) {
    console.debug('[FileContext] No relevant files found for query:', query, 'suggestions:', suggestions);
    const result = { context: '', files: [], suggestions };
    contextCache.set(cacheKey, { ...result, timestamp: Date.now() });
    return result;
  }

  // Track which files we've already added to avoid duplication
  const addedFiles = new Set<string>();
  let context = 'Relevant files:\n\n';
  let remainingChars = maxChars - context.length;

  for (const file of relevantFiles) {
    // Skip if already added
    if (addedFiles.has(file.id)) continue;
    
    const content = file.extractedText || file.content;
    const fileHeader = `📄 ${file.name} (${file.type || 'text'}):\n`;

    if (remainingChars <= fileHeader.length + 50) break;

    context += fileHeader;
    remainingChars -= fileHeader.length;

    const truncatedContent = content.length > remainingChars - 10
      ? content.substring(0, remainingChars - 10) + '...'
      : content;

    context += truncatedContent + '\n\n';
    remainingChars -= truncatedContent.length + 2;
    addedFiles.add(file.id);

    if (remainingChars <= 100) break;
  }

  const result = { context, files: relevantFiles, suggestions };
  contextCache.set(cacheKey, { ...result, timestamp: Date.now() });
  return result;
};

const getAllFilesContext = (maxChars: number = 3000): string => {
  const all = [...files, ...getProjectFiles()];
  if (all.length === 0) return '';

  let context = `File Collection (${all.length} files):\n\n`;
  let remainingChars = maxChars - context.length;

  for (const file of all) {
    const content = file.extractedText || file.content;
    const fileHeader = `📄 ${file.name}:\n`;

    if (remainingChars <= fileHeader.length + 50) break;

    context += fileHeader;
    remainingChars -= fileHeader.length;

    const truncatedContent = content.length > remainingChars - 10
      ? content.substring(0, remainingChars - 10) + '...'
      : content;

    context += truncatedContent + '\n\n';
    remainingChars -= truncatedContent.length + 2;

    if (remainingChars <= 100) break;
  }

  return context;
};

const listAllFiles = (): UploadedFile[] => {
  return [...files, ...getProjectFiles()];
};

const getContextForFiles = (fileIds: string[], maxChars: number = 2000): { context: string; files: UploadedFile[] } => {
  const all = listAllFiles();
  const selected = all.filter(f => fileIds.includes(f.id));
  if (selected.length === 0) return { context: '', files: [] };

  let context = 'Selected files:\n\n';
  let remainingChars = maxChars - context.length;

  for (const file of selected) {
    const content = file.extractedText || file.content;
    const fileHeader = `📄 ${file.name} (${file.type || 'text'}):\n`;

    if (remainingChars <= fileHeader.length + 50) break;

    context += fileHeader;
    remainingChars -= fileHeader.length;

    const truncatedContent = content.length > remainingChars - 10
      ? content.substring(0, remainingChars - 10) + '...'
      : content;

    context += truncatedContent + '\n\n';
    remainingChars -= truncatedContent.length + 2;

    if (remainingChars <= 100) break;
  }

  return { context, files: selected };
};

  const getStats = () => {
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    const totalWords = files.reduce((sum, file) => {
      const content = file.extractedText || file.content;
      return sum + content.trim().split(/\s+/).filter(word => word.length > 0).length;
    }, 0);
    const fileTypes = [...new Set(files.map(file => file.type))];
    
    return {
      totalFiles: files.length,
      totalSize,
      totalWords,
      fileTypes
    };
  };

  return (
    <FileContext.Provider value={{
      files,
      isLoading,
      addFiles,
      removeFile,
      getFileContent,
      searchFiles,
      getRelevantFileContext,
      getRelevantFileContextDetailed,
      getAllFilesContext,
      listAllFiles,
      getContextForFiles,
      getStats
    }}>
      {children}
    </FileContext.Provider>
  );
};

export const useFileContext = () => {
  const context = useContext(FileContext);
  if (context === undefined) {
    throw new Error('useFileContext must be used within a FileProvider');
  }
  return context;
};