import React, { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { FileUpload } from "@/components/FileUpload";
import { useFileContext } from "@/contexts/FileContext";
import { getProjectFiles } from "@/services/projectFiles";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Database, Brain, MessageSquare, Sparkles } from "lucide-react";
import { IntelligenceHub } from "@/components/IntelligenceHub";
import { ConversationCenter } from "@/components/ConversationCenter";
import { ContentCreationHub } from "@/components/ContentCreationHub";
import { useChat } from "@/hooks/useChat";
import { toast } from "sonner";


export default function Workspace() {
  const { files, addFiles } = useFileContext();
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("sources");
  const [callTranscript, setCallTranscript] = useState('');
  const [isCallActive, setIsCallActive] = useState(false);
  const [lastGeneratedQuote, setLastGeneratedQuote] = useState<any>(null);

  const allFiles = useMemo(() => {
    return [...files, ...getProjectFiles()];
  }, [files]);

  const filteredFiles = useMemo(() =>
    allFiles.filter((f) => f.name.toLowerCase().includes(search.toLowerCase())),
  [allFiles, search]);

  // Mock customer info for demo
  const customerInfo = {
    company: "TechCorp Solutions",
    industry: "Technology",
    size: "Medium Business"
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-3 sm:p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6 h-auto p-1">
            <TabsTrigger value="sources" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Data Sources
            </TabsTrigger>
            <TabsTrigger value="live-ops" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Live Operations
            </TabsTrigger>
            <TabsTrigger value="content" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Content Creation
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sources">
            <Card className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Data Sources</h3>
                  <div className="text-sm text-muted-foreground">
                    {allFiles.length} files available
                  </div>
                </div>
                
                <Input
                  placeholder="Search files..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="max-w-sm"
                />
                
                <FileUpload onFilesUploaded={addFiles} projectId="default" />
                
                {filteredFiles.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-medium mb-3">Available Files ({filteredFiles.length})</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {filteredFiles.map((file) => (
                        <div key={file.id} className="p-3 border rounded-lg">
                          <div className="font-medium text-sm truncate">{file.name}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {file.size ? `${Math.round(file.size / 1024)} KB` : 'Unknown size'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="live-ops">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <IntelligenceHub 
                callTranscript={callTranscript}
                isCallActive={isCallActive}
              />
              <ConversationCenter selectedFileIds={selectedFileIds} />
            </div>
          </TabsContent>

          <TabsContent value="content">
            <ContentCreationHub 
              quoteData={lastGeneratedQuote}
              callNotes={callTranscript}
              customerInfo={customerInfo}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
