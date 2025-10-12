# ElevenLabs Voice Agent Setup Guide

This application now uses **ElevenLabs Voice Agent** for real-time voice coaching. This replaces the previous browser-based speech recognition and eliminates duplicate transcript issues.

## Prerequisites

1. **ElevenLabs Account**: Sign up at [elevenlabs.io](https://elevenlabs.io/)
2. **API Key**: Get your API key from ElevenLabs Dashboard → Settings → API Keys
3. **Voice Agent**: Create a voice agent in ElevenLabs Dashboard → Conversational AI

## Quick Setup

### Step 1: Create Your Voice Agent

1. Go to [ElevenLabs Dashboard](https://elevenlabs.io/)
2. Navigate to **Conversational AI** → **Create Agent**
3. Configure your agent:
   - **Name**: "IONOS Sales Coach" (or your preferred name)
   - **Voice**: Select a professional voice
   - **System Prompt**:
     ```
     You are an AI sales coach for IONOS customer service agents. Your role is to:
     
     1. Listen to live sales conversations
     2. Provide real-time coaching suggestions
     3. Recommend relevant IONOS products based on customer needs
     4. Help agents handle objections and close deals
     
     Be concise, actionable, and supportive. Only speak when you have valuable coaching to offer.
     ```
   - **First Message**: "Ready to coach! Start your sales call."

4. **Copy your Agent ID** from the agent settings

### Step 2: Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Add your credentials to `.env`:
   ```env
   ELEVEN_LABS_API_KEY=your_api_key_here
   ELEVEN_LABS_AGENT_ID=your_agent_id_here
   ```

### Step 3: Install Dependencies

**Python Backend:**
```bash
pip install -r requirements.txt
```

**React Frontend:**
```bash
npm install
```

### Step 4: Start the Application

1. **Start Python backend** (in one terminal):
   ```bash
   python app.py
   ```

2. **Start React frontend** (in another terminal):
   ```bash
   npm run dev
   ```

3. Open your browser to the React app URL (usually `http://localhost:5173`)

## Usage

1. Navigate to the **Live Coaching Dashboard**
2. Click **"Start Voice Coaching"**
3. Grant microphone permission when prompted
4. Start speaking - the ElevenLabs agent will listen and provide coaching

## Features

✅ **Zero Duplicate Transcripts** - Server-side VAD eliminates duplicates  
✅ **Custom Domain Support** - Works on any domain  
✅ **GDPR Compliant** - ElevenLabs is GDPR-certified  
✅ **Sub-Second Latency** - Purpose-built for real-time voice  
✅ **Audio-to-Audio** - Agent can speak coaching suggestions  
✅ **IONOS AI Integration** - Uses IONOS AI for additional coaching analysis  

## Troubleshooting

### "Failed to get signed URL"
- **Cause**: Missing or invalid credentials
- **Fix**: Check your `.env` file and ensure `ELEVEN_LABS_API_KEY` and `ELEVEN_LABS_AGENT_ID` are correct

### "Microphone permission denied"
- **Cause**: Browser blocked microphone access
- **Fix**:
  1. Click the lock icon in your browser's address bar
  2. Select Permissions → Microphone → Allow
  3. Refresh the page

### CORS Errors
- **Cause**: Frontend and backend on different origins
- **Fix**: The Flask backend already includes CORS headers. Make sure both are running.

## API Endpoints

The Python backend provides these endpoints:

- `GET /api/voice/signed-url` - Get signed URL for ElevenLabs connection
- `GET /api/voice/agent-id` - Get configured agent ID
- `GET /api/voice/health` - Health check for voice service

## Architecture

```
React Frontend (Port 5173)
    ↓
Python Backend (Port 7860) - Flask API
    ↓
ElevenLabs Voice Agent API
    ↓
Coaching Suggestions via IONOS AI
```

## Cost Estimate

ElevenLabs Conversational AI pricing:
- **Free tier**: 10 minutes/month
- **Starter**: $11/month for 100 minutes
- **Creator**: $33/month for 500 minutes
- **Pro**: $99/month for 2000 minutes

For production sales coaching with ~10-20 calls/day (150-600 minutes/month):
**Recommended plan**: Creator ($33/month)

## Support

For issues or questions:
1. Check this setup guide
2. Review the troubleshooting section
3. Check ElevenLabs documentation at [docs.elevenlabs.io](https://docs.elevenlabs.io/)
