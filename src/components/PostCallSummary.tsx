import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  TrendingUp
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

Thank you for taking the time to speak with me today about {{companyName}}'s solutions.

Based on our conversation, I understand that you're looking to {{keyPain}}. I believe our solution can help you achieve {{desiredOutcome}}.

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
  const { toast } = useToast();

  // Auto-analyze conversation data on mount
  useEffect(() => {
    if (callSummary.transcriptHighlights?.length > 0) {
      analyzeConversationData();
    }
  }, [callSummary]);

  const analyzeConversationData = async () => {
    try {
      const transcriptText = callSummary.transcriptHighlights.join(' ');
      const analysisPrompt = `
Analyze this sales conversation and extract key information:

Transcript: "${transcriptText}"

Extract and return ONLY a JSON object with:
{
  "customerName": "first name only if clearly mentioned",
  "companyName": "company name if mentioned", 
  "keyPain": "main problem/challenge customer mentioned",
  "desiredOutcome": "what customer wants to achieve"
}

If any field is not clearly mentioned, use empty string.
      `;

      const response = await ionosAI.sendMessage([
        {
          role: 'system',
          content: 'You are an expert at extracting key information from sales conversations. Return only valid JSON.'
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
          setConversationData({
            customerName: extracted.customerName || '',
            companyName: extracted.companyName || '',
            keyPain: extracted.keyPain || '',
            desiredOutcome: extracted.desiredOutcome || ''
          });
        }
      } catch (parseError) {
        console.error('Failed to parse conversation analysis:', parseError);
      }
    } catch (error) {
      console.error('Failed to analyze conversation:', error);
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

Generate a personalized follow-up email using the extracted conversation data.
      `;

      const emailContent = await ionosAI.sendMessage([
        {
          role: 'system',
          content: 'You are an expert sales professional. Generate a professional, personalized follow-up email using the conversation data provided. Make it specific and actionable.'
        },
        {
          role: 'user',
          content: context
        }
      ]);

      setCustomEmail(emailContent);
      toast({
        title: "Email Generated",
        description: "AI-powered follow-up email has been generated successfully."
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
    const emailToSave = customEmail || selectedTemplate.body;
    onSaveToHistory(callSummary, emailToSave);
    onClose();
    toast({
      title: "Call Saved",
      description: "Call summary and follow-up email saved to history."
    });
  };

  const fillTemplate = (template: string) => {
    return template
      .replace(/{{customerName}}/g, conversationData.customerName || callSummary.customerName || '[Customer Name]')
      .replace(/{{companyName}}/g, conversationData.companyName || '[Company Name]')
      .replace(/{{keyPain}}/g, conversationData.keyPain || 'business challenges')
      .replace(/{{desiredOutcome}}/g, conversationData.desiredOutcome || 'improved efficiency')
      .replace(/{{keyPoints}}/g, callSummary.keyPoints.map(point => `• ${point}`).join('\n'))
      .replace(/{{nextSteps}}/g, callSummary.nextSteps.map(step => `• ${step}`).join('\n'))
      .replace(/{{timeline}}/g, '[Timeline]')
      .replace(/{{yourName}}/g, '[Your Name]');
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
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
    <div 
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <CardHeader className="border-b bg-muted/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PhoneCall className="h-5 w-5 text-primary" />
              <CardTitle>Call Summary & Follow-up</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {callSummary.duration}
              </Badge>
              <Badge variant="secondary">{callSummary.callType}</Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 h-[600px]">
            {/* Call Summary */}
            <div className="border-r">
              <ScrollArea className="h-full p-6">
                <div className="space-y-6">
                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="p-4 text-center">
                        <Target className="h-8 w-8 text-primary mx-auto mb-2" />
                        <div className="text-2xl font-bold">{callSummary.keyPoints.length}</div>
                        <div className="text-sm text-muted-foreground">Key Points</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <MessageSquare className="h-8 w-8 text-destructive mx-auto mb-2" />
                        <div className="text-2xl font-bold">{callSummary.objections.length}</div>
                        <div className="text-sm text-muted-foreground">Objections</div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Key Points */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-sm flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Key Discussion Points
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(callSummary.keyPoints.join('\n'), 'Key Points')}
                      >
                        {copiedField === 'Key Points' ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {callSummary.keyPoints.map((point, index) => (
                        <div key={index} className="flex items-start gap-2 text-sm">
                          <Badge variant="outline" className="text-xs mt-1">{index + 1}</Badge>
                          <span>{point}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Objections */}
                  {callSummary.objections.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-sm flex items-center gap-2">
                          <MessageSquare className="h-4 w-4" />
                          Objections Handled
                        </h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(callSummary.objections.join('\n'), 'Objections')}
                        >
                          {copiedField === 'Objections' ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {callSummary.objections.map((objection, index) => (
                          <div key={index} className="flex items-start gap-2 text-sm">
                            <Badge variant="destructive" className="text-xs mt-1">{index + 1}</Badge>
                            <span>{objection}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <Separator />

                  {/* Next Steps */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-sm flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Next Steps
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(callSummary.nextSteps.join('\n'), 'Next Steps')}
                      >
                        {copiedField === 'Next Steps' ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {callSummary.nextSteps.map((step, index) => (
                        <div key={index} className="flex items-start gap-2 text-sm">
                          <Badge variant="secondary" className="text-xs mt-1">{index + 1}</Badge>
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </div>

            {/* Email Generation */}
            <div>
              <ScrollArea className="h-full p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Follow-up Email
                    </h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={generateAIEmail}
                      disabled={isGeneratingEmail}
                    >
                      {isGeneratingEmail ? (
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                          Generating...
                        </div>
                      ) : (
                        <>
                          <FileText className="h-4 w-4 mr-2" />
                          AI Generate
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Auto-detected Conversation Data */}
                  {(conversationData.customerName || conversationData.companyName || conversationData.keyPain) && (
                    <div className="space-y-2 p-3 bg-muted/50 rounded-lg border">
                      <label className="text-sm font-medium">Auto-detected Information</label>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {conversationData.customerName && (
                          <div><span className="font-medium">Customer:</span> {conversationData.customerName}</div>
                        )}
                        {conversationData.companyName && (
                          <div><span className="font-medium">Company:</span> {conversationData.companyName}</div>
                        )}
                        {conversationData.keyPain && (
                          <div className="col-span-2"><span className="font-medium">Key Pain:</span> {conversationData.keyPain}</div>
                        )}
                        {conversationData.desiredOutcome && (
                          <div className="col-span-2"><span className="font-medium">Desired Outcome:</span> {conversationData.desiredOutcome}</div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Template Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email Template</label>
                    <div className="grid grid-cols-2 gap-2">
                      {EMAIL_TEMPLATES.map((template) => (
                        <Button
                          key={template.id}
                          variant={selectedTemplate.id === template.id ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            setSelectedTemplate(template);
                            setCustomEmail('');
                          }}
                          className="text-xs"
                        >
                          {template.name}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Email Subject */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Subject Line</label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 p-2 border rounded-md bg-muted text-sm">
                        {selectedTemplate.subject}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(selectedTemplate.subject, 'Subject')}
                      >
                        {copiedField === 'Subject' ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  {/* Email Body */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email Body</label>
                    <Textarea
                      value={customEmail || fillTemplate(selectedTemplate.body)}
                      onChange={(e) => setCustomEmail(e.target.value)}
                      className="min-h-[300px] text-sm"
                      placeholder="Email content will appear here..."
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => copyToClipboard(customEmail || fillTemplate(selectedTemplate.body), 'Email')}
                      className="flex-1"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Email
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        const emailContent = `Subject: ${selectedTemplate.subject}\n\n${customEmail || fillTemplate(selectedTemplate.body)}`;
                        const blob = new Blob([emailContent], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'follow-up-email.txt';
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>
              </ScrollArea>
            </div>
          </div>

          {/* Actions */}
          <div className="border-t p-6 bg-muted/50">
            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={handleSaveAndClose}>
                  Save to History
                </Button>
                <Button onClick={handleSaveAndClose}>
                  Save & Close
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}