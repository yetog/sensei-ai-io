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
import { Play, Pause, Square, FileText, MessageSquare, Wrench, Database, Save, Trash2, Bot, BarChart3, Headphones, Lightbulb } from "lucide-react";
import { PerformanceDashboard } from "@/components/PerformanceDashboard";
import { ObjectionHandler } from "@/components/ObjectionHandler";
import { CallAssistant } from "@/components/CallAssistant";
import { EnhancedCallIntelligence } from "@/components/EnhancedCallIntelligence";
import { GammaIntegration } from "@/components/GammaIntegration";
import { QuoteGenerator } from "@/components/QuoteGenerator";
import { BetaOnboarding } from "@/components/BetaOnboarding";
import { agentService } from "@/services/agentService";
import { datasetService } from "@/services/datasetService";
import { agentTrainingService } from "@/services/agentTrainingService";
import { useChat } from "@/hooks/useChat";
import { ChatMessage } from "@/components/ChatMessage";
import { AgentIntroduction } from "@/components/AgentIntroduction";
import { TypingIndicator } from "@/components/TypingIndicator";
import { toast } from "sonner";


export default function Workspace() {
  const { files, addFiles, removeFile, getRelevantFileContextDetailed, getContextForFiles } = useFileContext();
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [activeAgentId, setActiveAgentId] = useState<string>("");
  const [activeDatasetId, setActiveDatasetId] = useState<string>("");
  const [activeTab, setActiveTab] = useState("sources");
  const [refresh, setRefresh] = useState(0);
  const [showAgentIntro, setShowAgentIntro] = useState(false);
  const [callTranscript, setCallTranscript] = useState('');
  const [isCallActive, setIsCallActive] = useState(false);
  const [lastGeneratedQuote, setLastGeneratedQuote] = useState<any>(null);

  const agents = useMemo(() => agentService.list(), []);
  const datasets = useMemo(() => datasetService.list(), [refresh]);
  const activeAgent = useMemo(() => agents.find(a => a.id === activeAgentId), [agents, activeAgentId]);
  const activeDataset = useMemo(() => datasets.find(d => d.id === activeDatasetId), [datasets, activeDatasetId]);

  // Chat functionality
  const { messages, isLoading, sendMessage, sendQuickAction, clearChat } = useChat();
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const allFiles = useMemo(() => {
    return [...files, ...getProjectFiles()];
  }, [files]);

  const filteredFiles = useMemo(() =>
    allFiles.filter((f) => f.name.toLowerCase().includes(search.toLowerCase())),
  [allFiles, search]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-3 sm:p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 sm:grid-cols-8 mb-6 h-auto p-1">
            <TabsTrigger value="sources">Sources</TabsTrigger>
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="assistant">Calls</TabsTrigger>
            <TabsTrigger value="intelligence">AI Intelligence</TabsTrigger>
            <TabsTrigger value="objections">Objections</TabsTrigger>
            <TabsTrigger value="quotes">Quotes</TabsTrigger>
            <TabsTrigger value="gamma">Gamma</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="sources">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">File Sources</h3>
              <FileUpload onFilesUploaded={addFiles} projectId="default" />
            </Card>
          </TabsContent>

          <TabsContent value="chat">
            <Card className="h-[600px] flex flex-col">
              <div className="p-4">
                <h3 className="font-semibold">AI Chat Assistant</h3>
              </div>
              <div className="flex-1 p-4">
                <p>Chat interface here...</p>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="assistant">
            <CallAssistant />
          </TabsContent>

          <TabsContent value="intelligence">
            <EnhancedCallIntelligence 
              transcript={callTranscript}
              isActive={isCallActive}
              onInsightGenerated={(insight) => {
                toast.success(`${insight.agentType} insight: ${insight.title}`);
              }}
            />
          </TabsContent>

          <TabsContent value="objections">
            <ObjectionHandler />
          </TabsContent>

          <TabsContent value="quotes">
            <QuoteGenerator 
              onQuoteGenerated={(quote) => {
                setLastGeneratedQuote(quote);
                toast.success('Quote generated successfully!');
              }}
            />
          </TabsContent>

          <TabsContent value="gamma">
            <GammaIntegration 
              quoteData={lastGeneratedQuote}
              callNotes={'Demo call notes'}
              customerInfo={{ 
                company: "Demo Customer", 
                industry: "Technology",
                size: "Medium Business"
              }}
            />
          </TabsContent>

          <TabsContent value="performance">
            <PerformanceDashboard 
              userKPIs={{ responseTime: 2.5, pitchQuality: 85, quotesSent: 12, conversionRate: 18 }}
              teamAverage={{ responseTime: 3.2, pitchQuality: 75, quotesSent: 8, conversionRate: 15 }}
              period="daily"
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
