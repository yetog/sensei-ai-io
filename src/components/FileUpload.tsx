import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X, AlertCircle, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { fileService } from '@/services/fileService';
import { UploadedFile } from '@/types/file';
import { toast } from 'sonner';

interface FileUploadProps {
  onFilesUploaded?: (files: UploadedFile[]) => void;
  projectId?: string;
  maxFiles?: number;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFilesUploaded,
  projectId,
  maxFiles = 10
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setIsProcessing(true);
    setProcessingProgress(0);
    
    const newFiles: UploadedFile[] = [];
    const totalFiles = acceptedFiles.length;

    try {
      for (let i = 0; i < acceptedFiles.length; i++) {
        const file = acceptedFiles[i];
        
        // Check file type
        if (!fileService.isFileTypeSupported(file.type)) {
          toast.error(`Unsupported file type: ${file.type}`);
          continue;
        }

        // Check file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`File too large: ${file.name} (max 10MB)`);
          continue;
        }

        try {
          const result = await fileService.processFile(file, projectId);
          newFiles.push(result.file);
          
          toast.success(`Processed: ${file.name}`);
        } catch (error) {
          console.error(`Error processing ${file.name}:`, error);
          toast.error(`Failed to process: ${file.name}`);
        }

        setProcessingProgress(((i + 1) / totalFiles) * 100);
      }

      setUploadedFiles(prev => [...prev, ...newFiles]);
      onFilesUploaded?.(newFiles);
      
      if (newFiles.length > 0) {
        toast.success(`Successfully uploaded ${newFiles.length} file(s)`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload files');
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
    }
  }, [onFilesUploaded, projectId]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/json': ['.json'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
      'text/csv': ['.csv'],
      'application/pdf': ['.pdf']
    },
    maxFiles,
    disabled: isProcessing
  });

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
    fileService.deleteFile(fileId);
    toast.success('File removed');
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
            ${isDragActive 
              ? 'border-primary bg-primary/5' 
              : 'border-border hover:border-primary/50 hover:bg-muted/50'
            }
            ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <input {...getInputProps()} />
          
          <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">
              {isDragActive ? 'Drop files here' : 'Upload Knowledge Files'}
            </h3>
            <p className="text-muted-foreground">
              {isDragActive 
                ? 'Release to upload your files'
                : 'Drag & drop files here, or click to select'
              }
            </p>
            <div className="text-sm text-muted-foreground">
              <p>Supported: JSON, TXT, MD, CSV, PDF (up to 10MB each)</p>
              <p>Maximum {maxFiles} files</p>
            </div>
          </div>

          {isProcessing && (
            <div className="mt-4">
              <Progress value={processingProgress} className="w-full" />
              <p className="text-sm text-muted-foreground mt-2">
                Processing files... {Math.round(processingProgress)}%
              </p>
            </div>
          )}
        </div>
      </Card>

      {uploadedFiles.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Uploaded Files</h3>
          <div className="space-y-3">
            {uploadedFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 bg-muted rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <File className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(file.size)} • {file.type}
                      {file.extractedText && (
                        <span> • {file.extractedText.split(/\s+/).length} words</span>
                      )}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(file.id)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {uploadedFiles.length === 0 && !isProcessing && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Upload files to provide context for your AI chat. The content will be used to answer questions about your documents.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};