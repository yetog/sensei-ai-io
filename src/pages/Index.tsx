import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Square, Settings, FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { ChatBot } from '@/components/ChatBot';
import { ScriptAIToolbar } from '@/components/ScriptAIToolbar';
import { useChat } from '@/hooks/useChat';
import { ionosAI } from '@/services/ionosAI';

const Index = () => {
  const [script, setScript] = useState('');
  const [notes, setNotes] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState([1]);
  const [voice, setVoice] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);
  
  const { sendQuickAction, toggleChat } = useChat();

  // Load saved data from localStorage
  useEffect(() => {
    const savedScript = localStorage.getItem('scriptvoice-script');
    const savedNotes = localStorage.getItem('scriptvoice-notes');
    
    if (savedScript) setScript(savedScript);
    if (savedNotes) setNotes(savedNotes);

    // Load available voices
    const loadVoices = () => {
      const voices = speechSynthesis.getVoices();
      setAvailableVoices(voices);
      if (voices.length > 0 && !voice) {
        setVoice(voices[0].name);
      }
    };

    loadVoices();
    speechSynthesis.onvoiceschanged = loadVoices;
  }, [voice]);

  // Save script to localStorage
  useEffect(() => {
    localStorage.setItem('scriptvoice-script', script);
    setWordCount(script.trim().split(/\s+/).filter(word => word.length > 0).length);
  }, [script]);

  // Save notes to localStorage
  useEffect(() => {
    localStorage.setItem('scriptvoice-notes', notes);
  }, [notes]);

  const handlePlay = () => {
    if (script.trim() === '') {
      toast.error('Please enter some text to play');
      return;
    }

    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(script);
    const selectedVoice = availableVoices.find(v => v.name === voice);
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    
    utterance.rate = speed[0];
    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => {
      setIsPlaying(false);
      toast.error('Speech synthesis error');
    };

    speechRef.current = utterance;
    speechSynthesis.speak(utterance);
    toast.success('Playing script...');
  };

  const handlePause = () => {
    if (speechSynthesis.speaking) {
      speechSynthesis.pause();
      setIsPlaying(false);
    }
  };

  const handleStop = () => {
    speechSynthesis.cancel();
    setIsPlaying(false);
  };

  const handleDownload = () => {
    // For now, we'll show a toast. In a real implementation, 
    // you would integrate with a TTS service that returns audio files
    toast.info('Audio download feature coming soon!');
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">
                  Script<span className="text-primary">Voice</span>
                </h1>
                <p className="text-sm text-muted-foreground">AI-Powered TTS Script Editor</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <span>Word Count:</span>
              <span className="text-primary font-semibold">{wordCount}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-140px)]">
          
          {/* Main Script Editor */}
          <div className="lg:col-span-3 space-y-6">
            {/* TTS Controls */}
            <Card className="p-6">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={handlePlay}
                    disabled={isPlaying}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Play TTS
                  </Button>
                  
                  <Button
                    onClick={handlePause}
                    variant="outline"
                    disabled={!isPlaying}
                  >
                    <Pause className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    onClick={handleStop}
                    variant="outline"
                  >
                    <Square className="w-4 h-4" />
                  </Button>

                  <Button
                    onClick={handleDownload}
                    variant="outline"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex items-center space-x-4 flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">Voice Speed:</span>
                    <div className="w-24">
                      <Slider
                        value={speed}
                        onValueChange={setSpeed}
                        max={2}
                        min={0.5}
                        step={0.1}
                        className="w-full"
                      />
                    </div>
                    <span className="text-sm text-primary min-w-0">{speed[0]}x</span>
                  </div>

                  <div className="flex items-center space-x-2 min-w-0">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">Voice:</span>
                    <Select value={voice} onValueChange={setVoice}>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Select Voice" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableVoices.map((voice) => (
                          <SelectItem key={voice.name} value={voice.name}>
                            {voice.name} ({voice.lang})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {isPlaying && (
                <div className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-primary rounded-full pulse-gold"></div>
                    <span className="text-sm text-primary">Currently playing script...</span>
                  </div>
                </div>
              )}
            </Card>

            {/* AI Toolbar */}
            <ScriptAIToolbar
              script={script}
              onQuickAction={(action) => sendQuickAction(action, script)}
              onToggleChat={toggleChat}
              disabled={!ionosAI.getApiToken()}
            />

            {/* Script Editor */}
            <Card className="flex-1 p-6">
              <div className="h-full flex flex-col">
                <div className="mb-4">
                  <h2 className="text-lg font-semibold mb-2">Script Editor</h2>
                  <p className="text-sm text-muted-foreground">
                    Enter your script here. Use clear punctuation for better TTS pronunciation.
                  </p>
                </div>
                
                <Textarea
                  placeholder="Start writing your script here..."
                  value={script}
                  onChange={(e) => setScript(e.target.value)}
                  className="flex-1 resize-none bg-input border-border text-lg leading-relaxed"
                  style={{ minHeight: '400px' }}
                />
              </div>
            </Card>
          </div>

          {/* Notes Panel */}
          <div className="lg:col-span-1">
            <Card className="h-full p-6">
              <div className="h-full flex flex-col">
                <div className="mb-4">
                  <h2 className="text-lg font-semibold mb-2">Project Notes</h2>
                  <p className="text-sm text-muted-foreground">
                    Keep track of your ideas and script notes.
                  </p>
                </div>
                
                <Textarea
                  placeholder="Add your notes here..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="flex-1 resize-none bg-input border-border"
                  style={{ minHeight: '500px' }}
                />
                
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    Notes are automatically saved locally
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Add the ChatBot component with script context */}
      <ChatBot script={script} />
    </div>
  );
};

export default Index;
