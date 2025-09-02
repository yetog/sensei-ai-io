import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Circle, ArrowRight, PlayCircle, FileText, Mic, BarChart3 } from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  completed: boolean;
  action?: () => void;
}

interface BetaOnboardingProps {
  onNavigateToTools?: () => void;
  onNavigateToWorkspace?: () => void;
  onNavigateToSettings?: () => void;
  onClose?: () => void;
}

export function BetaOnboarding({ 
  onNavigateToTools, 
  onNavigateToWorkspace, 
  onNavigateToSettings,
  onClose 
}: BetaOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to Sensei AI Beta',
      description: 'You\'re now part of our exclusive beta program! This AI assistant will help reduce mental load and improve your sales consistency.',
      icon: <CheckCircle className="w-6 h-6 text-primary" />,
      completed: true
    },
    {
      id: 'workspace',
      title: 'Upload Your Product Knowledge',
      description: 'Start by uploading PDFs, documents, or pasting text about your products. The AI will use this to help with pitches and quotes.',
      icon: <FileText className="w-6 h-6" />,
      completed: false,
      action: onNavigateToWorkspace
    },
    {
      id: 'tools',
      title: 'Explore Sales Tools',
      description: 'Check out the Quote Generator and Meeting Prep Podcast tools. These will save you 20-40 minutes per quote and help you practice for calls.',
      icon: <PlayCircle className="w-6 h-6" />,
      completed: false,
      action: onNavigateToTools
    },
    {
      id: 'assistant',
      title: 'Try the Call Assistant',
      description: 'Use the real-time call assistant for live suggestions during customer conversations. It\'s like having a coach in your ear.',
      icon: <Mic className="w-6 h-6" />,
      completed: false
    },
    {
      id: 'analytics',
      title: 'Track Your Performance',
      description: 'Monitor your response time, pitch quality, and quote generation. We\'ll track the 3 KPIs that matter most for sales success.',
      icon: <BarChart3 className="w-6 h-6" />,
      completed: false
    },
    {
      id: 'settings',
      title: 'Customize Your Experience',
      description: 'Set your preferred AI model (OpenAI, Claude, Meta) and configure TTS voices to match your style.',
      icon: <Circle className="w-6 h-6" />,
      completed: false,
      action: onNavigateToSettings
    }
  ];

  const handleStepAction = (step: OnboardingStep) => {
    if (step.action) {
      step.action();
    }
    setCompletedSteps(prev => new Set([...prev, step.id]));
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const progress = (completedSteps.size / steps.length) * 100;

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">🥋</span>
              Beta Tester Onboarding
            </CardTitle>
            <CardDescription>
              Get started with Sensei AI - Your GPT Trainer for sales excellence
            </CardDescription>
          </div>
          <Badge variant="secondary">Beta Program</Badge>
        </div>
        <div>
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Progress</span>
            <span>{completedSteps.size}/{steps.length} completed</span>
          </div>
          <Progress value={progress} className="w-full" />
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.has(step.id) || step.completed;
          const isCurrent = index === currentStep;
          
          return (
            <div
              key={step.id}
              className={`flex items-start gap-4 p-4 rounded-lg border transition-all ${
                isCurrent ? 'border-primary bg-primary/5' : 'border-border'
              } ${isCompleted ? 'opacity-75' : ''}`}
            >
              <div className={`shrink-0 ${isCompleted ? 'text-green-500' : 'text-muted-foreground'}`}>
                {isCompleted ? <CheckCircle className="w-6 h-6" /> : step.icon}
              </div>
              
              <div className="flex-1 space-y-2">
                <h3 className="font-medium">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
                
                {isCurrent && !isCompleted && (
                  <Button
                    onClick={() => handleStepAction(step)}
                    size="sm"
                    className="mt-2"
                  >
                    {step.action ? 'Take me there' : 'Mark as complete'}
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}

        <div className="pt-4 border-t">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Questions? Reach out to your manager or the development team.
            </div>
            {progress === 100 && (
              <Button onClick={onClose} variant="outline">
                Complete Onboarding
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}