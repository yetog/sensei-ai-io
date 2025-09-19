interface KnowledgeBase {
  id: string;
  type: 'objection' | 'sales_flow' | 'product' | 'retention_matrix' | 'website_data';
  category: string;
  content: any;
  lastUpdated: string;
  source: string;
  version: number;
}

interface ObjectionFeedback {
  objectionId: string;
  helpful: boolean;
  reason?: 'clear' | 'off-topic' | 'outdated' | 'too-long' | 'missing-context';
  note?: string;
  agentId?: string;
  timestamp: string;
}

interface SalesFlow {
  product: string;
  pitch: string;
  whatIs: string;
  whoUses: string[];
  commonObjections: string[];
  suggestedResponses: string[];
  pricing: {
    basePrice: number;
    promoPrice?: number;
    discounts: Array<{ percent: number; condition: string }>;
  };
}

class KnowledgeBaseService {
  private static instance: KnowledgeBaseService;
  private readonly KNOWLEDGE_KEY = 'sensei:knowledge';
  private readonly FEEDBACK_KEY = 'sensei:feedback';

  static getInstance(): KnowledgeBaseService {
    if (!KnowledgeBaseService.instance) {
      KnowledgeBaseService.instance = new KnowledgeBaseService();
    }
    return KnowledgeBaseService.instance;
  }

  // Core IONOS sales flows from the meeting notes
  private getCoreSalesFlows(): SalesFlow[] {
    return [
      {
        product: 'Domain & Hosting Package',
        pitch: 'Complete online presence solution with premium DNS, SSL, and 24/7 support',
        whatIs: 'Professional domain registration with managed hosting, including security and performance optimization',
        whoUses: ['Small businesses', 'E-commerce stores', 'Professional services', 'Startups'],
        commonObjections: ['Too expensive', 'Already have hosting', 'GoDaddy is cheaper', 'Not technical enough'],
        suggestedResponses: [
          'Let me show you the total cost of ownership comparison with premium support included',
          'Perfect timing for an upgrade - our migration team handles everything seamlessly',
          'GoDaddy has lower initial prices, but we include premium DNS and SSL that they charge extra for',
          'That\'s exactly why we include 24/7 expert support and setup assistance'
        ],
        pricing: {
          basePrice: 299,
          promoPrice: 199,
          discounts: [
            { percent: 15, condition: '36-month commitment' },
            { percent: 10, condition: 'Multiple domains' }
          ]
        }
      },
      {
        product: 'Email Security Suite',
        pitch: 'Enterprise-grade email protection against threats, spam, and data breaches',
        whatIs: 'Advanced email filtering, encryption, and backup with compliance features',
        whoUses: ['Healthcare', 'Legal firms', 'Financial services', 'Any business handling sensitive data'],
        commonObjections: ['We use Gmail', 'Too complex', 'Not enough email volume', 'Budget constraints'],
        suggestedResponses: [
          'Gmail is great for basic email, but lacks the enterprise security and compliance features your industry requires',
          'Our solution integrates seamlessly with your existing email - no complexity added',
          'Even small volumes need protection - one breach costs far more than our annual fee',
          'Consider the cost of a single data breach versus this protection investment'
        ],
        pricing: {
          basePrice: 149,
          discounts: [
            { percent: 20, condition: 'Annual payment' },
            { percent: 25, condition: '50+ users' }
          ]
        }
      },
      {
        product: 'Dedicated Server Solutions',
        pitch: 'High-performance dedicated infrastructure with managed support and guaranteed uptime',
        whatIs: 'Fully managed dedicated servers with custom configurations and 24/7 monitoring',
        whoUses: ['Growing SaaS companies', 'E-commerce platforms', 'Media companies', 'Development teams'],
        commonObjections: ['Cloud is cheaper', 'Too much server for us', 'Maintenance concerns', 'Migration complexity'],
        suggestedResponses: [
          'Cloud costs scale unpredictably - dedicated gives you fixed costs and better performance',
          'We right-size the solution to your needs and you can scale up seamlessly',
          'That\'s exactly why we include full management - you focus on business, we handle the servers',
          'Our migration specialists make it seamless with zero downtime'
        ],
        pricing: {
          basePrice: 899,
          discounts: [
            { percent: 10, condition: '12-month contract' },
            { percent: 15, condition: '24-month contract' }
          ]
        }
      }
    ];
  }

  // Real objections from IONOS sales experience
  getExpandedObjections() {
    return [
      // Pricing objections (most common)
      {
        id: 'pricing-1',
        category: 'pricing',
        objection: "Your prices are too high compared to competitors",
        response: "I understand cost is important. Let me show you the total cost of ownership - with our premium DNS, included SSL certificates, and 24/7 expert support, you actually save money versus competitors who charge extra for these essentials. Plus, our 36-month plan locks in 15% savings.",
        context: "Domain/hosting pricing with competitor comparison",
        success_rate: 82,
        agentType: 'outbound' as const,
        product: 'Domain & Hosting',
        lastUsed: new Date().toISOString()
      },
      {
        id: 'pricing-2', 
        category: 'pricing',
        objection: "GoDaddy is significantly cheaper",
        response: "You're absolutely right about GoDaddy's initial pricing. However, let's look at year 2 and beyond - their renewal rates are often 300% higher. Our transparent pricing stays consistent, and we include premium features like advanced security and migration support that GoDaddy charges extra for.",
        context: "Direct GoDaddy comparison",
        success_rate: 76,
        agentType: 'outbound',
        product: 'Domain & Hosting',
        lastUsed: new Date().toISOString()
      },
      {
        id: 'pricing-3',
        category: 'pricing',
        objection: "We don't have budget for this right now",
        response: "I completely understand budget constraints. Let me ask - what's the cost to your business if your current solution fails or gets compromised? Our monthly payment option starts at just $16/month, which is often less than a single lunch. Can we explore a solution that fits your current budget?",
        context: "Budget constraints with payment options",
        success_rate: 68,
        agentType: 'retention',
        product: 'Any',
        lastUsed: new Date().toISOString()
      },

      // Product/Technical objections
      {
        id: 'product-1',
        category: 'product',
        objection: "We're already using our current hosting and it works fine",
        response: "That's great that it's working for you currently. Can I ask - how do you handle backups, security updates, and technical support when issues arise? Often clients don't realize the hidden costs and risks until they need help at 2 AM. Our managed approach prevents those emergencies.",
        context: "Satisfied with current solution",
        success_rate: 71,
        agentType: 'outbound',
        product: 'Hosting',
        lastUsed: new Date().toISOString()
      },
      {
        id: 'product-2',
        category: 'product', 
        objection: "This seems too technical for our team",
        response: "That's exactly why we include full setup and training with every package. You don't need to be technical - our team handles all the complex stuff. We'll have you up and running in 24 hours, and you'll have a dedicated support person who knows your account.",
        context: "Technical complexity concerns",
        success_rate: 85,
        agentType: 'outbound',
        product: 'Any',
        lastUsed: new Date().toISOString()
      },
      {
        id: 'product-3',
        category: 'product',
        objection: "We're not using our current hosting to its full potential",
        response: "Perfect! That tells me you're ready for a solution that matches how you actually work. Let's set up something you'll actually use. Our onboarding team will help you maximize the value from day one, and you'll have resources that grow with your business.",
        context: "Underutilizing current services",
        success_rate: 79,
        agentType: 'retention',
        product: 'Hosting',
        lastUsed: new Date().toISOString()
      },

      // Timing objections
      {
        id: 'timing-1',
        category: 'timing',
        objection: "We need to think about this decision",
        response: "Absolutely, this is an important decision for your business. What specific aspects would you like to think through? I'm here to address any concerns. Also, with market uncertainty, locking in these rates for 36 months gives you cost predictability - these promotional rates end this month.",
        context: "General hesitation with urgency",
        success_rate: 64,
        agentType: 'outbound',
        product: 'Any',
        lastUsed: new Date().toISOString()
      },
      {
        id: 'timing-2',
        category: 'timing',
        objection: "Our current contract doesn't expire for 6 months",
        response: "Great planning ahead! Many of our best clients started their transition early. We can set everything up now and time the migration perfectly with your contract end. This locks in current promotional pricing and gives us time to do the migration right - no rush, no downtime.",
        context: "Existing contract obligations",
        success_rate: 73,
        agentType: 'outbound',
        product: 'Any',
        lastUsed: new Date().toISOString()
      },

      // Authority objections
      {
        id: 'authority-1',
        category: 'authority',
        objection: "I need to run this by my boss/IT team",
        response: "That makes perfect sense - this affects the whole team. Would it help if I prepared a technical overview for your IT team and a business case summary for your boss? I can also join a brief call with them to answer any questions directly.",
        context: "Multiple decision makers",
        success_rate: 78,
        agentType: 'outbound',
        product: 'Any',
        lastUsed: new Date().toISOString()
      },
      {
        id: 'authority-2',
        category: 'authority',
        objection: "The decision maker isn't available right now",
        response: "No problem at all. When would be the best time to connect with them? In the meantime, I can send you a summary of our discussion and the proposal so you have everything you need for that conversation. Would tomorrow afternoon or Thursday morning work better?",
        context: "Decision maker availability",
        success_rate: 69,
        agentType: 'outbound',
        product: 'Any',
        lastUsed: new Date().toISOString()
      },

      // Trust/Experience objections
      {
        id: 'trust-1',
        category: 'trust',
        objection: "We've had bad experiences with hosting companies before",
        response: "I'm really sorry to hear that - poor hosting experiences are frustrating and costly. What specifically went wrong? Our approach is different - you get a dedicated account manager who knows your business, 99.9% uptime SLA with credits if we miss it, and 24/7 phone support that actually answers. Let me share how we've helped clients with similar bad experiences.",
        context: "Previous negative experiences",
        success_rate: 67,
        agentType: 'retention',
        product: 'Hosting',
        lastUsed: new Date().toISOString()
      },
      {
        id: 'trust-2',
        category: 'trust',
        objection: "How do we know IONOS will be around in 5 years?",
        response: "Great question - you want a stable partner. IONOS has been in business for over 30 years and we're part of United Internet, a publicly traded company serving 8 million customers globally. We've grown consistently through multiple economic cycles. Your investment is protected by our stability and track record.",
        context: "Company stability concerns",
        success_rate: 84,
        agentType: 'outbound',
        product: 'Any',
        lastUsed: new Date().toISOString()
      },

      // Competition objections
      {
        id: 'competition-1',
        category: 'trust',
        objection: "We're considering AWS/Microsoft instead",
        response: "AWS and Microsoft are excellent for large enterprises with dedicated IT teams. For businesses like yours, they often become expensive and complex quickly. Our managed approach gives you enterprise-grade infrastructure with the simplicity and support you need, at a fraction of the complexity and cost.",
        context: "Major cloud provider comparison",
        success_rate: 71,
        agentType: 'outbound',
        product: 'Server/Cloud',
        lastUsed: new Date().toISOString()
      }
    ];
  }

  // Save objection feedback
  saveObjectionFeedback(feedback: ObjectionFeedback): void {
    const existingFeedback = this.getObjectionFeedback();
    existingFeedback.push(feedback);
    localStorage.setItem(this.FEEDBACK_KEY, JSON.stringify(existingFeedback));
    
    // Update objection success rate based on feedback
    this.updateObjectionSuccessRate(feedback.objectionId, feedback.helpful);
  }

  // Get all feedback for analysis
  getObjectionFeedback(): ObjectionFeedback[] {
    try {
      const feedback = localStorage.getItem(this.FEEDBACK_KEY);
      return feedback ? JSON.parse(feedback) : [];
    } catch {
      return [];
    }
  }

  // Get feedback statistics for specific objection
  getObjectionStats(objectionId: string): { totalFeedback: number; helpfulPercentage: number; commonIssues: string[] } {
    const feedback = this.getObjectionFeedback().filter(f => f.objectionId === objectionId);
    const helpful = feedback.filter(f => f.helpful).length;
    const total = feedback.length;
    
    const reasonCounts = feedback.reduce((acc, f) => {
      if (f.reason) {
        acc[f.reason] = (acc[f.reason] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const commonIssues = Object.entries(reasonCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([reason]) => reason);

    return {
      totalFeedback: total,
      helpfulPercentage: total > 0 ? Math.round((helpful / total) * 100) : 0,
      commonIssues
    };
  }

  private updateObjectionSuccessRate(objectionId: string, helpful: boolean): void {
    // In a real system, this would update the objection's success rate
    // For now, we just track it in feedback
    console.log(`Objection ${objectionId} feedback: ${helpful ? 'helpful' : 'not helpful'}`);
  }

  // Get objections filtered by agent type and context
  getObjectionsForAgent(agentType: 'outbound' | 'retention' | 'telesales', category?: string): any[] {
    const objections = this.getExpandedObjections();
    return objections.filter(obj => {
      const matchesAgent = obj.agentType === agentType || obj.agentType === 'any';
      const matchesCategory = !category || obj.category === category;
      return matchesAgent && matchesCategory;
    });
  }

  // Get sales flow for specific product
  getSalesFlow(product: string): SalesFlow | undefined {
    return this.getCoreSalesFlows().find(flow => 
      flow.product.toLowerCase().includes(product.toLowerCase())
    );
  }

  // Get all sales flows
  getAllSalesFlows(): SalesFlow[] {
    return this.getCoreSalesFlows();
  }

  // Analytics for board presentation
  getUsageAnalytics(): {
    totalQueries: number;
    averageHelpfulRate: number;
    topPerformingObjections: any[];
    improvementNeeded: any[];
    agentAdoption: { outbound: number; retention: number; telesales: number };
  } {
    const feedback = this.getObjectionFeedback();
    const objections = this.getExpandedObjections();

    const helpfulCount = feedback.filter(f => f.helpful).length;
    const totalFeedback = feedback.length;

    // Calculate per-objection performance
    const objectionPerformance = objections.map(obj => {
      const stats = this.getObjectionStats(obj.id);
      return {
        ...obj,
        ...stats
      };
    });

    const topPerforming = objectionPerformance
      .filter(obj => obj.totalFeedback >= 3)
      .sort((a, b) => b.helpfulPercentage - a.helpfulPercentage)
      .slice(0, 5);

    const needingImprovement = objectionPerformance
      .filter(obj => obj.totalFeedback >= 3 && obj.helpfulPercentage < 70)
      .sort((a, b) => a.helpfulPercentage - b.helpfulPercentage)
      .slice(0, 3);

    return {
      totalQueries: totalFeedback,
      averageHelpfulRate: totalFeedback > 0 ? Math.round((helpfulCount / totalFeedback) * 100) : 0,
      topPerformingObjections: topPerforming,
      improvementNeeded: needingImprovement,
      agentAdoption: {
        outbound: feedback.filter(f => f.agentId?.includes('outbound')).length,
        retention: feedback.filter(f => f.agentId?.includes('retention')).length,
        telesales: feedback.filter(f => f.agentId?.includes('telesales')).length
      }
    };
  }
}

export const knowledgeBaseService = KnowledgeBaseService.getInstance();