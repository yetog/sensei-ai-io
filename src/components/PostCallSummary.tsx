import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { 
  Mail, 
  Download, 
  Copy, 
  CheckCircle, 
  PhoneCall,
  Clock,
  Target,
  MessageSquare,
  FileText,
  Users,
  TrendingUp,
  History,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { ionosAI } from '@/services/ionosAI';

interface CallSummary {
  duration: string;
  customerName?: string;
  callType: string;
  keyPoints: string[];
  objections: string[];
  nextSteps: string[];
  outcome: 'follow_up' | 'quote_needed' | 'closed' | 'no_interest' | 'demo_scheduled';
  transcriptHighlights: string[];
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  type: 'thank_you' | 'quote' | 'follow_up' | 'completion' | 'demo_confirmation';
}

interface PostCallSummaryProps {
  callSummary: CallSummary;
  onClose: () => void;
  onSaveToHistory: (summary: CallSummary, email?: string) => void;
}

const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'thank_you',
    name: 'Thank You Follow-up',
    subject: 'Thank you for your time today',
    body: `Hi {{customerName}},

Thank you for taking the time to speak with me today about {{companyName}} solutions.

Based on our conversation, I understand that you're looking to {{keyPain}}. I believe our IONOS solutions can help you achieve {{desiredOutcome}}.

Key discussion points from our call:
{{keyPoints}}

Next steps:
{{nextSteps}}

Please don't hesitate to reach out if you have any questions. I look forward to continuing our conversation.

Best regards,
{{yourName}}`,
    type: 'thank_you'
  },
  {
    id: 'quote_request',
    name: 'Quote Follow-up',
    subject: 'Your requested quote',
    body: `Hi {{customerName}},

As promised, I'm following up with the quote we discussed during our call today.

Based on your requirements:
{{keyPoints}}

I'll prepare a detailed proposal and send it over by {{timeline}}. This will include:
- Pricing breakdown
- Implementation timeline
- Support options

Is there anything specific you'd like me to include in the proposal?

Best regards,
{{yourName}}`,
    type: 'quote'
  },
  {
    id: 'follow_up',
    name: 'General Follow-up',
    subject: 'Following up on our conversation',
    body: `Hi {{customerName}},

I wanted to follow up on our conversation today about {{topic}}.

Key discussion points:
{{keyPoints}}

Next steps:
{{nextSteps}}

I'll check back with you {{timeline}} to see how things are progressing.

Please let me know if you have any questions in the meantime.

Best regards,
{{yourName}}`,
    type: 'follow_up'
  },
  {
    id: 'completion',
    name: 'Project Completion',
    subject: 'Confirming project completion',
    body: `Hi {{customerName}},

I hope this email finds you well. I wanted to confirm that we've completed {{projectName}} as discussed.

What we delivered:
{{deliverables}}

Next steps:
{{nextSteps}}

Thank you for your business, and please don't hesitate to reach out if you need any support.

Best regards,
{{yourName}}`,
    type: 'completion'
  }
];

export function PostCallSummary({ callSummary, onClose, onSaveToHistory }: PostCallSummaryProps) {
  const navigate = useNavigate();
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate>(EMAIL_TEMPLATES[0]);
  const [customEmail, setCustomEmail] = useState('');
  const [isGeneratingEmail, setIsGeneratingEmail] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [conversationData, setConversationData] = useState({
    customerName: '',
    companyName: '',
    keyPain: '',
    desiredOutcome: ''
  });
  const [isEditingTemplate, setIsEditingTemplate] = useState(false);
  const { toast } = useToast();

  // Helper function to infer pain points from call type
  const inferKeyPainFromCallType = (callType: string, keyPoints: string[]): string => {
    // Infer pain points from actual discussion points
    if (keyPoints.length > 0) {
      return `Discussed: ${keyPoints.slice(0, 2).join(', ')}`;
    }
    
    // Context-based inference
    const contextMap: Record<string, string> = {
      'cold_call': 'Initial outreach to explore potential solutions',
      'demo': 'Evaluating solutions for their specific use case',
      'follow_up': 'Continuing discussion on previously identified needs',
      'closing': 'Finalizing solution implementation details',
      'discovery': 'Identifying specific business challenges and requirements',
      'retention': 'Addressing ongoing service needs and optimization',
      'quick_notes': 'Quick capture of conversation highlights'
    };
    
    return contextMap[callType] || 'Exploring potential partnership opportunities';
  };

  const inferDesiredOutcomeFromCallType = (callType: string, nextSteps: string[]): string => {
    // Infer from actual next steps
    if (nextSteps.length > 0) {
      return `Customer wants to: ${nextSteps[0]}`;
    }
    
    // Context-based inference
    const contextMap: Record<string, string> = {
      'cold_call': 'Explore IONOS services and determine fit',
      'demo': 'Evaluate IONOS solutions for their business needs',
      'follow_up': 'Continue evaluation and move toward partnership',
      'closing': 'Implement agreed-upon IONOS solutions',
      'discovery': 'Identify the right IONOS products for their requirements',
      'retention': 'Optimize current IONOS services and expand usage',
      'quick_notes': 'Document conversation for next steps'
    };
    
    return contextMap[callType] || 'Partner with IONOS for their business needs';
  };

  // Utility to check if text is a generic placeholder
  const isGenericPlaceholder = (text: string): boolean => {
    if (!text || text.trim() === '') return true;
    
    const genericPatterns = [
      /not mentioned/i,
      /\[.*?\]/,  // [Customer Name], [Company Name], etc.
      /^general business/i,
      /^business optimization/i,
      /^improved efficiency/i,
      /^customer$/i,
      /^company$/i
    ];
    
    return genericPatterns.some(pattern => pattern.test(text));
  };

  // Auto-analyze conversation data on mount
  useEffect(() => {
    if (callSummary.transcriptHighlights?.length > 0) {
      analyzeConversationData();
    } else {
      // Set fallback data if no transcript available
      setConversationData({
        customerName: callSummary.customerName || '',
        companyName: '',
        keyPain: inferKeyPainFromCallType(callSummary.callType, callSummary.keyPoints),
        desiredOutcome: inferDesiredOutcomeFromCallType(callSummary.callType, callSummary.nextSteps)
      });
    }
  }, [callSummary]);

  const analyzeConversationData = async () => {
    try {
      const transcriptText = callSummary.transcriptHighlights.join(' ');
      
      // Don't analyze if transcript is too short
      if (transcriptText.length < 50) {
        console.log('Transcript too short for analysis, using context-based fallback');
        setConversationData({
          customerName: callSummary.customerName || '',
          companyName: '',
          keyPain: inferKeyPainFromCallType(callSummary.callType, callSummary.keyPoints),
          desiredOutcome: inferDesiredOutcomeFromCallType(callSummary.callType, callSummary.nextSteps)
        });
        return;
      }
      
      const analysisPrompt = `
You are analyzing a sales conversation. Extract ONLY explicitly mentioned information.

TRANSCRIPT:
"${transcriptText}"

CALL TYPE: ${callSummary.callType}
KEY POINTS: ${callSummary.keyPoints.join(', ')}

CRITICAL RULES:
1. Extract customer first name ONLY if clearly mentioned (e.g., "Hi, I'm Sarah" → "Sarah")
2. Extract company name ONLY if mentioned (e.g., "from Tech Solutions Inc" → "Tech Solutions Inc")
3. If NOT mentioned, return empty string "" (NEVER use "Not mentioned" or placeholders)
4. For pain points: Extract SPECIFIC challenges customer discussed (use their exact words when possible)
5. For desired outcomes: Extract SPECIFIC goals customer wants to achieve
6. If pain/outcomes unclear, infer intelligently from call context and key points discussed

EXAMPLE (based on actual call):
Input: "David from Rapid Response Integration mainly focuses on AV and Datacenter hardware. Interested in IONOS services."
Output:
{
  "customerName": "David",
  "companyName": "Rapid Response Integration",
  "keyPain": "Needs reliable AV and Datacenter hardware solutions for their integration projects",
  "desiredOutcome": "Partner with IONOS to provide scalable datacenter infrastructure for their clients"
}

Return ONLY valid JSON:
{
  "customerName": "string or empty",
  "companyName": "string or empty",
  "keyPain": "specific challenges (NOT generic)",
  "desiredOutcome": "specific goals (NOT generic)"
}
`;

      const response = await ionosAI.sendMessage([
        {
          role: 'system',
          content: 'You are an expert at extracting precise information from sales conversations. Return ONLY valid JSON. Never use placeholder text like "Not mentioned" - use empty strings instead. Be specific and detailed based on actual conversation content.'
        },
        {
          role: 'user',
          content: analysisPrompt
        }
      ]);

      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const extracted = JSON.parse(jsonMatch[0]);
          
          // Validate extracted data quality
          setConversationData({
            customerName: extracted.customerName || callSummary.customerName || '',
            companyName: extracted.companyName || '',
            keyPain: !isGenericPlaceholder(extracted.keyPain || '') 
              ? extracted.keyPain 
              : inferKeyPainFromCallType(callSummary.callType, callSummary.keyPoints),
            desiredOutcome: !isGenericPlaceholder(extracted.desiredOutcome || '') 
              ? extracted.desiredOutcome 
              : inferDesiredOutcomeFromCallType(callSummary.callType, callSummary.nextSteps)
          });
          
          console.log('Enhanced conversation analysis:', extracted);
        }
      } catch (parseError) {
        console.error('Failed to parse conversation analysis:', parseError);
        // Use intelligent fallback
        setConversationData({
          customerName: callSummary.customerName || '',
          companyName: '',
          keyPain: inferKeyPainFromCallType(callSummary.callType, callSummary.keyPoints),
          desiredOutcome: inferDesiredOutcomeFromCallType(callSummary.callType, callSummary.nextSteps)
        });
      }
    } catch (error) {
      console.error('Failed to analyze conversation:', error);
      // Use intelligent fallback
      setConversationData({
        customerName: callSummary.customerName || '',
        companyName: '',
        keyPain: inferKeyPainFromCallType(callSummary.callType, callSummary.keyPoints),
        desiredOutcome: inferDesiredOutcomeFromCallType(callSummary.callType, callSummary.nextSteps)
      });
    }
  };

  const generateAIEmail = async () => {
    setIsGeneratingEmail(true);
    try {
      const context = `
Call Summary:
- Duration: ${callSummary.duration}
- Type: ${callSummary.callType}
- Customer: ${conversationData.customerName || 'Customer'}
- Company: ${conversationData.companyName || 'Their company'}
- Key Pain: ${conversationData.keyPain || 'Business challenges'}
- Desired Outcome: ${conversationData.desiredOutcome || 'Improved efficiency'}
- Key Points: ${callSummary.keyPoints.join(', ')}
- Objections: ${callSummary.objections.join(', ')}
- Next Steps: ${callSummary.nextSteps.join(', ')}
- Outcome: ${callSummary.outcome}

Generate a personalized follow-up email using the user-edited template fields. Use the specific values provided for customer name, company, key pain points, and desired outcomes to create a highly personalized email.
      `;

      const emailContent = await ionosAI.sendMessage([
        {
          role: 'system',
          content: 'You are an expert sales professional. Generate a professional, personalized follow-up email using the conversation data and user-edited template fields provided. Make it highly specific and actionable based on the provided customer information.'
        },
        {
          role: 'user',
          content: context
        }
      ]);

      setCustomEmail(emailContent);
      toast({
        title: "Email Generated",
        description: "AI-powered follow-up email has been generated using your template fields."
      });
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Failed to generate email. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingEmail(false);
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
      toast({
        title: "Copied",
        description: `${field} copied to clipboard`
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy to clipboard",
        variant: "destructive"
      });
    }
  };

  const handleSaveAndClose = () => {
    const emailToSave = customEmail || fillTemplate(selectedTemplate.body);
    onSaveToHistory(callSummary, emailToSave);
    onClose();
    toast({
      title: "Call Saved",
      description: "Call summary and follow-up email saved to history."
    });
  };

  const handleViewHistory = () => {
    const emailToSave = customEmail || fillTemplate(selectedTemplate.body);
    onSaveToHistory(callSummary, emailToSave);
    onClose();
    navigate('/call-history');
    toast({
      title: "Navigating to Call History",
      description: "Call saved and redirecting to history page."
    });
  };

  const generateCaseNotes = () => {
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const customerName = conversationData.customerName || callSummary.customerName;
    const companyName = conversationData.companyName;
    const callId = `CALL-${Date.now().toString().slice(-8)}`;
    
    let notes = `CASE NOTES - ${currentDate}\n\n`;
    
    // Only add customer info if available
    if (customerName || companyName) {
      if (customerName) notes += `Customer: ${customerName}\n`;
      if (companyName) notes += `Company: ${companyName}\n`;
    }
    
    notes += `Call Type: ${callSummary.callType}\n`;
    notes += `Call ID: ${callId}\n\n`;
    
    notes += `KEY DISCUSSION POINTS:\n`;
    notes += callSummary.keyPoints.map((point, index) => `${index + 1}. ${point}`).join('\n');
    notes += `\n\n`;
    
    if (callSummary.objections.length > 0) {
      notes += `OBJECTIONS ADDRESSED:\n`;
      notes += callSummary.objections.map((obj, index) => `${index + 1}. ${obj}`).join('\n');
      notes += `\n\n`;
    }
    
    notes += `NEXT STEPS:\n`;
    notes += callSummary.nextSteps.map((step, index) => `${index + 1}. ${step}`).join('\n');
    notes += `\n\n`;
    
    // Only add pain points/outcomes if meaningful
    if (conversationData.keyPain && !isGenericPlaceholder(conversationData.keyPain)) {
      notes += `PAIN POINTS IDENTIFIED:\n- ${conversationData.keyPain}\n\n`;
    }
    
    if (conversationData.desiredOutcome && !isGenericPlaceholder(conversationData.desiredOutcome)) {
      notes += `DESIRED OUTCOMES:\n- ${conversationData.desiredOutcome}`;
    }
    
    return notes;
  };

  const fillTemplate = (template: string) => {
    const customerName = conversationData.customerName || callSummary.customerName;
    const companyName = conversationData.companyName;
    
    // Smart greeting: Use name if available, otherwise professional greeting
    const greeting = customerName ? `Hi ${customerName}` : 'Hello';
    
    // Smart company reference
    const companyRef = companyName 
      ? `${companyName}'s` 
      : 'your organization\'s';
    
    // Smart pain point description
    const painDescription = conversationData.keyPain && !isGenericPlaceholder(conversationData.keyPain)
      ? conversationData.keyPain 
      : `the challenges we discussed regarding ${callSummary.callType.replace(/_/g, ' ')}`;
    
    // Smart outcome description
    const outcomeDescription = conversationData.desiredOutcome && !isGenericPlaceholder(conversationData.desiredOutcome)
      ? conversationData.desiredOutcome
      : `the goals we outlined for ${companyName || 'your business'}`;
    
    return template
      .replace(/Hi {{customerName}}/g, greeting)
      .replace(/{{customerName}}/g, customerName || 'there')
      .replace(/{{companyName}}/g, companyRef)
      .replace(/{{keyPain}}/g, painDescription)
      .replace(/{{desiredOutcome}}/g, outcomeDescription)
      .replace(/{{keyPoints}}/g, callSummary.keyPoints.map(point => `• ${point}`).join('\n'))
      .replace(/{{nextSteps}}/g, callSummary.nextSteps.map(step => `• ${step}`).join('\n'))
      .replace(/{{timeline}}/g, 'early next week')
      .replace(/{{yourName}}/g, '[Your Name]')
      .replace(/{{topic}}/g, callSummary.callType.replace(/_/g, ' '));
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b z-10">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <PhoneCall className="h-6 w-6 text-primary" />
                <div>
                  <h1 className="text-xl font-semibold">Call Summary & Follow-up</h1>
                  <p className="text-sm text-muted-foreground">Review your call and create follow-up actions</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {callSummary.duration}
                </Badge>
                <Badge variant="secondary">{callSummary.callType}</Badge>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={onClose}
                  className="h-9 w-9 p-0"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Call Summary */}
              <div className="space-y-6">
                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-6 text-center">
                      <Target className="h-10 w-10 text-primary mx-auto mb-3" />
                      <div className="text-3xl font-bold">{callSummary.keyPoints.length}</div>
                      <div className="text-sm text-muted-foreground">Key Points</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6 text-center">
                      <MessageSquare className="h-10 w-10 text-destructive mx-auto mb-3" />
                      <div className="text-3xl font-bold">{callSummary.objections.length}</div>
                      <div className="text-sm text-muted-foreground">Objections</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Case Notes */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Case Notes
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(generateCaseNotes(), 'Case Notes')}
                    >
                      {copiedField === 'Case Notes' ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="p-4 bg-muted/30 rounded-lg font-mono text-sm leading-relaxed whitespace-pre-line">
                      {generateCaseNotes()}
                    </div>
                  </CardContent>
                </Card>

                {/* Objections */}
                {callSummary.objections.length > 0 && (
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Objections Handled
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(callSummary.objections.join('\n'), 'Objections')}
                      >
                        {copiedField === 'Objections' ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {callSummary.objections.map((objection, index) => (
                          <div key={index} className="flex items-start gap-3 p-3 bg-destructive/5 border border-destructive/20 rounded-lg">
                            <Badge variant="destructive" className="text-xs mt-0.5">{index + 1}</Badge>
                            <span className="text-sm leading-relaxed">{objection}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Next Steps */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Next Steps
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(callSummary.nextSteps.join('\n'), 'Next Steps')}
                    >
                      {copiedField === 'Next Steps' ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {callSummary.nextSteps.map((step, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 bg-secondary/30 rounded-lg">
                          <Badge variant="secondary" className="text-xs mt-0.5">{index + 1}</Badge>
                          <span className="text-sm leading-relaxed">{step}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Email Generation */}
              <div className="space-y-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Follow-up Email
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={generateAIEmail}
                      disabled={isGeneratingEmail}
                    >
                      {isGeneratingEmail ? 'Generating...' : 'AI Generate'}
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Editable Template Fields */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-sm font-medium">Email Template Fields</label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsEditingTemplate(!isEditingTemplate)}
                        >
                          {isEditingTemplate ? 'Save Changes' : 'Edit Fields'}
                        </Button>
                      </div>
                      
                      {isEditingTemplate ? (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-medium text-muted-foreground">Customer Name</label>
                            <input
                              type="text"
                              value={conversationData.customerName}
                              onChange={(e) => setConversationData(prev => ({ ...prev, customerName: e.target.value }))}
                              placeholder="Customer's first name"
                              className="w-full mt-1 px-2 py-1 border rounded text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-muted-foreground">Company Name</label>
                            <input
                              type="text"
                              value={conversationData.companyName}
                              onChange={(e) => setConversationData(prev => ({ ...prev, companyName: e.target.value }))}
                              placeholder="Company name"
                              className="w-full mt-1 px-2 py-1 border rounded text-sm"
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="text-xs font-medium text-muted-foreground">Key Pain Point</label>
                            <input
                              type="text"
                              value={conversationData.keyPain}
                              onChange={(e) => setConversationData(prev => ({ ...prev, keyPain: e.target.value }))}
                              placeholder="Main challenge or pain point"
                              className="w-full mt-1 px-2 py-1 border rounded text-sm"
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="text-xs font-medium text-muted-foreground">Desired Outcome</label>
                            <input
                              type="text"
                              value={conversationData.desiredOutcome}
                              onChange={(e) => setConversationData(prev => ({ ...prev, desiredOutcome: e.target.value }))}
                              placeholder="What they want to achieve"
                              className="w-full mt-1 px-2 py-1 border rounded text-sm"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <span className="font-medium text-muted-foreground">Customer:</span>
                            <p className="mt-1">{conversationData.customerName || 'Not set'}</p>
                          </div>
                          <div>
                            <span className="font-medium text-muted-foreground">Company:</span>
                            <p className="mt-1">{conversationData.companyName || 'Not set'}</p>
                          </div>
                          <div>
                            <span className="font-medium text-muted-foreground">Key Pain:</span>
                            <p className="mt-1">{conversationData.keyPain || 'Not set'}</p>
                          </div>
                          <div>
                            <span className="font-medium text-muted-foreground">Desired Outcome:</span>
                            <p className="mt-1">{conversationData.desiredOutcome || 'Not set'}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <Separator />

                    {/* Template Selection */}
                    <div>
                      <label className="text-sm font-medium">Email Template:</label>
                      <select 
                        value={selectedTemplate.id}
                        onChange={(e) => {
                          const template = EMAIL_TEMPLATES.find(t => t.id === e.target.value);
                          if (template) setSelectedTemplate(template);
                        }}
                        className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                      >
                        {EMAIL_TEMPLATES.map(template => (
                          <option key={template.id} value={template.id}>
                            {template.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Subject Line */}
                    <div>
                      <label className="text-sm font-medium">Subject:</label>
                      <p className="mt-1 px-3 py-2 bg-muted rounded-md text-sm">
                        {selectedTemplate.subject}
                      </p>
                    </div>

                    {/* Email Body */}
                    <div>
                      <label className="text-sm font-medium">Email Content:</label>
                      <Textarea
                        value={customEmail || fillTemplate(selectedTemplate.body)}
                        onChange={(e) => setCustomEmail(e.target.value)}
                        placeholder="Email content will appear here..."
                        className="mt-1 min-h-[300px] text-sm"
                      />
                    </div>

                    {/* Email Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(customEmail || fillTemplate(selectedTemplate.body), 'Email')}
                        className="flex-1"
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const emailContent = customEmail || fillTemplate(selectedTemplate.body);
                          const blob = new Blob([emailContent], { type: 'text/plain' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = 'follow-up-email.txt';
                          a.click();
                          URL.revokeObjectURL(url);
                        }}
                        className="flex-1"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <Button 
                variant="outline" 
                onClick={onClose}
                className="min-w-[100px]"
              >
                <X className="h-4 w-4 mr-2" />
                Close
              </Button>
              <div className="flex items-center gap-2 flex-wrap">
                <Button variant="outline" onClick={handleViewHistory} className="min-w-[140px]">
                  <History className="h-4 w-4 mr-2" />
                  View in History
                </Button>
                <Button onClick={handleSaveAndClose} className="min-w-[120px]">
                  Save & Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}