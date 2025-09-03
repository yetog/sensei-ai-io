# Webhook Integration Examples

## Sales Assistant Webhook

### Endpoint
`POST https://your-n8n-instance.com/webhook/sales-assistant`

### Payload Structure
```json
{
  "transcript": "Customer: I'm interested in your pricing... Rep: Our starter package...",
  "duration": 185,
  "customerInfo": {
    "name": "John Smith",
    "email": "john@example.com",
    "company": "Example Corp",
    "id": "lead_123"
  },
  "currentInsights": [
    {
      "type": "buying_signal",
      "message": "Customer asking about pricing",
      "confidence": 0.8
    }
  ]
}
```

### Response Format
```json
{
  "success": true,
  "coaching": "Customer is showing strong buying signals. Ask about budget and timeline next.",
  "hasQuote": true,
  "quote": {
    "package": "Professional",
    "price": "$7,500/month",
    "features": ["Advanced Analytics", "24/7 Support"],
    "timeline": "2-week implementation",
    "nextSteps": "Schedule technical demo"
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "callDuration": 185
}
```

## Call Automation Webhook

### Endpoint
`POST https://your-n8n-instance.com/webhook/call-automation`

### Payload Structure
```json
{
  "fullTranscript": "Complete call transcript here...",
  "callDuration": 845,
  "insights": [
    {
      "type": "objection",
      "message": "Price concern raised",
      "timestamp": "2024-01-15T10:25:00Z"
    }
  ],
  "quotes": [
    {
      "package": "Professional",
      "price": 7500,
      "generated_at": "2024-01-15T10:28:00Z"
    }
  ],
  "customerInfo": {
    "name": "Jane Doe",
    "email": "jane@company.com",
    "company": "Big Corp Inc",
    "id": "lead_456"
  },
  "repEmail": "sales-rep@yourcompany.com",
  "crmWebhook": "https://your-crm.com/api/leads/update",
  "crmApiKey": "your-crm-api-key"
}
```

### Response Format
```json
{
  "success": true,
  "callSummary": "Comprehensive call summary in markdown format...",
  "emailSent": true,
  "crmUpdated": true,
  "followUpScheduled": "2024-01-18T10:30:00Z",
  "timestamp": "2024-01-15T10:35:00Z"
}
```

## Integration in Call Assistant

### Add Webhook URLs to Configuration
```typescript
// In your Call Assistant component or service
const WEBHOOK_CONFIG = {
  salesAssistant: "https://your-n8n-instance.com/webhook/sales-assistant",
  callAutomation: "https://your-n8n-instance.com/webhook/call-automation"
};

// Real-time coaching webhook
const sendCoachingRequest = async (transcript: string, insights: Insight[]) => {
  try {
    const response = await fetch(WEBHOOK_CONFIG.salesAssistant, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transcript,
        duration: callDuration,
        customerInfo: customerData,
        currentInsights: insights
      })
    });
    
    const coaching = await response.json();
    if (coaching.hasQuote) {
      // Handle quote generation
      setGeneratedQuote(coaching.quote);
    }
    
    // Apply coaching suggestions
    setCoachingSuggestions(coaching.coaching);
  } catch (error) {
    console.error('Coaching webhook failed:', error);
  }
};

// Post-call automation webhook
const triggerCallAutomation = async (callData: CallSummary) => {
  try {
    const response = await fetch(WEBHOOK_CONFIG.callAutomation, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(callData)
    });
    
    const automation = await response.json();
    console.log('Automation completed:', automation);
  } catch (error) {
    console.error('Automation webhook failed:', error);
  }
};
```

## Credential Setup in N8N

### IONOS AI HTTP Header Auth
- **Name**: `ionos-api-credentials`
- **Header Name**: `Authorization`
- **Header Value**: `Bearer YOUR_ACTUAL_IONOS_API_KEY`

### Telegram API
- **Name**: `telegram-credentials`
- **Access Token**: Your Telegram bot token

### Email SMTP
- **Name**: `email-credentials`
- **Host**: Your SMTP server
- **Port**: 587 (or your SMTP port)
- **Username**: Your email
- **Password**: Your app password

## Testing Webhooks

### Using cURL
```bash
# Test Sales Assistant Webhook
curl -X POST https://your-n8n-instance.com/webhook/sales-assistant \
  -H "Content-Type: application/json" \
  -d '{
    "transcript": "Customer is asking about pricing for our enterprise package",
    "duration": 120,
    "customerInfo": {
      "name": "Test Customer",
      "email": "test@example.com",
      "company": "Test Corp"
    },
    "currentInsights": []
  }'

# Test Call Automation Webhook
curl -X POST https://your-n8n-instance.com/webhook/call-automation \
  -H "Content-Type: application/json" \
  -d '{
    "fullTranscript": "Complete test transcript...",
    "callDuration": 300,
    "customerInfo": {
      "name": "Test Customer",
      "email": "test@example.com",
      "company": "Test Corp"
    },
    "repEmail": "rep@yourcompany.com"
  }'
```

## Production Considerations

1. **Webhook Security**: Add signature verification
2. **Rate Limiting**: Implement request throttling
3. **Error Handling**: Graceful fallbacks for webhook failures
4. **Monitoring**: Set up alerts for failed executions
5. **Scaling**: Use webhook queuing for high volume calls