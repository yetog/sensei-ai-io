import React, { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { agentService } from "@/services/agentService";
import { datasetService } from "@/services/datasetService";
import { promptLibrary, getPromptsByCategory, PromptTemplate } from "@/data/promptLibrary";
import { Sparkles, Settings, BookOpen, Copy } from "lucide-react";

export default function Agents() {
  const [name, setName] = useState("");
  const [prompt, setPrompt] = useState("");
  const [temperature, setTemperature] = useState([1]);
  const [model, setModel] = useState("gpt-4");
  const [topK, setTopK] = useState([4]);
  const [chunkSize, setChunkSize] = useState([800]);
  const [selectedDatasets, setSelectedDatasets] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [refresh, setRefresh] = useState(0);

  const agents = useMemo(() => agentService.list(), [refresh]);
  const datasets = useMemo(() => datasetService.list(), [refresh]);
  
  const filteredPrompts = useMemo(() => {
    if (selectedCategory === "all") return promptLibrary;
    return getPromptsByCategory(selectedCategory as PromptTemplate['category']);
  }, [selectedCategory]);

  const create = () => {
    if (!name.trim() || !prompt.trim()) return;
    agentService.create({ 
      name: name.trim(), 
      systemPrompt: prompt.trim(),
      temperature: temperature[0],
      model,
      datasetIds: selectedDatasets,
      topK: topK[0],
      chunkSize: chunkSize[0]
    });
    resetForm();
    setRefresh((x) => x + 1);
  };

  const resetForm = () => {
    setName("");
    setPrompt("");
    setTemperature([1]);
    setModel("gpt-4");
    setTopK([4]);
    setChunkSize([800]);
    setSelectedDatasets([]);
  };

  const useTemplate = (template: PromptTemplate) => {
    setName(template.name);
    setPrompt(template.systemPrompt);
    setTemperature([template.suggestedSettings.temperature]);
    setModel(template.suggestedSettings.model);
    setTopK([template.suggestedSettings.topK]);
    setChunkSize([template.suggestedSettings.chunkSize]);
  };

  const duplicateAgent = (agent: any) => {
    setName(`${agent.name} (Copy)`);
    setPrompt(agent.systemPrompt);
    setTemperature([agent.temperature || 1]);
    setModel(agent.model || "gpt-4");
    setTopK([agent.topK || 4]);
    setChunkSize([agent.chunkSize || 800]);
    setSelectedDatasets(agent.datasetIds || []);
  };

  const remove = (id: string) => {
    agentService.remove(id);
    setRefresh((x) => x + 1);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">AI Agents</h1>
        <p className="text-muted-foreground">Create and manage custom AI agents with specialized prompts and settings.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Agent Creation */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="templates" className="w-full">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="templates" className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Templates
              </TabsTrigger>
              <TabsTrigger value="custom" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Custom
              </TabsTrigger>
            </TabsList>

            {/* Prompt Templates */}
            <TabsContent value="templates" className="space-y-4">
              <Card className="p-4">
                <div className="flex items-center gap-3 mb-4">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold">Prompt Library</h3>
                </div>
                
                <div className="mb-4">
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Filter by category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="Writing">Writing</SelectItem>
                      <SelectItem value="Analysis">Analysis</SelectItem>
                      <SelectItem value="Coding">Coding</SelectItem>
                      <SelectItem value="Creative">Creative</SelectItem>
                      <SelectItem value="Research">Research</SelectItem>
                      <SelectItem value="Business">Business</SelectItem>
                      <SelectItem value="Teaching">Teaching</SelectItem>
                      <SelectItem value="Support">Support</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-3 max-h-96 overflow-y-auto">
                  {filteredPrompts.map((template) => (
                    <div key={template.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium">{template.name}</h4>
                          <p className="text-sm text-muted-foreground">{template.description}</p>
                        </div>
                        <Button size="sm" onClick={() => useTemplate(template)}>
                          Use Template
                        </Button>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary">{template.category}</Badge>
                        {template.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>

            {/* Custom Agent Creation */}
            <TabsContent value="custom" className="space-y-4">
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Create Custom Agent</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="agent-name">Agent Name</Label>
                    <Input 
                      id="agent-name"
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                      placeholder="e.g., Content Writer, Code Reviewer..." 
                    />
                  </div>

                  <div>
                    <Label htmlFor="system-prompt">System Prompt</Label>
                    <Textarea 
                      id="system-prompt"
                      value={prompt} 
                      onChange={(e) => setPrompt(e.target.value)} 
                      placeholder="Define the agent's role, expertise, and behavior..." 
                      rows={8} 
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Model</Label>
                      <Select value={model} onValueChange={setModel}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gpt-4">GPT-4</SelectItem>
                          <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                          <SelectItem value="claude-3">Claude 3</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Temperature: {temperature[0]}</Label>
                      <Slider
                        value={temperature}
                        onValueChange={setTemperature}
                        max={2}
                        min={0}
                        step={0.1}
                        className="mt-2"
                      />
                      <div className="text-xs text-muted-foreground mt-1">
                        Lower = more focused, Higher = more creative
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Top-K Results: {topK[0]}</Label>
                      <Slider
                        value={topK}
                        onValueChange={setTopK}
                        max={10}
                        min={1}
                        step={1}
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label>Chunk Size: {chunkSize[0]}</Label>
                      <Slider
                        value={chunkSize}
                        onValueChange={setChunkSize}
                        max={1500}
                        min={400}
                        step={100}
                        className="mt-2"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Linked Datasets</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2 max-h-32 overflow-y-auto">
                      {datasets.map((dataset) => (
                        <label key={dataset.id} className="flex items-center space-x-2 text-sm">
                          <input
                            type="checkbox"
                            checked={selectedDatasets.includes(dataset.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedDatasets([...selectedDatasets, dataset.id]);
                              } else {
                                setSelectedDatasets(selectedDatasets.filter(id => id !== dataset.id));
                              }
                            }}
                          />
                          <span>{dataset.name} ({dataset.fileIds.length})</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={create} disabled={!name.trim() || !prompt.trim()}>
                      Create Agent
                    </Button>
                    <Button variant="outline" onClick={resetForm}>
                      Reset
                    </Button>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Existing Agents */}
        <div>
          <Card className="p-4">
            <h3 className="font-semibold mb-4">Your Agents ({agents.length})</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {agents.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-8">
                  No agents created yet. Use a template or create a custom agent to get started.
                </div>
              ) : (
                agents.map((agent) => (
                  <div key={agent.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{agent.name}</h4>
                      <div className="flex gap-1">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => duplicateAgent(agent)}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => remove(agent.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                    
                    <div className="text-xs text-muted-foreground">
                      {agent.systemPrompt.slice(0, 120)}{agent.systemPrompt.length > 120 ? '...' : ''}
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs">
                      <Badge variant="outline">{agent.model || 'gpt-4'}</Badge>
                      <Badge variant="outline">T: {agent.temperature || 1}</Badge>
                      {agent.datasetIds && agent.datasetIds.length > 0 && (
                        <Badge variant="outline">{agent.datasetIds.length} datasets</Badge>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
