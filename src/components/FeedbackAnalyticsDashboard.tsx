import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TrendingUp, TrendingDown, Brain, Target, BarChart3, Trash2 } from 'lucide-react';
import { feedbackLearning, type SuggestionFeedback, type LearningPattern } from '@/services/feedbackLearning';

interface FeedbackAnalyticsDashboardProps {
  isVisible: boolean;
  onClose: () => void;
}

export const FeedbackAnalyticsDashboard: React.FC<FeedbackAnalyticsDashboardProps> = ({
  isVisible,
  onClose
}) => {
  const [feedbackData, setFeedbackData] = useState<SuggestionFeedback[]>([]);
  const [learningPatterns, setLearningPatterns] = useState<LearningPattern[]>([]);
  const [stats, setStats] = useState({ totalFeedback: 0, helpfulRate: 0, commonIssues: [] as string[] });

  useEffect(() => {
    if (isVisible) {
      loadFeedbackData();
    }
  }, [isVisible]);

  const loadFeedbackData = () => {
    try {
      const feedback = feedbackLearning.getAllFeedback();
      const patterns = feedbackLearning.getLearningPatterns();
      const statistics = feedbackLearning.getFeedbackStats();
      
      setFeedbackData(feedback);
      setLearningPatterns(patterns);
      setStats(statistics);
      
      console.log('📊 Feedback analytics loaded:', {
        feedback: feedback.length,
        patterns: patterns.length,
        helpfulRate: statistics.helpfulRate
      });
    } catch (error) {
      console.error('❌ Failed to load feedback data:', error);
    }
  };

  const clearAllData = () => {
    feedbackLearning.clearLearningData();
    loadFeedbackData();
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getSuggestionTypeColor = (type: string) => {
    const colors = {
      objection: 'bg-red-100 text-red-800',
      product_pitch: 'bg-blue-100 text-blue-800',
      closing: 'bg-green-100 text-green-800',
      retention: 'bg-purple-100 text-purple-800',
      general: 'bg-gray-100 text-gray-800'
    };
    return colors[type as keyof typeof colors] || colors.general;
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-4xl translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">AI Learning Analytics</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={clearAllData} className="text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Data
            </Button>
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Feedback</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalFeedback}</div>
              <p className="text-xs text-muted-foreground">suggestions rated</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Helpful Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold">{Math.round(stats.helpfulRate * 100)}%</div>
                {stats.helpfulRate > 0.7 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
              </div>
              <Progress value={stats.helpfulRate * 100} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Learning Patterns</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{learningPatterns.length}</div>
              <p className="text-xs text-muted-foreground">patterns learned</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="patterns" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="patterns">Learning Patterns</TabsTrigger>
            <TabsTrigger value="feedback">Recent Feedback</TabsTrigger>
            <TabsTrigger value="issues">Common Issues</TabsTrigger>
          </TabsList>

          <TabsContent value="patterns" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  AI Learning Patterns
                </CardTitle>
                <CardDescription>
                  Patterns the AI has learned from your feedback to improve future suggestions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  {learningPatterns.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      No learning patterns yet. Rate some suggestions to see AI learning in action!
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {learningPatterns.map((pattern, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">Pattern {index + 1}</Badge>
                              <span className="text-sm font-medium">
                                Confidence: {Math.round(pattern.confidence * 100)}%
                              </span>
                            </div>
                            <Badge variant="secondary">{pattern.frequency} uses</Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <h4 className="font-medium text-green-600 mb-1">✅ What Works</h4>
                              <div className="space-y-1">
                                {pattern.positivePatterns.slice(0, 2).map((positive, i) => (
                                  <p key={i} className="text-xs text-muted-foreground bg-green-50 p-2 rounded">
                                    {positive.substring(0, 100)}...
                                  </p>
                                ))}
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="font-medium text-red-600 mb-1">❌ What Doesn't</h4>
                              <div className="space-y-1">
                                {pattern.negativePatterns.slice(0, 2).map((negative, i) => (
                                  <p key={i} className="text-xs text-muted-foreground bg-red-50 p-2 rounded">
                                    {negative.substring(0, 100)}...
                                  </p>
                                ))}
                              </div>
                            </div>
                          </div>
                          
                          <div className="mt-2">
                            <h4 className="font-medium text-blue-600 mb-1">🔑 Keywords</h4>
                            <div className="flex flex-wrap gap-1">
                              {pattern.keywords.map((keyword, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {keyword}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="feedback" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Recent Feedback
                </CardTitle>
                <CardDescription>
                  Latest user feedback on AI coaching suggestions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  {feedbackData.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      No feedback data available. Start rating suggestions to see analytics!
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {feedbackData.slice(-20).reverse().map((feedback, index) => (
                        <div key={index} className="border rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Badge className={getSuggestionTypeColor(feedback.suggestionType)}>
                                {feedback.suggestionType}
                              </Badge>
                              <Badge variant={feedback.rating === 'helpful' ? 'default' : 'destructive'}>
                                {feedback.rating === 'helpful' ? '👍 Helpful' : '👎 Not Helpful'}
                              </Badge>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {formatTimestamp(feedback.timestamp)}
                            </span>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-2">
                            <strong>Suggestion:</strong> {feedback.suggestionText.substring(0, 150)}...
                          </p>
                          
                          <p className="text-xs text-muted-foreground">
                            <strong>Context:</strong> {feedback.context.substring(0, 100)}...
                          </p>
                          
                          {feedback.reason && (
                            <p className="text-xs text-orange-600 mt-1">
                              <strong>Reason:</strong> {feedback.reason}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="issues" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Common Issues</CardTitle>
                <CardDescription>
                  Most frequently reported problems with suggestions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {stats.commonIssues.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    No common issues identified yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {stats.commonIssues.map((issue, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                        <span className="text-sm">{issue}</span>
                        <Badge variant="outline">#{index + 1}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};