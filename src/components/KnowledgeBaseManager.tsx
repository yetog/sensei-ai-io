import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  FileText, 
  Upload,
  Download,
  Tag,
  BookOpen,
  AlertCircle,
  Target,
  Users,
  Zap
} from 'lucide-react';
import { knowledgeBase, KnowledgeDocument } from '@/services/knowledgeBase';
import { cn } from '@/lib/utils';

export function KnowledgeBaseManager() {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [editingDoc, setEditingDoc] = useState<KnowledgeDocument | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newDoc, setNewDoc] = useState({
    title: '',
    content: '',
    type: 'general' as KnowledgeDocument['type'],
    tags: ''
  });

  useEffect(() => {
    refreshDocuments();
  }, []);

  const refreshDocuments = () => {
    setDocuments(knowledgeBase.getAllDocuments());
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = !searchQuery || 
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesType = selectedType === 'all' || doc.type === selectedType;
    
    return matchesSearch && matchesType;
  });

  const handleSaveDocument = () => {
    const tags = newDoc.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
    
    if (editingDoc) {
      knowledgeBase.updateDocument(editingDoc.id, {
        title: newDoc.title,
        content: newDoc.content,
        type: newDoc.type,
        tags
      });
    } else {
      knowledgeBase.addDocument({
        title: newDoc.title,
        content: newDoc.content,
        type: newDoc.type,
        tags
      });
    }
    
    refreshDocuments();
    setIsDialogOpen(false);
    setEditingDoc(null);
    setNewDoc({ title: '', content: '', type: 'general', tags: '' });
  };

  const handleEditDocument = (doc: KnowledgeDocument) => {
    setEditingDoc(doc);
    setNewDoc({
      title: doc.title,
      content: doc.content,
      type: doc.type,
      tags: doc.tags.join(', ')
    });
    setIsDialogOpen(true);
  };

  const handleDeleteDocument = (id: string) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      knowledgeBase.deleteDocument(id);
      refreshDocuments();
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const imported = await knowledgeBase.importFromFile(file);
      refreshDocuments();
      alert(`Successfully imported ${imported} document(s)`);
    } catch (error) {
      alert('Error importing file: ' + (error as Error).message);
    }
  };

  const handleExport = () => {
    const data = knowledgeBase.exportToJson();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `knowledge-base-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getTypeIcon = (type: KnowledgeDocument['type']) => {
    switch (type) {
      case 'objection_handling': return <AlertCircle className="h-4 w-4" />;
      case 'product_info': return <Target className="h-4 w-4" />;
      case 'pricing': return <Zap className="h-4 w-4" />;
      case 'process': return <BookOpen className="h-4 w-4" />;
      case 'competitor': return <Users className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: KnowledgeDocument['type']) => {
    switch (type) {
      case 'objection_handling': return 'bg-red-100 text-red-800';
      case 'product_info': return 'bg-blue-100 text-blue-800';
      case 'pricing': return 'bg-green-100 text-green-800';
      case 'process': return 'bg-purple-100 text-purple-800';
      case 'competitor': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Knowledge Base</h2>
          <p className="text-muted-foreground">
            Manage your coaching knowledge and reference materials
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="file"
            id="file-upload"
            className="hidden"
            accept=".json,.txt,.md"
            onChange={handleFileUpload}
          />
          <label htmlFor="file-upload">
            <Button variant="outline" size="sm" className="cursor-pointer">
              <Upload className="h-4 w-4 mr-1" />
              Import
            </Button>
          </label>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Document
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingDoc ? 'Edit Document' : 'Add New Document'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    value={newDoc.title}
                    onChange={(e) => setNewDoc({ ...newDoc, title: e.target.value })}
                    placeholder="Enter document title"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Type</label>
                  <select
                    value={newDoc.type}
                    onChange={(e) => setNewDoc({ ...newDoc, type: e.target.value as KnowledgeDocument['type'] })}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="general">General</option>
                    <option value="objection_handling">Objection Handling</option>
                    <option value="product_info">Product Information</option>
                    <option value="pricing">Pricing</option>
                    <option value="process">Process</option>
                    <option value="competitor">Competitor Info</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Tags (comma-separated)</label>
                  <Input
                    value={newDoc.tags}
                    onChange={(e) => setNewDoc({ ...newDoc, tags: e.target.value })}
                    placeholder="sales, objections, pricing"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Content</label>
                  <Textarea
                    value={newDoc.content}
                    onChange={(e) => setNewDoc({ ...newDoc, content: e.target.value })}
                    placeholder="Enter document content..."
                    rows={10}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveDocument}>
                    {editingDoc ? 'Update' : 'Add'} Document
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search documents..."
                className="pl-10"
              />
            </div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 border rounded-md min-w-[200px]"
            >
              <option value="all">All Types</option>
              <option value="objection_handling">Objection Handling</option>
              <option value="product_info">Product Information</option>
              <option value="pricing">Pricing</option>
              <option value="process">Process</option>
              <option value="competitor">Competitor Info</option>
              <option value="general">General</option>
            </select>
          </div>
          
          <div className="text-sm text-muted-foreground">
            Showing {filteredDocuments.length} of {documents.length} documents
          </div>
        </CardContent>
      </Card>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDocuments.map((doc) => (
          <Card key={doc.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {getTypeIcon(doc.type)}
                  <CardTitle className="text-base line-clamp-2">
                    {doc.title}
                  </CardTitle>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditDocument(doc)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteDocument(doc.id)}
                    className="h-8 w-8 p-0 hover:bg-red-100"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Badge className={cn("mb-3", getTypeColor(doc.type))}>
                {doc.type.replace('_', ' ')}
              </Badge>
              
              <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                {doc.content}
              </p>
              
              {doc.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {doc.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      <Tag className="h-2 w-2 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                  {doc.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{doc.tags.length - 3} more
                    </Badge>
                  )}
                </div>
              )}
              
              <div className="text-xs text-muted-foreground">
                Updated {new Date(doc.lastUpdated).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredDocuments.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No documents found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || selectedType !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Start building your knowledge base by adding your first document'
                }
              </p>
              {!searchQuery && selectedType === 'all' && (
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Your First Document
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}