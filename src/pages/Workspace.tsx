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
    <div className="min-h-screen">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4">
        {/* Sources */}
        <div className="md:col-span-3 space-y-3">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Sources</h3>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{filteredFiles.length}/{allFiles.length} files</Badge>
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search files..."
                  className="h-8 w-36"
                />
              </div>
            </div>
            <div className="flex gap-2 mb-3">
              <Button size="sm" variant="outline" onClick={selectAll}>Select all</Button>
              <Button size="sm" variant="outline" onClick={clearAll}>Clear</Button>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Tip: Organize sources into datasets on the Datasets page.
              <a href="/datasets" className="ml-2 underline">Open Datasets</a>
            </p>
            <ScrollArea className="h-64 pr-2">
              <div className="space-y-2">
                {filteredFiles.map((f) => (
                  <label key={f.id} className="flex items-start gap-2 text-sm">
                    <Checkbox
                      checked={selectedFileIds.includes(f.id)}
                      onCheckedChange={() => toggleSelect(f.id)}
                    />
                    <div className="min-w-0">
                      <div className="truncate font-medium">{f.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {(f.extractedText || f.content).slice(0, 80)}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </ScrollArea>
          </Card>

          <FileUpload onFilesUploaded={addFiles} projectId="default" />
        </div>

        {/* Chat (center) */}
        <div className="md:col-span-5 space-y-3">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Chat</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Agent</span>
                <Select
                  value={activeAgentId || undefined}
                  onValueChange={(v) => setActiveAgentId(v === "__clear__" ? "" : v)}
                >
                  <SelectTrigger className="h-8 w-[200px]"><SelectValue placeholder="No agent"/></SelectTrigger>
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
            <p className="text-sm text-muted-foreground mb-2">
              Use the floating assistant button to start chatting. Selected sources will be used for context.
            </p>
            <p className="text-xs text-muted-foreground">Sources selected: {selectedFileIds.length}{activeAgent ? ` • Agent: ${activeAgent.name}` : ''}</p>
          </Card>
        </div>

        {/* Studio (right) */}
        <div className="md:col-span-4 space-y-3">
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Summary</h3>
            <p className="text-sm text-muted-foreground mb-3">Generate a quick summary of selected sources in chat.</p>
            <Button size="sm" variant="outline" onClick={() => {
              window.dispatchEvent(new CustomEvent('chatbot:open'));
              window.dispatchEvent(new CustomEvent('chatbot:action', { detail: { action: 'Summarize the selected sources concisely. Use bullet points and cite files as [📄filename].' } }));
            }}>Ask assistant to summarize</Button>
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold mb-3">Mind Map</h3>
            <MindMap root="Selected Sources" childrenLabels={selectedFileIds.map(id => allFiles.find(f => f.id === id)?.name || id)} />
          </Card>

          {/* TTS Panel */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3">TTS Preview</h3>
            <textarea
              value={ttsText}
              onChange={(e) => setTtsText(e.target.value)}
              placeholder="Type text to preview speech..."
              className="w-full h-24 rounded-md bg-input border border-border p-2 text-sm"
            />
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <Button onClick={() => handlePlay()} disabled={isPlaying}> <Play className="w-4 h-4 mr-2"/> Play</Button>
              <Button onClick={handlePause} variant="outline" disabled={!isPlaying}><Pause className="w-4 h-4"/></Button>
              <Button onClick={handleStop} variant="outline"><Square className="w-4 h-4"/></Button>
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-xs text-muted-foreground">Speed</span>
                <div className="w-24"><Slider value={speed} onValueChange={setSpeed} max={2} min={0.5} step={0.1} /></div>
                <span className="text-xs text-primary">{speed[0]}x</span>
                <Select value={voice} onValueChange={setVoice}>
                  <SelectTrigger className="w-[160px]"><SelectValue placeholder="Voice"/></SelectTrigger>
                  <SelectContent>
                    {availableVoices.map((v) => (
                      <SelectItem key={v.name} value={v.name}>{v.name} ({v.lang})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Floating assistant (uses selected sources) */}
      <ChatBot selectedFileIds={selectedFileIds} activeAgentPrompt={activeAgent?.systemPrompt} onSpeak={(text) => { setTtsText(text); handlePlay(text); }} />
    </div>
  );
}
