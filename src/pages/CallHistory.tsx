import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Phone,
  Search,
  Eye,
  Trash2,
  Download,
  Calendar,
  User,
  Clock,
  Filter
} from 'lucide-react';
import { callSummaryStorage, type StoredCallSummary } from '@/services/callSummaryStorage';
import { useToast } from '@/hooks/use-toast';
import { PostCallSummary } from '@/components/PostCallSummary';
import { PerformanceDashboard } from '@/components/PerformanceDashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function CallHistory() {
  const [summaries, setSummaries] = useState<StoredCallSummary[]>([]);
  const [filteredSummaries, setFilteredSummaries] = useState<StoredCallSummary[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSummary, setSelectedSummary] = useState<StoredCallSummary | null>(null);
  const [showPostCallSummary, setShowPostCallSummary] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSummaries();
  }, []);

  useEffect(() => {
    filterSummaries();
  }, [summaries, searchTerm]);

  const loadSummaries = () => {
    const allSummaries = callSummaryStorage.getAllSummaries();
    setSummaries(allSummaries);
  };

  const filterSummaries = () => {
    if (!searchTerm.trim()) {
      setFilteredSummaries(summaries);
      return;
    }

    const filtered = summaries.filter(summary =>
      summary.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      summary.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      summary.callType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      summary.outcome.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredSummaries(filtered);
  };

  const handleDelete = (id: string) => {
    if (callSummaryStorage.deleteSummary(id)) {
      setSummaries(prev => prev.filter(s => s.id !== id));
      toast({
        title: "Call Deleted",
        description: "Call summary has been removed from history."
      });
    }
  };

  const handleView = (summary: StoredCallSummary) => {
    setSelectedSummary(summary);
    setShowPostCallSummary(true);
  };

  const handleDownload = (summary: StoredCallSummary) => {
    const content = `
Call Summary - ${new Date(summary.timestamp).toLocaleDateString()}

Customer: ${summary.customerName || 'N/A'}
Company: ${summary.companyName || 'N/A'}
Duration: ${summary.duration}
Call Type: ${summary.callType}
Outcome: ${summary.outcome}

Key Points:
${summary.keyPoints.map(point => `• ${point}`).join('\n')}

Objections:
${summary.objections.map(obj => `• ${obj}`).join('\n')}

Next Steps:
${summary.nextSteps.map(step => `• ${step}`).join('\n')}

Follow-up Email:
${summary.followUpEmail || 'No email generated'}
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `call-summary-${summary.customerName || 'unknown'}-${new Date(summary.timestamp).toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getOutcomeBadgeColor = (outcome: string) => {
    switch (outcome) {
      case 'closed': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'follow_up': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'quote_needed': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'demo_scheduled': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'no_interest': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-muted text-muted-foreground border-muted';
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Phone className="h-8 w-8 text-primary" />
            Call History
          </h1>
          <p className="text-muted-foreground mt-2">
            View and manage your sales call summaries and performance analytics
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-3 py-1">
          {summaries.length} Total Calls
        </Badge>
      </div>

      <Tabs defaultValue="history" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="history">Call History</TabsTrigger>
          <TabsTrigger value="performance">Performance Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="space-y-6">

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Recent Calls
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search calls..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {filteredSummaries.length > 0 ? (
            <ScrollArea className="h-[600px] w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Outcome</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSummaries.map((summary) => (
                    <TableRow key={summary.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          {formatDate(summary.timestamp)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{summary.customerName || 'Unknown'}</div>
                            {summary.companyName && (
                              <div className="text-sm text-muted-foreground">{summary.companyName}</div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{summary.callType}</Badge>
                      </TableCell>
                      <TableCell>{summary.duration}</TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={getOutcomeBadgeColor(summary.outcome)}
                        >
                          {summary.outcome.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleView(summary)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownload(summary)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(summary.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          ) : (
            <div className="text-center py-12">
              <Phone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No calls found</h3>
              <p className="text-muted-foreground">
                {searchTerm 
                  ? `No calls match "${searchTerm}"`
                  : 'Start making calls to see your history here'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Post Call Summary Modal */}
      {showPostCallSummary && selectedSummary && (
        <PostCallSummary
          callSummary={{
            duration: selectedSummary.duration,
            customerName: selectedSummary.customerName,
            callType: selectedSummary.callType,
            keyPoints: selectedSummary.keyPoints,
            objections: selectedSummary.objections,
            nextSteps: selectedSummary.nextSteps,
            outcome: selectedSummary.outcome as 'follow_up' | 'quote_needed' | 'closed' | 'no_interest' | 'demo_scheduled',
            transcriptHighlights: selectedSummary.transcriptHighlights
          }}
          onClose={() => {
            setShowPostCallSummary(false);
            setSelectedSummary(null);
          }}
          onSaveToHistory={() => {
            // Already saved, just close
            setShowPostCallSummary(false);
            setSelectedSummary(null);
          }}
        />
      )}
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <PerformanceDashboard 
            isVisible={true}
            onClose={() => {}}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}