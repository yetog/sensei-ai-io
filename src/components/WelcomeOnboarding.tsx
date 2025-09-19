import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Circle, ArrowRight, PlayCircle, FileText, Mic, BarChart3, X, Users, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { initializeDemoData } from '@/data/demoData';

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
  const [refreshKey, setRefreshKey] = useState(0);

  // Initialize demo data and check if user has seen onboarding before
  useEffect(() => {
    // Initialize demo data for seamless experience
    initializeDemoData();
    
    const hasSeenOnboarding = localStorage.getItem('sensei:hasSeenOnboarding');
    if (hasSeenOnboarding) {
      setIsVisible(false);
    }
  }, []);

  // Refresh completion status periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshKey(prev => prev + 1);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Check actual completion status based on localStorage or application state
  const checkStepCompletion = (stepId: string): boolean => {
    // Check if manually triggered or has visited the section
    const manuallyTriggered = localStorage.getItem(`sensei:triggered_${stepId}`) === 'true';
    const hasVisited = localStorage.getItem(`sensei:hasVisited${stepId.charAt(0).toUpperCase() + stepId.slice(1)}`) === 'true';
    
    switch (stepId) {
      case 'welcome':
        return true; // Always completed
      case 'workspace':
        return manuallyTriggered || hasVisited || localStorage.getItem('sensei:hasUploadedFiles') === 'true';
      case 'agents':
        return manuallyTriggered || hasVisited || localStorage.getItem('sensei:hasCreatedAgent') === 'true';
      case 'tools':
        return manuallyTriggered || hasVisited || localStorage.getItem('sensei:hasUsedTools') === 'true';
      case 'assistant':
        return manuallyTriggered || hasVisited || localStorage.getItem('sensei:hasUsedAssistant') === 'true';
      case 'settings':
        return manuallyTriggered || hasVisited || localStorage.getItem('sensei:hasConfiguredSettings') === 'true';
      default:
        return false;
    }
  };

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to Sensei AI',
      description: 'Your intelligent sales assistant that reduces mental load and improves sales consistency. Let\'s get you started!',
      icon: <CheckCircle className="w-6 h-6 text-primary" />,
      completed: checkStepCompletion('welcome')
    },
    {
      id: 'workspace',
      title: 'Upload Your Knowledge Base',
      description: 'Start by uploading product docs, sales scripts, or any materials. The AI will use these to provide contextual assistance.',
      icon: <FileText className="w-6 h-6" />,
      completed: checkStepCompletion('workspace'),
      action: () => {
        navigate('/');
        localStorage.setItem('sensei:hasUsedWorkspace', 'true');
      },
      route: '/'
    },
    {
      id: 'agents',
      title: 'Create Your Sales Agents',
      description: 'Build specialized AI agents for different sales scenarios - prospecting, objection handling, closing, etc.',
      icon: <Users className="w-6 h-6" />,
      completed: checkStepCompletion('agents'),
      action: () => {
        navigate('/agents');
        localStorage.setItem('sensei:hasVisitedAgents', 'true');
      },
      route: '/agents'
    },
    {
      id: 'tools',
      title: 'Explore Sales Tools',
      description: 'Use Quote Generator, Meeting Prep Podcasts, and other tools to save 20-40 minutes per sales activity.',
      icon: <PlayCircle className="w-6 h-6" />,
      completed: checkStepCompletion('tools'),
      action: () => {
        navigate('/products');
        localStorage.setItem('sensei:hasVisitedTools', 'true');
      },
      route: '/products'
    },
    {
      id: 'assistant',
      title: 'Try the Call Assistant',
      description: 'Get real-time suggestions during customer calls. It\'s like having a coach whispering in your ear.',
      icon: <Mic className="w-6 h-6" />,
      completed: checkStepCompletion('assistant'),
      action: () => {
        navigate('/');
        localStorage.setItem('sensei:workspaceTab', 'assistant');
        localStorage.setItem('sensei:hasVisitedAssistant', 'true');
        setTimeout(() => {
          window.location.reload();
        }, 100);
      }
    },
    {
      id: 'settings',
      title: 'Customize Your Setup',
      description: 'Choose your preferred AI model, voice settings, and other preferences to match your working style.',
      icon: <Settings className="w-6 h-6" />,
      completed: checkStepCompletion('settings'),
      action: () => {
        navigate('/settings');
        localStorage.setItem('sensei:hasVisitedSettings', 'true');
      },
      route: '/settings'
    }
  ];

  const handleStepAction = (step: OnboardingStep) => {
    if (step.action) {
      step.action();
    }
    
    // Mark step as manually triggered
    localStorage.setItem(`sensei:triggered_${step.id}`, 'true');
    
    // Refresh to update completion status
    setTimeout(() => {
      setRefreshKey(prev => prev + 1);
    }, 500);
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

  // Calculate progress based on actual completion status
  const completedCount = steps.filter(step => step.completed).length;
  const progress = (completedCount / steps.length) * 100;

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
              <span>{completedCount}/{steps.length} completed</span>
            </div>
            <Progress 
              value={progress} 
              className="w-full h-2" 
            />
          </div>
        </CardHeader>

        <CardContent className="space-y-4 max-h-96 overflow-y-auto">
          {steps.map((step, index) => {
            const isCompleted = step.completed;
            const isClickable = step.action || step.route;
            
            return (
              <div
                key={step.id}
                onClick={() => isClickable && !isCompleted ? handleStepAction(step) : undefined}
                className={`flex items-start gap-4 p-4 rounded-lg border transition-all duration-200 ${
                  isClickable && !isCompleted
                    ? 'cursor-pointer hover:border-primary/50 hover:bg-primary/5 hover:shadow-md' 
                    : isCompleted 
                    ? 'opacity-75 border-green-500/30 bg-green-500/5'
                    : 'border-border'
                } ${isCompleted ? '' : 'animate-pulse-border'}`}
              >
                <div className={`shrink-0 transition-colors ${
                  isCompleted ? 'text-green-500' : 'text-primary'
                }`}>
                  {isCompleted ? <CheckCircle className="w-6 h-6" /> : step.icon}
                </div>
                
                <div className="flex-1 space-y-2">
                  <h3 className={`font-medium transition-colors ${
                    isCompleted ? 'text-green-700 dark:text-green-400' : 'text-foreground'
                  }`}>
                    {step.title}
                    {isCompleted && <span className="ml-2 text-xs text-green-600">✓ Complete</span>}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                  
                  {!isCompleted && isClickable && (
                    <div className="pt-2">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStepAction(step);
                        }}
                        size="sm"
                        variant="outline"
                        className="hover:bg-primary hover:text-primary-foreground"
                      >
                        {step.action ? 'Let\'s go' : 'Mark complete'}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
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