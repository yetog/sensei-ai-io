import { UploadedFile, FileChunk, FileProcessingResult, SupportedFileType } from '@/types/file';

export class FileService {
  private static instance: FileService;
  
  static getInstance(): FileService {
    if (!FileService.instance) {
      FileService.instance = new FileService();
    }
    return FileService.instance;
  }

  async processFile(file: File, projectId?: string): Promise<FileProcessingResult> {
    const fileId = this.generateFileId();
    const uploadedFile: UploadedFile = {
      id: fileId,
      name: file.name,
      type: file.type,
      size: file.size,
      content: '',
      uploadDate: new Date(),
      projectId
    };

    let extractedText = '';
    
    try {
      switch (file.type) {
        case 'application/json':
          extractedText = await this.processJsonFile(file);
          break;
        case 'text/plain':
        case 'text/markdown':
          extractedText = await this.processTextFile(file);
          break;
        case 'text/csv':
          extractedText = await this.processCsvFile(file);
          break;
        case 'application/pdf':
          const { PDFProcessor } = await import('./pdfProcessor');
          extractedText = await PDFProcessor.extractTextFromPDF(file);
          break;
        default:
          throw new Error(`Unsupported file type: ${file.type}`);
      }

      uploadedFile.extractedText = extractedText;
      uploadedFile.content = extractedText;

      // Create chunks for better retrieval
      const chunks = this.createChunks(extractedText, fileId);
      
      // Store in localStorage for now
      this.saveFileToStorage(uploadedFile);

      return {
        file: uploadedFile,
        chunks,
        extractedText,
        metadata: {
          wordCount: extractedText.split(/\s+/).filter(word => word.length > 0).length,
          characterCount: extractedText.length
        }
      };
    } catch (error) {
      console.error('File processing error:', error);
      throw new Error(`Failed to process file: ${error}`);
    }
  }

  private async processJsonFile(file: File): Promise<string> {
    const content = await file.text();
    try {
      const jsonData = JSON.parse(content);
      return this.flattenJsonToText(jsonData);
    } catch (error) {
      throw new Error('Invalid JSON file format');
    }
  }

  private async processTextFile(file: File): Promise<string> {
    return await file.text();
  }

  private async processCsvFile(file: File): Promise<string> {
    const content = await file.text();
    const lines = content.split('\n');
    const headers = lines[0]?.split(',') || [];
    
    if (lines.length < 2) {
      return content; // Return as-is if no data rows
    }

    // Convert CSV to readable text format
    let result = `Data from ${headers.length} columns:\n\n`;
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      if (values.length === headers.length) {
        result += `Entry ${i}:\n`;
        headers.forEach((header, index) => {
          result += `  ${header.trim()}: ${values[index]?.trim() || 'N/A'}\n`;
        });
        result += '\n';
      }
    }
    
    return result;
  }

  private flattenJsonToText(obj: any, prefix = ''): string {
    let result = '';
    
    if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        const itemPrefix = prefix ? `${prefix}[${index}]` : `item_${index}`;
        result += this.flattenJsonToText(item, itemPrefix);
      });
    } else if (typeof obj === 'object' && obj !== null) {
      Object.entries(obj).forEach(([key, value]) => {
        const newPrefix = prefix ? `${prefix}.${key}` : key;
        if (typeof value === 'object') {
          result += this.flattenJsonToText(value, newPrefix);
        } else {
          result += `${newPrefix}: ${value}\n`;
        }
      });
    } else {
      result += `${prefix}: ${obj}\n`;
    }
    
    return result;
  }

  private createChunks(text: string, fileId: string, chunkSize = 1000, overlap = 200): FileChunk[] {
    const chunks: FileChunk[] = [];
    const words = text.split(/\s+/);
    const wordsPerChunk = Math.floor(chunkSize / 5); // Approximate words per chunk
    
    for (let i = 0; i < words.length; i += wordsPerChunk - Math.floor(overlap / 5)) {
      const chunkWords = words.slice(i, i + wordsPerChunk);
      const chunkContent = chunkWords.join(' ');
      
      if (chunkContent.trim().length > 0) {
        chunks.push({
          id: `${fileId}_chunk_${chunks.length}`,
          fileId,
          content: chunkContent,
          metadata: {
            chunkIndex: chunks.length,
            totalChunks: 0, // Will be updated after all chunks are created
            startPosition: i,
            endPosition: i + chunkWords.length
          }
        });
      }
    }

    // Update total chunks count
    chunks.forEach(chunk => {
      chunk.metadata.totalChunks = chunks.length;
    });

    return chunks;
  }

  private generateFileId(): string {
    return `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private saveFileToStorage(file: UploadedFile): void {
    const existingFiles = this.getStoredFiles();
    existingFiles.push(file);
    localStorage.setItem('uploaded_files', JSON.stringify(existingFiles));
  }

  getStoredFiles(): UploadedFile[] {
    try {
      const stored = localStorage.getItem('uploaded_files');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error reading stored files:', error);
      return [];
    }
  }

  deleteFile(fileId: string): void {
    const files = this.getStoredFiles().filter(f => f.id !== fileId);
    localStorage.setItem('uploaded_files', JSON.stringify(files));
  }

  getFileContent(fileId: string): string | null {
    const file = this.getStoredFiles().find(f => f.id === fileId);
    return file?.extractedText || file?.content || null;
  }

  searchFiles(query: string): UploadedFile[] {
    const files = this.getStoredFiles();
    const lowercaseQuery = query.toLowerCase();
    
    return files.filter(file => 
      file.name.toLowerCase().includes(lowercaseQuery) ||
      file.extractedText?.toLowerCase().includes(lowercaseQuery) ||
      file.content.toLowerCase().includes(lowercaseQuery)
    );
  }

  getSupportedFileTypes(): SupportedFileType[] {
    return [
      'application/json',
      'text/plain', 
      'text/markdown',
      'text/csv',
      'application/pdf'
    ];
  }

  isFileTypeSupported(type: string): boolean {
    return this.getSupportedFileTypes().includes(type as SupportedFileType);
  }
}

export const fileService = FileService.getInstance();