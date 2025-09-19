import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  MessageCircle, 
  User, 
  Phone,
  Zap,
  CheckCircle,
  AlertTriangle,
  Target,
  Lightbulb
} from 'lucide-react';

interface SimulatedConversation {
  id: string;
  title: string;
  description: string;
  segments: Array<{
    speaker: 'rep' | 'customer';
    text: string;
    timestamp: number;
    triggerInsight?: {
      type: 'objection' | 'opportunity' | 'suggestion' | 'warning';
      message: string;
      confidence: number;
    };
  }>;
}

interface ConversationSimulatorProps {
  onTranscriptUpdate: (text: string, speaker: 'rep' | 'customer') => void;
  onInsightGenerated: (insight: any) => void;
  isActive: boolean;
}

const DEMO_CONVERSATIONS: SimulatedConversation[] = [
  {
    id: 'price-objection',
    title: 'Price Objection Scenario',
    description: 'Customer raises concerns about pricing',
    segments: [
      {
        speaker: 'rep',
        text: "Thanks for your time today. I'd like to show you how our solution can help streamline your operations.",
        timestamp: 0
      },
      {
        speaker: 'customer',
        text: "I appreciate that, but honestly, we're looking at your competitors and they seem much more affordable.",
        timestamp: 3000,
        triggerInsight: {
          type: 'objection',
          message: 'Price objection detected. Focus on ROI and unique value proposition rather than competing on price.',
          confidence: 0.92
        }
      },
      {
        speaker: 'rep',
        text: "I understand price is important. Can you tell me what specific outcomes you're looking to achieve?",
        timestamp: 6000
      },
      {
        speaker: 'customer',
        text: "We need to reduce our processing time by at least 30% and eliminate manual errors.",
        timestamp: 9000,
        triggerInsight: {
          type: 'opportunity',
          message: 'Customer shared specific success metrics. Perfect opportunity to demonstrate ROI calculation.',
          confidence: 0.88
        }
      }
    ]
  },
  {
    id: 'buying-signals',
    title: 'Strong Buying Signals',
    description: 'Customer shows interest and asks implementation questions',
    segments: [
      {
        speaker: 'customer',
        text: "This looks really interesting. How quickly could we get this implemented?",
        timestamp: 0,
        triggerInsight: {
          type: 'opportunity',
          message: 'Strong buying signal detected! Customer is asking about implementation timeline.',
          confidence: 0.95
        }
      },
      {
        speaker: 'rep',
        text: "Great question! Typically our implementation takes 2-4 weeks depending on your current setup.",
        timestamp: 3000
      },
      {
        speaker: 'customer',
        text: "That sounds reasonable. What would the onboarding process look like for our team?",
        timestamp: 6000,
        triggerInsight: {
          type: 'suggestion',
          message: 'Customer is showing implementation interest. Time to discuss next steps and possibly schedule a technical demo.',
          confidence: 0.89
        }
      }
    ]
  },
  {
    id: 'technical-concerns',
    title: 'Technical Objections',
    description: 'Customer has integration and security concerns',
    segments: [
      {
        speaker: 'customer',
        text: "We're concerned about how this would integrate with our existing CRM system.",
        timestamp: 0,
        triggerInsight: {
          type: 'objection',
          message: 'Integration concern raised. Highlight API capabilities and existing integrations.',
          confidence: 0.86
        }
      },
      {
        speaker: 'rep',
        text: "That's a very valid concern. We have pre-built integrations with over 50 CRM systems including Salesforce, HubSpot, and Microsoft Dynamics.",
        timestamp: 3000
      },
      {
        speaker: 'customer',
        text: "What about security? We handle sensitive customer data.",
        timestamp: 6000,
        triggerInsight: {
          type: 'suggestion',
          message: 'Security question is critical. Share SOC 2 compliance, encryption details, and security case studies.',
          confidence: 0.91
        }
      }
    ]
  }
];

export function ConversationSimulator({ onTranscriptUpdate, onInsightGenerated, isActive }: ConversationSimulatorProps) {
  const [selectedConversation, setSelectedConversation] = useState<SimulatedConversation | null>(null);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  useEffect(() => {
    if (!isPlaying || !selectedConversation || currentSegmentIndex >= selectedConversation.segments.length) {
      return;
    }

    const currentSegment = selectedConversation.segments[currentSegmentIndex];
    const nextSegment = selectedConversation.segments[currentSegmentIndex + 1];
    
    const delay = nextSegment 
      ? (nextSegment.timestamp - currentSegment.timestamp) / playbackSpeed
      : 2000;

    const timer = setTimeout(() => {
      // Update transcription
      onTranscriptUpdate(currentSegment.text, currentSegment.speaker);
      
      // Generate insight if applicable
      if (currentSegment.triggerInsight) {
        setTimeout(() => {
          onInsightGenerated(currentSegment.triggerInsight);
        }, 500); // Small delay to simulate AI processing
      }

      setCurrentSegmentIndex(prev => prev + 1);
    }, delay);

    return () => clearTimeout(timer);
  }, [isPlaying, selectedConversation, currentSegmentIndex, playbackSpeed, onTranscriptUpdate, onInsightGenerated]);

  useEffect(() => {
    if (currentSegmentIndex >= (selectedConversation?.segments.length || 0)) {
      setIsPlaying(false);
    }
  }, [currentSegmentIndex, selectedConversation]);

  const startSimulation = (conversation: SimulatedConversation) => {
    setSelectedConversation(conversation);
    setCurrentSegmentIndex(0);
    setIsPlaying(true);
  };

  const pauseSimulation = () => {
    setIsPlaying(false);
  };

  const resumeSimulation = () => {
    if (selectedConversation && currentSegmentIndex < selectedConversation.segments.length) {
      setIsPlaying(true);
    }
  };

  const resetSimulation = () => {
    setIsPlaying(false);
    setCurrentSegmentIndex(0);
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'objection': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'opportunity': return <Target className="h-4 w-4 text-green-500" />;
      case 'suggestion': return <Lightbulb className="h-4 w-4 text-blue-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <MessageCircle className="h-4 w-4" />;
    }
  };

  if (!isActive) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Demo Conversation Simulator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {DEMO_CONVERSATIONS.map((conversation) => (
              <Card key={conversation.id} className="cursor-pointer hover:bg-muted/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium mb-1">{conversation.title}</h4>
                      <p className="text-sm text-muted-foreground mb-3">{conversation.description}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {conversation.segments.length} segments
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {conversation.segments.filter(s => s.triggerInsight).length} insights
                        </Badge>
                      </div>
                    </div>
                    <Button 
                      onClick={() => startSimulation(conversation)}
                      size="sm"
                      className="ml-4"
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Start Demo
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <Separator className="my-6" />
          
          <div className="text-center py-4">
            <div className="text-sm text-muted-foreground space-y-2">
              <div className="flex items-center gap-2 justify-center">
                <Zap className="h-4 w-4 text-blue-500" />
                <span>Select a scenario above to see AI coaching in action</span>
              </div>
              <div className="text-xs">
                Watch how the AI analyzes conversation in real-time and provides coaching insights
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="h-5 w-5" />
          Demo Conversation
          {selectedConversation && (
            <Badge variant="default" className="ml-2">
              {selectedConversation.title}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Playback Controls */}
        <div className="flex items-center gap-2">
          {isPlaying ? (
            <Button onClick={pauseSimulation} size="sm">
              <Pause className="h-4 w-4 mr-1" />
              Pause
            </Button>
          ) : (
            <Button onClick={resumeSimulation} size="sm">
              <Play className="h-4 w-4 mr-1" />
              Resume
            </Button>
          )}
          
          <Button onClick={resetSimulation} variant="outline" size="sm">
            <RotateCcw className="h-4 w-4 mr-1" />
            Reset
          </Button>
          
          <div className="flex items-center gap-2 ml-4">
            <span className="text-sm text-muted-foreground">Speed:</span>
            <Button 
              variant={playbackSpeed === 0.5 ? "default" : "outline"} 
              size="sm"
              onClick={() => setPlaybackSpeed(0.5)}
            >
              0.5x
            </Button>
            <Button 
              variant={playbackSpeed === 1 ? "default" : "outline"} 
              size="sm"
              onClick={() => setPlaybackSpeed(1)}
            >
              1x
            </Button>
            <Button 
              variant={playbackSpeed === 2 ? "default" : "outline"} 
              size="sm"
              onClick={() => setPlaybackSpeed(2)}
            >
              2x
            </Button>
          </div>
        </div>

        {/* Progress */}
        {selectedConversation && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Progress</span>
              <span>{currentSegmentIndex} / {selectedConversation.segments.length}</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${(currentSegmentIndex / selectedConversation.segments.length) * 100}%` 
                }}
              />
            </div>
          </div>
        )}

        {/* Current Segments Preview */}
        {selectedConversation && (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {selectedConversation.segments.slice(0, currentSegmentIndex + 2).map((segment, index) => (
              <div 
                key={index}
                className={`p-3 rounded-lg border transition-all ${
                  index === currentSegmentIndex 
                    ? 'border-primary bg-primary/5' 
                    : index < currentSegmentIndex 
                      ? 'border-muted bg-muted/50 opacity-60'
                      : 'border-muted opacity-40'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    {segment.speaker === 'rep' ? (
                      <User className="h-4 w-4 text-blue-500" />
                    ) : (
                      <MessageCircle className="h-4 w-4 text-green-500" />
                    )}
                    <span className="text-sm font-medium capitalize">
                      {segment.speaker === 'rep' ? 'Sales Rep' : 'Customer'}
                    </span>
                  </div>
                </div>
                <p className="text-sm mt-2 ml-6">{segment.text}</p>
                
                {segment.triggerInsight && index <= currentSegmentIndex && (
                  <div className="mt-3 ml-6 p-2 bg-card border rounded-md">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      {getInsightIcon(segment.triggerInsight.type)}
                      <span>AI Insight Generated</span>
                      <Badge variant="outline" className="text-xs">
                        {Math.round(segment.triggerInsight.confidence * 100)}% confidence
                      </Badge>
                    </div>
                    <p className="text-sm">{segment.triggerInsight.message}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="text-center py-2">
          <div className="text-xs text-muted-foreground flex items-center gap-2 justify-center">
            <CheckCircle className="h-3 w-3 text-green-500" />
            <span>Demo mode - Real conversation would be processed by speech-to-text</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}