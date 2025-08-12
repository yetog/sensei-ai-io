import React from 'react';
import { FileText, X, Download, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useFileContext } from '@/contexts/FileContext';

interface FilesPanelProps {
  className?: string;
}

export const FilesPanel: React.FC<FilesPanelProps> = ({ className = '' }) => {
  const { files, removeFile, getStats } = useFileContext();
  const stats = getStats();

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatFileType = (mimeType: string): string => {
    const typeMap: { [key: string]: string } = {
      'application/json': 'JSON',
      'text/plain': 'TXT',
      'text/markdown': 'MD',
      'text/csv': 'CSV',
      'application/pdf': 'PDF'
    };
    return typeMap[mimeType] || mimeType.split('/')[1]?.toUpperCase() || 'FILE';
  };

  const getFilePreview = (file: any): string => {
    const content = file.extractedText || file.content;
    return content.length > 100 ? content.substring(0, 100) + '...' : content;
  };

  if (files.length === 0) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="text-center text-muted-foreground">
          <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No files uploaded yet</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`${className}`}>
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center">
            <FileText className="w-4 h-4 mr-2" />
            Uploaded Files
          </h3>
          <Badge variant="secondary">
            {stats.totalFiles} files • {formatFileSize(stats.totalSize)}
          </Badge>
        </div>
        {stats.totalWords > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            {stats.totalWords.toLocaleString()} words total
          </p>
        )}
      </div>
      
      <ScrollArea className="max-h-80">
        <div className="p-4 space-y-3">
          {files.map((file) => (
            <div key={file.id} className="border border-border rounded-lg p-3 bg-card">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="text-sm font-medium truncate">{file.name}</h4>
                    <Badge variant="outline" className="text-xs">
                      {formatFileType(file.type)}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    {formatFileSize(file.size)} • {new Date(file.uploadDate).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-muted-foreground bg-secondary/50 rounded p-2">
                    {getFilePreview(file)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFile(file.id)}
                  className="h-6 w-6 ml-2"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      
      {stats.fileTypes.length > 1 && (
        <div className="p-4 border-t border-border">
          <div className="flex flex-wrap gap-1">
            {stats.fileTypes.map((type) => (
              <Badge key={type} variant="secondary" className="text-xs">
                {formatFileType(type)}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};