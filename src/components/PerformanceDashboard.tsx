import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Clock, Target, MessageSquare } from 'lucide-react';

interface KPIData {
  responseTime: number;
  pitchQuality: number;
  quotesSent: number;
  conversionRate: number;
}

interface PerformanceDashboardProps {
  userKPIs: KPIData;
  teamAverage: KPIData;
  period: 'daily' | 'weekly' | 'monthly';
}

export function PerformanceDashboard({ 
  userKPIs = { responseTime: 2.5, pitchQuality: 85, quotesSent: 12, conversionRate: 18 },
  teamAverage = { responseTime: 3.2, pitchQuality: 75, quotesSent: 8, conversionRate: 15 },
  period = 'daily' 
}: PerformanceDashboardProps) {
  const getPerformanceColor = (userValue: number, teamValue: number, higherIsBetter = true) => {
    const isAboveAverage = higherIsBetter ? userValue > teamValue : userValue < teamValue;
    return isAboveAverage ? 'text-green-500' : 'text-orange-500';
  };

  const getProgressValue = (userValue: number, teamValue: number, higherIsBetter = true) => {
    const ratio = higherIsBetter ? userValue / teamValue : teamValue / userValue;
    return Math.min(Math.max(ratio * 50, 20), 100);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Performance Dashboard</h2>
        <p className="text-muted-foreground">Track your key sales metrics and compare with team averages</p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Response Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getPerformanceColor(userKPIs.responseTime, teamAverage.responseTime, false)}`}>
                  {userKPIs.responseTime}m
                </div>
                <Progress value={getProgressValue(userKPIs.responseTime, teamAverage.responseTime, false)} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  Team avg: {teamAverage.responseTime}m
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pitch Quality</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getPerformanceColor(userKPIs.pitchQuality, teamAverage.pitchQuality)}`}>
                  {userKPIs.pitchQuality}%
                </div>
                <Progress value={userKPIs.pitchQuality} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  Team avg: {teamAverage.pitchQuality}%
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Quotes Sent</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getPerformanceColor(userKPIs.quotesSent, teamAverage.quotesSent)}`}>
                  {userKPIs.quotesSent}
                </div>
                <Progress value={getProgressValue(userKPIs.quotesSent, teamAverage.quotesSent)} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  Team avg: {teamAverage.quotesSent}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getPerformanceColor(userKPIs.conversionRate, teamAverage.conversionRate)}`}>
                  {userKPIs.conversionRate}%
                </div>
                <Progress value={userKPIs.conversionRate} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  Team avg: {teamAverage.conversionRate}%
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Performance Summary</CardTitle>
              <CardDescription>Your performance compared to team averages</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Above Average Metrics</span>
                  <Badge variant="secondary">
                    {[
                      userKPIs.responseTime < teamAverage.responseTime,
                      userKPIs.pitchQuality > teamAverage.pitchQuality,
                      userKPIs.quotesSent > teamAverage.quotesSent,
                      userKPIs.conversionRate > teamAverage.conversionRate
                    ].filter(Boolean).length}/4
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  Focus areas: Consistent performance across all metrics leads to higher conversion rates.
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
              <CardDescription>Track your improvement over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Performance trend charts will be available once you start using the system regularly.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="goals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Goals</CardTitle>
              <CardDescription>Set and track your targets</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Response Time Goal</span>
                  <Badge variant="outline">&lt; 2 minutes</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Pitch Quality Goal</span>
                  <Badge variant="outline">&gt; 90%</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Daily Quotes Goal</span>
                  <Badge variant="outline">&gt; 15 quotes</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Conversion Rate Goal</span>
                  <Badge variant="outline">&gt; 20%</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}