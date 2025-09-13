import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Presentation, 
  FileText, 
  Download, 
  ExternalLink, 
  Settings, 
  Check,
  AlertCircle,
  Zap,
  Image
} from 'lucide-react';
import { gammaAPI } from '@/services/gammaAPI';
import { toast } from 'sonner';

interface GammaIntegrationProps {
  quoteData?: any;
  callNotes?: string;
  customerInfo?: any;
}

export function GammaIntegration({ quoteData, callNotes, customerInfo }: GammaIntegrationProps) {
  const [apiKey, setApiKey] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<any[]>([]);
  const [usageStats, setUsageStats] = useState<any>(null);

  // Check configuration on mount
  useEffect(() => {
    const configured = gammaAPI.isConfigured();
    setIsConfigured(configured);
    if (configured) {
      setApiKey(gammaAPI.getApiKey() || '');
      loadUsageStats();
    }
  }, []);

  const loadUsageStats = async () => {
    try {
      const stats = await gammaAPI.getUsageStats();
      setUsageStats(stats);
    } catch (error) {
      console.error('Failed to load usage stats:', error);
    }
  };

  const configureGamma = async () => {
    if (!apiKey.trim()) {
      toast.error('Please enter your Gamma API key');
      return;
    }

    try {
      gammaAPI.setApiKey(apiKey.trim());
      const isValid = await gammaAPI.validateConnection();
      
      if (isValid) {
        setIsConfigured(true);
        await loadUsageStats();
        toast.success('Gamma API configured successfully!');
      } else {
        setIsConfigured(false);
        toast.error('Invalid API key. Please check and try again.');
      }
    } catch (error) {
      toast.error('Failed to validate Gamma API key');
      console.error('Gamma configuration error:', error);
    }
  };

  const generateQuoteDocument = async () => {
    if (!quoteData) {
      toast.error('No quote data available');
      return;
    }

    setIsGenerating(true);
    try {
      const result = await gammaAPI.generateQuoteDocument(quoteData);
      setGeneratedContent(prev => [result, ...prev]);
      toast.success('Professional quote document generated!');
    } catch (error) {
      toast.error('Failed to generate quote document');
      console.error('Quote generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateSalesProposal = async () => {
    if (!customerInfo) {
      toast.error('Customer information required for proposal');
      return;
    }

    setIsGenerating(true);
    try {
      const proposalData = {
        customerName: customerInfo.company || 'Valued Customer',
        industry: customerInfo.industry || 'Technology',
        challenges: [
          'Improve operational efficiency',
          'Reduce costs and increase ROI',
          'Scale business operations'
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
        pricing: quoteData?.total || 25000,
        timeline: '30-60 days implementation'
      };

      const result = await gammaAPI.generateSalesProposal(proposalData);
      setGeneratedContent(prev => [result, ...prev]);
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
      const result = await gammaAPI.generateTrainingMaterial(trainingData);
      setGeneratedContent(prev => [result, ...prev]);
      toast.success('Training materials generated!');
    } catch (error) {
      toast.error('Failed to generate training materials');
      console.error('Training generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateCustomPresentation = async (title: string, content: string, theme: string) => {
    if (!title.trim() || !content.trim()) {
      toast.error('Please provide title and content');
      return;
    }

    setIsGenerating(true);
    try {
      const result = await gammaAPI.generatePresentation({
        title,
        content,
        theme: theme as any,
        format: 'presentation',
        pages: 8
      });
      setGeneratedContent(prev => [result, ...prev]);
      toast.success('Custom presentation generated!');
    } catch (error) {
      toast.error('Failed to generate presentation');
      console.error('Custom generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isConfigured) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Presentation className="h-5 w-5" />
            Gamma AI Integration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Settings className="h-4 w-4" />
            <AlertDescription>
              Configure your Gamma API key to generate professional presentations and documents.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-2 block">Gamma API Key</label>
              <Input
                type="password"
                placeholder="Enter your Gamma API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>
            <Button onClick={configureGamma} className="w-full">
              <Settings className="h-4 w-4 mr-2" />
              Configure Gamma Integration
            </Button>
          </div>
          
          <div className="text-sm text-muted-foreground">
            <p>Get your API key from <a href="https://gamma.app/api" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">gamma.app/api</a></p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Presentation className="h-5 w-5" />
            Gamma AI Content Generation
            <Badge variant="secondary" className="ml-2">
              <Check className="h-3 w-3 mr-1" />
              Connected
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Usage Stats */}
            {usageStats && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold">{usageStats.generationsThisMonth}</div>
                  <div className="text-sm text-muted-foreground">Used This Month</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{usageStats.generationsRemaining}</div>
                  <div className="text-sm text-muted-foreground">Remaining</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium">{usageStats.planType}</div>
                  <div className="text-sm text-muted-foreground">Plan Type</div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                onClick={generateQuoteDocument}
                disabled={isGenerating || !quoteData}
                className="h-20 flex flex-col gap-2"
              >
                <FileText className="h-6 w-6" />
                <span className="text-sm">Generate Quote Document</span>
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
                <Image className="h-6 w-6" />
                <span className="text-sm">Training Materials</span>
              </Button>
            </div>

            {/* Custom Generation */}
            <CustomPresentationForm
              onGenerate={generateCustomPresentation}
              isGenerating={isGenerating}
            />
          </div>
        </CardContent>
      </Card>

      {/* Generated Content */}
      {generatedContent.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Content</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {generatedContent.map((content, index) => (
                <div key={content.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Presentation className="h-5 w-5 text-primary" />
                    <div>
                      <h4 className="font-medium">{content.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        Generated {new Date(content.generatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={content.status === 'completed' ? 'default' : 'secondary'}>
                      {content.status}
                    </Badge>
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
      )}
    </div>
  );
}

interface CustomPresentationFormProps {
  onGenerate: (title: string, content: string, theme: string) => void;
  isGenerating: boolean;
}

function CustomPresentationForm({ onGenerate, isGenerating }: CustomPresentationFormProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [theme, setTheme] = useState('professional');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate(title, content, theme);
    setTitle('');
    setContent('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg">
      <h4 className="font-medium">Create Custom Presentation</h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-1 block">Title</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Presentation title"
          />
        </div>
        
        <div>
          <label className="text-sm font-medium mb-1 block">Theme</label>
          <Select value={theme} onValueChange={setTheme}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="professional">Professional</SelectItem>
              <SelectItem value="modern">Modern</SelectItem>
              <SelectItem value="creative">Creative</SelectItem>
              <SelectItem value="minimal">Minimal</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div>
        <label className="text-sm font-medium mb-1 block">Content</label>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Describe what you want in your presentation..."
          rows={4}
        />
      </div>
      
      <Button
        type="submit"
        disabled={isGenerating || !title.trim() || !content.trim()}
        className="w-full"
      >
        <Zap className="h-4 w-4 mr-2" />
        {isGenerating ? 'Generating...' : 'Generate Custom Presentation'}
      </Button>
    </form>
  );
}