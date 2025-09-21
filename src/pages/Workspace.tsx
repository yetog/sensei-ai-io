import React, { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileUpload } from "@/components/FileUpload";
import { useFileContext } from "@/contexts/FileContext";
import { getProjectFiles } from "@/services/projectFiles";
import { MindMap } from "@/components/MindMap";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectLabel, SelectGroup } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Pause, Square, FileText, MessageSquare, Wrench, Database, Save, Trash2, Bot } from "lucide-react";
import { agentService } from "@/services/agentService";
import { datasetService } from "@/services/datasetService";
import { agentTrainingService } from "@/services/agentTrainingService";
import { useChat } from "@/hooks/useChat";
import { ChatMessage } from "@/components/ChatMessage";
import { AgentIntroduction } from "@/components/AgentIntroduction";
import { TypingIndicator } from "@/components/TypingIndicator";
import { LiveCoachingDashboard } from "@/components/LiveCoachingDashboard";

import { toast } from "sonner";


export default function Workspace() {
  const { files, addFiles, removeFile, getRelevantFileContextDetailed, getContextForFiles } = useFileContext();
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [activeAgentId, setActiveAgentId] = useState<string>("");
  
  // Check for agent selection from other pages
  useEffect(() => {
    const savedAgentId = localStorage.getItem('sensei:selectedAgentId');
    const savedTab = localStorage.getItem('sensei:workspaceTab');
    
    if (savedAgentId) {
      setActiveAgentId(savedAgentId);
      localStorage.removeItem('sensei:selectedAgentId');
    }
    
    if (savedTab) {
      setActiveTab(savedTab);
      localStorage.removeItem('sensei:workspaceTab');
    }
  }, []);
  const [activeDatasetId, setActiveDatasetId] = useState<string>("");
  const [activeTab, setActiveTab] = useState("sources");
  const [refresh, setRefresh] = useState(0);
  const [showAgentIntro, setShowAgentIntro] = useState(false);
  const agents = useMemo(() => agentService.list(), []);
  const datasets = useMemo(() => datasetService.list(), [refresh]);
  const activeAgent = useMemo(() => agents.find(a => a.id === activeAgentId), [agents, activeAgentId]);

  // Initialize agent when selected
  useEffect(() => {
    if (activeAgent) {
      agentTrainingService.initializeAgent(activeAgent);
      if (messages.length === 0) {
        setShowAgentIntro(true);
      }
    }
  }, [activeAgent?.id]);
  const activeDataset = useMemo(() => datasets.find(d => d.id === activeDatasetId), [datasets, activeDatasetId]);

  // Chat functionality
  const { messages, isLoading, sendMessage, sendQuickAction, clearChat } = useChat();
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  // Dataset functions
  const loadDataset = (datasetId: string) => {
    const dataset = datasetService.get(datasetId);
    if (dataset) {
      setSelectedFileIds(dataset.fileIds);
      setActiveDatasetId(datasetId);
      toast.success(`Loaded dataset: ${dataset.name}`);
    }
  };

  const saveAsDataset = () => {
    if (selectedFileIds.length === 0) {
      toast.error("Select some files first");
      return;
    }
    const name = prompt("Dataset name:");
    if (name?.trim()) {
      datasetService.create({ name: name.trim(), fileIds: selectedFileIds });
      setRefresh(x => x + 1);
      toast.success("Dataset created successfully");
    }
  };

  const addToDataset = (datasetId: string) => {
    if (selectedFileIds.length === 0) {
      toast.error("Select some files first");
      return;
    }
    datasetService.attachFiles(datasetId, selectedFileIds);
    setRefresh(x => x + 1);
    toast.success("Files added to dataset");
  };

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

  // Chat functions
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      let context = '';
      let usedFiles: string[] = [];

      if (selectedFileIds && selectedFileIds.length > 0) {
        const res = getContextForFiles(selectedFileIds);
        context = res.context;
        usedFiles = res.files.map(f => f.name);
      } else {
        const detail = getRelevantFileContextDetailed(inputValue);
        context = detail.context;
        usedFiles = detail.files.map(f => f.name);
      }

      // Allow chat without agent - use empty string if no agent
      const agentContext = activeAgent?.systemPrompt || '';
      const agentName = activeAgent?.name || undefined;
      sendMessage(inputValue, agentContext, context, usedFiles, selectedFileIds && selectedFileIds.length > 0 ? [] : getRelevantFileContextDetailed(inputValue).suggestions, agentName, activeAgent);
      setInputValue('');
    }
  };

  const handleQuickAction = (action: string) => {
    let context = '';
    let usedFiles: string[] = [];

    if (selectedFileIds && selectedFileIds.length > 0) {
      const res = getContextForFiles(selectedFileIds);
      context = res.context;
      usedFiles = res.files.map(f => f.name);
    } else {
      const detail = getRelevantFileContextDetailed(action);
      context = detail.context;
      usedFiles = detail.files.map(f => f.name);
    }

    // Allow quick actions without agent
    const agentContext = activeAgent?.systemPrompt || '';
    const agentName = activeAgent?.name || undefined;
    sendQuickAction(action, agentContext, context, usedFiles, selectedFileIds && selectedFileIds.length > 0 ? [] : getRelevantFileContextDetailed(action).suggestions, agentName, activeAgent);
  };

  // Allow TTS to be triggered from chat
  const handleSpeakFromChat = (text: string) => {
    setTtsText(text);
    handlePlay(text);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="sources" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Sources
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="live-coaching" className="flex items-center gap-2">
              <Bot className="w-4 h-4" />
              Live Coaching
            </TabsTrigger>
            <TabsTrigger value="tools" className="flex items-center gap-2">
              <Wrench className="w-4 h-4" />
              Tools
            </TabsTrigger>
          </TabsList>

          {/* Sources Tab */}
          <TabsContent value="sources" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Sources Management */}
              <div className="lg:col-span-2 space-y-4">
                <Card className="p-6 bg-gradient-to-br from-card to-card/80 border-border/50 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-foreground">Sources</h3>
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                      {filteredFiles.length}/{allFiles.length} files
                    </Badge>
                  </div>
                  
                  {/* Dataset Controls */}
                  <div className="mb-4 p-4 bg-muted/20 rounded-lg border border-border/30">
                    <div className="flex items-center gap-3 mb-3">
                      <Database className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">Dataset:</span>
                      <Select value={activeDatasetId || "__none__"} onValueChange={(v) => {
                        if (v === "__none__") {
                          setActiveDatasetId("");
                        } else {
                          loadDataset(v);
                        }
                      }}>
                        <SelectTrigger className="w-[200px] bg-input/50 border-border/50">
                          <SelectValue placeholder="Select dataset..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">No dataset</SelectItem>
                          {datasets.map(ds => (
                            <SelectItem key={ds.id} value={ds.id}>
                              {ds.name} ({ds.fileIds.length} files)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={saveAsDataset} className="hover:bg-primary/10">
                        <Save className="w-3 h-3 mr-1" />
                        Save as Dataset
                      </Button>
                      {activeDatasetId && (
                        <Button size="sm" variant="outline" onClick={() => addToDataset(activeDatasetId)} className="hover:bg-primary/10">
                          Add to Current
                        </Button>
                      )}
                    </div>
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

                  <ScrollArea className="h-96 pr-2">
                    <div className="space-y-3">
                      {filteredFiles.map((f) => (
                         <div key={f.id} className="group">
                           <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/20 transition-colors border border-transparent hover:border-border/50">
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
                             <Button
                               size="sm"
                               variant="ghost"
                               onClick={(e) => {
                                 e.stopPropagation();
                                 if (confirm(`Are you sure you want to delete "${f.name}"?`)) {
                                   removeFile(f.id);
                                   setSelectedFileIds(prev => prev.filter(id => id !== f.id));
                                 }
                               }}
                               className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                             >
                               <Trash2 className="w-3 h-3" />
                             </Button>
                           </div>
                         </div>
                      ))}
                    </div>
                  </ScrollArea>
                </Card>
              </div>

              {/* File Upload & Summary */}
              <div className="space-y-4">
                <FileUpload onFilesUploaded={addFiles} projectId="default" />
                
                <Card className="p-4 bg-gradient-to-br from-card to-card/80 border-border/50 shadow-lg">
                  <h4 className="text-sm font-semibold mb-3">Selection Summary</h4>
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <div>📁 {selectedFileIds.length} files selected</div>
                    {activeDataset && (
                      <div className="text-primary">🗂️ Dataset: {activeDataset.name}</div>
                    )}
                    {activeAgent && (
                      <div className="text-primary">🤖 Agent: {activeAgent.name}</div>
                    )}
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Chat Tab */}
          <TabsContent value="chat" className="space-y-4">
            <Card className="h-[600px] flex flex-col bg-gradient-to-br from-card to-card/80 border-border/50 shadow-lg">
              {/* Chat Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full pulse-purple"></div>
                  <h3 className="font-semibold">{activeAgent?.name || "AI Assistant"}</h3>
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                    {selectedFileIds.length} sources
                  </Badge>
                </div>
                 <div className="flex items-center gap-3">
                   <span className="text-sm text-muted-foreground">Agent:</span>
                   <Select
                     value={activeAgentId || undefined}
                     onValueChange={(v) => setActiveAgentId(v === "__clear__" ? "" : v)}
                   >
                     <SelectTrigger className="h-9 w-[180px] bg-input/50 border-border/50">
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
                  <Button size="sm" variant="outline" onClick={clearChat}>
                    Clear Chat
                  </Button>
                 </div>
               </div>

               {/* Active Agent Info */}
               {activeAgentId && activeAgent && (
                 <div className="p-3 bg-muted/30 border-b border-border/30">
                   <div className="flex items-center gap-2 mb-2">
                     <Bot className="w-4 h-4 text-primary" />
                     <span className="font-medium text-sm">{activeAgent.name}</span>
                     <Badge variant="outline" className="text-xs">
                       {activeAgent.model || 'gpt-4'}
                     </Badge>
                     <Badge variant="outline" className="text-xs">
                       T: {activeAgent.temperature || 1}
                     </Badge>
                   </div>
                   {activeAgent.datasetIds && activeAgent.datasetIds.length > 0 && (
                     <div className="text-xs text-muted-foreground">
                       <span className="font-medium">Linked Datasets: </span>
                       {activeAgent.datasetIds.map(id => {
                         const dataset = datasets.find(d => d.id === id);
                         return dataset ? `${dataset.name} (${dataset.fileIds.length})` : id;
                       }).join(', ')}
                     </div>
                   )}
                   <details className="text-xs text-muted-foreground mt-2">
                     <summary className="cursor-pointer hover:text-foreground">System Prompt</summary>
                     <div className="mt-1 p-2 bg-background/50 rounded text-xs whitespace-pre-wrap max-h-20 overflow-y-auto">
                       {activeAgent.systemPrompt}
                     </div>
                   </details>
                 </div>
               )}

               {/* Chat Messages */}
              <ScrollArea className="flex-1 p-4">
                {/* Agent Introduction */}
                {showAgentIntro && activeAgent && messages.length === 0 && (
                  <div className="mb-4">
                    <AgentIntroduction 
                      agent={activeAgent}
                      onStarterClick={handleQuickAction}
                      onClose={() => setShowAgentIntro(false)}
                    />
                  </div>
                )}
                
                {messages.length === 0 && !showAgentIntro && (
                  <div className="text-center text-muted-foreground py-8">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm mb-4">
                      {selectedFileIds.length > 0 
                        ? 'Ask me about your selected sources!' 
                        : 'Select some sources first to get AI assistance!'
                      }
                    </p>
                    {selectedFileIds.length > 0 && (
                      <div className="space-y-2">
                        {["Summarize the selected sources", "What are the key insights?", "Generate a summary"].map((prompt, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            className="mx-1"
                            onClick={() => handleQuickAction(prompt)}
                          >
                            {prompt}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                
                {messages.map((message) => (
                  <ChatMessage key={message.id} message={message} onSpeak={handleSpeakFromChat} />
                ))}
                
                {isLoading && (
                  <div className="flex justify-start mb-4">
                    <div className="bg-secondary rounded-lg px-4 py-2">
                      <TypingIndicator agentName={activeAgent?.name} />
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </ScrollArea>

              {/* Chat Input */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-border">
                <div className="flex space-x-2">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={selectedFileIds.length > 0 ? "Ask about your sources..." : "Select sources first..."}
                    disabled={isLoading}
                    className="flex-1"
                  />
                  <Button
                    type="submit"
                    disabled={!inputValue.trim() || isLoading}
                  >
                    Send
                  </Button>
                </div>
              </form>
            </Card>
          </TabsContent>

          {/* Tools Tab */}
          <TabsContent value="tools" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Quick Actions */}
              <Card className="p-6 bg-gradient-to-br from-card to-card/80 border-border/50 shadow-lg">
                <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
                <div className="space-y-4">
                  <Button 
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                    onClick={() => {
                      setActiveTab("chat");
                      handleQuickAction('Summarize the selected sources concisely. Use bullet points and cite files as [📄filename].');
                    }}
                    disabled={selectedFileIds.length === 0}
                  >
                    📋 Generate Summary
                  </Button>
                  <Button 
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setActiveTab("chat");
                      handleQuickAction('Extract key insights and themes from the selected sources.');
                    }}
                    disabled={selectedFileIds.length === 0}
                  >
                    💡 Extract Insights
                  </Button>
                  <Button 
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setActiveTab("chat");
                      handleQuickAction('Create an outline based on the selected sources.');
                    }}
                    disabled={selectedFileIds.length === 0}
                  >
                    📝 Create Outline
                  </Button>
                </div>
              </Card>

              {/* Mind Map */}
              <Card className="p-6 bg-gradient-to-br from-card to-card/80 border-border/50 shadow-lg">
                <h3 className="text-lg font-semibold text-foreground mb-4">🧠 Mind Map</h3>
                <div className="bg-muted/10 rounded-lg p-4 border border-border/30">
                  <MindMap root="Selected Sources" childrenLabels={selectedFileIds.map(id => allFiles.find(f => f.id === id)?.name || id)} />
                </div>
              </Card>

              {/* Text-to-Speech */}
              <Card className="lg:col-span-2 p-6 bg-gradient-to-br from-card to-card/80 border-border/50 shadow-lg">
                <h3 className="text-lg font-semibold text-foreground mb-4">🎵 Text-to-Speech</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <textarea
                      value={ttsText}
                      onChange={(e) => setTtsText(e.target.value)}
                      placeholder="Type or paste text to preview speech..."
                      className="w-full h-32 rounded-lg bg-input/50 border border-border/50 p-3 text-sm resize-none focus:border-primary/50 transition-colors"
                    />
                    
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
                      >
                        <Pause className="w-4 h-4"/>
                      </Button>
                      <Button 
                        onClick={handleStop} 
                        variant="outline"
                        size="sm"
                      >
                        <Square className="w-4 h-4"/>
                      </Button>
                      {isPlaying && <div className="ml-2 w-2 h-2 bg-primary rounded-full pulse-purple"></div>}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground min-w-[50px]">Speed:</span>
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
                      <span className="text-sm text-primary font-medium min-w-[40px]">{speed[0]}x</span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground min-w-[50px]">Voice:</span>
                      <Select value={voice} onValueChange={setVoice}>
                        <SelectTrigger className="flex-1 bg-input/50 border-border/50">
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

                    {availableVoices.length === 0 && (
                      <div className="text-xs text-muted-foreground bg-muted/20 p-2 rounded-md">
                        ⚠️ Loading speech synthesis voices...
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Live Coaching Tab */}
          <TabsContent value="live-coaching">
            <LiveCoachingDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
