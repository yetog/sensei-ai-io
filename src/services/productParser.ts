/**
 * Product Parser Service
 * Parses and manages IONOS products from CSV
 */

export interface Product {
  name: string;
  category: string;
  description: string;
  price?: string;
  features: string[];
}

class ProductParserService {
  private products: Product[] = [];
  private isLoaded = false;

  async loadProducts(): Promise<Product[]> {
    if (this.isLoaded) {
      return this.products;
    }

    try {
      const response = await fetch('/Products_For_IONOS_-_Products.csv');
      const csvText = await response.text();
      
      this.products = this.parseCSV(csvText);
      this.isLoaded = true;
      
      console.log(`Loaded ${this.products.length} products from CSV`);
      return this.products;
    } catch (error) {
      console.error('Failed to load products CSV:', error);
      return [];
    }
  }

  private parseCSV(csvText: string): Product[] {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length === 0) return [];

    // First line is header
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const products: Product[] = [];

    // Parse each product line
    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      
      if (values.length < headers.length) continue;

      const product: Product = {
        name: values[headers.indexOf('name')] || values[0] || '',
        category: values[headers.indexOf('category')] || values[1] || 'General',
        description: values[headers.indexOf('description')] || values[2] || '',
        price: values[headers.indexOf('price')] || values[3],
        features: this.extractFeatures(values, headers)
      };

      if (product.name) {
        products.push(product);
      }
    }

    return products;
  }

  private parseCSVLine(line: string): string[] {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    values.push(current.trim());
    return values;
  }

  private extractFeatures(values: string[], headers: string[]): string[] {
    const features: string[] = [];
    
    // Look for feature-related columns
    const featureColumns = ['features', 'benefits', 'highlights', 'specs'];
    
    featureColumns.forEach(col => {
      const index = headers.indexOf(col);
      if (index !== -1 && values[index]) {
        const featureText = values[index];
        // Split by common delimiters
        const items = featureText.split(/[,;•\n]/).filter(f => f.trim());
        features.push(...items.map(f => f.trim()));
      }
    });

    return features.filter(f => f.length > 0);
  }

  getAllProducts(): Product[] {
    return this.products;
  }

  searchProducts(query: string): Product[] {
    const lowerQuery = query.toLowerCase();
    return this.products.filter(product =>
      product.name.toLowerCase().includes(lowerQuery) ||
      product.category.toLowerCase().includes(lowerQuery) ||
      product.description.toLowerCase().includes(lowerQuery) ||
      product.features.some(f => f.toLowerCase().includes(lowerQuery))
    );
  }

  getProductsByCategory(category: string): Product[] {
    return this.products.filter(p => 
      p.category.toLowerCase() === category.toLowerCase()
    );
  }

  getProductSummary(): string {
    const categories = new Set(this.products.map(p => p.category));
    return `Available products: ${this.products.length} items across ${categories.size} categories (${Array.from(categories).join(', ')})`;
  }
}

export const productParser = new ProductParserService();
