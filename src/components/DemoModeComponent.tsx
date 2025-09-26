import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Play, 
  Pause, 
  SkipForward, 
  Users, 
  Target, 
  TrendingUp, 
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';

interface DemoModeComponentProps {
  onTranscriptionUpdate: (text: string, speaker: 'agent' | 'customer') => void;
  onSuggestionGenerated: (suggestion: any) => void;
  isActive: boolean;
}

interface DemoScenario {
  id: string;
  title: string;
  description: string;
  callType: string;
  steps: Array<{
    speaker: 'agent' | 'customer';
    text: string;
    delay: number;
    suggestions?: Array<{
      type: string;
      priority: 'high' | 'medium' | 'low';
      suggestion: string;
      reasoning: string;
    }>;
  }>;
}

const demoScenarios: DemoScenario[] = [
  {
    id: 'incoming_sales',
    title: 'Incoming Sales Call',
    description: 'Customer interested in our services',
    callType: 'incoming_sales',
    steps: [
      {
        speaker: 'customer',
        text: "Hi, I saw your ad online and I'm interested in learning more about your software solutions.",
        delay: 2000,
        suggestions: [
          {
            type: 'greeting',
            priority: 'high',
            suggestion: "Thank you for calling! I'd be happy to help you learn about our solutions. What specific challenges are you hoping to solve?",
            reasoning: "Warm greeting with discovery question to understand needs"
          }
        ]
      },
      {
        speaker: 'agent',
        text: "Thank you for calling! I'd be happy to help you learn about our solutions. What specific challenges are you hoping to solve?",
        delay: 3000
      },
      {
        speaker: 'customer',
        text: "Well, we're struggling with managing our customer data and it's taking way too much manual work.",
        delay: 4000,
        suggestions: [
          {
            type: 'discovery',
            priority: 'high',
            suggestion: "That's a common challenge. Can you tell me more about your current process? How many customers are we talking about?",
            reasoning: "Dig deeper into pain points and scope"
          },
          {
            type: 'empathy',
            priority: 'medium',
            suggestion: "I completely understand that frustration - manual data management can be incredibly time-consuming.",
            reasoning: "Show empathy to build rapport"
          }
        ]
      },
      {
        speaker: 'agent',
        text: "I completely understand that frustration. Can you tell me more about your current process? How many customers are we talking about?",
        delay: 3000
      },
      {
        speaker: 'customer',
        text: "We have about 500 customers right now, but we're growing fast. Everything is in spreadsheets and it's a nightmare.",
        delay: 4000,
        suggestions: [
          {
            type: 'product_pitch',
            priority: 'high',
            suggestion: "Perfect! Our CRM handles exactly that scale and can import all your existing data. Would you like to see how it could work for your specific situation?",
            reasoning: "Perfect fit - position solution for their exact needs"
          }
        ]
      }
    ]
  },
  {
    id: 'objection_handling',
    title: 'Price Objection',
    description: 'Customer concerned about pricing',
    callType: 'outbound_sales',
    steps: [
      {
        speaker: 'customer',
        text: "I'm interested but honestly, this seems pretty expensive. We're a small business and budget is tight.",
        delay: 2000,
        suggestions: [
          {
            type: 'objection',
            priority: 'high',
            suggestion: "I understand budget is important. Let's talk about the ROI - how much time would you save each week with automation?",
            reasoning: "Address price objection by focusing on value and ROI"
          },
          {
            type: 'objection',
            priority: 'medium',
            suggestion: "That's a fair concern. What if I could show you how this pays for itself in the first 3 months?",
            reasoning: "Alternative approach focusing on payback period"
          }
        ]
      },
      {
        speaker: 'agent',
        text: "I understand budget is important. Let's talk about the ROI - how much time would you save each week with automation?",
        delay: 3000
      },
      {
        speaker: 'customer',
        text: "Well, I probably spend about 10 hours a week on data entry and reporting.",
        delay: 3000,
        suggestions: [
          {
            type: 'closing',
            priority: 'high',
            suggestion: "So at $20/hour, that's $200 per week, or over $10,000 per year. Our solution costs less than 2 months of that time. Does that help put it in perspective?",
            reasoning: "Calculate specific ROI to justify investment"
          }
        ]
      }
    ]
  },
  {
    id: 'retention_call',
    title: 'Customer Retention',
    description: 'Existing customer considering cancellation',
    callType: 'retention',
    steps: [
      {
        speaker: 'customer',
        text: "I called because we're thinking about canceling. We're just not seeing the value we expected.",
        delay: 2000,
        suggestions: [
          {
            type: 'retention',
            priority: 'high',
            suggestion: "I appreciate you calling instead of just canceling. Can you help me understand what specific value you were expecting to see?",
            reasoning: "Thank them for reaching out and focus on understanding expectations"
          },
          {
            type: 'discovery',
            priority: 'high',
            suggestion: "That's disappointing to hear. What specific outcomes were you hoping for that you haven't achieved yet?",
            reasoning: "Understand the gap between expectations and reality"
          }
        ]
      }
    ]
  }
];

export function DemoModeComponent({ onTranscriptionUpdate, onSuggestionGenerated, isActive }: DemoModeComponentProps) {
  const [selectedScenario, setSelectedScenario] = useState<DemoScenario | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  useEffect(() => {
    if (!isActive) {
      setIsPlaying(false);
      setCurrentStep(0);
      setCompletedSteps([]);
    }
  }, [isActive]);

  const playScenario = async () => {
    if (!selectedScenario || !isActive) return;
    
    setIsPlaying(true);
    setCurrentStep(0);
    setCompletedSteps([]);

    for (let i = 0; i < selectedScenario.steps.length; i++) {
      if (!isPlaying) break;
      
      const step = selectedScenario.steps[i];
      
      // Wait for the delay
      await new Promise(resolve => setTimeout(resolve, step.delay));
      
      if (!isPlaying) break;

      // Update transcription
      onTranscriptionUpdate(step.text, step.speaker);

      // Generate suggestions if available
      if (step.suggestions) {
        step.suggestions.forEach(suggestion => {
          onSuggestionGenerated({
            id: `demo_${Date.now()}_${Math.random()}`,
            type: suggestion.type,
            priority: suggestion.priority,
            suggestion: suggestion.suggestion,
            reasoning: suggestion.reasoning,
            timestamp: Date.now(),
            isDemo: true
          });
        });
      }

      setCurrentStep(i + 1);
      setCompletedSteps(prev => [...prev, i]);
    }

    setIsPlaying(false);
  };

  const stopScenario = () => {
    setIsPlaying(false);
  };

  const nextStep = () => {
    if (!selectedScenario || currentStep >= selectedScenario.steps.length) return;
    
    const step = selectedScenario.steps[currentStep];
    onTranscriptionUpdate(step.text, step.speaker);
    
    if (step.suggestions) {
      step.suggestions.forEach(suggestion => {
        onSuggestionGenerated({
          id: `demo_${Date.now()}_${Math.random()}`,
          type: suggestion.type,
          priority: suggestion.priority,
          suggestion: suggestion.suggestion,
          reasoning: suggestion.reasoning,
          timestamp: Date.now(),
          isDemo: true
        });
      });
    }

    setCurrentStep(prev => prev + 1);
    setCompletedSteps(prev => [...prev, currentStep]);
  };

  if (!isActive) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Demo mode is only available when live coaching is not active.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {/* Scenario Selection */}
      {!selectedScenario && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Demo Mode - Select Scenario
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {demoScenarios.map(scenario => (
                <Button
                  key={scenario.id}
                  variant="outline"
                  className="justify-start h-auto p-4"
                  onClick={() => setSelectedScenario(scenario)}
                >
                  <div className="text-left">
                    <div className="font-medium">{scenario.title}</div>
                    <div className="text-sm text-muted-foreground">{scenario.description}</div>
                    <Badge variant="secondary" className="mt-1">
                      {scenario.steps.length} interactions
                    </Badge>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scenario Playback */}
      {selectedScenario && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                {selectedScenario.title}
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setSelectedScenario(null);
                  setIsPlaying(false);
                  setCurrentStep(0);
                  setCompletedSteps([]);
                }}
              >
                Change Scenario
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {/* Progress */}
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4" />
              Step {currentStep} of {selectedScenario.steps.length}
              <Badge variant={isPlaying ? 'default' : 'outline'}>
                {isPlaying ? 'Playing' : 'Paused'}
              </Badge>
            </div>

            {/* Controls */}
            <div className="flex gap-2">
              {!isPlaying ? (
                <Button onClick={playScenario} className="flex-1">
                  <Play className="h-4 w-4 mr-2" />
                  Play Scenario
                </Button>
              ) : (
                <Button onClick={stopScenario} variant="destructive" className="flex-1">
                  <Pause className="h-4 w-4 mr-2" />
                  Stop
                </Button>
              )}
              
              <Button 
                onClick={nextStep} 
                variant="outline"
                disabled={isPlaying || currentStep >= selectedScenario.steps.length}
              >
                <SkipForward className="h-4 w-4" />
                Next Step
              </Button>
            </div>

            {/* Step Preview */}
            <div className="space-y-2">
              {selectedScenario.steps.slice(0, Math.min(currentStep + 2, selectedScenario.steps.length)).map((step, index) => (
                <div 
                  key={index}
                  className={`p-3 rounded-lg border ${
                    completedSteps.includes(index) 
                      ? 'bg-green-50 border-green-200' 
                      : index === currentStep 
                        ? 'bg-blue-50 border-blue-200' 
                        : 'bg-muted/30'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={step.speaker === 'agent' ? 'default' : 'secondary'}>
                      {step.speaker === 'agent' ? 'Agent' : 'Customer'}
                    </Badge>
                    {completedSteps.includes(index) && <CheckCircle className="h-4 w-4 text-green-500" />}
                  </div>
                  <p className="text-sm">{step.text}</p>
                  {step.suggestions && step.suggestions.length > 0 && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      Will generate {step.suggestions.length} coaching suggestion(s)
                    </div>
                  )}
                </div>
              ))}
            </div>

          </CardContent>
        </Card>
      )}
    </div>
  );
}