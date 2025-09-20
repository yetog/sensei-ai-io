import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Target, 
  Shield, 
  PhoneCall, 
  Play,
  DollarSign,
  Clock,
  Users
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

export function DemoScenarios({ onSelectScenario, isListening }: DemoScenariosProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Play className="h-5 w-5" />
          Demo Scenarios
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Practice with realistic customer scenarios to test coaching quality
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {demoScenarios.map((scenario) => (
            <Card key={scenario.id} className="relative">
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
                    Customer will say:
                  </p>
                  <div className="text-xs bg-accent/50 p-2 rounded border-l-2 border-accent">
                    "{scenario.customerLines[0]}..."
                  </div>
                </div>

                {/* Expected Coaching */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    Expected coaching:
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
                  onClick={() => onSelectScenario(scenario)}
                  disabled={isListening}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  <Play className="h-3 w-3 mr-1" />
                  Practice This Scenario
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {isListening && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded">
            <p className="text-sm text-amber-700">
              🎯 <strong>Demo Mode Active:</strong> Simulate customer responses by speaking the provided lines, 
              then respond as yourself to test the AI coaching suggestions.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}