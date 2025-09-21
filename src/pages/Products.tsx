import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, ExternalLink, Edit, Trash2, FileText } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Map } from 'lucide-react';
import { MindMap } from '@/components/MindMap';
import { KnowledgeBaseManager } from '@/components/KnowledgeBaseManager';

interface Product {
  id: string;
  name: string;
  description: string;
  marketSegment: string;
  productLink: string;
  pitch: string;
  category: string;
}

const Products = () => {
  const [products, setProducts] = useState<Product[]>([
    {
      id: '1',
      name: 'DOMAINS',
      description: 'A domain name is your website\'s address on the internet.',
      marketSegment: 'Small businesses, entrepreneurs',
      productLink: 'https://example.com/domains',
      pitch: 'Get your own domain name today and start building your online presence.',
      category: 'Web Services'
    },
    {
      id: '2',
      name: 'STANDARD SSL',
      description: 'A standard SSL certificate encrypts the data that is transferred between your website and your visitors\' browsers.',
      marketSegment: 'E-commerce, financial services',
      productLink: 'https://example.com/ssl',
      pitch: 'Secure your website with a standard SSL certificate and give your visitors peace of mind.',
      category: 'Security'
    }
  ]);

  const [isOpen, setIsOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    marketSegment: '',
    productLink: '',
    pitch: '',
    category: ''
  });

  const [activeView, setActiveView] = useState<'list' | 'mindmap' | 'knowledge'>('list');
  const [categories, setCategories] = useState<string[]>(['Web Services', 'Security', 'Cloud', 'AI/ML']);

  const handleSubmit = () => {
    if (editingProduct) {
      setProducts(products.map(p => 
        p.id === editingProduct.id 
          ? { ...editingProduct, ...formData }
          : p
      ));
    } else {
      const newProduct: Product = {
        id: Date.now().toString(),
        ...formData
      };
      setProducts([...products, newProduct]);
    }
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      marketSegment: '',
      productLink: '',
      pitch: '',
      category: ''
    });
    setEditingProduct(null);
    setIsOpen(false);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      marketSegment: product.marketSegment,
      productLink: product.productLink,
      pitch: product.pitch,
      category: product.category
    });
    setIsOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      setProducts(products.filter(p => p.id !== id));
    }
  };

  const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const csv = e.target?.result as string;
      const lines = csv.split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      
      const newProducts: Product[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length >= 6) {
          const product: Product = {
            id: Date.now().toString() + i,
            name: values[0] || '',
            description: values[1] || '',
            marketSegment: values[2] || '',
            productLink: values[3] || '',
            pitch: values[4] || '',
            category: values[5] || 'Uncategorized'
          };
          newProducts.push(product);
        }
      }
      
      if (newProducts.length > 0) {
        setProducts(prev => [...prev, ...newProducts]);
        const newCategories = [...new Set(newProducts.map(p => p.category).filter(Boolean))];
        setCategories(prev => [...new Set([...prev, ...newCategories])]);
        alert(`Imported ${newProducts.length} products successfully!`);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const addCategory = () => {
    const newCategory = prompt("Enter new category name:");
    if (newCategory?.trim() && !categories.includes(newCategory.trim())) {
      setCategories(prev => [...prev, newCategory.trim()]);
    }
  };

  const getProductsByCategory = () => {
    const grouped: Record<string, Product[]> = {};
    products.forEach(product => {
      const category = product.category || 'Uncategorized';
      if (!grouped[category]) grouped[category] = [];
      grouped[category].push(product);
    });
    return grouped;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Card className="bg-gradient-to-br from-card to-card/80 border-border/50 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Product Knowledge</CardTitle>
              <CardDescription>
                Manage your product information, market segments, and links
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Tabs value={activeView} onValueChange={(v) => setActiveView(v as 'list' | 'mindmap' | 'knowledge')} className="w-auto">
                <TabsList>
                  <TabsTrigger value="list">List View</TabsTrigger>
                  <TabsTrigger value="mindmap" className="flex items-center gap-2">
                    <Map className="h-4 w-4" />
                    Mind Map
                  </TabsTrigger>
                  <TabsTrigger value="knowledge" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Knowledge Base
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              
              <div className="flex items-center gap-2">
                <label htmlFor="csv-upload">
                  <Button variant="outline" asChild>
                    <span className="cursor-pointer flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      Import CSV
                    </span>
                  </Button>
                </label>
                <input
                  id="csv-upload"
                  type="file"
                  accept=".csv"
                  onChange={handleCsvUpload}
                  className="hidden"
                />
                
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => resetForm()}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Product
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingProduct ? 'Edit Product' : 'Add New Product'}
                  </DialogTitle>
                  <DialogDescription>
                    Fill in the product details including target market segment and product link.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Product Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="Enter product name"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="What is this product?"
                      rows={3}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="marketSegment">Market Segment</Label>
                    <Input
                      id="marketSegment"
                      value={formData.marketSegment}
                      onChange={(e) => setFormData({...formData, marketSegment: e.target.value})}
                      placeholder="End clients with most demand (e.g., small businesses, enterprises)"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="productLink">Product Link</Label>
                    <Input
                      id="productLink"
                      type="url"
                      value={formData.productLink}
                      onChange={(e) => setFormData({...formData, productLink: e.target.value})}
                      placeholder="https://example.com/product"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="pitch">Sales Pitch</Label>
                    <Textarea
                      id="pitch"
                      value={formData.pitch}
                      onChange={(e) => setFormData({...formData, pitch: e.target.value})}
                      placeholder="Your compelling sales pitch for this product"
                      rows={3}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="category">Category</Label>
                    <div className="flex gap-2">
                      <Select
                        value={formData.category}
                        onValueChange={(value) => setFormData({...formData, category: value})}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button type="button" variant="outline" onClick={addCategory}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button onClick={handleSubmit}>
                    {editingProduct ? 'Update Product' : 'Add Product'}
                  </Button>
                </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {activeView === 'list' ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Market Segment</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Pitch</TableHead>
                    <TableHead>Link</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
              <TableBody>
                {products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 bg-muted/20 rounded-full flex items-center justify-center">
                          <Plus className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <div>
                          <h3 className="font-medium text-foreground">No products yet</h3>
                          <p className="text-sm text-muted-foreground">Add your first product to get started</p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="max-w-xs">
                        <div className="truncate" title={product.description}>
                          {product.description}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{product.marketSegment}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{product.category}</Badge>
                      </TableCell>
                      <TableCell className="max-w-sm">
                        <div className="truncate" title={product.pitch}>
                          {product.pitch}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                        >
                          <a 
                            href={product.productLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Visit
                          </a>
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(product)}
                            className="hover:bg-primary/10"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(product.id)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          ) : activeView === 'mindmap' ? (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Product Mind Map</h3>
                <p className="text-sm text-muted-foreground">
                  Visual representation of your products grouped by categories
                </p>
              </div>
              
              {Object.keys(getProductsByCategory()).length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Map className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <h3 className="font-medium text-foreground">No products yet</h3>
                  <p className="text-sm text-muted-foreground">Add products to see them in the mind map</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {Object.entries(getProductsByCategory()).map(([category, categoryProducts]) => (
                    <div key={category} className="space-y-4">
                      <h4 className="text-md font-semibold text-primary border-b border-border/50 pb-2">
                        {category} ({categoryProducts.length} products)
                      </h4>
                      <MindMap
                        root={category}
                        childrenLabels={categoryProducts.map(p => p.name)}
                        width={800}
                        height={250}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : activeView === 'knowledge' ? (
            <KnowledgeBaseManager />
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
};

export default Products;