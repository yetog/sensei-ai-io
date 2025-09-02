import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Mic, MicOff, Brain, Lightbulb, TrendingUp, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CallInsight {
  type: 'opportunity' | 'objection' | 'next_step' | 'warning';
  title: string;
  message: string;
  action?: string;
}

export function CallAssistant() {
  const [isListening, setIsListening] = useState(false);
  const [callNotes, setCallNotes] = useState('');
  const [currentInsights, setCurrentInsights] = useState<CallInsight[]>([
    {
      type: 'opportunity',
      title: 'SSL Opportunity Detected',
      message: 'Customer mentioned having a domain but no SSL certificate. This is a perfect upsell opportunity.',
      action: 'Pitch SSL benefits: security, SEO boost, customer trust'
    },
    {
      type: 'next_step',
      title: 'Contract Length',
      message: 'Customer is price-sensitive. Consider pitching 36-month contract for better rates.',
      action: 'Mention economic uncertainty and cost control benefits'
    }
  ]);

  const toggleListening = () => {
    setIsListening(!isListening);
    if (!isListening) {
      // Simulate real-time insights
      setTimeout(() => {
        setCurrentInsights(prev => [...prev, {
          type: 'objection',
          title: 'Price Objection Detected',
          message: 'Customer mentioned cost concerns. Use value-based selling approach.',
          action: 'Show ROI calculation and premium support benefits'
        }]);
      }, 3000);
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'objection': return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case 'next_step': return <Lightbulb className="h-4 w-4 text-blue-500" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <Brain className="h-4 w-4" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'opportunity': return 'border-green-200 bg-green-50';
      case 'objection': return 'border-orange-200 bg-orange-50';
      case 'next_step': return 'border-blue-200 bg-blue-50';
      case 'warning': return 'border-red-200 bg-red-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Call Assistant</h2>
        <p className="text-muted-foreground">Real-time suggestions and insights during your sales calls</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Call Control */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Live Call Analysis
            </CardTitle>
            <CardDescription>
              Start listening to get real-time insights and suggestions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center">
              <Button
                onClick={toggleListening}
                size="lg"
                variant={isListening ? "destructive" : "default"}
                className="flex items-center gap-2"
              >
                {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                {isListening ? 'Stop Listening' : 'Start Listening'}
              </Button>
            </div>
            
            {isListening && (
              <Alert>
                <Mic className="h-4 w-4" />
                <AlertDescription>
                  Listening to your call... AI insights will appear on the right as the conversation progresses.
                </AlertDescription>
              </Alert>
            )}

            <div>
              <label className="text-sm font-medium mb-2 block">Quick Notes</label>
              <Textarea
                placeholder="Jot down key points during the call..."
                value={callNotes}
                onChange={(e) => setCallNotes(e.target.value)}
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Real-time Insights */}
        <Card>
          <CardHeader>
            <CardTitle>Real-time Insights</CardTitle>
            <CardDescription>
              AI-powered suggestions based on conversation analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {currentInsights.map((insight, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${getInsightColor(insight.type)}`}
                >
                  <div className="flex items-start gap-2 mb-2">
                    {getInsightIcon(insight.type)}
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{insight.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{insight.message}</p>
                    </div>
                  </div>
                  {insight.action && (
                    <div className="mt-2">
                      <Badge variant="secondary" className="text-xs">
                        💡 {insight.action}
                      </Badge>
                    </div>
                  )}
                </div>
              ))}
              
              {currentInsights.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Start listening to see AI insights</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common actions to take during or after calls
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button variant="outline" size="sm">
              Generate Quote
            </Button>
            <Button variant="outline" size="sm">
              Schedule Follow-up
            </Button>
            <Button variant="outline" size="sm">
              Send Resources
            </Button>
            <Button variant="outline" size="sm">
              Transfer to Manager
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}