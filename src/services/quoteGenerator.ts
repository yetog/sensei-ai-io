import { ionosAI } from './ionosAI';

interface QuoteRequest {
  customerInfo: {
    company: string;
    industry: string;
    size: string;
    needs: string[];
  };
  products: string[];
  budget?: string;
  timeline?: string;
  additionalNotes?: string;
}

interface Quote {
  id: string;
  customerInfo: QuoteRequest['customerInfo'];
  items: QuoteItem[];
  subtotal: number;
  discount?: number;
  total: number;
  validUntil: Date;
  terms: string;
  notes: string;
  createdAt: Date;
}

interface QuoteItem {
  product: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export class QuoteGenerator {
  private static instance: QuoteGenerator;
  
  // Sample product catalog - in production this would come from a database
  private readonly productCatalog = {
    'CRM Software': { basePrice: 99, description: 'Customer relationship management platform' },
    'Sales Analytics': { basePrice: 149, description: 'Advanced sales performance analytics' },
    'Marketing Automation': { basePrice: 199, description: 'Automated marketing campaign management' },
    'Training Program': { basePrice: 2500, description: 'Comprehensive sales training program' },
    'Consulting Services': { basePrice: 250, description: 'Expert business consulting (per hour)' },
    'Data Integration': { basePrice: 499, description: 'Custom data integration setup' },
    'Support Package': { basePrice: 199, description: 'Premium support and maintenance' }
  };

  static getInstance(): QuoteGenerator {
    if (!QuoteGenerator.instance) {
      QuoteGenerator.instance = new QuoteGenerator();
    }
    return QuoteGenerator.instance;
  }

  async generateQuote(request: QuoteRequest): Promise<Quote> {
    // Use AI to analyze the request and suggest products
    const aiAnalysis = await this.getAIRecommendations(request);
    
    // Generate quote items based on AI recommendations and product catalog
    const items = this.createQuoteItems(request, aiAnalysis);
    
    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const discount = this.calculateDiscount(subtotal, request);
    const total = subtotal - (discount || 0);
    
    // Generate terms and conditions
    const terms = await this.generateTerms(request, total);
    
    return {
      id: this.generateQuoteId(),
      customerInfo: request.customerInfo,
      items,
      subtotal,
      discount,
      total,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      terms,
      notes: aiAnalysis.notes || '',
      createdAt: new Date()
    };
  }

  private async getAIRecommendations(request: QuoteRequest): Promise<any> {
    const prompt = `
Analyze this quote request and provide recommendations:

Customer: ${request.customerInfo.company}
Industry: ${request.customerInfo.industry}
Company Size: ${request.customerInfo.size}
Needs: ${request.customerInfo.needs.join(', ')}
Budget: ${request.budget || 'Not specified'}
Timeline: ${request.timeline || 'Not specified'}

Available Products:
${Object.entries(this.productCatalog).map(([name, info]) => 
  `- ${name}: $${info.basePrice} - ${info.description}`
).join('\n')}

Provide recommendations in JSON format:
{
  "recommendedProducts": [{"product": "name", "quantity": number, "reasoning": "why"}],
  "pricingStrategy": "volume/premium/competitive",
  "suggestedDiscount": number,
  "notes": "additional recommendations"
}
`;

    try {
      const response = await ionosAI.sendMessage([
        { role: 'user', content: prompt }
      ], 'Sales Agent');
      
      // Parse AI response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('AI analysis error:', error);
    }

    // Fallback recommendations
    return {
      recommendedProducts: request.products.map(p => ({ product: p, quantity: 1, reasoning: 'Customer requested' })),
      pricingStrategy: 'competitive',
      suggestedDiscount: 0,
      notes: 'Standard pricing applied'
    };
  }

  private createQuoteItems(request: QuoteRequest, aiAnalysis: any): QuoteItem[] {
    const items: QuoteItem[] = [];
    
    // Add recommended products
    aiAnalysis.recommendedProducts?.forEach((rec: any) => {
      const product = this.productCatalog[rec.product as keyof typeof this.productCatalog];
      if (product) {
        items.push({
          product: rec.product,
          description: product.description,
          quantity: rec.quantity || 1,
          unitPrice: this.calculatePricing(product.basePrice, request),
          total: (rec.quantity || 1) * this.calculatePricing(product.basePrice, request)
        });
      }
    });

    // Add any manually requested products not in AI recommendations
    request.products.forEach(productName => {
      if (!items.some(item => item.product === productName)) {
        const product = this.productCatalog[productName as keyof typeof this.productCatalog];
        if (product) {
          items.push({
            product: productName,
            description: product.description,
            quantity: 1,
            unitPrice: this.calculatePricing(product.basePrice, request),
            total: this.calculatePricing(product.basePrice, request)
          });
        }
      }
    });

    return items;
  }

  private calculatePricing(basePrice: number, request: QuoteRequest): number {
    let price = basePrice;
    
    // Company size adjustments
    switch (request.customerInfo.size.toLowerCase()) {
      case 'enterprise':
        price *= 1.5; // Enterprise premium
        break;
      case 'startup':
        price *= 0.8; // Startup discount
        break;
    }
    
    return Math.round(price);
  }

  private calculateDiscount(subtotal: number, request: QuoteRequest): number {
    let discount = 0;
    
    // Volume discounts
    if (subtotal > 10000) discount += subtotal * 0.15;
    else if (subtotal > 5000) discount += subtotal * 0.10;
    else if (subtotal > 2000) discount += subtotal * 0.05;
    
    // Startup discount
    if (request.customerInfo.size.toLowerCase() === 'startup') {
      discount += subtotal * 0.10;
    }
    
    return Math.round(discount);
  }

  private async generateTerms(request: QuoteRequest, total: number): Promise<string> {
    const baseTerms = `
Payment Terms: Net 30 days
Implementation: ${request.timeline || '2-4 weeks'}
Support: 90-day warranty included
Cancellation: 30-day notice required
    `.trim();
    
    return baseTerms;
  }

  private generateQuoteId(): string {
    return `QT-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  }

  async exportQuoteToPDF(quote: Quote): Promise<Blob> {
    // In a real implementation, you'd use a PDF generation library
    // For now, return a simple text representation
    const content = this.formatQuoteAsText(quote);
    return new Blob([content], { type: 'text/plain' });
  }

  private formatQuoteAsText(quote: Quote): string {
    return `
QUOTE ${quote.id}
Date: ${quote.createdAt.toLocaleDateString()}
Valid Until: ${quote.validUntil.toLocaleDateString()}

CUSTOMER INFORMATION:
Company: ${quote.customerInfo.company}
Industry: ${quote.customerInfo.industry}
Size: ${quote.customerInfo.size}

ITEMS:
${quote.items.map(item => 
  `${item.product} - ${item.description}
  Quantity: ${item.quantity} x $${item.unitPrice} = $${item.total}`
).join('\n\n')}

TOTALS:
Subtotal: $${quote.subtotal}
${quote.discount ? `Discount: -$${quote.discount}` : ''}
Total: $${quote.total}

TERMS:
${quote.terms}

NOTES:
${quote.notes}
    `.trim();
  }
}

export const quoteGenerator = QuoteGenerator.getInstance();