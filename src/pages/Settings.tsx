import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ionosAI } from "@/services/ionosAI";
import { toast } from "sonner";
import { HelpCircle, Users, MessageSquare, Settings as SettingsIcon, Bot, FileText, Zap } from "lucide-react";
import { ModelSelector } from "@/components/ModelSelector";
import { HybridAIStatus } from "@/components/HybridAIStatus";
import { IonosKnowledgeManager } from "@/components/IonosKnowledgeManager";

export default function Settings() {
  const [token, setToken] = useState(ionosAI.getApiToken() || "");
  
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">Configure your AI assistant and learn how to use the platform effectively</p>
      </div>

      <Tabs defaultValue="api" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="api" className="flex items-center gap-2">
            <SettingsIcon className="w-4 h-4" />
            API Configuration
          </TabsTrigger>
          <TabsTrigger value="models" className="flex items-center gap-2">
            <Bot className="w-4 h-4" />
            Models & TTS
          </TabsTrigger>
          <TabsTrigger value="help" className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4" />
            Help & Guide
          </TabsTrigger>
        </TabsList>

        <TabsContent value="api" className="space-y-4">
          <Card className="p-6 space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">API Keys</h3>
              <p className="text-sm text-muted-foreground">Configure your IONOS AI API token to enable chat functionality</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">IONOS AI Token</label>
              <Input 
                type="password" 
                value={token} 
                onChange={(e) => setToken(e.target.value)} 
                placeholder="Enter your API token" 
                className="max-w-md"
              />
            </div>
            <Button 
              onClick={() => { 
                ionosAI.setApiToken(token); 
                toast.success("API token saved successfully!"); 
              }}
              className="w-fit"
            >
              Save Token
            </Button>
          </Card>
        </TabsContent>

        <TabsContent value="models" className="space-y-4">
          <div className="space-y-6">
            <ModelSelector />
            <HybridAIStatus />
            <IonosKnowledgeManager />
          </div>
        </TabsContent>

        <TabsContent value="help" className="space-y-6">
          <Card className="p-6">
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
                <Bot className="w-5 h-5" />
                How to Use Your AI Assistant
              </h3>
              <p className="text-muted-foreground">Get the most out of your AI-powered business assistant</p>
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Getting Started
                </h4>
                <div className="space-y-2 text-sm text-muted-foreground ml-6">
                  <p>• **Configure API Token**: Add your IONOS AI token in the API Configuration tab</p>
                  <p>• **Start Chatting**: Click the chat button to begin a conversation with your AI assistant</p>
                  <p>• **Ask Anything**: No script or files required - ask questions about any business topic</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Specialized Agents
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 ml-6">
                  <div className="p-3 border rounded-lg">
                    <Badge variant="secondary" className="mb-2">Marketing</Badge>
                    <p className="text-xs text-muted-foreground">Campaigns, content creation, SEO, social media, branding strategies</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <Badge variant="secondary" className="mb-2">Sales</Badge>
                    <p className="text-xs text-muted-foreground">Lead generation, outreach, conversion optimization, sales materials</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <Badge variant="secondary" className="mb-2">Analysis</Badge>
                    <p className="text-xs text-muted-foreground">Data insights, metrics analysis, customer behavior, performance optimization</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Working with Files & Context
                </h4>
                <div className="space-y-2 text-sm text-muted-foreground ml-6">
                  <p>• **Upload Files**: Add documents, scripts, or data to provide context to your AI</p>
                  <p>• **File Analysis**: The AI will reference uploaded files in its responses</p>
                  <p>• **Source Citations**: Responses will show which files were referenced</p>
                  <p>• **Optional Context**: Files enhance responses but aren't required for basic questions</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Pro Tips
                </h4>
                <div className="space-y-2 text-sm text-muted-foreground ml-6">
                  <p>• **Be Specific**: The more context you provide, the better the AI can help</p>
                  <p>• **Use Agents**: Select specialized agents for domain-specific expertise</p>
                  <p>• **Ask Follow-ups**: Continue conversations to dive deeper into topics</p>
                  <p>• **Try Different Approaches**: Experiment with different question styles and formats</p>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
