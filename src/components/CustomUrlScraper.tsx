import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { UrlScraperService } from '@/services/urlScraperService';
import { UploadedFile } from '@/types/file';
import { Link2, Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CustomUrlScraperProps {
  onUrlScraped: (file: UploadedFile) => void;
}

export const CustomUrlScraper = ({ onUrlScraped }: CustomUrlScraperProps) => {
  const { toast } = useToast();
  const [url, setUrl] = useState('');
  const [isScrapingInProgress, setIsScrapingInProgress] = useState(false);

  const isValidUrl = (urlString: string): boolean => {
    try {
      const url = new URL(urlString);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const handleScrapeUrl = async () => {
    if (!url.trim()) {
      toast({
        title: "URL Required",
        description: "Please enter a URL to scrape",
        variant: "destructive",
      });
      return;
    }

    if (!isValidUrl(url)) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid HTTP or HTTPS URL",
        variant: "destructive",
      });
      return;
    }

    setIsScrapingInProgress(true);

    try {
      const result = await UrlScraperService.scrapeUrl(url);

      if (result.success && result.data) {
        toast({
          title: "Success",
          description: `Scraped ${new URL(url).hostname} successfully`,
        });
        onUrlScraped(result.data);
        setUrl('');
      } else {
        toast({
          title: "Scraping Failed",
          description: result.error || "Failed to scrape URL",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsScrapingInProgress(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isScrapingInProgress) {
      handleScrapeUrl();
    }
  };

  return (
    <Card className="p-4 bg-gradient-to-br from-card to-card/80 border-border/50 shadow-lg">
      <div className="flex items-center gap-2 mb-3">
        <Link2 className="w-4 h-4 text-primary" />
        <h4 className="text-sm font-semibold">Add Links</h4>
      </div>
      
      <p className="text-xs text-muted-foreground mb-4">
        Scrape competitor sites, documentation, or any web page to add as a source
      </p>

      <div className="space-y-3">
        <div className="flex gap-2">
          <Input
            type="url"
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isScrapingInProgress}
            className="flex-1"
          />
          <Button
            onClick={handleScrapeUrl}
            disabled={isScrapingInProgress || !url.trim()}
            size="sm"
          >
            {isScrapingInProgress ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Scraping...
              </>
            ) : (
              'Scrape'
            )}
          </Button>
        </div>

        <Alert className="bg-muted/50 border-muted">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Uses the same Firecrawl API key from Settings. Scraped pages appear in your Sources list.
          </AlertDescription>
        </Alert>
      </div>
    </Card>
  );
};
