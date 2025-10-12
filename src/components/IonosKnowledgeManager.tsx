import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { IonosWebsiteScraperService } from '@/services/ionosWebsiteScraper';
import { clearScrapedKnowledge } from '@/data/ionosKnowledge';
import { RefreshCw, Key, Trash2, Database } from 'lucide-react';

export const IonosKnowledgeManager = () => {
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState('');
  const [hasApiKey, setHasApiKey] = useState(false);
  const [isScrapingInProgress, setIsScrapingInProgress] = useState(false);
  const [scrapingProgress, setScrapingProgress] = useState(0);
  const [lastScraped, setLastScraped] = useState<Date | null>(null);

  useEffect(() => {
    const existingKey = IonosWebsiteScraperService.getApiKey();
    setHasApiKey(!!existingKey);
    const lastDate = IonosWebsiteScraperService.getLastScrapedDate();
    setLastScraped(lastDate);
  }, []);

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid API key",
        variant: "destructive",
      });
      return;
    }

    const isValid = await IonosWebsiteScraperService.testApiKey(apiKey);
    
    if (isValid) {
      IonosWebsiteScraperService.saveApiKey(apiKey);
      setHasApiKey(true);
      setApiKey('');
      toast({
        title: "Success",
        description: "Firecrawl API key saved successfully",
      });
    } else {
      toast({
        title: "Error",
        description: "Invalid API key. Please check and try again.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveApiKey = () => {
    IonosWebsiteScraperService.removeApiKey();
    setHasApiKey(false);
    toast({
      title: "Success",
      description: "API key removed",
    });
  };

  const handleScrapeWebsite = async () => {
    setIsScrapingInProgress(true);
    setScrapingProgress(0);

    const result = await IonosWebsiteScraperService.scrapeIonosWebsite(
      undefined,
      (current, total) => {
        setScrapingProgress((current / total) * 100);
      }
    );

    setIsScrapingInProgress(false);

    if (result.success) {
      const lastDate = IonosWebsiteScraperService.getLastScrapedDate();
      setLastScraped(lastDate);
      toast({
        title: "Success",
        description: `Successfully scraped ${result.data?.length || 0} pages from IONOS website`,
      });
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to scrape IONOS website",
        variant: "destructive",
      });
    }
  };

  const handleClearKnowledge = () => {
    clearScrapedKnowledge();
    setLastScraped(null);
    toast({
      title: "Success",
      description: "Scraped knowledge cleared. Chatbot will use fallback knowledge.",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          IONOS Website Knowledge
        </CardTitle>
        <CardDescription>
          Auto-update chatbot training data by scraping ionos.com
          {lastScraped && (
            <span className="block mt-1 text-sm">
              Last updated: {lastScraped.toLocaleString()}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasApiKey ? (
          <div className="space-y-2">
            <label className="text-sm font-medium">Firecrawl API Key</label>
            <div className="flex gap-2">
              <Input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your Firecrawl API key"
              />
              <Button onClick={handleSaveApiKey} variant="outline">
                <Key className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Get your API key from{' '}
              <a
                href="https://www.firecrawl.dev/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                firecrawl.dev
              </a>
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">API Key configured ✓</span>
              <Button onClick={handleRemoveApiKey} variant="ghost" size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                Remove
              </Button>
            </div>

            {isScrapingInProgress && (
              <div className="space-y-2">
                <Progress value={scrapingProgress} />
                <p className="text-sm text-muted-foreground text-center">
                  Scraping IONOS website... {Math.round(scrapingProgress)}%
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleScrapeWebsite}
                disabled={isScrapingInProgress}
                className="flex-1"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isScrapingInProgress ? 'animate-spin' : ''}`} />
                {isScrapingInProgress ? 'Scraping...' : 'Update Knowledge'}
              </Button>
              
              <Button
                onClick={handleClearKnowledge}
                variant="outline"
                disabled={isScrapingInProgress || !lastScraped}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              This will scrape key pages from ionos.com to keep the chatbot up-to-date.
              Data is cached locally for 7 days.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
