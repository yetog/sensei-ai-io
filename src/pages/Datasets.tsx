import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function Datasets() {
  return (
    <div className="p-4 space-y-4">
      <Card className="p-4">
        <h3 className="font-semibold mb-2">Datasets</h3>
        <p className="text-sm text-muted-foreground">Create and manage collections of source files. (Coming soon)</p>
      </Card>
    </div>
  );
}
