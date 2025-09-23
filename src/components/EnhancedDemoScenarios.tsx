import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Target, 
  Shield, 
  PhoneCall, 
  Play,
  Users,
  CheckCircle,
  ArrowRight,
  Volume2
} from 'lucide-react';

interface DemoScenariosProps {
  onSelectScenario: (scenario: DemoScenario) => void;
  isListening: boolean;
}

interface DemoScenario {
  id: string;
  title: string;
  callType: 'incoming_sales' | 'retention' | 'outbound' | 'general';
  description: string;
  customerLines: string[];
  expectedCoaching: string[];
  difficulty: 'easy' | 'medium' | 'hard';
}

const demoScenarios: DemoScenario[] = [
  {
    id: 'price_objection',
    title: 'Price Objection Handling',
    callType: 'incoming_sales',
    description: 'Customer is interested but concerned about pricing',
    customerLines: [
      "I'm interested in your hosting service, but the price seems quite high compared to competitors.",
      "I found another provider for half the price. Why should I pay more?",
      "Can you give me a discount or match their price?"
    ],
    expectedCoaching: [
      'Focus on value proposition over price',
      'Ask about their specific needs',
      'Highlight unique features and support'
    ],
    difficulty: 'medium'
  },
  {
    id: 'cancellation_save',
    title: 'Retention - Cancellation Save',
    callType: 'retention',
    description: 'Customer wants to cancel due to budget constraints',
    customerLines: [
      "I need to cancel my service. Business has been slow and I need to cut costs.",
      "I really like the service, but I just can't afford it right now.",
      "Is there anything you can do to help me keep the service at a lower cost?"
    ],
    expectedCoaching: [
      'Explore downgrade options',
      'Offer temporary discounts',
      'Understand specific budget constraints'
    ],
    difficulty: 'hard'
  },
  {
    id: 'qualification_call',
    title: 'Outbound Qualification',
    callType: 'outbound',
    description: 'Cold call to qualify a potential lead',
    customerLines: [
      "Hello? Oh, I wasn't expecting a call about hosting.",
      "We currently use another provider, but I'm always open to learning about better options.",
      "What makes your service different from what we already have?"
    ],
    expectedCoaching: [
      'Ask discovery questions',
      'Listen for pain points',
      'Schedule a proper demo'
    ],
    difficulty: 'easy'
  },
  {
    id: 'closing_opportunity',
    title: 'Ready to Close',
    callType: 'incoming_sales',
    description: 'Customer showing strong buying signals',
    customerLines: [
      "This looks perfect for our needs. How quickly can we get started?",
      "What's the next step? Do I need to sign something?",
      "Can we start with the premium package?"
    ],
    expectedCoaching: [
      'Strike while iron is hot',
      'Confirm decision makers',
      'Walk through next steps'
    ],
    difficulty: 'easy'
  }
];

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'easy': return 'bg-green-50 border-green-200 text-green-700';
    case 'medium': return 'bg-yellow-50 border-yellow-200 text-yellow-700';
    case 'hard': return 'bg-red-50 border-red-200 text-red-700';
    default: return 'bg-gray-50 border-gray-200 text-gray-700';
  }
};

const getCallTypeIcon = (callType: string) => {
  switch (callType) {
    case 'incoming_sales': return <Target className="h-4 w-4" />;
    case 'retention': return <Shield className="h-4 w-4" />;
    case 'outbound': return <PhoneCall className="h-4 w-4" />;
    default: return <Users className="h-4 w-4" />;
  }
};

export function EnhancedDemoScenarios({ onSelectScenario, isListening }: DemoScenariosProps) {
  const [selectedScenario, setSelectedScenario] = useState<DemoScenario | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleSelectScenario = (scenario: DemoScenario) => {
    setSelectedScenario(scenario);
    setCurrentStep(0);
    setIsPlaying(true);
    onSelectScenario(scenario);
  };

  const handleNextStep = () => {
    if (selectedScenario && currentStep < selectedScenario.customerLines.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 0.8;
      speechSynthesis.speak(utterance);
    }
  };

  if (isPlaying && selectedScenario) {
    const progress = ((currentStep + 1) / selectedScenario.customerLines.length) * 100;
    
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Play className="h-5 w-5 text-primary animate-pulse" />
            <h3 className="text-lg font-semibold">Practice Session: {selectedScenario.title}</h3>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              setIsPlaying(false);
              setSelectedScenario(null);
            }}
          >
            End Practice
          </Button>
        </div>

        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                {getCallTypeIcon(selectedScenario.callType)}
                Step {currentStep + 1} of {selectedScenario.customerLines.length}
              </CardTitle>
              <Badge className="bg-primary text-primary-foreground">
                Live Practice
              </Badge>
            </div>
            <Progress value={progress} className="h-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-accent/30 p-4 rounded-lg border-l-4 border-primary">
              <div className="flex items-start gap-3">
                <div className="flex items-center gap-2 text-sm font-medium text-primary mb-2">
                  <Users className="h-4 w-4" />
                  Customer says:
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => speakText(selectedScenario.customerLines[currentStep])}
                  className="h-6 w-6 p-0"
                >
                  <Volume2 className="h-3 w-3" />
                </Button>
              </div>
              <p className="text-foreground font-medium animate-fade-in">
                "{selectedScenario.customerLines[currentStep]}"
              </p>
            </div>

            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <p className="text-sm text-green-700 mb-2">
                <strong>🎯 Now you respond:</strong> Practice your sales response while the AI analyzes and provides coaching suggestions.
              </p>
              <p className="text-xs text-green-600">
                Expected coaching: {selectedScenario.expectedCoaching[Math.min(currentStep, selectedScenario.expectedCoaching.length - 1)]}
              </p>
            </div>

            <div className="flex justify-between items-center">
              <div className="text-xs text-muted-foreground">
                Speak your response naturally - AI is listening and will provide coaching
              </div>
              
              {currentStep < selectedScenario.customerLines.length - 1 ? (
                <Button 
                  onClick={handleNextStep}
                  size="sm"
                  className="animate-fade-in"
                >
                  Next Customer Line
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              ) : (
                <div className="flex items-center gap-2 text-green-600 animate-fade-in">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Scenario Complete!</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Play className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Enhanced Demo Scenarios</h3>
      </div>
      <p className="text-sm text-muted-foreground">
        Interactive practice scenarios with step-by-step guidance and automated customer responses
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {demoScenarios.map((scenario, index) => (
            <Card key={scenario.id} className="relative hover-scale transition-all duration-200" style={{ animationDelay: `${index * 0.1}s` }}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    {getCallTypeIcon(scenario.callType)}
                    {scenario.title}
                  </CardTitle>
                  <Badge 
                    variant="outline" 
                    className={getDifficultyColor(scenario.difficulty)}
                  >
                    {scenario.difficulty.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {scenario.description}
                </p>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                {/* Customer Lines Preview */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    Interactive Flow ({scenario.customerLines.length} steps):
                  </p>
                  <div className="text-xs bg-accent/30 p-2 rounded border-l-2 border-accent">
                    "{scenario.customerLines[0]}..."
                  </div>
                </div>

                {/* Expected Coaching */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    AI will coach on:
                  </p>
                  <ul className="text-xs space-y-1">
                    {scenario.expectedCoaching.slice(0, 2).map((coaching, index) => (
                      <li key={index} className="flex items-center gap-1">
                        <div className="h-1 w-1 bg-primary rounded-full" />
                        {coaching}
                      </li>
                    ))}
                  </ul>
                </div>

                <Button 
                  onClick={() => handleSelectScenario(scenario)}
                  disabled={isListening}
                  variant="outline"
                  size="sm"
                  className="w-full hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  <Play className="h-3 w-3 mr-1" />
                  Start Interactive Practice
                </Button>
              </CardContent>
            </Card>
          ))}
      </div>

      {isListening && !isPlaying && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg animate-fade-in">
          <p className="text-sm text-amber-700">
            🎯 <strong>AI Coaching Active:</strong> Start a practice scenario to receive step-by-step guidance and real-time coaching suggestions.
          </p>
        </div>
      )}
    </div>
  );
}