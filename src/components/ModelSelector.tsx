import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ttsService } from '@/services/ttsService';
import { toast } from 'sonner';
import { Bot, Volume2, Settings } from 'lucide-react';

interface ModelSelectorProps {
  className?: string;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({ className }) => {
  const [selectedModel, setSelectedModel] = useState('ionos');
  const [elevenLabsKey, setElevenLabsKey] = useState(ttsService.getApiKey() || '');
  const [isTestingTTS, setIsTestingTTS] = useState(false);

  const models = [
    {
      id: 'ionos',
      name: 'IONOS AI',
      description: 'Meta Llama 3.1 8B - Fast and capable',
      status: 'active',
      provider: 'IONOS'
    },
    {
      id: 'openai-gpt4',
      name: 'GPT-4',
      description: 'OpenAI\'s most capable model',
      status: 'coming-soon',
      provider: 'OpenAI'
    },
    {
      id: 'claude',
      name: 'Claude 3.5',
      description: 'Anthropic\'s advanced reasoning model',
      status: 'coming-soon',
      provider: 'Anthropic'
    }
  ];

  const handleSaveElevenLabsKey = async () => {
    if (!elevenLabsKey.trim()) {
      toast.error('Please enter your ElevenLabs API key');
      return;
    }
    
    try {
      await ttsService.setApiKey(elevenLabsKey);
      toast.success('ElevenLabs API key saved successfully!');
    } catch (error) {
      toast.error('Failed to save API key');
    }
  };

  const testTTS = async () => {
    if (!elevenLabsKey) {
      toast.error('Please enter and save your ElevenLabs API key first');
      return;
    }

    setIsTestingTTS(true);
    try {
      const audioUrl = await ttsService.generateSpeech(
        'Hello! This is a test of the text-to-speech system. Your AI assistant is ready to help you.',
        'marketing'
      );
      
      if (audioUrl) {
        const audio = new Audio(audioUrl);
        audio.play();
        toast.success('TTS test successful!');
      }
    } catch (error) {
      console.error('TTS test error:', error);
      toast.error('TTS test failed. Please check your API key.');
    } finally {
      setIsTestingTTS(false);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <Card className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
            <Bot className="w-5 h-5" />
            AI Model Selection
          </h3>
          <p className="text-sm text-muted-foreground">Choose your preferred AI model for chat interactions</p>
        </div>

        <div className="space-y-3">
          {models.map((model) => (
            <div
              key={model.id}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedModel === model.id 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50'
              } ${model.status === 'coming-soon' ? 'opacity-60' : ''}`}
              onClick={() => model.status === 'active' && setSelectedModel(model.id)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">{model.name}</h4>
                    <Badge variant={model.status === 'active' ? 'default' : 'secondary'}>
                      {model.status === 'active' ? 'Available' : 'Coming Soon'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{model.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">Provider: {model.provider}</p>
                </div>
                {selectedModel === model.id && (
                  <div className="w-4 h-4 rounded-full bg-primary" />
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
            <Volume2 className="w-5 h-5" />
            Text-to-Speech Configuration
          </h3>
          <p className="text-sm text-muted-foreground">Configure ElevenLabs for professional voice synthesis</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">ElevenLabs API Key</label>
            <div className="flex gap-2">
              <Input
                type="password"
                value={elevenLabsKey}
                onChange={(e) => setElevenLabsKey(e.target.value)}
                placeholder="Enter your ElevenLabs API key"
                className="flex-1"
              />
              <Button onClick={handleSaveElevenLabsKey}>
                Save
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Get your API key from{' '}
              <a 
                href="https://elevenlabs.io/speech-synthesis" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                ElevenLabs Dashboard
              </a>
            </p>
          </div>

          <Separator />

          <div className="space-y-3">
            <h4 className="font-medium">Voice Settings</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 border rounded-lg">
                <h5 className="font-medium text-sm mb-1">Marketing Agent</h5>
                <p className="text-xs text-muted-foreground">Aria - Engaging, creative voice</p>
              </div>
              <div className="p-3 border rounded-lg">
                <h5 className="font-medium text-sm mb-1">Sales Agent</h5>
                <p className="text-xs text-muted-foreground">Roger - Confident, persuasive voice</p>
              </div>
              <div className="p-3 border rounded-lg">
                <h5 className="font-medium text-sm mb-1">Analysis Agent</h5>
                <p className="text-xs text-muted-foreground">Sarah - Professional, analytical voice</p>
              </div>
            </div>
          </div>

          <Button 
            variant="outline" 
            onClick={testTTS}
            disabled={isTestingTTS || !elevenLabsKey}
            className="w-full"
          >
            <Volume2 className="w-4 h-4 mr-2" />
            {isTestingTTS ? 'Testing...' : 'Test TTS'}
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Beta Features
          </h3>
          <p className="text-sm text-muted-foreground">Experimental features for advanced users</p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <h4 className="font-medium text-sm">Quote Generation</h4>
              <p className="text-xs text-muted-foreground">AI-powered sales quote creation</p>
            </div>
            <Badge variant="secondary">Beta</Badge>
          </div>
          
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <h4 className="font-medium text-sm">Podcast Prep</h4>
              <p className="text-xs text-muted-foreground">Dual-AI meeting preparation conversations</p>
            </div>
            <Badge variant="secondary">Beta</Badge>
          </div>
          
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <h4 className="font-medium text-sm">Advanced Analytics</h4>
              <p className="text-xs text-muted-foreground">Conversation performance tracking</p>
            </div>
            <Badge variant="secondary">Coming Soon</Badge>
          </div>
        </div>
      </Card>
    </div>
  );
};