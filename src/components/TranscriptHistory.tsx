import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  History, 
  Search, 
  Calendar, 
  Download, 
  Trash2,
  FileText,
  Clock,
  Users
} from 'lucide-react';

interface TranscriptEntry {
  id: string;
  timestamp: number;
  duration: string;
  callType: string;
  exchangeCount: number;
  transcript: string;
  summary?: string;
}

interface TranscriptHistoryProps {
  onClose?: () => void;
}

export function TranscriptHistory({ onClose }: TranscriptHistoryProps) {
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredTranscripts, setFilteredTranscripts] = useState<TranscriptEntry[]>([]);

  useEffect(() => {
    loadTranscripts();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      setFilteredTranscripts(
        transcripts.filter(t => 
          t.transcript.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.callType.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    } else {
      setFilteredTranscripts(transcripts);
    }
  }, [searchTerm, transcripts]);

  const loadTranscripts = () => {
    try {
      const stored = localStorage.getItem('coaching-transcripts');
      if (stored) {
        const parsed = JSON.parse(stored);
        setTranscripts(parsed.sort((a: TranscriptEntry, b: TranscriptEntry) => b.timestamp - a.timestamp));
      }
    } catch (error) {
      console.error('Error loading transcripts:', error);
    }
  };

  const deleteTranscript = (id: string) => {
    const updated = transcripts.filter(t => t.id !== id);
    setTranscripts(updated);
    localStorage.setItem('coaching-transcripts', JSON.stringify(updated));
  };

  const downloadTranscript = (transcript: TranscriptEntry) => {
    const content = `Sales Coaching Transcript
Date: ${new Date(transcript.timestamp).toLocaleDateString()}
Time: ${new Date(transcript.timestamp).toLocaleTimeString()}
Duration: ${transcript.duration}
Call Type: ${transcript.callType}
Exchanges: ${transcript.exchangeCount}

TRANSCRIPT:
${transcript.transcript}

${transcript.summary ? `SUMMARY:
${transcript.summary}` : ''}
`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript-${new Date(transcript.timestamp).toISOString().split('T')[0]}-${transcript.id.slice(0, 8)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getCallTypeColor = (callType: string) => {
    switch (callType) {
      case 'incoming_sales': return 'bg-green-100 text-green-800 border-green-300';
      case 'retention': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'outbound': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <Card className="w-full max-w-6xl mx-auto h-[80vh]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Transcript History
            <Badge variant="secondary" className="ml-2">
              {transcripts.length} saved
            </Badge>
          </CardTitle>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              ×
            </Button>
          )}
        </div>
        
        <div className="flex items-center gap-2 pt-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search transcripts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="h-[calc(100%-120px)]">
        <ScrollArea className="h-full">
          {filteredTranscripts.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-lg mb-1">No transcripts found</p>
                <p className="text-sm">Start coaching to create your first transcript</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTranscripts.map((transcript) => (
                <Card key={transcript.id} className="border border-border/50 hover:border-primary/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge 
                            variant="outline" 
                            className={getCallTypeColor(transcript.callType)}
                          >
                            {transcript.callType.replace('_', ' ').toUpperCase()}
                          </Badge>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {new Date(transcript.timestamp).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {transcript.duration}
                          </div>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Users className="h-3 w-3" />
                            {transcript.exchangeCount} exchanges
                          </div>
                        </div>
                        
                        <div className="text-sm text-foreground/80 leading-relaxed max-h-20 overflow-hidden">
                          {transcript.transcript.substring(0, 200)}
                          {transcript.transcript.length > 200 && '...'}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => downloadTranscript(transcript)}
                          className="h-8 w-8 p-0"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteTranscript(transcript.id)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}