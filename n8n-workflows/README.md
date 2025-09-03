# N8N Workflows for Call Assistant Integration

## Overview
This directory contains n8n workflows that integrate with your Call Assistant application using IONOS AI model hub.

## Setup Instructions

### 1. IONOS AI API Configuration
- Get your API key from IONOS AI Model Hub
- Format: `Bearer your-actual-api-key-here` (NOT the JWT token)
- Endpoint: `https://openai.inference.de-txl.ionos.com/v1/chat/completions`

### 2. Workflow Installation
1. Import the JSON files into your n8n instance
2. Configure credentials for each service (Telegram, Email, etc.)
3. Update webhook URLs in your Call Assistant application
4. Test each workflow individually before going live

### 3. Available Workflows

#### basic-ionos-chat.json
- **Purpose**: Fixed version of your current Telegram bot
- **Trigger**: Telegram message
- **Output**: AI response via IONOS AI
- **Features**: Error handling, conversation context

#### sales-assistant.json
- **Purpose**: Advanced sales intelligence via webhook
- **Trigger**: Webhook from Call Assistant
- **Output**: Real-time coaching, quote generation
- **Features**: Conversation analysis, sales insights

#### call-automation.json
- **Purpose**: Post-call automation and follow-up
- **Trigger**: Webhook with call transcript
- **Output**: Email summary, calendar scheduling
- **Features**: Call analysis, automated follow-up

## Integration with Call Assistant

### Webhook URLs
Add these webhook URLs to your Call Assistant configuration:

```typescript
const WEBHOOK_URLS = {
  salesAssistant: "https://your-n8n-instance.com/webhook/sales-assistant",
  callAutomation: "https://your-n8n-instance.com/webhook/call-automation"
};
```

### Payload Examples
See `webhook-examples.md` for detailed payload structures.

## Production Considerations

1. **Rate Limiting**: IONOS AI has rate limits - implement queuing for high volume
2. **Error Handling**: All workflows include fallback responses
3. **Security**: Use webhook signatures for production
4. **Monitoring**: Set up n8n alerts for failed executions
5. **Scaling**: Consider clustering n8n for high availability

## Support
- IONOS AI Documentation: https://docs.ionos.com/ai/
- N8N Documentation: https://docs.n8n.io/
- Call Assistant Integration: See webhook examples