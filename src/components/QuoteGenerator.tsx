import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { quoteGenerator } from '@/services/quoteGenerator';
import { toast } from 'sonner';
import { FileText, Download, DollarSign, Clock } from 'lucide-react';

interface QuoteGeneratorProps {
  onQuoteGenerated?: (quote: any) => void;
}

export const QuoteGenerator: React.FC<QuoteGeneratorProps> = ({ onQuoteGenerated }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQuote, setGeneratedQuote] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    company: '',
    industry: '',
    size: '',
    needs: [] as string[],
    products: [] as string[],
    budget: '',
    timeline: '',
    additionalNotes: ''
  });

  const industries = [
    'Technology', 'Healthcare', 'Finance', 'Retail', 'Manufacturing',
    'Education', 'Real Estate', 'Consulting', 'Other'
  ];

  const companySizes = [
    'Startup (1-10 employees)',
    'Small Business (11-50 employees)', 
    'Medium Business (51-200 employees)',
    'Enterprise (200+ employees)'
  ];

  const availableProducts = [
    'CRM Software', 'Sales Analytics', 'Marketing Automation',
    'Training Program', 'Consulting Services', 'Data Integration', 'Support Package'
  ];

  const commonNeeds = [
    'Lead Generation', 'Sales Process Optimization', 'Customer Retention',
    'Data Analytics', 'Team Training', 'Automation', 'Integration'
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleArrayItem = (field: 'needs' | 'products', item: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(item)
        ? prev[field].filter(i => i !== item)
        : [...prev[field], item]
    }));
  };

  const generateQuote = async () => {
    if (!formData.company || !formData.industry || formData.products.length === 0) {
      toast.error('Please fill in company, industry, and select at least one product');
      return;
    }

    setIsGenerating(true);
    try {
      const quote = await quoteGenerator.generateQuote({
        customerInfo: {
          company: formData.company,
          industry: formData.industry,
          size: formData.size,
          needs: formData.needs
        },
        products: formData.products,
        budget: formData.budget,
        timeline: formData.timeline,
        additionalNotes: formData.additionalNotes
      });

      setGeneratedQuote(quote);
      onQuoteGenerated?.(quote);
      toast.success('Quote generated successfully!');
    } catch (error) {
      console.error('Quote generation error:', error);
      toast.error('Failed to generate quote');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadQuote = async () => {
    if (!generatedQuote) return;

    try {
      const blob = await quoteGenerator.exportQuoteToPDF(generatedQuote);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `quote-${generatedQuote.id}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Quote downloaded!');
    } catch (error) {
      toast.error('Failed to download quote');
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            AI Quote Generator
          </h3>
          <p className="text-muted-foreground">Generate professional sales quotes using AI analysis</p>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Company Name *</label>
              <Input
                value={formData.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
                placeholder="Acme Corporation"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Industry *</label>
              <Select value={formData.industry} onValueChange={(value) => handleInputChange('industry', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  {industries.map(industry => (
                    <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Company Size</label>
              <Select value={formData.size} onValueChange={(value) => handleInputChange('size', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select company size" />
                </SelectTrigger>
                <SelectContent>
                  {companySizes.map(size => (
                    <SelectItem key={size} value={size}>{size}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Timeline</label>
              <Input
                value={formData.timeline}
                onChange={(e) => handleInputChange('timeline', e.target.value)}
                placeholder="e.g., 30 days, Q1 2024"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Customer Needs</label>
            <div className="flex flex-wrap gap-2">
              {commonNeeds.map(need => (
                <Badge
                  key={need}
                  variant={formData.needs.includes(need) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleArrayItem('needs', need)}
                >
                  {need}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Products/Services *</label>
            <div className="flex flex-wrap gap-2">
              {availableProducts.map(product => (
                <Badge
                  key={product}
                  variant={formData.products.includes(product) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleArrayItem('products', product)}
                >
                  {product}
                </Badge>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Budget Range</label>
              <Input
                value={formData.budget}
                onChange={(e) => handleInputChange('budget', e.target.value)}
                placeholder="e.g., $10,000 - $50,000"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Additional Notes</label>
              <Input
                value={formData.additionalNotes}
                onChange={(e) => handleInputChange('additionalNotes', e.target.value)}
                placeholder="Special requirements, preferences..."
              />
            </div>
          </div>

          <Button 
            onClick={generateQuote}
            disabled={isGenerating}
            className="w-full"
          >
            <DollarSign className="w-4 h-4 mr-2" />
            {isGenerating ? 'Generating Quote...' : 'Generate AI Quote'}
          </Button>
        </div>
      </Card>

      {generatedQuote && (
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Generated Quote</h3>
            <div className="flex items-center gap-2">
              <Badge variant="outline">#{generatedQuote.id}</Badge>
              <Button variant="outline" size="sm" onClick={downloadQuote}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
              <div>
                <h4 className="font-medium mb-2">Customer Information</h4>
                <p className="text-sm text-muted-foreground">
                  <strong>Company:</strong> {generatedQuote.customerInfo.company}<br />
                  <strong>Industry:</strong> {generatedQuote.customerInfo.industry}<br />
                  <strong>Size:</strong> {generatedQuote.customerInfo.size}
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Quote Details</h4>
                <p className="text-sm text-muted-foreground">
                  <strong>Valid Until:</strong> {new Date(generatedQuote.validUntil).toLocaleDateString()}<br />
                  <strong>Created:</strong> {new Date(generatedQuote.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Quote Items</h4>
              <div className="space-y-2">
                {generatedQuote.items.map((item: any, index: number) => (
                  <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <h5 className="font-medium">{item.product}</h5>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${item.total.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.quantity} x ${item.unitPrice.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${generatedQuote.subtotal.toLocaleString()}</span>
              </div>
              {generatedQuote.discount && (
                <div className="flex justify-between text-green-600">
                  <span>Discount:</span>
                  <span>-${generatedQuote.discount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-semibold">
                <span>Total:</span>
                <span>${generatedQuote.total.toLocaleString()}</span>
              </div>
            </div>

            {generatedQuote.notes && (
              <div className="p-4 bg-primary/5 rounded-lg">
                <h4 className="font-medium mb-2">AI Recommendations</h4>
                <p className="text-sm text-muted-foreground">{generatedQuote.notes}</p>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};