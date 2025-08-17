import React, { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileUpload } from "@/components/FileUpload";
import { useFileContext } from "@/contexts/FileContext";
import { getProjectFiles } from "@/services/projectFiles";
import { ChatBot } from "@/components/ChatBot";
import { MindMap } from "@/components/MindMap";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectLabel, SelectGroup } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Play, Pause, Square } from "lucide-react";
import { agentService } from "@/services/agentService";


export default function Workspace() {
  const { files, addFiles } = useFileContext();
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [activeAgentId, setActiveAgentId] = useState<string>("");
  const agents = useMemo(() => agentService.list(), []);
  const activeAgent = useMemo(() => agents.find(a => a.id === activeAgentId), [agents, activeAgentId]);

  // Combine uploaded + project files
  const allFiles = useMemo(() => {
    return [...files, ...getProjectFiles()];
  }, [files]);

  const filteredFiles = useMemo(() =>
    allFiles.filter((f) => f.name.toLowerCase().includes(search.toLowerCase())),
  [allFiles, search]);

  // Persist selected sources
  useEffect(() => {
    try {
      const raw = localStorage.getItem('sensei:selectedFileIds');
      if (raw) {
        const ids = JSON.parse(raw) as string[];
        const existing = new Set(allFiles.map(f => f.id));
        setSelectedFileIds(ids.filter(id => existing.has(id)));
      }
    } catch {}
  }, [allFiles.length]);

  useEffect(() => {
    localStorage.setItem('sensei:selectedFileIds', JSON.stringify(selectedFileIds));
  }, [selectedFileIds]);

  const toggleSelect = (id: string) => {
    setSelectedFileIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectAll = () => setSelectedFileIds(allFiles.map((f) => f.id));
  const clearAll = () => setSelectedFileIds([]);

  // TTS panel state (moved here per request)
  const [ttsText, setTtsText] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState([1]);
  const [voice, setVoice] = useState("");
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Load saved TTS preferences
  useEffect(() => {
    try {
      const savedSpeed = localStorage.getItem('sensei:ttsSpeed');
      const savedVoice = localStorage.getItem('sensei:ttsVoice');
      if (savedSpeed) setSpeed([parseFloat(savedSpeed)]);
      if (savedVoice) setVoice(savedVoice);
    } catch {}
  }, []);

  // Persist TTS preferences
  useEffect(() => {
    try { localStorage.setItem('sensei:ttsSpeed', String(speed[0])); } catch {}
  }, [speed]);
  useEffect(() => {
    try { localStorage.setItem('sensei:ttsVoice', voice); } catch {}
  }, [voice]);

  useEffect(() => {
    const loadVoices = () => {
      const voices = speechSynthesis.getVoices();
      setAvailableVoices(voices);
      if (voices.length > 0 && !voice) setVoice(voices[0].name);
    };
    loadVoices();
    speechSynthesis.onvoiceschanged = loadVoices;
  }, [voice]);

  const handlePlay = (textOverride?: string) => {
    const text = textOverride ?? ttsText;
    if (!text.trim()) return;
    if (speechSynthesis.speaking) speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    const v = availableVoices.find((x) => x.name === voice);
    if (v) utt.voice = v;
    utt.rate = speed[0];
    utt.onstart = () => setIsPlaying(true);
    utt.onend = () => setIsPlaying(false);
    utt.onerror = () => setIsPlaying(false);
    speechSynthesis.speak(utt);
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

  // Allow ChatBot to send content to TTS panel
  const handleSpeakFromChat = (text: string) => {
    setTtsText(text);
    handlePlay(text);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 max-w-7xl mx-auto">
        {/* Sources Panel */}
        <div className="lg:col-span-3 space-y-4">
          <Card className="p-6 bg-gradient-to-br from-card to-card/80 border-border/50 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Sources</h3>
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                {filteredFiles.length}/{allFiles.length} files
              </Badge>
            </div>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search files..."
              className="mb-4 bg-input/50 border-border/50 focus:border-primary/50"
            />
            <div className="flex gap-2 mb-4">
              <Button size="sm" variant="outline" onClick={selectAll} className="hover:bg-primary/10 hover:border-primary/50">
                Select all
              </Button>
              <Button size="sm" variant="outline" onClick={clearAll} className="hover:bg-destructive/10 hover:border-destructive/50">
                Clear
              </Button>
            </div>
            <div className="text-xs text-muted-foreground mb-4 p-3 bg-muted/30 rounded-md border border-border/30">
              💡 <strong>Tip:</strong> Organize sources into datasets for better management.
              <a href="/datasets" className="ml-2 text-primary hover:text-accent underline transition-colors">
                Open Datasets →
              </a>
            </div>
            <ScrollArea className="h-72 pr-2">
              <div className="space-y-3">
                {filteredFiles.map((f) => (
                  <div key={f.id} className="group">
                    <label className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/20 transition-colors cursor-pointer border border-transparent hover:border-border/50">
                      <Checkbox
                        checked={selectedFileIds.includes(f.id)}
                        onCheckedChange={() => toggleSelect(f.id)}
                        className="mt-1 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium text-foreground group-hover:text-primary transition-colors">
                          {f.name}
                        </div>
                        <div className="text-xs text-muted-foreground truncate mt-1">
                          {(f.extractedText || f.content).slice(0, 90)}...
                        </div>
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </Card>

          <FileUpload onFilesUploaded={addFiles} projectId="default" />
        </div>

        {/* Chat Panel */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="p-6 bg-gradient-to-br from-card to-card/80 border-border/50 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">AI Assistant</h3>
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">Agent:</span>
                <Select
                  value={activeAgentId || undefined}
                  onValueChange={(v) => setActiveAgentId(v === "__clear__" ? "" : v)}
                >
                  <SelectTrigger className="h-9 w-[180px] bg-input/50 border-border/50 hover:border-primary/50 transition-colors">
                    <SelectValue placeholder="No agent"/>
                  </SelectTrigger>
                  <SelectContent>
            {agents.length === 0 ? (
              <SelectGroup>
                <SelectLabel>No agents yet</SelectLabel>
              </SelectGroup>
            ) : (
              <>
                <SelectItem value="__clear__">No agent</SelectItem>
                {agents.map(a => (
                  <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                ))}
              </>
            )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="bg-muted/20 rounded-lg p-4 border border-border/30">
              <p className="text-sm text-muted-foreground mb-3">
                💬 Click the floating assistant button to start chatting. Your selected sources will provide context for the conversation.
              </p>
              <div className="flex items-center gap-4 text-xs">
                <span className="text-muted-foreground">
                  📁 <strong>{selectedFileIds.length}</strong> sources selected
                </span>
                {activeAgent && (
                  <span className="text-primary">
                    🤖 Agent: <strong>{activeAgent.name}</strong>
                  </span>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Studio Panel */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="p-6 bg-gradient-to-br from-card to-card/80 border-border/50 shadow-lg">
            <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-foreground mb-2">📋 Summary</h4>
                <p className="text-xs text-muted-foreground mb-3">Generate an AI summary of your selected sources.</p>
                <Button 
                  size="sm" 
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('chatbot:open'));
                    window.dispatchEvent(new CustomEvent('chatbot:action', { detail: { action: 'Summarize the selected sources concisely. Use bullet points and cite files as [📄filename].' } }));
                  }}
                >
                  Generate Summary
                </Button>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-card to-card/80 border-border/50 shadow-lg">
            <h3 className="text-lg font-semibold text-foreground mb-4">🧠 Mind Map</h3>
            <div className="bg-muted/10 rounded-lg p-4 border border-border/30">
              <MindMap root="Selected Sources" childrenLabels={selectedFileIds.map(id => allFiles.find(f => f.id === id)?.name || id)} />
            </div>
          </Card>

          {/* Enhanced TTS Panel */}
          <Card className="p-6 bg-gradient-to-br from-card to-card/80 border-border/50 shadow-lg">
            <h3 className="text-lg font-semibold text-foreground mb-4">🎵 Text-to-Speech</h3>
            <div className="space-y-4">
              <textarea
                value={ttsText}
                onChange={(e) => setTtsText(e.target.value)}
                placeholder="Type or paste text to preview speech..."
                className="w-full h-28 rounded-lg bg-input/50 border border-border/50 p-3 text-sm resize-none focus:border-primary/50 transition-colors"
              />
              
              {/* Playback Controls */}
              <div className="flex items-center gap-2">
                <Button 
                  onClick={() => handlePlay()} 
                  disabled={isPlaying || !ttsText.trim()}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  size="sm"
                >
                  <Play className="w-4 h-4 mr-2"/> Play
                </Button>
                <Button 
                  onClick={handlePause} 
                  variant="outline" 
                  disabled={!isPlaying}
                  size="sm"
                  className="hover:bg-muted/50"
                >
                  <Pause className="w-4 h-4"/>
                </Button>
                <Button 
                  onClick={handleStop} 
                  variant="outline"
                  size="sm"
                  className="hover:bg-destructive/10 hover:border-destructive/50"
                >
                  <Square className="w-4 h-4"/>
                </Button>
                {isPlaying && <div className="ml-2 w-2 h-2 bg-primary rounded-full pulse-purple"></div>}
              </div>

              {/* Voice Settings */}
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground min-w-[45px]">Speed:</span>
                  <div className="flex-1">
                    <Slider 
                      value={speed} 
                      onValueChange={setSpeed} 
                      max={2} 
                      min={0.5} 
                      step={0.1}
                      className="w-full" 
                    />
                  </div>
                  <span className="text-xs text-primary font-medium min-w-[35px]">{speed[0]}x</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground min-w-[45px]">Voice:</span>
                  <Select value={voice} onValueChange={setVoice}>
                    <SelectTrigger className="flex-1 bg-input/50 border-border/50 hover:border-primary/50 transition-colors">
                      <SelectValue placeholder="Select voice..."/>
                    </SelectTrigger>
                    <SelectContent>
                      {availableVoices.length === 0 ? (
                        <SelectItem value="loading" disabled>Loading voices...</SelectItem>
                      ) : (
                        availableVoices.map((v) => (
                          <SelectItem key={v.name} value={v.name}>
                            {v.name} ({v.lang})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Status indicator */}
              {availableVoices.length === 0 && (
                <div className="text-xs text-muted-foreground bg-muted/20 p-2 rounded-md">
                  ⚠️ Loading speech synthesis voices...
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Floating assistant (uses selected sources) */}
      <ChatBot selectedFileIds={selectedFileIds} activeAgentPrompt={activeAgent?.systemPrompt} onSpeak={(text) => { setTtsText(text); handlePlay(text); }} />
    </div>
  );
}
