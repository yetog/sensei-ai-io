import FirecrawlApp from '@mendable/firecrawl-js';
import { ScrapedPage } from '@/data/ionosKnowledge';

const IONOS_PAGES_TO_SCRAPE = [
  'https://www.ionos.com/hosting',
  'https://www.ionos.com/hosting/web-hosting',
  'https://www.ionos.com/hosting/wordpress-hosting',
  'https://www.ionos.com/domains',
  'https://www.ionos.com/email',
  'https://www.ionos.com/email/email-hosting',
  'https://www.ionos.com/office-solutions/microsoft-365',
  'https://www.ionos.com/servers/vps',
  'https://www.ionos.com/servers/cloud-server',
  'https://www.ionos.com/servers/dedicated-server',
  'https://www.ionos.com/digitalguide/online-marketing/ecommerce/what-is-ionos/',
];

export class IonosWebsiteScraperService {
  private static API_KEY_STORAGE_KEY = 'firecrawl_api_key';
  
  static saveApiKey(apiKey: string): void {
    localStorage.setItem(this.API_KEY_STORAGE_KEY, apiKey);
    console.log('Firecrawl API key saved successfully');
  }
  
  static getApiKey(): string | null {
    return localStorage.getItem(this.API_KEY_STORAGE_KEY);
  }
  
  static removeApiKey(): void {
    localStorage.removeItem(this.API_KEY_STORAGE_KEY);
  }
  
  static async testApiKey(apiKey: string): Promise<boolean> {
    try {
      console.log('Testing Firecrawl API key...');
      const firecrawl = new FirecrawlApp({ apiKey });
      
      // Test with a simple scrape
      const testResponse = await firecrawl.scrape('https://www.ionos.com/', {
        formats: ['markdown']
      }) as any;
      
      return testResponse.success;
    } catch (error) {
      console.error('Error testing Firecrawl API key:', error);
      return false;
    }
  }
  
  static async scrapeIonosWebsite(
    apiKey?: string,
    onProgress?: (current: number, total: number) => void
  ): Promise<{ success: boolean; error?: string; data?: ScrapedPage[] }> {
    const key = apiKey || this.getApiKey();
    
    if (!key) {
      return { success: false, error: 'API key not found. Please provide a Firecrawl API key.' };
    }
    
    try {
      console.log('Starting IONOS website scraping...');
      const firecrawl = new FirecrawlApp({ apiKey: key });
      const scrapedData: ScrapedPage[] = [];
      const total = IONOS_PAGES_TO_SCRAPE.length;
      
      for (let i = 0; i < IONOS_PAGES_TO_SCRAPE.length; i++) {
        const url = IONOS_PAGES_TO_SCRAPE[i];
        console.log(`Scraping ${i + 1}/${total}: ${url}`);
        
        if (onProgress) {
          onProgress(i + 1, total);
        }
        
        try {
          const response = await firecrawl.scrape(url, {
            formats: ['markdown']
          }) as any;
          
          if (response.success && response.markdown) {
            scrapedData.push({
              url,
              markdown: response.markdown,
              scrapedAt: new Date().toISOString(),
            });
          } else {
            console.warn(`Failed to scrape ${url}:`, response);
          }
        } catch (pageError) {
          console.error(`Error scraping ${url}:`, pageError);
          // Continue with other pages even if one fails
        }
      }
      
      if (scrapedData.length === 0) {
        return { success: false, error: 'No pages were successfully scraped' };
      }
      
      // Store in localStorage
      localStorage.setItem('ionos-scraped-knowledge', JSON.stringify(scrapedData));
      
      console.log(`Successfully scraped ${scrapedData.length}/${total} pages`);
      return { success: true, data: scrapedData };
    } catch (error) {
      console.error('Error during IONOS website scraping:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to scrape IONOS website' 
      };
    }
  }
  
  static getLastScrapedDate(): Date | null {
    try {
      const stored = localStorage.getItem('ionos-scraped-knowledge');
      if (stored) {
        const data = JSON.parse(stored);
        const firstPage = data[0];
        if (firstPage && firstPage.scrapedAt) {
          return new Date(firstPage.scrapedAt);
        }
      }
      return null;
    } catch (error) {
      console.error('Error getting last scraped date:', error);
      return null;
    }
  }
}
