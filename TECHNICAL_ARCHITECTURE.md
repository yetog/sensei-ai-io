# Technical Architecture Documentation

## 1. System Overview

**Technology Stack:**
- **Frontend**: React 18, TypeScript, Vite, TailwindCSS
- **Backend**: Python (Flask/Gradio), MCP (Model Context Protocol)
- **AI Services**: IONOS AI (Meta-Llama-3.1-8B), ElevenLabs Conversational AI
- **Storage**: localStorage (client-side), CSV files (products)

**Architecture Pattern**: Hybrid frontend-backend with MCP integration

**Key Features:**
- Real-time voice coaching during customer calls
- RAG-powered chat with file context
- Customizable AI agents with system prompts
- Post-call analysis and automated follow-up emails
- Voice-to-text input for chat

---

## 2. Core Components Architecture

### 2.1 RAG (Retrieval-Augmented Generation) System

**Location**: `src/contexts/FileContext.tsx`, `src/services/fileService.ts`

**Purpose**: Intelligent file upload, parsing, and context retrieval for AI interactions

**Key Features:**
- Semantic file search with Levenshtein distance scoring
- Context caching (30-second TTL) to reduce redundant processing
- Product-aware CSV parsing for IONOS products
- Dynamic context window management (max 2000-3000 chars)
- Duplicate content detection

**Technical Flow:**
```
User uploads file → fileService.processFile() → Extract text/products → 
Store in localStorage → FileContext indexes content → 
Search query → Semantic ranking → Return top 3 relevant files → 
Build context string → Send to AI
```

**Key Methods:**
- `searchFiles(query)`: Fuzzy matching + content scoring
- `getRelevantFileContextDetailed()`: Smart context extraction with caching
- `getContextForFiles(fileIds)`: Get content for specific file IDs

**Files:**
- `src/contexts/FileContext.tsx` - Main context provider
- `src/services/fileService.ts` - File processing logic
- `src/services/productParser.ts` - CSV product parsing
- `src/services/pdfProcessor.ts` - PDF text extraction

---

### 2.2 Hybrid AI System

**Location**: `src/services/hybridAI.ts`

**Purpose**: Intelligent routing between local and cloud AI for optimal latency/accuracy

**Architecture:**
- **Local-first**: Attempts local AI first (2s timeout)
- **Cloud fallback**: Falls back to IONOS AI if local fails
- **Smart product matching**: Extracts relevant products based on conversation topics

**Technical Flow:**
```
Coaching request → Check local AI availability → Try local generation (2s timeout) →
If fail/timeout → Cloud AI (IONOS) → Apply feedback learning → Return suggestion
```

**Key Features:**
- Topic detection (domain, email, security, hosting, website)
- Contextual product filtering (reduces full CSV to relevant products only)
- Feedback learning integration to improve suggestions
- Performance tracking (local vs cloud success rates)

**Files:**
- `src/services/hybridAI.ts` - Main hybrid routing logic
- `src/services/localAI.ts` - Local AI integration (Transformers.js)
- `src/services/ionosAI.ts` - IONOS AI API client

---

### 2.3 ElevenLabs Voice Agent Integration

**Location**: `src/hooks/useElevenLabsVoiceAgent.ts`

**Purpose**: Real-time voice-to-voice conversations with AI

**Technical Stack:**
- ElevenLabs Conversational AI WebSocket API
- React hooks for state management
- Web Audio API for playback

**Flow:**
```
User speaks → Microphone capture → ElevenLabs API (WebSocket) →
AI response (audio + transcript) → Play audio + Display transcript →
Generate coaching suggestions in parallel
```

**Key Features:**
- Automatic agent initialization with signed URLs
- Real-time audio streaming (no buffering)
- Transcript capture for coaching analysis
- Mode detection (listening vs speaking)
- Error recovery with user feedback

**Configuration:**
- `VITE_ELEVEN_LABS_AGENT_ID` - Agent ID from ElevenLabs dashboard
- `ELEVENLABS_API_KEY` - API key for authentication

**Files:**
- `src/hooks/useElevenLabsVoiceAgent.ts` - WebSocket client hook
- `services/elevenlabs_voice_service.py` - Python backend wrapper

---

### 2.4 Real-Time Coaching System

**Location**: `src/hooks/useRealTimeCoachingWithElevenLabs.ts`, `src/components/LiveCoachingDashboard.tsx`

**Purpose**: Provide live coaching suggestions during customer calls

**Architecture:**
- Integrates with ElevenLabs voice agent
- Uses IONOS AI for coaching generation
- Tracks session metrics (duration, suggestions, transcription)

**Coaching Flow:**
```
Voice agent transcript → Filter short/irrelevant → Build context (last 5 exchanges) →
Send to IONOS AI with coaching prompt → Parse structured response →
Display coaching card with type/priority → Agent can dismiss/rate
```

**Suggestion Types:**
- `objection` - Handle customer objections
- `product_pitch` - Suggest specific products
- `closing` - Move conversation toward close
- `retention` - Strengthen customer relationship
- `general` - General coaching tips

**Coaching Prompt Structure:**
```typescript
systemPrompt: "You are a real-time sales coaching assistant..."
context: "Last 5 conversation exchanges + relevant products"
request: "Provide actionable coaching suggestion"
```

**Files:**
- `src/hooks/useRealTimeCoachingWithElevenLabs.ts` - Coaching logic
- `src/components/LiveCoachingDashboard.tsx` - Coaching UI
- `src/components/AnimatedSuggestionCard.tsx` - Suggestion display

---

### 2.5 Post-Call Summary & Follow-Up

**Location**: `src/components/PostCallSummary.tsx`

**Purpose**: Automatic call analysis and personalized follow-up email generation

**Key Features:**
- Conversation data extraction (customer name, company, pain points, outcomes)
- AI-powered email generation using extracted data
- Email template library with variable substitution
- Case notes generation for CRM
- Call history persistence

**Technical Flow:**
```
Call ends → Analyze transcript with IONOS AI → Extract structured data (JSON) →
Load email template → Fill variables with extracted data → 
AI generates personalized email → User reviews/edits → Save to call history
```

**Extracted Data Structure:**
```typescript
{
  customerName: string;
  companyName: string;
  painPoints: string[];
  desiredOutcomes: string[];
  productsDiscussed: string[];
  nextSteps: string[];
}
```

**Files:**
- `src/components/PostCallSummary.tsx` - Summary UI & logic
- `src/services/callSummaryStorage.ts` - Persistence layer
- `src/services/callHistoryService.ts` - Call history management

---

### 2.6 MCP (Model Context Protocol) Server

**Location**: `mcp/server.py`, `mcp/context_manager.py`

**Purpose**: Central coordination point for resources, tools, and context

**Architecture:**
- Resource management (ProjectResource, TTSResource, AIResource)
- Tool execution with context tracking
- Activity logging for all operations

**Key Components:**
- `MCPResource` - Base class for registerable resources
- `MCPTool` - Base class for executable tools
- `MCPContext` - Manages application state and activity history

**Context Flow:**
```
User action → Update MCP context → Sync to session_data →
Trigger callbacks → Update UI → Log activity
```

**Files:**
- `mcp/server.py` - Main MCP server
- `mcp/context_manager.py` - Unified context manager
- `mcp/resources/ai_resource.py` - AI service resource
- `mcp/resources/tts_resource.py` - TTS resource
- `mcp/resources/project_resource.py` - Project resource

---

### 2.7 AI Service Integration

**Frontend** (`src/services/ionosAI.ts`):
- Chat completions with system prompts
- US pricing enforcement (USD, not EUR)
- Coaching-specific prompts with structured output format
- Image generation support (DALL-E)

**Backend** (`services/ai_service.py`):
- Wraps IONOS AI API
- Provides MCP resource interface
- Handles script improvement and content generation

**API Configuration:**
```typescript
const DEFAULT_API_TOKEN = "io-..."; // Default IONOS token
const API_ENDPOINT = "https://api.ionos.space/v1";
const MODEL = "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo";
```

**Files:**
- `src/services/ionosAI.ts` - Frontend AI client
- `services/ai_service.py` - Backend AI service
- `core/config.py` - Configuration management

---

## 3. Key Technical Patterns

### 3.1 Voice-to-Text Chat Input

**Implementation**: `src/hooks/useVoiceInput.ts`, `src/utils/voiceInput.ts`

**Browser API**: Web Speech Recognition API

**Features:**
- Continuous recognition mode
- Interim results display
- Final transcript capture
- Browser compatibility checks (Chrome/Edge only)
- Error handling with user feedback (toasts)

**Usage:**
```typescript
const { isRecording, transcript, startRecording, stopRecording } = useVoiceInput({
  onTranscript: (text, isFinal) => {
    if (isFinal) {
      setInputValue(text);
    }
  }
});
```

---

### 3.2 Agent System

**Location**: `src/services/agentService.ts`

**Purpose**: Customizable AI personas for different use cases

**Agent Types:**
- **Sales Coach** - Real-time sales guidance
- **Technical Support** - Product troubleshooting
- **Product Specialist** - Deep product knowledge
- **General Assistant** - All-purpose helper

**Agent Structure:**
```typescript
interface Agent {
  id: string;
  name: string;
  type: string;
  description: string;
  systemPrompt: string;
  icon: string;
  color: string;
}
```

**Training Integration:**
- Agents can be trained with datasets
- Training adds file context to agent's knowledge base
- System prompt augmentation with trained data

**Files:**
- `src/services/agentService.ts` - Agent CRUD operations
- `src/services/agentTrainingService.ts` - Training logic
- `src/components/AgentSelector.tsx` - Agent selection UI

---

### 3.3 Dataset Management

**Location**: `src/services/datasetService.ts`

**Purpose**: Manage collections of files for training/context

**Features:**
- Create/update/delete datasets
- Associate files with datasets
- Dataset-based agent training
- Metadata tracking (file count, size, word count)

**Dataset Structure:**
```typescript
interface Dataset {
  id: string;
  name: string;
  description?: string;
  fileIds: string[];
  createdAt: Date;
  updatedAt: Date;
}
```

**Files:**
- `src/services/datasetService.ts` - Dataset management
- `src/pages/Datasets.tsx` - Dataset UI

---

### 3.4 Call History & Analytics

**Location**: `src/services/callHistoryService.ts`

**Purpose**: Persistent storage and analysis of past calls

**Data Stored:**
- Full transcript
- Coaching suggestions applied
- Call outcome (closed, follow-up, demo scheduled, etc.)
- Duration, type, customer info
- Follow-up email sent
- Key points and objections

**Call Record Structure:**
```typescript
interface CallRecord {
  id: string;
  date: Date;
  duration: number;
  type: 'inbound' | 'outbound';
  outcome: string;
  transcript: string;
  suggestions: CoachingSuggestion[];
  customerInfo: CustomerData;
  followUpEmail?: string;
}
```

**Files:**
- `src/services/callHistoryService.ts` - Call history management
- `src/pages/CallHistory.tsx` - Call history UI

---

## 4. Data Flow Diagrams

### 4.1 Live Coaching Session Flow

```
┌─────────────┐
│   User UI   │
└──────┬──────┘
       │ Start Coaching
       ▼
┌─────────────────────────┐
│ LiveCoachingDashboard   │
└──────┬──────────────────┘
       │ Initialize
       ▼
┌──────────────────────────────┐
│ useRealTimeCoachingWithElevenLabs │
└──────┬───────────────────────┘
       │ Start ElevenLabs Agent
       ▼
┌──────────────────────────┐     ┌────────────────┐
│ useElevenLabsVoiceAgent  │────→│  ElevenLabs    │
└──────┬───────────────────┘     │  WebSocket API │
       │                          └────────────────┘
       │ Transcript Event
       ▼
┌──────────────────────────┐
│ processTranscriptionForCoaching │
└──────┬───────────────────┘
       │ Generate Suggestion
       ▼
┌──────────────────────────┐     ┌────────────────┐
│   hybridAI Service       │────→│   IONOS AI     │
└──────┬───────────────────┘     │   (Cloud)      │
       │                          └────────────────┘
       │ Coaching Suggestion
       ▼
┌──────────────────────────┐
│ Display SuggestionCard   │
└──────────────────────────┘
```

### 4.2 RAG-Powered Chat Flow

```
┌─────────────┐
│   User UI   │
└──────┬──────┘
       │ Send Message + Select Sources
       ▼
┌──────────────────────────┐
│    useChat Hook          │
└──────┬───────────────────┘
       │ Get Context
       ▼
┌──────────────────────────┐
│  FileContext             │
│  getContextForFiles()    │
└──────┬───────────────────┘
       │ Build Context String
       │ (Smart filtering, caching)
       ▼
┌──────────────────────────┐
│  ionosAI.sendMessage()   │
│  + System Prompt         │
│  + Context               │
│  + User Message          │
└──────┬───────────────────┘
       │ API Call
       ▼
┌──────────────────────────┐
│   IONOS AI API           │
│   (Meta-Llama-3.1-8B)    │
└──────┬───────────────────┘
       │ AI Response
       ▼
┌──────────────────────────┐
│  Display in Chat         │
│  + Show Used Files       │
└──────────────────────────┘
```

---

## 5. Performance Optimizations

### 5.1 Context Caching
- **Location**: `FileContext.tsx`
- **Mechanism**: Map-based cache with 30-second TTL
- **Impact**: Reduces redundant file processing by ~70%

### 5.2 Hybrid AI Routing
- **Local-first strategy**: Attempts fast local AI (2s timeout) before cloud
- **Expected latency**: 200-500ms (local) vs 1-3s (cloud)
- **Fallback logic**: Automatic cloud fallback on local failure

### 5.3 Smart Product Filtering
- **Problem**: Full IONOS product CSV = 50-100KB of context
- **Solution**: Topic detection → filter to relevant products only
- **Impact**: Reduces context size by 60-80%, improves AI accuracy

### 5.4 Duplicate Detection
- **Location**: `duplicateDetection.ts`
- **Mechanism**: Content normalization + Set-based deduplication
- **Impact**: Prevents redundant context in multi-file scenarios

---

## 6. Key Files Reference

### Frontend Core
- `src/pages/Workspace.tsx` - Main workspace with sources, chat, coaching
- `src/contexts/FileContext.tsx` - RAG file management system
- `src/services/ionosAI.ts` - IONOS AI API client
- `src/services/hybridAI.ts` - Local/cloud AI routing
- `src/hooks/useChat.ts` - Chat state management
- `src/hooks/useRealTimeCoachingWithElevenLabs.ts` - Voice coaching
- `src/hooks/useVoiceInput.ts` - Voice-to-text for chat

### Components
- `src/components/LiveCoachingDashboard.tsx` - Real-time coaching UI
- `src/components/PostCallSummary.tsx` - Post-call analysis
- `src/components/ChatBot.tsx` - Floating chat widget
- `src/components/MindMap.tsx` - Knowledge graph visualization

### Backend (Python)
- `mcp/server.py` - MCP server core
- `mcp/context_manager.py` - Unified context management
- `services/ai_service.py` - AI service wrapper
- `services/elevenlabs_voice_service.py` - ElevenLabs integration

---

## 7. Environment Variables

### Required Variables
```bash
# ElevenLabs (Voice Agent)
VITE_ELEVEN_LABS_AGENT_ID=your_agent_id
ELEVENLABS_API_KEY=your_api_key

# IONOS AI (already has default token)
# Optional: custom token in localStorage
```

### Installation
```bash
# Frontend
npm install

# Backend (Python)
pip install -r requirements.txt
```

### Development
```bash
# Frontend dev server
npm run dev

# Python backend (Gradio UI)
python app.py
```

---

## 8. Future Enhancements

1. **GDPR Compliance**: Data encryption, consent management, retention policies
2. **Local AI Performance**: Optimize Whisper.cpp for sub-100ms STT
3. **Advanced Analytics**: Call performance metrics, agent skill scoring
4. **Multi-language Support**: Extend beyond English
5. **Database Integration**: Replace localStorage with proper database
6. **WebRTC Streaming**: Direct browser-to-browser for lower latency
