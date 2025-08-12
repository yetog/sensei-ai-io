import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ionosAI } from "@/services/ionosAI";
import { toast } from "sonner";

export default function Settings() {
  const [token, setToken] = useState(ionosAI.getApiToken() || "");
  return (
    <div className="p-4 space-y-4">
      <Card className="p-4 space-y-3">
        <h3 className="font-semibold">API Keys</h3>
        <label className="text-sm">IONOS AI Token</label>
        <Input type="password" value={token} onChange={(e) => setToken(e.target.value)} placeholder="Enter token" />
        <Button onClick={() => { ionosAI.setApiToken(token); toast.success("Token saved"); }}>Save</Button>
      </Card>
    </div>
  );
}
