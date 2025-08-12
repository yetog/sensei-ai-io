import React from "react";
import { Card } from "@/components/ui/card";

export default function Agents() {
  return (
    <div className="p-4 space-y-4">
      <Card className="p-4">
        <h3 className="font-semibold mb-2">Agents</h3>
        <p className="text-sm text-muted-foreground">Define chat personalities linked to datasets. (Coming soon)</p>
      </Card>
    </div>
  );
}
