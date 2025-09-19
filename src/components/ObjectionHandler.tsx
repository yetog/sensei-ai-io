import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Copy, ThumbsUp, ThumbsDown, MessageCircle, TrendingUp, AlertCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { knowledgeBaseService } from '@/services/knowledgeBaseService';
import { useToast } from '@/components/ui/use-toast';

interface Objection {
  id: string;
  category: 'pricing' | 'product' | 'timing' | 'authority' | 'trust' | 'competition';
  objection: string;
  response: string;
  context: string;
  success_rate: number;
  agentType: 'outbound' | 'retention' | 'telesales' | 'any';
  product: string;
  lastUsed: string;
}

interface FeedbackDialogProps {
  objection: Objection;
  onSubmit: (helpful: boolean, reason?: string, note?: string) => void;
}

function FeedbackDialog({ objection, onSubmit }: FeedbackDialogProps) {
  const [reason, setReason] = useState<string>('');
  const [note, setNote] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = (helpful: boolean) => {
    onSubmit(helpful, reason || undefined, note || undefined);
    setIsOpen(false);
    setReason('');
    setNote('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="ml-2">
          Feedback
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Was this objection response helpful?</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
            <strong>Objection:</strong> {objection.objection}
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={() => handleSubmit(true)}
              className="flex-1"
              variant="default"
            >
              <ThumbsUp className="w-4 h-4 mr-2" />
              Helpful
            </Button>
            <Button 
              onClick={() => handleSubmit(false)}
              className="flex-1"
              variant="destructive"
            >
              <ThumbsDown className="w-4 h-4 mr-2" />
              Not Helpful
            </Button>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Why? (optional)</label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="clear">Clear and effective</SelectItem>
                <SelectItem value="off-topic">Off-topic response</SelectItem>
                <SelectItem value="outdated">Outdated information</SelectItem>
                <SelectItem value="too-long">Too lengthy</SelectItem>
                <SelectItem value="missing-context">Missing context</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Additional notes (optional)</label>
            <Textarea 
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Any specific feedback or suggestions..."
              rows={3}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ObjectionHandler() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedAgentType, setSelectedAgentType] = useState<string>('all');
  const [objections, setObjections] = useState<Objection[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Load objections from knowledge base
    const loadedObjections = knowledgeBaseService.getExpandedObjections() as Objection[];
    setObjections(loadedObjections);
    
    // Load analytics
    const analyticsData = knowledgeBaseService.getUsageAnalytics();
    setAnalytics(analyticsData);
  }, []);

  const categories = [
    { value: 'all', label: 'All Objections' },
    { value: 'pricing', label: 'Pricing' },
    { value: 'product', label: 'Product' },
    { value: 'timing', label: 'Timing' },
    { value: 'authority', label: 'Authority' },
    { value: 'trust', label: 'Trust' }
  ];

  const agentTypes = [
    { value: 'all', label: 'All Agents' },
    { value: 'outbound', label: 'Outbound' },
    { value: 'retention', label: 'Retention' },
    { value: 'telesales', label: 'Telesales' }
  ];

  const filteredObjections = objections.filter(obj => {
    const matchesSearch = obj.objection.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         obj.response.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || obj.category === selectedCategory;
    const matchesAgentType = selectedAgentType === 'all' || obj.agentType === selectedAgentType || obj.agentType === 'any';
    return matchesSearch && matchesCategory && matchesAgentType;
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "Response text copied successfully",
      duration: 2000,
    });
  };

  const handleFeedback = (objectionId: string, helpful: boolean, reason?: string, note?: string) => {
    knowledgeBaseService.saveObjectionFeedback({
      objectionId,
      helpful,
      reason: reason as any,
      note,
      agentId: `current-agent-${selectedAgentType}`,
      timestamp: new Date().toISOString()
    });

    // Refresh analytics
    const updatedAnalytics = knowledgeBaseService.getUsageAnalytics();
    setAnalytics(updatedAnalytics);

    toast({
      title: helpful ? "Thanks for the feedback!" : "Feedback received",
      description: helpful ? "This helps us improve our suggestions" : "We'll work on improving this response",
      duration: 3000,
    });
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      pricing: 'bg-red-100 text-red-800',
      product: 'bg-blue-100 text-blue-800',
      timing: 'bg-yellow-100 text-yellow-800',
      authority: 'bg-purple-100 text-purple-800',
      trust: 'bg-green-100 text-green-800'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold mb-2">Objection Handler</h2>
          <p className="text-muted-foreground">Real IONOS objections with proven responses</p>
        </div>
        {analytics && (
          <div className="flex gap-4 text-sm">
            <div className="text-center">
              <div className="font-bold text-lg">{analytics.totalQueries}</div>
              <div className="text-muted-foreground">Total Uses</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-lg text-green-600">{analytics.averageHelpfulRate}%</div>
              <div className="text-muted-foreground">Helpful Rate</div>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search objections and responses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Select value={selectedAgentType} onValueChange={setSelectedAgentType}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {agentTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-auto">
            <TabsList className="grid grid-cols-3 lg:grid-cols-6">
              {categories.map((category) => (
                <TabsTrigger key={category.value} value={category.value} className="text-xs">
                  {category.label.split(' ')[0]}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredObjections.map((objection) => (
          <Card key={objection.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <CardTitle className="text-lg">{objection.objection}</CardTitle>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={getCategoryColor(objection.category)}>
                      {objection.category}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      <ThumbsUp className="w-3 h-3 mr-1" />
                      {objection.success_rate}% success
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {objection.agentType}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {objection.product}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyToClipboard(objection.response)}
                    title="Copy response"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <FeedbackDialog 
                    objection={objection}
                    onSubmit={(helpful, reason, note) => handleFeedback(objection.id, helpful, reason, note)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium mb-1">Recommended Response:</h4>
                  <p className="text-sm leading-relaxed">{objection.response}</p>
                </div>
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center">
                      <MessageCircle className="inline w-3 h-3 mr-1" />
                      {objection.context}
                    </span>
                    <span className="flex items-center">
                      <TrendingUp className="inline w-3 h-3 mr-1" />
                      Last used: {new Date(objection.lastUsed).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredObjections.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No objections found matching your search.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}