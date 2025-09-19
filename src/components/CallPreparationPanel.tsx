import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle2,
  User,
  Building,
  Target,
  FileText,
  Calendar,
  Clock,
  TrendingUp,
  AlertCircle,
  Lightbulb
} from 'lucide-react';

interface CallPreparationPanelProps {
  className?: string;
  onCallReady?: () => void;
}

const PREPARATION_CHECKLIST = [
  { id: 'research', label: 'Company research completed', completed: true },
  { id: 'agenda', label: 'Call agenda prepared', completed: true },
  { id: 'materials', label: 'Sales materials ready', completed: false },
  { id: 'objectives', label: 'Call objectives defined', completed: true },
  { id: 'questions', label: 'Discovery questions prepared', completed: false }
];

const COMPANY_INSIGHTS = [
  {
    icon: <Building className="h-4 w-4 text-blue-500" />,
    label: 'Industry',
    value: 'SaaS Technology'
  },
  {
    icon: <User className="h-4 w-4 text-green-500" />,
    label: 'Company Size',
    value: '250-500 employees'
  },
  {
    icon: <TrendingUp className="h-4 w-4 text-purple-500" />,
    label: 'Growth Stage',
    value: 'Series B, 40% YoY growth'
  },
  {
    icon: <Target className="h-4 w-4 text-orange-500" />,
    label: 'Pain Points',
    value: 'Manual processes, scaling issues'
  }
];

const SUGGESTED_APPROACHES = [
  {
    title: 'Lead with ROI',
    description: 'Companies like theirs typically see 30% efficiency gains',
    confidence: 'High'
  },
  {
    title: 'Reference TechCorp Case Study',
    description: 'Similar company size and challenges, great success story',
    confidence: 'Medium'
  },
  {
    title: 'Focus on Scalability',
    description: 'Their growth stage suggests scaling challenges',
    confidence: 'High'
  }
];

export function CallPreparationPanel({ className = '', onCallReady }: CallPreparationPanelProps) {
  const [checklist, setChecklist] = useState(PREPARATION_CHECKLIST);
  
  const toggleChecklistItem = (id: string) => {
    setChecklist(prev => prev.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  const completedItems = checklist.filter(item => item.completed).length;
  const isCallReady = completedItems >= 4;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Call Preparation</h2>
          <p className="text-muted-foreground">Get ready for your sales call with AI insights</p>
        </div>
        <Badge variant={isCallReady ? "default" : "secondary"}>
          {completedItems}/{checklist.length} Ready
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Preparation Checklist */}
        <div className="space-y-6">
          
          {/* Call Readiness */}
          <Card className={isCallReady ? 'border-green-500/50 bg-green-50/50 dark:bg-green-950/20' : ''}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Pre-Call Checklist
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {checklist.map((item) => (
                  <div key={item.id} className="flex items-center space-x-3">
                    <Checkbox
                      id={item.id}
                      checked={item.completed}
                      onCheckedChange={() => toggleChecklistItem(item.id)}
                    />
                    <label
                      htmlFor={item.id}
                      className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${
                        item.completed ? 'line-through text-muted-foreground' : ''
                      }`}
                    >
                      {item.label}
                    </label>
                  </div>
                ))}
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {isCallReady ? 'Ready to start call' : `${5 - completedItems} items remaining`}
                </span>
                <Button 
                  onClick={onCallReady}
                  disabled={!isCallReady}
                  className="ml-auto"
                >
                  {isCallReady ? 'Start Call' : 'Complete Checklist'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Call Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Call Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Contact</label>
                  <p className="font-medium">Sarah Johnson</p>
                  <p className="text-sm text-muted-foreground">VP of Operations</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Company</label>
                  <p className="font-medium">TechCorp Solutions</p>
                  <p className="text-sm text-muted-foreground">SaaS Platform</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Time</label>
                  <p className="font-medium flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    2:00 PM - 2:30 PM
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Type</label>
                  <p className="font-medium">Discovery Call</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: AI Insights */}
        <div className="space-y-6">
          
          {/* Company Intelligence */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Company Intelligence
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                {COMPANY_INSIGHTS.map((insight, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    {insight.icon}
                    <div className="flex-1">
                      <div className="text-sm font-medium">{insight.label}</div>
                      <div className="text-sm text-muted-foreground">{insight.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* AI Suggestions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                AI-Powered Suggestions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {SUGGESTED_APPROACHES.map((approach, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-sm">{approach.title}</h4>
                    <Badge 
                      variant={approach.confidence === 'High' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {approach.confidence}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{approach.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Key Talking Points */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Key Talking Points
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Pain Point Discovery</p>
                    <p className="text-muted-foreground">Ask about current manual processes and bottlenecks</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Target className="h-4 w-4 text-blue-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Value Proposition</p>
                    <p className="text-muted-foreground">Emphasize automation and scalability benefits</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">ROI Focus</p>
                    <p className="text-muted-foreground">Quantify potential time and cost savings</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}