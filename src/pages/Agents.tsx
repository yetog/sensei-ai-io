import React, { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { agentService } from "@/services/agentService";

export default function Agents() {
  const [name, setName] = useState("");
  const [prompt, setPrompt] = useState("");
  const [refresh, setRefresh] = useState(0);

  const agents = useMemo(() => agentService.list(), [refresh]);

  const create = () => {
    if (!name.trim() || !prompt.trim()) return;
    agentService.create({ name: name.trim(), systemPrompt: prompt.trim() });
    setName("");
    setPrompt("");
    setRefresh((x) => x + 1);
  };

  const remove = (id: string) => {
    agentService.remove(id);
    setRefresh((x) => x + 1);
  };

  return (
    <div className="p-4 space-y-4">
      <Card className="p-4">
        <h1 className="font-semibold mb-2">Agents</h1>
        <p className="text-sm text-muted-foreground mb-4">Define chat personalities linked to datasets.</p>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium mb-2">Create new agent</h3>
            <div className="space-y-2">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Agent name" />
              <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="System prompt" rows={6} />
              <Button onClick={create}>Create</Button>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">Your agents</h3>
            <div className="space-y-2">
              {agents.length === 0 && (
                <div className="text-sm text-muted-foreground">No agents yet. Create one on the left and use it from Workspace.</div>
              )}
              {agents.map((a) => (
                <div key={a.id} className="rounded border p-3">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{a.name}</div>
                    <Button size="sm" variant="outline" onClick={() => remove(a.id)}>Delete</Button>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2 whitespace-pre-wrap">
                    {a.systemPrompt.slice(0, 240)}{a.systemPrompt.length > 240 ? '…' : ''}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
