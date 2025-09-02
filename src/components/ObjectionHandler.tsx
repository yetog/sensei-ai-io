import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Copy, ThumbsUp, MessageCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Objection {
  id: string;
  category: 'pricing' | 'product' | 'timing' | 'authority' | 'trust';
  objection: string;
  response: string;
  context: string;
  success_rate: number;
}

const objections: Objection[] = [
  {
    id: '1',
    category: 'pricing',
    objection: "Your prices are too high",
    response: "I understand cost is important. Let me show you the ROI calculation - with our premium support and uptime guarantee, you'll actually save money in the long run. Plus, we can discuss a 36-month plan that locks in significant savings.",
    context: "Domain/hosting pricing concerns",
    success_rate: 85
  },
  {
    id: '2',
    category: 'pricing',
    objection: "GoDaddy is cheaper",
    response: "You're right that GoDaddy has lower initial prices, but let's compare the total cost of ownership. Our premium DNS, included SSL certificates, and 24/7 expert support often make us more cost-effective. Here's a direct comparison...",
    context: "Competitor pricing comparison",
    success_rate: 78
  },
  {
    id: '3',
    category: 'product',
    objection: "I'm not using my current hosting",
    response: "That's actually perfect timing! If you're not using your current hosting, we can help you get set up properly. Our migration team will handle everything, and I'll make sure you have the right resources to actually use what you're paying for.",
    context: "Unused services/retention",
    success_rate: 72
  },
  {
    id: '4',
    category: 'timing',
    objection: "I need to think about it",
    response: "I completely understand - this is an important decision. What specific aspects would you like to think through? I'm here to help clarify anything. Also, with economic uncertainty, locking in these rates now for 36 months gives you cost control.",
    context: "General hesitation",
    success_rate: 65
  },
  {
    id: '5',
    category: 'authority',
    objection: "I need to ask my boss/team",
    response: "That makes sense. Would it be helpful if I prepared a brief summary of our discussion and the proposal for you to share? I can also schedule a quick call with your team to answer any technical questions they might have.",
    context: "Decision maker not present",
    success_rate: 70
  },
  {
    id: '6',
    category: 'trust',
    objection: "I've had bad experiences with hosting companies",
    response: "I'm sorry to hear that, and I completely understand your hesitation. What specifically went wrong? Our approach is different - we assign dedicated account managers and have a 99.9% uptime guarantee. Let me share some customer success stories similar to your situation.",
    context: "Past negative experiences",
    success_rate: 68
  }
];

export function ObjectionHandler() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { value: 'all', label: 'All Objections' },
    { value: 'pricing', label: 'Pricing' },
    { value: 'product', label: 'Product' },
    { value: 'timing', label: 'Timing' },
    { value: 'authority', label: 'Authority' },
    { value: 'trust', label: 'Trust' }
  ];

  const filteredObjections = objections.filter(obj => {
    const matchesSearch = obj.objection.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         obj.response.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || obj.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
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
      <div>
        <h2 className="text-2xl font-bold mb-2">Objection Handler</h2>
        <p className="text-muted-foreground">Quick access to proven responses for common sales objections</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search objections..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full sm:w-auto">
          <TabsList className="grid grid-cols-3 sm:grid-cols-6">
            {categories.map((category) => (
              <TabsTrigger key={category.value} value={category.value} className="text-xs">
                {category.label.split(' ')[0]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="grid gap-4">
        {filteredObjections.map((objection) => (
          <Card key={objection.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{objection.objection}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge className={getCategoryColor(objection.category)}>
                      {objection.category}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      <ThumbsUp className="w-3 h-3 mr-1" />
                      {objection.success_rate}% success
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copyToClipboard(objection.response)}
                  className="shrink-0"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium mb-1">Recommended Response:</h4>
                  <p className="text-sm leading-relaxed">{objection.response}</p>
                </div>
                <div className="text-xs text-muted-foreground">
                  <MessageCircle className="inline w-3 h-3 mr-1" />
                  Context: {objection.context}
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