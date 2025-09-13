import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Circle, ArrowRight, PlayCircle, FileText, Mic, BarChart3, X, Users, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  completed: boolean;
  action?: () => void;
  route?: string;
}

interface WelcomeOnboardingProps {
  onClose?: () => void;
}

export function WelcomeOnboarding({ onClose }: WelcomeOnboardingProps) {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [isVisible, setIsVisible] = useState(true);

  // Check if user has seen onboarding before
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('sensei:hasSeenOnboarding');
    if (hasSeenOnboarding) {
      setIsVisible(false);
    }
  }, []);

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to Sensei AI',
      description: 'Your intelligent sales assistant that reduces mental load and improves sales consistency. Let\'s get you started!',
      icon: <CheckCircle className="w-6 h-6 text-primary" />,
      completed: true
    },
    {
      id: 'workspace',
      title: 'Upload Your Knowledge Base',
      description: 'Start by uploading product docs, sales scripts, or any materials. The AI will use these to provide contextual assistance.',
      icon: <FileText className="w-6 h-6" />,
      completed: false,
      action: () => navigate('/'),
      route: '/'
    },
    {
      id: 'agents',
      title: 'Create Your Sales Agents',
      description: 'Build specialized AI agents for different sales scenarios - prospecting, objection handling, closing, etc.',
      icon: <Users className="w-6 h-6" />,
      completed: false,
      action: () => navigate('/agents'),
      route: '/agents'
    },
    {
      id: 'tools',
      title: 'Explore Sales Tools',
      description: 'Use Quote Generator, Meeting Prep Podcasts, and other tools to save 20-40 minutes per sales activity.',
      icon: <PlayCircle className="w-6 h-6" />,
      completed: false,
      action: () => navigate('/products'),
      route: '/products'
    },
    {
      id: 'assistant',
      title: 'Try the Call Assistant',
      description: 'Get real-time suggestions during customer calls. It\'s like having a coach whispering in your ear.',
      icon: <Mic className="w-6 h-6" />,
      completed: false,
      action: () => {
        navigate('/');
        setTimeout(() => {
          // Switch to call assistant tab
          localStorage.setItem('sensei:workspaceTab', 'assistant');
          window.location.reload();
        }, 100);
      }
    },
    {
      id: 'settings',
      title: 'Customize Your Setup',
      description: 'Choose your preferred AI model, voice settings, and other preferences to match your working style.',
      icon: <Settings className="w-6 h-6" />,
      completed: false,
      action: () => navigate('/settings'),
      route: '/settings'
    }
  ];

  const handleStepAction = (step: OnboardingStep) => {
    setCompletedSteps(prev => new Set([...prev, step.id]));
    
    if (step.action) {
      step.action();
    }
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('sensei:hasSeenOnboarding', 'true');
    setIsVisible(false);
    onClose?.();
  };

  const handleComplete = () => {
    localStorage.setItem('sensei:hasSeenOnboarding', 'true');
    setIsVisible(false);
    onClose?.();
  };

  const progress = (completedSteps.size / steps.length) * 100;

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <Card className="max-w-2xl w-full mx-auto shadow-2xl border-primary/20 animate-scale-in">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <span className="text-3xl animate-pulse-purple">🥋</span>
                Welcome to Sensei AI
              </CardTitle>
              <CardDescription className="text-base mt-2">
                Your intelligent sales companion. Let's get you set up for success.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                New User
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkip}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <div className="pt-4">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>Setup Progress</span>
              <span>{completedSteps.size}/{steps.length} completed</span>
            </div>
            <Progress 
              value={progress} 
              className="w-full h-2" 
            />
          </div>
        </CardHeader>

        <CardContent className="space-y-4 max-h-96 overflow-y-auto">
          {steps.map((step, index) => {
            const isCompleted = completedSteps.has(step.id) || step.completed;
            const isCurrent = index === currentStep;
            
            return (
              <div
                key={step.id}
                className={`flex items-start gap-4 p-4 rounded-lg border transition-all duration-200 ${
                  isCurrent 
                    ? 'border-primary bg-primary/5 shadow-md animate-glow-purple' 
                    : 'border-border hover:border-border/80'
                } ${isCompleted ? 'opacity-75' : ''}`}
              >
                <div className={`shrink-0 transition-colors ${
                  isCompleted ? 'text-green-500' : isCurrent ? 'text-primary' : 'text-muted-foreground'
                }`}>
                  {isCompleted ? <CheckCircle className="w-6 h-6" /> : step.icon}
                </div>
                
                <div className="flex-1 space-y-2">
                  <h3 className={`font-medium transition-colors ${
                    isCurrent ? 'text-primary' : 'text-foreground'
                  }`}>
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                  
                  {isCurrent && !isCompleted && (
                    <Button
                      onClick={() => handleStepAction(step)}
                      size="sm"
                      className="mt-3 animate-fade-in"
                    >
                      {step.action ? 'Let\'s go' : 'Mark complete'}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>

        <div className="px-6 pb-6">
          <div className="flex items-center justify-between pt-4 border-t border-border/50">
            <div className="text-sm text-muted-foreground">
              You can always access this guide later in Settings
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSkip} variant="outline" size="sm">
                Skip for now
              </Button>
              {progress === 100 && (
                <Button onClick={handleComplete} size="sm">
                  Get started
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}