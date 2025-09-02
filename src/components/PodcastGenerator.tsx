import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { podcastGenerator } from '@/services/podcastGenerator';
import { toast } from 'sonner';
import { Mic, Play, Download, Clock, Users } from 'lucide-react';

interface PodcastGeneratorProps {
  onPodcastGenerated?: (podcast: any) => void;
}

export const PodcastGenerator: React.FC<PodcastGeneratorProps> = ({ onPodcastGenerated }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [generatedScript, setGeneratedScript] = useState<any>(null);
  const [generatedAudio, setGeneratedAudio] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    topic: '',
    company: '',
    industry: '',
    role: '',
    challenges: [] as string[],
    meetingType: '',
    objectives: [] as string[],
    duration: 8,
    focus: [] as string[]
  });

  const meetingTypes = [
    'sales_call', 'demo', 'follow_up', 'discovery', 'negotiation', 'closing'
  ];

  const commonChallenges = [
    'Lead Quality', 'Conversion Rate', 'Competition', 'Pricing Objections',
    'Decision Making Process', 'Budget Constraints', 'Timeline Pressure'
  ];

  const commonObjectives = [
    'Build Rapport', 'Understand Needs', 'Present Solution', 'Handle Objections',
    'Advance to Next Stage', 'Close Deal', 'Get Referrals'
  ];

  const focusAreas = [
    'Value Proposition', 'ROI Demonstration', 'Technical Details', 'Case Studies',
    'Implementation Timeline', 'Support & Training', 'Pricing Strategy'
  ];

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleArrayItem = (field: 'challenges' | 'objectives' | 'focus', item: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(item)
        ? prev[field].filter(i => i !== item)
        : [...prev[field], item]
    }));
  };

  const generateScript = async () => {
    if (!formData.topic) {
      toast.error('Please enter a meeting topic');
      return;
    }

    setIsGenerating(true);
    try {
      const request = {
        topic: formData.topic,
        customerInfo: formData.company ? {
          company: formData.company,
          industry: formData.industry,
          role: formData.role,
          challenges: formData.challenges
        } : undefined,
        meetingContext: {
          type: formData.meetingType,
          objectives: formData.objectives,
          duration: formData.duration
        },
        focus: formData.focus
      };

      const script = await podcastGenerator.generateMeetingPrep(request);
      setGeneratedScript(script);
      onPodcastGenerated?.(script);
      toast.success('Podcast script generated successfully!');
    } catch (error) {
      console.error('Script generation error:', error);
      toast.error('Failed to generate script');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateAudio = async () => {
    if (!generatedScript) {
      toast.error('Please generate a script first');
      return;
    }

    setIsGeneratingAudio(true);
    try {
      const audio = await podcastGenerator.generateAudioPodcast(generatedScript);
      setGeneratedAudio(audio);
      toast.success('Audio podcast generated successfully!');
    } catch (error) {
      console.error('Audio generation error:', error);
      toast.error('Audio generation failed. Please check your ElevenLabs API key in Settings.');
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const playAudio = () => {
    if (generatedAudio?.audioUrl) {
      const audio = new Audio(generatedAudio.audioUrl);
      audio.play();
    }
  };

  const downloadTranscript = () => {
    if (!generatedAudio?.transcript) return;

    const blob = new Blob([generatedAudio.transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meeting-prep-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Transcript downloaded!');
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
            <Mic className="w-5 h-5" />
            AI Podcast Generator
          </h3>
          <p className="text-muted-foreground">Generate dual-AI conversation podcasts for meeting preparation</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Meeting Topic *</label>
            <Input
              value={formData.topic}
              onChange={(e) => handleInputChange('topic', e.target.value)}
              placeholder="e.g., SaaS Demo for Enterprise Client"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Meeting Type</label>
              <Select value={formData.meetingType} onValueChange={(value) => handleInputChange('meetingType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select meeting type" />
                </SelectTrigger>
                <SelectContent>
                  {meetingTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Duration (minutes)</label>
              <Input
                type="number"
                value={formData.duration}
                onChange={(e) => handleInputChange('duration', parseInt(e.target.value) || 8)}
                min="5"
                max="30"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Company</label>
              <Input
                value={formData.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
                placeholder="Target company"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Industry</label>
              <Input
                value={formData.industry}
                onChange={(e) => handleInputChange('industry', e.target.value)}
                placeholder="Their industry"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Contact Role</label>
              <Input
                value={formData.role}
                onChange={(e) => handleInputChange('role', e.target.value)}
                placeholder="Decision maker role"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Expected Challenges</label>
            <div className="flex flex-wrap gap-2">
              {commonChallenges.map(challenge => (
                <Badge
                  key={challenge}
                  variant={formData.challenges.includes(challenge) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleArrayItem('challenges', challenge)}
                >
                  {challenge}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Meeting Objectives</label>
            <div className="flex flex-wrap gap-2">
              {commonObjectives.map(objective => (
                <Badge
                  key={objective}
                  variant={formData.objectives.includes(objective) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleArrayItem('objectives', objective)}
                >
                  {objective}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Focus Areas</label>
            <div className="flex flex-wrap gap-2">
              {focusAreas.map(focus => (
                <Badge
                  key={focus}
                  variant={formData.focus.includes(focus) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleArrayItem('focus', focus)}
                >
                  {focus}
                </Badge>
              ))}
            </div>
          </div>

          <Button 
            onClick={generateScript}
            disabled={isGenerating}
            className="w-full"
          >
            <Users className="w-4 h-4 mr-2" />
            {isGenerating ? 'Generating Script...' : 'Generate Podcast Script'}
          </Button>
        </div>
      </Card>

      {generatedScript && (
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Mic className="w-5 h-5" />
              {generatedScript.title}
            </h3>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {Math.round(generatedScript.totalDuration / 60)} min
              </Badge>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={generateAudio}
                disabled={isGeneratingAudio}
              >
                <Mic className="w-4 h-4 mr-2" />
                {isGeneratingAudio ? 'Generating...' : 'Generate Audio'}
              </Button>
            </div>
          </div>

          <p className="text-muted-foreground mb-4">{generatedScript.description}</p>

          <div className="space-y-3">
            <h4 className="font-medium">Conversation Script</h4>
            {generatedScript.segments?.map((segment: any, index: number) => (
              <div key={index} className="p-3 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={segment.speaker === 'host' ? 'default' : 'secondary'}>
                    {segment.speaker === 'host' ? 'Sales Coach' : 'Expert'}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {Math.round(segment.duration)}s
                  </span>
                  {segment.emphasis && segment.emphasis !== 'normal' && (
                    <Badge variant="outline" className="text-xs">
                      {segment.emphasis}
                    </Badge>
                  )}
                </div>
                <p className="text-sm">{segment.content}</p>
              </div>
            ))}
          </div>

          {generatedScript.keyTakeaways && generatedScript.keyTakeaways.length > 0 && (
            <div className="mt-4 p-4 bg-primary/5 rounded-lg">
              <h4 className="font-medium mb-2">Key Takeaways</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                {generatedScript.keyTakeaways.map((takeaway: string, index: number) => (
                  <li key={index}>• {takeaway}</li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}

      {generatedAudio && (
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Generated Audio Podcast</h3>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={playAudio}>
                <Play className="w-4 h-4 mr-2" />
                Play Audio
              </Button>
              <Button variant="outline" size="sm" onClick={downloadTranscript}>
                <Download className="w-4 h-4 mr-2" />
                Download Transcript
              </Button>
            </div>
          </div>

          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">
              🎧 Your AI-generated meeting preparation podcast is ready! 
              This features two AI voices having a natural conversation about your upcoming meeting.
            </p>
            {generatedAudio.audioUrl && (
              <audio controls className="w-full mt-3">
                <source src={generatedAudio.audioUrl} type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};