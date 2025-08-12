import { useState, useEffect, useCallback } from 'react';
import { UploadedFile } from '@/types/file';
import { fileService } from '@/services/fileService';

export const useFileManager = (projectId?: string) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load files on mount
  useEffect(() => {
    const storedFiles = fileService.getStoredFiles();
    const projectFiles = projectId 
      ? storedFiles.filter(f => f.projectId === projectId)
      : storedFiles;
    setFiles(projectFiles);
  }, [projectId]);

  const handleFilesUploaded = useCallback((newFiles: UploadedFile[]) => {
    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const removeFile = useCallback((fileId: string) => {
    fileService.deleteFile(fileId);
    setFiles(prev => prev.filter(f => f.id !== fileId));
  }, []);

  const searchFiles = useCallback((query: string): UploadedFile[] => {
    return fileService.searchFiles(query);
  }, []);

  const getFileContent = useCallback((fileId: string): string | null => {
    return fileService.getFileContent(fileId);
  }, []);

  const getRelevantFileContext = useCallback((query: string, maxChars: number = 2000): string => {
    if (!query.trim()) return '';
    
    const searchResults = searchFiles(query);
    let context = '';
    let charCount = 0;

    for (const file of searchResults.slice(0, 3)) { // Limit to top 3 files
      if (charCount >= maxChars) break;
      
      const content = file.extractedText || file.content;
      const remainingChars = maxChars - charCount;
      
      if (content.length <= remainingChars) {
        context += `\n--- From ${file.name} ---\n${content}\n`;
        charCount += content.length + file.name.length + 20; // Account for formatting
      } else {
        // Take a relevant excerpt
        const excerpt = content.substring(0, remainingChars - file.name.length - 50);
        context += `\n--- From ${file.name} (excerpt) ---\n${excerpt}...\n`;
        charCount = maxChars;
      }
    }

    return context;
  }, [searchFiles]);

  const getAllFilesContext = useCallback((maxChars: number = 3000): string => {
    let context = '';
    let charCount = 0;

    for (const file of files) {
      if (charCount >= maxChars) break;
      
      const content = file.extractedText || file.content;
      const remainingChars = maxChars - charCount;
      
      if (content.length <= remainingChars) {
        context += `\n--- ${file.name} ---\n${content}\n`;
        charCount += content.length + file.name.length + 10;
      } else {
        const excerpt = content.substring(0, remainingChars - file.name.length - 30);
        context += `\n--- ${file.name} (excerpt) ---\n${excerpt}...\n`;
        charCount = maxChars;
      }
    }

    return context;
  }, [files]);

  const getStats = useCallback(() => {
    const totalFiles = files.length;
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    const totalWords = files.reduce((sum, file) => {
      const content = file.extractedText || file.content;
      return sum + (content.split(/\s+/).filter(word => word.length > 0).length);
    }, 0);

    return {
      totalFiles,
      totalSize,
      totalWords,
      fileTypes: [...new Set(files.map(f => f.type))]
    };
  }, [files]);

  return {
    files,
    isLoading,
    setIsLoading,
    handleFilesUploaded,
    removeFile,
    searchFiles,
    getFileContent,
    getRelevantFileContext,
    getAllFilesContext,
    getStats
  };
};