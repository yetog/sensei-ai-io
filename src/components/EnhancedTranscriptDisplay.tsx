import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Search, ChevronDown, ChevronUp, User, MessageCircle, Edit3, Download } from 'lucide-react';

interface TranscriptionSegment {
  id: string;
  speaker: 'user' | 'customer';
  text: string;
  timestamp: number;
  confidence: number;
  isConsolidated?: boolean;
  segmentGroup?: string;
  duration?: number;
}

interface ConversationBlock {
  id: string;
  speaker: 'user' | 'customer';
  segments: TranscriptionSegment[];
  startTime: number;
  endTime: number;
  totalText: string;
  averageConfidence: number;
  topic?: string;
}

interface EnhancedTranscriptDisplayProps {
  segments: TranscriptionSegment[];
  interimText?: string;
  transcriptQuality: number;
  onEditSegment?: (segmentId: string, newText: string) => void;
  onExportTranscript?: () => void;
  sessionDuration: number;
}

// Move detectTopic outside the component to avoid initialization issues
const detectTopic = (text: string): string => {
  const keywords = {
    'pricing': ['price', 'cost', 'expensive', 'budget', 'affordable'],
    'features': ['feature', 'functionality', 'capabilities', 'can it', 'does it'],
    'support': ['help', 'support', 'assistance', 'problem', 'issue'],
    'closing': ['decision', 'sign up', 'purchase', 'buy', 'contract'],
    'objection': ['but', 'however', 'concern', 'worried', 'not sure']
  };

  const lowerText = text.toLowerCase();
  for (const [topic, words] of Object.entries(keywords)) {
    if (words.some(word => lowerText.includes(word))) {
      return topic;
    }
  }
  return 'general';
};

export function EnhancedTranscriptDisplay({
  segments,
  interimText = '',
  transcriptQuality,
  onEditSegment,
  onExportTranscript,
  sessionDuration
}: EnhancedTranscriptDisplayProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedBlocks, setExpandedBlocks] = useState<Set<string>>(new Set());
  const [editingSegment, setEditingSegment] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  // Group segments into conversation blocks
  const conversationBlocks = useMemo((): ConversationBlock[] => {
    const blocks: ConversationBlock[] = [];
    let currentBlock: ConversationBlock | null = null;

    segments.forEach((segment) => {
      const shouldStartNewBlock = !currentBlock || 
        currentBlock.speaker !== segment.speaker ||
        (segment.timestamp - currentBlock.endTime > 30000); // 30 second gap

      if (shouldStartNewBlock) {
        if (currentBlock) blocks.push(currentBlock);
        
        currentBlock = {
          id: `block_${segment.id}`,
          speaker: segment.speaker,
          segments: [segment],
          startTime: segment.timestamp,
          endTime: segment.timestamp,
          totalText: segment.text,
          averageConfidence: segment.confidence,
          topic: detectTopic(segment.text)
        };
      } else if (currentBlock) {
        currentBlock.segments.push(segment);
        currentBlock.endTime = segment.timestamp;
        currentBlock.totalText += ' ' + segment.text;
        currentBlock.averageConfidence = 
          (currentBlock.averageConfidence + segment.confidence) / 2;
      }
    });

    if (currentBlock) blocks.push(currentBlock);
    return blocks;
  }, [segments]);

  // Filter blocks based on search
  const filteredBlocks = useMemo(() => {
    if (!searchQuery) return conversationBlocks;
    
    return conversationBlocks.filter(block =>
      block.totalText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      block.topic?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [conversationBlocks, searchQuery]);

  const formatTime = (timestamp: number, startTime: number): string => {
    const elapsed = Math.floor((timestamp - startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return 'bg-green-500';
    if (confidence >= 0.6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const toggleBlockExpansion = (blockId: string) => {
    const newExpanded = new Set(expandedBlocks);
    if (newExpanded.has(blockId)) {
      newExpanded.delete(blockId);
    } else {
      newExpanded.add(blockId);
    }
    setExpandedBlocks(newExpanded);
  };

  const startEditing = (segment: TranscriptionSegment) => {
    setEditingSegment(segment.id);
    setEditText(segment.text);
  };

  const saveEdit = () => {
    if (editingSegment && onEditSegment) {
      onEditSegment(editingSegment, editText);
    }
    setEditingSegment(null);
    setEditText('');
  };

  const sessionTime = formatTime(Date.now(), Date.now() - sessionDuration);

  return (
    <div className="space-y-4">
      {/* Header with search and stats */}
      <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-2">
            <div className={`w-2 h-2 rounded-full ${getConfidenceColor(transcriptQuality / 100)}`} />
            Quality: {transcriptQuality}%
          </Badge>
          
          <Badge variant="outline">
            {filteredBlocks.length} blocks
          </Badge>
          
          <Badge variant="outline">
            {sessionTime}
          </Badge>
          
          {onExportTranscript && (
            <Button variant="outline" size="sm" onClick={onExportTranscript}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          )}
        </div>
      </div>

      {/* Conversation blocks */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filteredBlocks.map((block) => (
          <Card key={block.id} className="transition-all hover:shadow-md">
            <Collapsible
              open={expandedBlocks.has(block.id)}
              onOpenChange={() => toggleBlockExpansion(block.id)}
            >
              <CollapsibleTrigger asChild>
                <CardContent className="p-4 cursor-pointer">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-full ${
                      block.speaker === 'user' 
                        ? 'bg-blue-100 text-blue-600' 
                        : 'bg-green-100 text-green-600'
                    }`}>
                      {block.speaker === 'user' ? (
                        <User className="h-4 w-4" />
                      ) : (
                        <MessageCircle className="h-4 w-4" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium capitalize">
                          {block.speaker}
                        </span>
                        
                        {block.topic && (
                          <Badge variant="secondary" className="text-xs">
                            {block.topic}
                          </Badge>
                        )}
                        
                        <span className="text-xs text-muted-foreground">
                          {formatTime(block.startTime, Date.now() - sessionDuration)}
                        </span>
                        
                        <div className={`w-2 h-2 rounded-full ${getConfidenceColor(block.averageConfidence)}`} />
                        
                        {expandedBlocks.has(block.id) ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      
                      <p className="text-sm text-foreground line-clamp-2">
                        {block.totalText}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <div className="px-4 pb-4 space-y-2">
                  {block.segments.map((segment) => (
                    <div key={segment.id} className="flex items-start gap-2 p-2 bg-muted/30 rounded">
                      {editingSegment === segment.id ? (
                        <div className="flex-1 flex gap-2">
                          <Input
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="flex-1"
                          />
                          <Button size="sm" onClick={saveEdit}>Save</Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingSegment(null)}>
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <>
                          <span className="flex-1 text-sm">{segment.text}</span>
                          {onEditSegment && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => startEditing(segment)}
                            >
                              <Edit3 className="h-3 w-3" />
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        ))}
        
        {/* Show interim results */}
        {interimText && (
          <Card className="opacity-60">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-gray-100 text-gray-600">
                  <MessageCircle className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <span className="text-sm italic text-muted-foreground">
                    {interimText}...
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      
      {filteredBlocks.length === 0 && !interimText && (
        <div className="text-center py-8 text-muted-foreground">
          {searchQuery ? 'No matching conversation found' : 'Start speaking to see the transcript'}
        </div>
      )}
    </div>
  );
}