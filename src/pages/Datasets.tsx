import React, { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Database, FileText, Trash2, Upload } from "lucide-react";
import { datasetService } from "@/services/datasetService";
import { FileUpload } from "@/components/FileUpload";
import { useFileContext } from "@/contexts/FileContext";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function Datasets() {
  const { addFiles } = useFileContext();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>("");

  const datasets = useMemo(() => datasetService.list(), [refresh]);

  const createDataset = () => {
    if (!name.trim()) {
      toast.error("Please enter a dataset name");
      return;
    }
    datasetService.create({ name: name.trim(), description: description.trim() });
    setName("");
    setDescription("");
    setRefresh((x) => x + 1);
    toast.success("Dataset created successfully");
  };

  const remove = (id: string) => {
    datasetService.remove(id);
    setRefresh((x) => x + 1);
    toast.success("Dataset deleted successfully");
  };

  const handleFilesUploaded = (files: any[]) => {
    addFiles(files);
    
    if (selectedDatasetId) {
      const fileIds = files.map(f => f.id);
      datasetService.attachFiles(selectedDatasetId, fileIds);
      setRefresh(x => x + 1);
      toast.success(`Files added to dataset successfully`);
    } else {
      toast.success("Files uploaded. Select a dataset to add them to it.");
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Card className="bg-gradient-to-br from-card to-card/80 border-border/50 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                <Database className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">Dataset Management</CardTitle>
                <CardDescription>
                  Create and manage collections of source files for your AI agents
                </CardDescription>
              </div>
            </div>
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
              {datasets.length} datasets
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Create Dataset */}
            <div className="lg:col-span-1">
              <Card className="p-6 bg-gradient-to-br from-muted/20 to-muted/10 border-border/50">
                <div className="flex items-center gap-2 mb-4">
                  <Plus className="w-4 h-4 text-primary" />
                  <h3 className="text-lg font-semibold">Create Dataset</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Dataset Name
                    </label>
                    <Input 
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                      placeholder="e.g., Product Documentation" 
                      className="bg-input/50 border-border/50 focus:border-primary/50"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Description
                    </label>
                    <Textarea 
                      value={description} 
                      onChange={(e) => setDescription(e.target.value)} 
                      placeholder="What this dataset contains..." 
                      rows={3}
                      className="bg-input/50 border-border/50 focus:border-primary/50"
                    />
                  </div>
                  <Button 
                    onClick={createDataset} 
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                    disabled={!name.trim()}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Dataset
                  </Button>
                </div>
              </Card>
            </div>

            {/* File Upload Section */}
            <div className="lg:col-span-2">
              <Card className="p-6 bg-gradient-to-br from-card to-card/80 border-border/50 shadow-lg mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <Upload className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold">Upload Files to Dataset</h3>
                </div>
                
                {selectedDatasetId ? (
                  <div className="mb-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
                    <p className="text-sm text-primary">
                      Files will be added to: <strong>{datasets.find(d => d.id === selectedDatasetId)?.name}</strong>
                    </p>
                  </div>
                ) : (
                  <div className="mb-4 p-3 bg-muted/50 rounded-lg border border-border/30">
                    <p className="text-sm text-muted-foreground">
                      Select a dataset below to upload files directly to it
                    </p>
                  </div>
                )}
                
                <FileUpload 
                  onFilesUploaded={handleFilesUploaded}
                  projectId="datasets"
                  maxFiles={20}
                />
              </Card>
            </div>

            {/* Datasets List */}
            <div className="lg:col-span-3">
              <div className="space-y-4">
                {datasets.length === 0 ? (
                  <Card className="p-8 text-center bg-gradient-to-br from-muted/10 to-muted/5 border-border/30">
                    <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Database className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No datasets yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Create your first dataset to organize your source files for AI agents
                    </p>
                    <Button variant="outline" onClick={() => document.querySelector<HTMLInputElement>('input[placeholder*="Product"]')?.focus()}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create your first dataset
                    </Button>
                  </Card>
                 ) : (
                   <div className="grid gap-4">
                     {datasets.map((ds) => (
                       <Card 
                         key={ds.id} 
                         className={`p-4 bg-gradient-to-br from-card to-card/80 border-border/50 hover:shadow-md transition-all cursor-pointer
                           ${selectedDatasetId === ds.id ? 'ring-2 ring-primary border-primary/50' : ''}
                         `}
                         onClick={() => setSelectedDatasetId(selectedDatasetId === ds.id ? "" : ds.id)}
                       >
                         <div className="flex items-start justify-between">
                           <div className="flex-1">
                             <div className="flex items-center gap-3 mb-2">
                               <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                                 <FileText className="w-4 h-4 text-primary" />
                               </div>
                               <div>
                                 <h4 className="font-semibold text-foreground">{ds.name}</h4>
                                 <div className="flex items-center gap-2 mt-1">
                                   <Badge variant="outline" className="text-xs">
                                     {ds.fileIds.length} files
                                   </Badge>
                                   {selectedDatasetId === ds.id && (
                                     <Badge className="bg-primary text-primary-foreground text-xs">
                                       Selected for upload
                                     </Badge>
                                   )}
                                   <span className="text-xs text-muted-foreground">
                                     ID: {ds.id.slice(0, 8)}...
                                   </span>
                                 </div>
                               </div>
                             </div>
                             {ds.description && (
                               <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                                 {ds.description}
                               </p>
                             )}
                           </div>
                           <AlertDialog>
                             <AlertDialogTrigger asChild>
                               <Button 
                                 size="sm" 
                                 variant="ghost"
                                 onClick={(e) => e.stopPropagation()}
                                 className="text-destructive hover:text-destructive hover:bg-destructive/10 ml-4"
                               >
                                 <Trash2 className="w-4 h-4" />
                               </Button>
                             </AlertDialogTrigger>
                             <AlertDialogContent>
                               <AlertDialogHeader>
                                 <AlertDialogTitle>Delete Dataset</AlertDialogTitle>
                                 <AlertDialogDescription>
                                   Are you sure you want to delete "{ds.name}"? This action cannot be undone.
                                 </AlertDialogDescription>
                               </AlertDialogHeader>
                               <AlertDialogFooter>
                                 <AlertDialogCancel>Cancel</AlertDialogCancel>
                                 <AlertDialogAction
                                   onClick={() => remove(ds.id)}
                                   className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                 >
                                   Delete
                                 </AlertDialogAction>
                               </AlertDialogFooter>
                             </AlertDialogContent>
                           </AlertDialog>
                         </div>
                       </Card>
                     ))}
                   </div>
                 )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
