import FirecrawlApp from '@mendable/firecrawl-js';
import { UploadedFile } from '@/types/file';
import { IonosWebsiteScraperService } from './ionosWebsiteScraper';

export class UrlScraperService {
  static async scrapeUrl(url: string): Promise<{ success: boolean; data?: UploadedFile; error?: string }> {
    const apiKey = IonosWebsiteScraperService.getApiKey();
    
    if (!apiKey) {
      return { success: false, error: 'Firecrawl API key not found. Please configure it in Settings.' };
    }

    try {
      console.log('Scraping URL:', url);
      const firecrawl = new FirecrawlApp({ apiKey });
      
      const response = await firecrawl.scrape(url, {
        formats: ['markdown']
      }) as any;
      
      if (!response.success || !response.markdown) {
        return { success: false, error: 'Failed to scrape URL' };
      }

      // Convert scraped content to UploadedFile format
      const markdown = response.markdown;
      const domain = new URL(url).hostname;
      
      const uploadedFile: UploadedFile = {
        id: `url-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: `🔗 ${domain}`,
        type: 'text/markdown',
        size: markdown.length,
        content: markdown,
        extractedText: markdown,
        uploadDate: new Date(),
        sourceType: 'url',
        sourceUrl: url
      };

      console.log('Successfully scraped URL:', url);
      return { success: true, data: uploadedFile };
    } catch (error) {
      console.error('Error scraping URL:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to scrape URL' 
      };
    }
  }

  static getScrapedUrls(): UploadedFile[] {
    try {
      const stored = localStorage.getItem('project-files');
      if (!stored) return [];
      
      const allFiles = JSON.parse(stored);
      return allFiles.filter((file: UploadedFile) => file.sourceType === 'url');
    } catch (error) {
      console.error('Error getting scraped URLs:', error);
      return [];
    }
  }
}
