import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UploadedFile } from '@/types/file';
import { fileService } from '@/services/fileService';

interface FileContextType {
  files: UploadedFile[];
  isLoading: boolean;
  addFiles: (newFiles: UploadedFile[]) => void;
  removeFile: (fileId: string) => void;
  getFileContent: (fileId: string) => string | null;
  searchFiles: (query: string) => UploadedFile[];
  getRelevantFileContext: (query: string, maxChars?: number) => string;
  getAllFilesContext: (maxChars?: number) => string;
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
    if (!query.trim()) return files;
    
    const lowerQuery = query.toLowerCase();
    return files.filter(file => 
      file.name.toLowerCase().includes(lowerQuery) ||
      file.content.toLowerCase().includes(lowerQuery) ||
      (file.extractedText && file.extractedText.toLowerCase().includes(lowerQuery))
    );
  };

  const getRelevantFileContext = (query: string, maxChars: number = 2000): string => {
    const relevantFiles = searchFiles(query).slice(0, 3);
    
    if (relevantFiles.length === 0) return '';
    
    let context = 'Relevant uploaded files:\n\n';
    let remainingChars = maxChars - context.length;
    
    for (const file of relevantFiles) {
      const content = file.extractedText || file.content;
      const fileHeader = `📄 ${file.name} (${file.type}):\n`;
      
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

  const getAllFilesContext = (maxChars: number = 3000): string => {
    if (files.length === 0) return '';
    
    let context = `File Collection (${files.length} files):\n\n`;
    let remainingChars = maxChars - context.length;
    
    for (const file of files) {
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
      getAllFilesContext,
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