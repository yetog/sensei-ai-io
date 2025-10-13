// IONOS Website Knowledge Base
// This combines hardcoded fallback knowledge with dynamically scraped data

export const ionosWebsiteKnowledge = {
  companyInfo: `
    IONOS by 1&1 is one of the world's leading web hosting and cloud services companies.
    - Founded: 1988
    - Headquarters: Montabaur, Germany
    - Customers: Over 8 million worldwide
    - Data Centers: Multiple locations in Germany, US, and Europe
    - Certifications: ISO 27001, GDPR-compliant
  `,
  
  productCategories: `
    1. Web Hosting: Shared, WordPress, website builder
    2. Domains: 700+ TLDs, free privacy protection
    3. Email: Professional email, Microsoft 365
    4. Cloud: VPS, Cloud Servers, Dedicated Servers
    5. eCommerce: Online store solutions
    6. SSL Certificates: Various levels of encryption
  `,
  
  keyFeatures: `
    - 99.9% uptime guarantee
    - 24/7 customer support (phone, chat, email)
    - 30-day money-back guarantee
    - Free SSL certificates with hosting plans
    - One-click CMS installers (WordPress, Joomla, etc.)
    - DDoS protection included
    - Daily backups available
  `,
  
  support: `
    - Phone: Available 24/7 in multiple languages
    - Live Chat: Real-time assistance
    - Email: Ticketing system with response SLA
    - Knowledge Base: Extensive help articles and guides
    - Community Forum: User-to-user support
  `,
  
  pricing: `
    - Web Hosting: Starting at $6/month (Basic Plan), $8/month (Unlimited Plus)
    - Domain Registration: $1/year first year, $15/year renewal for .com domains
    - VPS: Starting at $2/month (introductory pricing)
    - Cloud Servers: Pay-as-you-go pricing starting at $0.004/hour
    - Email: Starting at $1/month per mailbox
    - Microsoft 365: Starting at $6.99/month per user
  `,
};

export interface ScrapedPage {
  url: string;
  markdown: string;
  scrapedAt: string;
}

export function getIonosKnowledgeContext(): string {
  // Try to load scraped knowledge first
  const scrapedData = getScrapedKnowledge();
  
  if (scrapedData && scrapedData.length > 0) {
    // Use scraped data if available
    const scrapedContext = scrapedData
      .map(page => `Source: ${page.url}\n${page.markdown}`)
      .join('\n\n---\n\n');
    
    return `IONOS Website Information (Auto-updated):\n\n${scrapedContext}`;
  }
  
  // Fallback to hardcoded knowledge
  return `IONOS Company Knowledge (Fallback):\n\n${Object.values(ionosWebsiteKnowledge).join('\n\n')}`;
}

export function getScrapedKnowledge(): ScrapedPage[] | null {
  try {
    const stored = localStorage.getItem('ionos-scraped-knowledge');
    if (stored) {
      const data = JSON.parse(stored);
      // Check if data is less than 7 days old
      const firstPage = data[0];
      if (firstPage && firstPage.scrapedAt) {
        const scrapedDate = new Date(firstPage.scrapedAt);
        const daysSinceUpdate = (Date.now() - scrapedDate.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceUpdate < 7) {
          return data;
        }
      }
    }
    return null;
  } catch (error) {
    console.error('Error loading scraped knowledge:', error);
    return null;
  }
}

export function clearScrapedKnowledge(): void {
  localStorage.removeItem('ionos-scraped-knowledge');
}
