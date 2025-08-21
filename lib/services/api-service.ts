import { db } from '@/lib/db';
import { apiKeys } from '@/lib/db/schema';
import { decryptValue } from '@/lib/crypto/encryption';
import { eq, and } from 'drizzle-orm';

export interface ServiceClient {
  name: string;
  isConfigured: boolean;
  hasValidKey: boolean;
  keyCount: number;
  lastTested?: Date;
}

export interface ServiceClients {
  stripe: ServiceClient;
  openai: ServiceClient;
  github: ServiceClient;
  vercel: ServiceClient;
  netlify: ServiceClient;
  supabase: ServiceClient;
}

class ApiServiceManager {
  private keyCache = new Map<string, string>();
  private cacheExpiry = new Map<string, number>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  async getApiKey(service: string, keyName?: string): Promise<string | null> {
    const cacheKey = `${service}:${keyName || 'default'}`;
    
    // Check cache first
    if (this.keyCache.has(cacheKey)) {
      const expiry = this.cacheExpiry.get(cacheKey);
      if (expiry && Date.now() < expiry) {
        return this.keyCache.get(cacheKey)!;
      }
    }

    try {
      // For now, use mock team ID since auth is disabled
      const teamId = 1;

      let query = db
        .select({
          encryptedValue: apiKeys.encryptedValue,
        })
        .from(apiKeys)
        .where(
          and(
            eq(apiKeys.teamId, teamId),
            eq(apiKeys.service, service),
            eq(apiKeys.isActive, true)
          )
        );

      if (keyName) {
        query = query.where(eq(apiKeys.keyName, keyName)) as any;
      }

      const [key] = await query.limit(1);

      if (!key) {
        return null;
      }

      const decryptedKey = decryptValue(key.encryptedValue);
      
      // Cache the result
      this.keyCache.set(cacheKey, decryptedKey);
      this.cacheExpiry.set(cacheKey, Date.now() + this.CACHE_DURATION);

      return decryptedKey;
    } catch (error) {
      console.error(`Failed to get API key for ${service}:`, error);
      return null;
    }
  }

  async getServiceClients(): Promise<ServiceClients> {
    try {
      // For now, use mock team ID since auth is disabled
      const teamId = 1;

      const keys = await db
        .select({
          service: apiKeys.service,
          keyName: apiKeys.keyName,
          isActive: apiKeys.isActive,
          lastUsed: apiKeys.lastUsed,
        })
        .from(apiKeys)
        .where(eq(apiKeys.teamId, teamId));

      const serviceStats = keys.reduce((acc: Record<string, { total: number; active: number; lastUsed: Date | null }>, key: any) => {
        if (!acc[key.service]) {
          acc[key.service] = {
            total: 0,
            active: 0,
            lastUsed: null as Date | null,
          };
        }
        acc[key.service].total++;
        if (key.isActive) {
          acc[key.service].active++;
        }
        if (key.lastUsed && (!acc[key.service].lastUsed || key.lastUsed > acc[key.service].lastUsed!)) {
          acc[key.service].lastUsed = key.lastUsed;
        }
        return acc;
      }, {} as Record<string, { total: number; active: number; lastUsed: Date | null }>);

      const services = ['stripe', 'openai', 'github', 'vercel', 'netlify', 'supabase'];
      const result = {} as ServiceClients;

      for (const service of services) {
        const stats = serviceStats[service] || { total: 0, active: 0, lastUsed: null };
        result[service as keyof ServiceClients] = {
          name: service,
          isConfigured: stats.active > 0,
          hasValidKey: stats.active > 0, // We'll enhance this with actual validation later
          keyCount: stats.active,
          lastTested: stats.lastUsed || undefined,
        };
      }

      return result;
    } catch (error) {
      console.error('Failed to get service clients:', error);
      // Return default empty state
      const services = ['stripe', 'openai', 'github', 'vercel', 'netlify', 'supabase'];
      const result = {} as ServiceClients;
      
      for (const service of services) {
        result[service as keyof ServiceClients] = {
          name: service,
          isConfigured: false,
          hasValidKey: false,
          keyCount: 0,
        };
      }
      
      return result;
    }
  }

  // Service-specific client factories
  async getStripeClient() {
    const key = await this.getApiKey('stripe');
    if (!key) {
      throw new Error('Stripe API key not configured');
    }

    // Return a simple object that can be used to make Stripe API calls
    return {
      key,
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      baseUrl: 'https://api.stripe.com/v1',
    };
  }

  async getOpenAIClient() {
    const key = await this.getApiKey('openai');
    if (!key) {
      throw new Error('OpenAI API key not configured');
    }

    return {
      key,
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      baseUrl: 'https://api.openai.com/v1',
    };
  }

  async getGitHubClient() {
    const key = await this.getApiKey('github');
    if (!key) {
      throw new Error('GitHub API key not configured');
    }

    return {
      key,
      headers: {
        'Authorization': `token ${key}`,
        'Accept': 'application/vnd.github.v3+json',
      },
      baseUrl: 'https://api.github.com',
    };
  }

  // Test if a service is properly configured and accessible
  async testServiceConnection(service: string): Promise<{ success: boolean; message: string; responseTime?: number }> {
    const startTime = Date.now();
    
    try {
      switch (service.toLowerCase()) {
        case 'stripe': {
          const client = await this.getStripeClient();
          const response = await fetch(`${client.baseUrl}/charges`, {
            method: 'GET',
            headers: client.headers,
          });
          const responseTime = Date.now() - startTime;
          return {
            success: response.ok,
            message: response.ok ? 'Stripe connection successful' : `Stripe error: ${response.statusText}`,
            responseTime,
          };
        }
        
        case 'openai': {
          const client = await this.getOpenAIClient();
          const response = await fetch(`${client.baseUrl}/models`, {
            method: 'GET',
            headers: client.headers,
          });
          const responseTime = Date.now() - startTime;
          return {
            success: response.ok,
            message: response.ok ? 'OpenAI connection successful' : `OpenAI error: ${response.statusText}`,
            responseTime,
          };
        }
        
        case 'github': {
          const client = await this.getGitHubClient();
          const response = await fetch(`${client.baseUrl}/user`, {
            method: 'GET',
            headers: client.headers,
          });
          const responseTime = Date.now() - startTime;
          return {
            success: response.ok,
            message: response.ok ? 'GitHub connection successful' : `GitHub error: ${response.statusText}`,
            responseTime,
          };
        }
        
        default:
          return {
            success: false,
            message: `Service ${service} is not supported for testing`,
          };
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        success: false,
        message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        responseTime,
      };
    }
  }

  // Clear cache for a specific service or all services
  clearCache(service?: string) {
    if (service) {
      const keysToDelete = Array.from(this.keyCache.keys()).filter(key => key.startsWith(`${service}:`));
      keysToDelete.forEach(key => {
        this.keyCache.delete(key);
        this.cacheExpiry.delete(key);
      });
    } else {
      this.keyCache.clear();
      this.cacheExpiry.clear();
    }
  }
}

export const apiServiceManager = new ApiServiceManager();