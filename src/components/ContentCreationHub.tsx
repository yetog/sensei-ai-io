import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { QuoteGenerator } from '@/components/QuoteGenerator';
import { gammaAPIv2 } from '@/services/gammaAPIv2';
import { 
  FileText, 
  Presentation, 
  Zap, 
  Download,
  ExternalLink,
  Sparkles,
  TrendingUp,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';

interface ContentCreationHubProps {
  quoteData?: any;
  callNotes?: string;
  customerInfo?: any;
  className?: string;
}

export function ContentCreationHub({ 
  quoteData, 
  callNotes = '', 
  customerInfo,
  className = '' 
}: ContentCreationHubProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<any[]>([]);
  const [lastGeneratedQuote, setLastGeneratedQuote] = useState<any>(null);
  const [contentStats, setContentStats] = useState({
    totalGenerated: 0,
    quotesCreated: 0,
    proposalsGenerated: 0,
    downloadsToday: 0
  });

  // Load generated content from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('generated_content');
    if (saved) {
      try {
        const content = JSON.parse(saved);
        setGeneratedContent(content);
        setContentStats({
          totalGenerated: content.length,
          quotesCreated: content.filter((c: any) => c.type === 'quote').length,
          proposalsGenerated: content.filter((c: any) => c.type === 'proposal').length,
          downloadsToday: content.filter((c: any) => 
            new Date(c.generatedAt).toDateString() === new Date().toDateString()
          ).length
        });
      } catch (error) {
        console.error('Failed to load generated content:', error);
      }
    }
  }, []);

  // Save content to localStorage
  const saveContent = (content: any, type: string) => {
    const newContent = { ...content, type, contextData: { quoteData, customerInfo, callNotes } };
    const updated = [newContent, ...generatedContent];
    setGeneratedContent(updated);
    localStorage.setItem('generated_content', JSON.stringify(updated));
    
    // Update stats
    setContentStats(prev => ({
      ...prev,
      totalGenerated: prev.totalGenerated + 1,
      quotesCreated: type === 'quote' ? prev.quotesCreated + 1 : prev.quotesCreated,
      proposalsGenerated: type === 'proposal' ? prev.proposalsGenerated + 1 : prev.proposalsGenerated,
      downloadsToday: prev.downloadsToday + 1
    }));
  };

  const generateQuoteDocument = async () => {
    if (!lastGeneratedQuote) {
      toast.error('Please generate a quote first');
      return;
    }

    setIsGenerating(true);
    try {
      const result = await gammaAPIv2.generateQuoteDocument(lastGeneratedQuote);
      saveContent(result, 'quote');
      toast.success('Professional quote document generated!');
    } catch (error) {
      toast.error('Failed to generate quote document');
      console.error('Quote generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateSalesProposal = async () => {
    const proposalData = {
      customerName: customerInfo?.company || lastGeneratedQuote?.customerName || 'Valued Customer',
      industry: customerInfo?.industry || 'Technology',
      challenges: [
        'Improve operational efficiency',
        'Reduce costs and increase ROI',
        'Scale business operations effectively'
      ],
      solutions: [
        'Advanced automation platform',
        'Integrated analytics dashboard',
        'Expert consultation services'
      ],
      benefits: [
        '30% efficiency improvement',
        'ROI within 6 months',
        '24/7 expert support'
      ],
      pricing: lastGeneratedQuote?.total || 25000,
      timeline: '30-60 days implementation'
    };

    setIsGenerating(true);
    try {
      const result = await gammaAPIv2.generateSalesProposal(proposalData);
      saveContent(result, 'proposal');
      toast.success('Sales proposal presentation generated!');
    } catch (error) {
      toast.error('Failed to generate sales proposal');
      console.error('Proposal generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateTrainingMaterial = async () => {
    const trainingData = {
      title: 'Sales Excellence Training',
      topics: [
        'Consultative Selling Techniques',
        'Objection Handling Mastery',
        'Closing Strategies',
        'Customer Relationship Building'
      ],
      objectives: [
        'Master consultative selling approach',
        'Handle common objections effectively',
        'Increase close rates by 25%',
        'Build stronger customer relationships'
      ],
      content: callNotes || 'Comprehensive sales training based on real call data and best practices.'
    };

    setIsGenerating(true);
    try {
      const result = await gammaAPIv2.generateTrainingMaterial(trainingData);
      saveContent(result, 'training');
      toast.success('Training materials generated!');
    } catch (error) {
      toast.error('Failed to generate training materials');
      console.error('Training generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateCallAnalysis = async () => {
    if (!callNotes) {
      toast.error('No call notes available for analysis');
      return;
    }

    const callData = {
      transcript: callNotes,
      duration: '15:30',
      participant: 'Sales Rep',
      insights: [
        { title: 'Strong Engagement', description: 'Customer showed high interest in product features' },
        { title: 'Price Sensitivity', description: 'Multiple cost-related questions raised' }
      ],
      recommendations: ['Follow up within 24 hours', 'Provide ROI calculator', 'Address pricing concerns'],
      nextActions: ['Send proposal', 'Schedule demo', 'Update CRM']
    };

    setIsGenerating(true);
    try {
      const result = await gammaAPIv2.generateCallAnalysisReport(callData);
      saveContent(result, 'analysis');
      toast.success('Call analysis report generated!');
    } catch (error) {
      toast.error('Failed to generate call analysis');
      console.error('Analysis generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Content Creation Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Total Generated
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-1">{contentStats.totalGenerated}</div>
            <div className="text-sm text-muted-foreground">All time</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Quotes Created
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-1">{contentStats.quotesCreated}</div>
            <div className="text-sm text-muted-foreground">Professional docs</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Presentation className="h-4 w-4 text-primary" />
              Proposals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-1">{contentStats.proposalsGenerated}</div>
            <div className="text-sm text-muted-foreground">Sales presentations</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-1 text-green-600">94%</div>
            <div className="text-sm text-muted-foreground">Generation success</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            AI-Powered Content Generation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              onClick={generateQuoteDocument}
              disabled={isGenerating || !lastGeneratedQuote}
              className="h-20 flex flex-col gap-2"
            >
              <FileText className="h-6 w-6" />
              <span className="text-sm">Quote Document</span>
            </Button>
            
            <Button
              onClick={generateSalesProposal}
              disabled={isGenerating}
              variant="outline"
              className="h-20 flex flex-col gap-2"
            >
              <Presentation className="h-6 w-6" />
              <span className="text-sm">Sales Proposal</span>
            </Button>
            
            <Button
              onClick={generateTrainingMaterial}
              disabled={isGenerating}
              variant="outline"
              className="h-20 flex flex-col gap-2"
            >
              <Sparkles className="h-6 w-6" />
              <span className="text-sm">Training Materials</span>
            </Button>

            <Button
              onClick={generateCallAnalysis}
              disabled={isGenerating || !callNotes}
              variant="outline"
              className="h-20 flex flex-col gap-2"
            >
              <TrendingUp className="h-6 w-6" />
              <span className="text-sm">Call Analysis</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="quotes" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="quotes">Quote Generator</TabsTrigger>
          <TabsTrigger value="generated">Generated Content</TabsTrigger>
        </TabsList>

        <TabsContent value="quotes" className="mt-6">
          <QuoteGenerator 
            onQuoteGenerated={(quote) => {
              setLastGeneratedQuote(quote);
              toast.success('Quote generated successfully!');
            }}
          />
        </TabsContent>

        <TabsContent value="generated" className="mt-6">
          {generatedContent.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Generated Content Library</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {generatedContent.map((content, index) => (
                    <div key={content.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          {content.type === 'quote' && <FileText className="h-5 w-5 text-primary" />}
                          {content.type === 'proposal' && <Presentation className="h-5 w-5 text-primary" />}
                          {content.type === 'training' && <Sparkles className="h-5 w-5 text-primary" />}
                          {content.type === 'analysis' && <TrendingUp className="h-5 w-5 text-primary" />}
                        </div>
                        <div>
                          <h4 className="font-medium">{content.title}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {content.type}
                            </Badge>
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(content.generatedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={content.status === 'completed' ? 'default' : 'secondary'}>
                          {content.status}
                        </Badge>
                        {content.downloadUrls && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(content.downloadUrls.pdf || content.downloadUrls.pptx, '_blank')}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(content.url, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Open
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No content generated yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Start by generating a quote or creating a sales proposal
                </p>
                <Button onClick={() => {
                  const quotesTab = document.querySelector('[value="quotes"]') as HTMLElement;
                  quotesTab?.click();
                }}>
                  Create Your First Quote
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}