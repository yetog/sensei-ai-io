import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Circle, ArrowRight, FileText, Bot, Database, MessageSquare } from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  action?: () => void;
  completed?: boolean;
}

interface DemoOnboardingProps {
  onClose: () => void;
  onNavigateToSources: () => void;
  onNavigateToAgents: () => void;
  onNavigateToDatasets: () => void;
  onNavigateToChat: () => void;
}

export const DemoOnboarding: React.FC<DemoOnboardingProps> = ({
  onClose,
  onNavigateToSources,
  onNavigateToAgents,
  onNavigateToDatasets,
  onNavigateToChat
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  const steps: OnboardingStep[] = [
    {
      id: 'upload',
      title: 'Upload Your Documents',
      description: 'Start by uploading documents, PDFs, or other files you want to analyze.',
      icon: <FileText className="w-5 h-5" />,
      action: onNavigateToSources
    },
    {
      id: 'datasets',
      title: 'Organize into Datasets',
      description: 'Group related files into datasets for easier management and context.',
      icon: <Database className="w-5 h-5" />,
      action: onNavigateToDatasets
    },
    {
      id: 'agents',
      title: 'Create Specialized Agents',
      description: 'Set up AI agents with specific expertise and link them to your datasets.',
      icon: <Bot className="w-5 h-5" />,
      action: onNavigateToAgents
    },
    {
      id: 'chat',
      title: 'Start Chatting',
      description: 'Begin conversations with your agents to get insights and answers.',
      icon: <MessageSquare className="w-5 h-5" />,
      action: onNavigateToChat
    }
  ];

  const handleStepAction = (step: OnboardingStep) => {
    setCompletedSteps(prev => new Set(prev).add(step.id));
    if (step.action) {
      step.action();
    }
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <Card className="p-6 bg-gradient-to-br from-primary/5 to-secondary/10 border-primary/20 shadow-lg max-w-md mx-auto animate-scale-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Welcome to Wolf AI!</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>✕</Button>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">Setup Progress</span>
          <span className="text-sm font-medium">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <div className="space-y-4">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.has(step.id);
          const isCurrent = index === currentStep;
          const isPast = index < currentStep;

          return (
            <div 
              key={step.id} 
              className={`flex items-start space-x-3 p-3 rounded-lg transition-colors ${
                isCurrent ? 'bg-primary/10 border border-primary/30' : 
                isCompleted ? 'bg-secondary/20' : 'bg-muted/10'
              }`}
            >
              <div className={`flex-shrink-0 mt-0.5 ${
                isCompleted ? 'text-primary' : 
                isCurrent ? 'text-primary' : 'text-muted-foreground'
              }`}>
                {isCompleted ? <CheckCircle className="w-5 h-5" /> : 
                 isCurrent ? step.icon : <Circle className="w-5 h-5" />}
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className={`font-medium mb-1 ${
                  isCompleted || isCurrent ? 'text-foreground' : 'text-muted-foreground'
                }`}>
                  {step.title}
                </h4>
                <p className="text-sm text-muted-foreground mb-2">
                  {step.description}
                </p>
                
                {isCurrent && !isCompleted && (
                  <Button 
                    size="sm" 
                    onClick={() => handleStepAction(step)}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    {index === steps.length - 1 ? 'Finish Setup' : 'Get Started'}
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                )}
                
                {isCompleted && (
                  <Badge variant="secondary" className="bg-primary/10 text-primary text-xs">
                    Completed
                  </Badge>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {completedSteps.size === steps.length && (
        <div className="mt-6 p-4 bg-primary/10 rounded-lg border border-primary/20">
          <h4 className="font-medium text-foreground mb-2">🎉 Setup Complete!</h4>
          <p className="text-sm text-muted-foreground mb-3">
            You're all set! Your AI agents are ready to help you analyze and get insights from your documents.
          </p>
          <Button onClick={onClose} className="w-full">
            Start Using Wolf AI
          </Button>
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground text-center">
          You can access this guide anytime from the help menu.
        </p>
      </div>
    </Card>
  );
};