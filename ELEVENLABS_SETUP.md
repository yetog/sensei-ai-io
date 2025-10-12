# ElevenLabs Voice Agent Setup (No Backend Required)

This guide explains how to set up and use the ElevenLabs Voice Agent for real-time voice coaching directly from your frontend application.

## Prerequisites

1. **ElevenLabs Account**: Sign up at [elevenlabs.io](https://elevenlabs.io/)
2. **Voice Agent**: Create and configure a Voice Agent in the ElevenLabs dashboard

---

## Quick Setup

### Step 1: Create Voice Agent in ElevenLabs

1. Go to [ElevenLabs Dashboard](https://elevenlabs.io/) → **Conversational AI**
2. Click **Create Agent**
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
     
     Be concise, actionable, and supportive.
     ```
   - **First Message**: "Ready to coach! Start your sales call."
   - **Privacy Settings**: Make sure the agent is set to **"Public"** for client-side access
4. **Copy the Agent ID** (e.g., `agent_0501k7bc2n30fw7v2b71p1rym317`)

### Step 2: Set Up Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Add your ElevenLabs Agent ID to `.env`:
   ```env
   # ElevenLabs Voice Agent (Frontend - No Backend Required)
   VITE_ELEVEN_LABS_AGENT_ID=agent_0501k7bc2n30fw7v2b71p1rym317
   ```

   **Important Notes**:
   - Only the Agent ID is needed in the frontend
   - No API key required (we use public agent connection)
   - Make sure your agent is set to "Public" in ElevenLabs dashboard

### Step 3: Install Dependencies

**Frontend (React):**
```bash
npm install
```

### Step 4: Start the Application

**Start React Frontend:**
```bash
npm run dev
```

**That's it!** No backend server needed for the voice agent to work.

---

## Usage

1. Open the application in your browser
2. Navigate to the **Live Coaching Dashboard** (from Agents page or sidebar)
3. Click **"Start Voice Coaching"** (the pulsing button)
4. Grant microphone permission when prompted
5. The ElevenLabs Voice Agent will connect directly and start listening
6. Start your sales conversation - the agent will provide real-time coaching

---

## Features

- ✅ **Zero Duplicate Transcripts**: Server-side VAD handles all turn detection
- ✅ **Sub-Second Latency**: Real-time voice processing (<1s)
- ✅ **Audio-to-Audio Coaching**: Agent can speak coaching suggestions back to you
- ✅ **GDPR Compliant**: ElevenLabs is GDPR-certified
- ✅ **Works on Custom Domains**: Direct WebSocket connection, no backend required
- ✅ **Simple Setup**: Just add Agent ID, no API keys or backend needed
- ✅ **Visual Feedback**: Animated microphone, speaking indicators, real-time transcript
- ✅ **Session Timer**: Track coaching call duration

---

## Troubleshooting

### Issue: "Voice Agent Not Available"

**Cause**: Missing Agent ID in environment variables

**Fix**:
1. Check your `.env` file
2. Verify `VITE_ELEVEN_LABS_AGENT_ID` is set correctly
3. Make sure the agent ID starts with `agent_`
4. Restart the frontend (`npm run dev`)

### Issue: "Microphone Permission Denied"

**Cause**: Browser blocked microphone access

**Fix**:
1. Click the 🔒 icon in your browser's address bar
2. Set Microphone permission to "Allow"
3. Refresh the page
4. Click "Start Voice Coaching" again

### Issue: "Failed to Connect" or "Failed to get signed URL"

**Cause**: Agent is not set to "Public" in ElevenLabs dashboard

**Fix**:
1. Go to [ElevenLabs Dashboard](https://elevenlabs.io/)
2. Navigate to your agent's settings
3. Under **Privacy Settings**, set the agent to **"Public"**
4. Save changes
5. Try connecting again

### Issue: "Agent Not Responding"

**Cause**: Agent configuration or microphone issues

**Fix**:
1. Check that your microphone is working (test in another app)
2. Verify the agent's system prompt is configured in ElevenLabs dashboard
3. Make sure the agent's first message is set
4. Try speaking louder or closer to the microphone
5. Check browser console for error messages

### Issue: CORS Errors

**Cause**: Browser security restrictions

**Fix**:
- This should not happen with the public agent approach
- If you see CORS errors, verify your agent is set to "Public" in ElevenLabs
- Try clearing browser cache and reloading

---

## Architecture

```
React Frontend
    ↓
Direct WebSocket Connection
    ↓
ElevenLabs Voice Agent (Public Agent)
    ↓
Real-time Transcription + Coaching
    ↓
IONOS AI (for additional coaching analysis)
```

**Benefits**:
- No backend server required for voice agent
- Faster connection (no intermediate API)
- Simpler deployment (just static React app)
- Still GDPR compliant (ElevenLabs handles data)

---

## Cost Estimate

ElevenLabs Conversational AI pricing:
- **Free tier**: 10 minutes/month
- **Starter**: $11/month for 100 minutes
- **Creator**: $33/month for 500 minutes
- **Pro**: $99/month for 2000 minutes

For production sales coaching with ~10-20 calls/day (150-600 minutes/month):
**Recommended plan**: Creator ($33/month)

---

## Security & Privacy

### Agent ID Safety
- **Agent ID**: Safe to expose client-side (designed for public access)
- **API Key**: Never expose (only needed for server-side operations)

For public agents, ElevenLabs designed the Agent ID to be used directly from the frontend. This is intentional and secure - the agent itself controls what actions are allowed.

### Restrict Access (Optional)
If you need to restrict access to paid users:
- Add authentication in your React app (separate from ElevenLabs)
- Gate the LiveCoachingDashboard component behind login
- ElevenLabs will still handle the voice agent securely

### GDPR Compliance
- Audio streams through ElevenLabs (GDPR-compliant infrastructure)
- Transcriptions displayed but not persisted by default
- User can explicitly save transcripts
- Right to erasure: Clear session data button available

---

## Support

For issues or questions:
1. Check this setup guide
2. Review the troubleshooting section
3. Verify your agent is set to "Public" in ElevenLabs dashboard
4. Check ElevenLabs documentation at [docs.elevenlabs.io](https://docs.elevenlabs.io/)
5. Contact ElevenLabs support for agent-specific issues
