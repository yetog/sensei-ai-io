import React, { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { datasetService } from "@/services/datasetService";

export default function Datasets() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [refresh, setRefresh] = useState(0);

  const datasets = useMemo(() => datasetService.list(), [refresh]);

  const createDataset = () => {
    if (!name.trim()) return;
    datasetService.create({ name: name.trim(), description: description.trim() });
    setName("");
    setDescription("");
    setRefresh((x) => x + 1);
  };

  const remove = (id: string) => {
    datasetService.remove(id);
    setRefresh((x) => x + 1);
  };

  return (
    <div className="p-4 space-y-4">
      <Card className="p-4">
        <h1 className="font-semibold mb-2">Datasets</h1>
        <p className="text-sm text-muted-foreground mb-4">Create and manage collections of source files.</p>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium mb-2">Create new dataset</h3>
            <div className="space-y-2">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Dataset name" />
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)" />
              <Button onClick={createDataset}>Create</Button>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">Your datasets</h3>
            <div className="space-y-2">
              {datasets.length === 0 && (
                <div className="text-sm text-muted-foreground">No datasets yet. Create one on the left or from Workspace selection.</div>
              )}
              {datasets.map((ds) => (
                <div key={ds.id} className="flex items-center justify-between rounded border p-3">
                  <div>
                    <div className="font-medium">{ds.name}</div>
                    {ds.description && <div className="text-xs text-muted-foreground">{ds.description}</div>}
                    <div className="text-xs text-muted-foreground mt-1">{ds.fileIds.length} files</div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => remove(ds.id)}>Delete</Button>
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
