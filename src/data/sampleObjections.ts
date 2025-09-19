// Pre-loaded objection handling samples for demo

export const preloadedObjections = [
  {
    id: 'obj-1',
    text: 'Your pricing seems high compared to other cloud providers.',
    category: 'pricing',
    confidence: 0.92,
    detectedAt: new Date(Date.now() - 3600000).toISOString(),
    context: 'IONOS VPS pricing discussion',
    suggestedResponse: {
      primary: 'I understand price is a key factor. Let me show you the total cost of ownership including our 24/7 German support, 99.9% SLA, and data sovereignty benefits.',
      talking_points: [
        'German data centers ensure GDPR compliance',
        '24/7 technical support included (worth €200/month elsewhere)', 
        'No hidden fees - transparent pricing model',
        'Calculate 3-year TCO vs competitors'
      ],
      evidence: 'ROI calculator showing 23% cost savings over 3 years'
    }
  },
  {
    id: 'obj-2', 
    text: 'We already have AWS and are happy with them.',
    category: 'competition',
    confidence: 0.88,
    detectedAt: new Date(Date.now() - 7200000).toISOString(),
    context: 'Enterprise client with existing AWS setup',
    suggestedResponse: {
      primary: 'AWS is a solid choice. Many of our clients also use AWS for some workloads. What specific challenges, if any, are you experiencing with data location or support response times?',
      talking_points: [
        'Multi-cloud strategy for redundancy',
        'European data sovereignty advantages',
        'Personal support vs ticket-based support',
        'Cost optimization for European customers'
      ],
      evidence: 'Case study: Deutsche Bank hybrid cloud approach'
    }
  },
  {
    id: 'obj-3',
    text: 'I need to discuss this with my IT team first.',
    category: 'decision',
    confidence: 0.85,
    detectedAt: new Date(Date.now() - 1800000).toISOString(),
    context: 'CTO showing interest but needs team buy-in',
    suggestedResponse: {
      primary: 'Absolutely, involving your IT team is smart. Would it be helpful if I prepared a technical overview they can review? What specific areas should I focus on?',
      talking_points: [
        'Offer technical documentation package',
        'Schedule follow-up with IT team present',
        'Provide trial access for evaluation',
        'Share technical references from similar clients'
      ],
      evidence: 'Technical comparison sheet vs AWS/Azure'
    }
  },
  {
    id: 'obj-4',
    text: 'We\'re not ready to migrate anything right now.',
    category: 'timing',
    confidence: 0.90,
    detectedAt: new Date(Date.now() - 900000).toISOString(),
    context: 'Large enterprise with complex legacy systems',
    suggestedResponse: {
      primary: 'Migration timing is crucial. Rather than migrate everything, what if we started with a pilot project or new workloads? Many clients find this approach less disruptive.',
      talking_points: [
        'Pilot project approach (low risk)',
        'Hybrid cloud strategy',
        'Timeline for next budget cycle',
        'Free migration consulting included'
      ],
      evidence: 'Migration success stories with similar companies'
    }
  }
];

export const demoCallTranscript = `
[CALL START - 14:23]
Customer: "Hi, I'm interested in learning about your VPS services for our growing business."

Rep: "Great! I'd be happy to help. Tell me a bit about your current setup and what you're looking to achieve."

Customer: "We're currently on a shared hosting plan but experiencing performance issues. We need something more robust but your pricing seems high compared to other providers."

Rep: "I understand price is important. Let me walk you through the value proposition..."

[OBJECTION DETECTED: Price concern - 14:24]
[AI SUGGESTION: Mention German data centers and included support value]

Customer: "We've also been looking at AWS since we're already familiar with their services."

[OBJECTION DETECTED: Competition (AWS) - 14:25]
[AI SUGGESTION: Position as complementary rather than replacement]

Rep: "AWS is definitely a strong platform. Many of our enterprise clients actually use both..."

Customer: "This sounds interesting, but I'll need to run this by my IT team before making any decisions."

[OBJECTION DETECTED: Decision process - 14:27]
[AI SUGGESTION: Offer technical materials for IT team review]

[CALL END - 14:31]
`;

export const initializeObjectionSamples = () => {
  if (!localStorage.getItem('sensei:sample-objections')) {
    localStorage.setItem('sensei:sample-objections', JSON.stringify(preloadedObjections));
  }
  
  if (!localStorage.getItem('sensei:sample-transcript')) {
    localStorage.setItem('sensei:sample-transcript', demoCallTranscript);
  }
};