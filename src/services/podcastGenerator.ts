import { ionosAI } from './ionosAI';
import { ttsService } from './ttsService';

interface PodcastRequest {
  topic: string;
  customerInfo?: {
    company: string;
    industry: string;
    role: string;
    challenges: string[];
  };
  meetingContext?: {
    type: string; // 'sales_call', 'demo', 'follow_up'
    objectives: string[];
    duration: number; // minutes
  };
  focus?: string[]; // areas to emphasize
}

interface PodcastSegment {
  speaker: 'host' | 'expert';
  content: string;
  duration: number; // estimated seconds
  emphasis?: 'normal' | 'excited' | 'thoughtful';
}

interface PodcastScript {
  title: string;
  description: string;
  segments: PodcastSegment[];
  totalDuration: number;
  keyTakeaways: string[];
}

export class PodcastGenerator {
  private static instance: PodcastGenerator;

  static getInstance(): PodcastGenerator {
    if (!PodcastGenerator.instance) {
      PodcastGenerator.instance = new PodcastGenerator();
    }
    return PodcastGenerator.instance;
  }

  async generateMeetingPrep(request: PodcastRequest): Promise<PodcastScript> {
    const script = await this.createPodcastScript(request);
    return script;
  }

  async generateAudioPodcast(script: PodcastScript): Promise<{ audioUrl: string; transcript: string }> {
    const audioSegments: string[] = [];
    let transcript = `${script.title}\n\n`;

    for (const segment of script.segments) {
      // Generate TTS for each segment with different voices
      const voiceId = segment.speaker === 'host' 
        ? '9BWtsMINqrJLrRacOk9x' // Aria - engaging host
        : 'CwhRBWXzGAHq8TQ4Fs17'; // Roger - expert voice

      try {
        const audioUrl = await ttsService.generateSpeech(
          segment.content, 
          segment.speaker === 'host' ? 'marketing' : 'sales',
          { voiceId }
        );
        
        audioSegments.push(audioUrl);
        transcript += `${segment.speaker.toUpperCase()}: ${segment.content}\n\n`;
      } catch (error) {
        console.error(`Error generating audio for segment:`, error);
        // Continue with other segments
      }
    }

    // In a real implementation, you'd merge the audio segments
    // For now, return the first segment as a demo
    return {
      audioUrl: audioSegments[0] || '',
      transcript
    };
  }

  private async createPodcastScript(request: PodcastRequest): Promise<PodcastScript> {
    const prompt = this.buildPrompt(request);
    
    try {
      const response = await ionosAI.sendMessage([
        { role: 'user', content: prompt }
      ], 'Sales Agent');

      return this.parseScriptResponse(response, request);
    } catch (error) {
      console.error('Error generating podcast script:', error);
      return this.getFallbackScript(request);
    }
  }

  private buildPrompt(request: PodcastRequest): string {
    const customerContext = request.customerInfo ? `
Customer Information:
- Company: ${request.customerInfo.company}
- Industry: ${request.customerInfo.industry}
- Role: ${request.customerInfo.role}
- Challenges: ${request.customerInfo.challenges.join(', ')}
` : '';

    const meetingContext = request.meetingContext ? `
Meeting Details:
- Type: ${request.meetingContext.type}
- Objectives: ${request.meetingContext.objectives.join(', ')}
- Duration: ${request.meetingContext.duration} minutes
` : '';

    return `
Create a conversational podcast script for sales meeting preparation on: ${request.topic}

${customerContext}
${meetingContext}

Format as a dialogue between:
- HOST: An enthusiastic sales coach (engaging, motivational)
- EXPERT: A seasoned sales professional (practical, insightful)

Structure:
1. Introduction (30 seconds)
2. Key challenges discussion (2 minutes)
3. Strategies and approaches (3 minutes)
4. Common objections and responses (2 minutes)
5. Success tips and closing (1 minute)

Requirements:
- Natural, conversational tone
- Practical, actionable advice
- 8-10 minute total duration
- Include specific examples
- End with 3 key takeaways

Return in JSON format:
{
  "title": "Episode title",
  "description": "Brief description",
  "segments": [
    {
      "speaker": "host|expert",
      "content": "What they say",
      "duration": estimated_seconds,
      "emphasis": "normal|excited|thoughtful"
    }
  ],
  "keyTakeaways": ["takeaway1", "takeaway2", "takeaway3"]
}
`;
  }

  private parseScriptResponse(response: string, request: PodcastRequest): PodcastScript {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        return {
          title: parsed.title || `Meeting Prep: ${request.topic}`,
          description: parsed.description || 'AI-generated meeting preparation',
          segments: parsed.segments || [],
          totalDuration: parsed.segments?.reduce((total: number, seg: any) => total + (seg.duration || 30), 0) || 480,
          keyTakeaways: parsed.keyTakeaways || []
        };
      }
    } catch (error) {
      console.error('Error parsing script response:', error);
    }

    return this.getFallbackScript(request);
  }

  private getFallbackScript(request: PodcastRequest): PodcastScript {
    return {
      title: `Meeting Prep: ${request.topic}`,
      description: 'AI-generated sales meeting preparation podcast',
      segments: [
        {
          speaker: 'host',
          content: `Welcome to Meeting Prep Podcast! Today we're diving into ${request.topic}. I'm your host, and I'm excited to help you nail your upcoming meeting!`,
          duration: 15,
          emphasis: 'excited'
        },
        {
          speaker: 'expert',
          content: `Thanks for having me! When it comes to ${request.topic}, the key is preparation. Let's break down what you need to know to succeed in this meeting.`,
          duration: 20,
          emphasis: 'normal'
        },
        {
          speaker: 'host',
          content: `Absolutely! So what are the main challenges your prospects typically face in this area?`,
          duration: 10,
          emphasis: 'normal'
        },
        {
          speaker: 'expert',
          content: `Great question! The top three challenges I see are: First, lack of clear data insights. Second, inefficient processes that waste time. And third, difficulty scaling their current solutions. These pain points are your opportunity to provide value.`,
          duration: 25,
          emphasis: 'thoughtful'
        }
      ],
      totalDuration: 70,
      keyTakeaways: [
        'Understand your prospect\'s specific challenges',
        'Prepare relevant case studies and examples',
        'Practice handling common objections'
      ]
    };
  }

  async generateRolePlayScenario(request: PodcastRequest): Promise<PodcastScript> {
    // Create a role-play version where one AI plays the prospect
    const rolePlayRequest = { ...request };
    
    const prompt = `
Create a role-play podcast script where:
- HOST: Sales representative (that's the user)
- EXPERT: Plays the prospect/customer role

Topic: ${request.topic}
Customer Context: ${JSON.stringify(request.customerInfo)}

The expert should act as the customer, presenting realistic objections and questions.
This is practice for the actual meeting.

Include:
1. Introduction and context setting
2. Initial pitch scenario
3. Common objections and how to handle them
4. Difficult questions and responses
5. Closing scenarios

Make it realistic and challenging but educational.
`;

    try {
      const response = await ionosAI.sendMessage([
        { role: 'user', content: prompt }
      ], 'Sales Agent');

      return this.parseScriptResponse(response, request);
    } catch (error) {
      console.error('Error generating role-play script:', error);
      return this.getFallbackScript(request);
    }
  }
}

export const podcastGenerator = PodcastGenerator.getInstance();