// Demo data for seamless presentation experience

export const sampleObjections = [
  {
    id: '1',
    title: 'Price Too High',
    content: 'I think your service is too expensive compared to competitors.',
    category: 'pricing',
    confidence: 0.95,
    suggestedResponse: 'I understand price is important. Let me show you the ROI calculation and value breakdown compared to our competitors.',
    context: 'B2B Software Sales'
  },
  {
    id: '2', 
    title: 'Need to Think About It',
    content: 'This sounds interesting but I need to think about it more.',
    category: 'decision',
    confidence: 0.88,
    suggestedResponse: 'Absolutely, this is an important decision. What specific aspects would you like to discuss to help with your decision?',
    context: 'Enterprise Sales'
  },
  {
    id: '3',
    title: 'Already Have a Solution',
    content: 'We already have a system in place that works for us.',
    category: 'competition',
    confidence: 0.92,
    suggestedResponse: 'That\'s great that you have something working. What challenges, if any, are you experiencing with your current solution?',
    context: 'SaaS Sales'
  },
  {
    id: '4',
    title: 'Not the Right Time',
    content: 'We\'re not ready to make any changes right now.',
    category: 'timing',
    confidence: 0.85,
    suggestedResponse: 'I appreciate you being upfront about timing. When would be a better time to revisit this conversation?',
    context: 'Consultative Sales'
  }
];

export const sampleQuotes = [
  {
    id: 'q1',
    customerName: 'IONOS Enterprise Client',
    productTitle: 'Cloud Infrastructure Package',
    totalValue: 15000,
    items: [
      { name: 'Virtual Private Server (VPS)', quantity: 5, price: 299, total: 1495 },
      { name: 'Managed Database Service', quantity: 2, price: 199, total: 398 },
      { name: 'CDN & Security Package', quantity: 1, price: 499, total: 499 },
      { name: 'Professional Support (Annual)', quantity: 1, price: 2400, total: 2400 }
    ],
    validUntil: '2024-02-15',
    notes: 'Enterprise package with priority support and dedicated account manager'
  },
  {
    id: 'q2',
    customerName: 'TechStart GmbH',
    productTitle: 'Small Business Starter Pack',
    totalValue: 2400,
    items: [
      { name: 'Business Website Hosting', quantity: 1, price: 29, total: 348 },
      { name: 'Email Professional', quantity: 10, price: 5, total: 600 },
      { name: 'Domain Registration (.com)', quantity: 2, price: 12, total: 24 },
      { name: 'SSL Certificate', quantity: 2, price: 69, total: 138 }
    ],
    validUntil: '2024-01-30',
    notes: 'Perfect for growing businesses needing reliable online presence'
  }
];

export const sampleKnowledgeBase = [
  {
    title: 'IONOS VPS Specifications',
    content: 'Our VPS solutions offer flexible computing power with guaranteed resources, SSD storage, and 99.9% uptime SLA.',
    category: 'technical',
    tags: ['vps', 'specifications', 'technical']
  },
  {
    title: 'Pricing Justification Framework',
    content: 'When discussing pricing, focus on ROI, total cost of ownership, and the value of 24/7 German support.',
    category: 'sales',
    tags: ['pricing', 'objections', 'value']
  },
  {
    title: 'Competitor Comparison Points',
    content: 'Key differentiators: Data centers in Germany, GDPR compliance, German engineering quality, and personal support.',
    category: 'competitive',
    tags: ['competition', 'differentiators', 'advantages']
  },
  {
    title: 'Customer Success Stories',
    content: 'Case studies showing 40% cost reduction and 99.9% uptime for similar businesses in their industry.',
    category: 'proof',
    tags: ['case studies', 'success', 'social proof']
  }
];

export const demoInsights = [
  {
    type: 'suggestion' as const,
    message: '💡 **Mention German Data Centers**: Customer seems concerned about data sovereignty. Highlight our German data centers and GDPR compliance.',
    confidence: 0.92,
    timestamp: Date.now() - 30000
  },
  {
    type: 'objection' as const,
    message: '⚠️ **Price Objection Detected**: Customer mentioned "expensive". Use the ROI calculator and compare total cost of ownership.',
    confidence: 0.87,
    timestamp: Date.now() - 60000
  },
  {
    type: 'opportunity' as const,
    message: '🎯 **Cross-sell Opportunity**: They need email hosting too. Mention our Professional Email package with the VPS.',
    confidence: 0.75,
    timestamp: Date.now() - 90000
  }
];

export const initializeDemoData = () => {
  // Pre-populate localStorage with demo data for seamless experience
  if (!localStorage.getItem('sensei:demo-objections')) {
    localStorage.setItem('sensei:demo-objections', JSON.stringify(sampleObjections));
  }
  
  if (!localStorage.getItem('sensei:demo-quotes')) {
    localStorage.setItem('sensei:demo-quotes', JSON.stringify(sampleQuotes));
  }
  
  if (!localStorage.getItem('sensei:demo-knowledge')) {
    localStorage.setItem('sensei:demo-knowledge', JSON.stringify(sampleKnowledgeBase));
  }
  
  if (!localStorage.getItem('sensei:demo-insights')) {
    localStorage.setItem('sensei:demo-insights', JSON.stringify(demoInsights));
  }

  // Initialize objection samples for better demo
  // Import and call initializeObjectionSamples if needed
  if (!localStorage.getItem('sensei:sample-objections')) {
    // Add basic objection samples
    localStorage.setItem('sensei:sample-objections', JSON.stringify(sampleObjections));
  }

  // Set some completion flags for better demo flow
  localStorage.setItem('sensei:hasUploadedFiles', 'true');
  localStorage.setItem('sensei:hasUsedAssistant', 'true');
  
  // Mark API configuration as complete for demo
  localStorage.setItem('sensei:hasConfiguredSettings', 'true');
};