# Memory Service Frontend Integration Guide

## Quick Implementation Steps for vibe-frontend

### 1. Update Navigation (app/(dashboard)/dashboard/layout.tsx)

```typescript
// Add to navItems array
const navItems = [
  // ... existing items
  { 
    href: 'https://api.lanonasis.com', 
    icon: Globe, 
    label: 'API Status',
    external: true 
  },
  { 
    href: 'https://docs.lanonasis.com', 
    icon: BookOpen, 
    label: 'Documentation',
    external: true 
  },
];
```

### 2. Create Onboarding Flow Component

```typescript
// app/(dashboard)/dashboard/onboarding/page.tsx
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { createMemoryClient } from '@/lib/memory/client';

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [apiKey, setApiKey] = useState('');
  const router = useRouter();
  
  const generateAPIKey = async () => {
    try {
      const response = await fetch('/api/generate-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.token}`
        },
        body: JSON.stringify({
          name: 'Default API Key',
          services: ['memory', 'gateway']
        })
      });
      
      const data = await response.json();
      setApiKey(data.apiKey);
      
      // Store in local config
      localStorage.setItem('lanonasis_api_key', data.apiKey);
      
      // Initialize memory client
      const client = createMemoryClient({
        baseURL: 'https://api.lanonasis.com',
        apiKey: data.apiKey
      });
      
    } catch (error) {
      console.error('Failed to generate API key:', error);
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      <Progress value={(step / 4) * 100} className="mb-8" />
      
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Welcome to Lanonasis Platform</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Let's get you set up with API access</p>
            <Button onClick={() => setStep(2)}>Get Started</Button>
          </CardContent>
        </Card>
      )}
      
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Choose Your Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <PlanCard 
                name="Free" 
                features={['100 memories', '60 API calls/min']} 
                onSelect={() => setStep(3)}
              />
              <PlanCard 
                name="Pro" 
                price="$29/mo"
                features={['10K memories', '300 API calls/min']} 
                onSelect={() => setStep(3)}
              />
            </div>
          </CardContent>
        </Card>
      )}
      
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Generate Your API Key</CardTitle>
          </CardHeader>
          <CardContent>
            {!apiKey ? (
              <Button onClick={generateAPIKey}>Generate API Key</Button>
            ) : (
              <div>
                <div className="bg-muted p-4 rounded-lg font-mono text-sm mb-4">
                  {apiKey}
                </div>
                <Button onClick={() => setStep(4)}>Continue to Dashboard</Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>You're All Set!</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Quick Start:</h3>
                <pre className="bg-muted p-4 rounded-lg text-sm">
                  npm install @lanonasis/memory-client
                  npx @lanonasis/cli auth login --key {apiKey}
                </pre>
              </div>
              <div className="flex gap-4">
                <Button onClick={() => router.push('/dashboard')}>Go to Dashboard</Button>
                <Button variant="outline" onClick={() => window.open('https://docs.lanonasis.com', '_blank')}>
                  View Documentation
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

### 3. Add Service Status Widget

```typescript
// components/widgets/ServiceStatusWidget.tsx
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const services = [
  { name: 'Memory API', url: 'https://api.lanonasis.com/api/v1/health' },
  { name: 'Gateway', url: 'https://api.lanonasis.com/health' },
  { name: 'SSE Events', url: 'https://api.lanonasis.com/sse/health' },
  { name: 'Documentation', url: 'https://docs.lanonasis.com/health' },
];

export function ServiceStatusWidget() {
  const [statuses, setStatuses] = useState<Record<string, boolean>>({});
  
  useEffect(() => {
    const checkServices = async () => {
      for (const service of services) {
        try {
          const response = await fetch(service.url);
          setStatuses(prev => ({ ...prev, [service.name]: response.ok }));
        } catch {
          setStatuses(prev => ({ ...prev, [service.name]: false }));
        }
      }
    };
    
    checkServices();
    const interval = setInterval(checkServices, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Service Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {services.map(service => (
            <div key={service.name} className="flex justify-between items-center">
              <span>{service.name}</span>
              <Badge variant={statuses[service.name] ? 'success' : 'destructive'}>
                {statuses[service.name] ? 'Online' : 'Offline'}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

### 4. Update Memory Dashboard with API Integration

```typescript
// app/(dashboard)/dashboard/memory/page.tsx
import { ServiceStatusWidget } from '@/components/widgets/ServiceStatusWidget';
import { APIKeyManager } from '@/components/APIKeyManager';

export default function MemoryPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Memory Service</h1>
        <div className="flex gap-2">
          <Button onClick={() => window.open('https://docs.lanonasis.com/memory', '_blank')}>
            Documentation
          </Button>
          <Button onClick={() => window.open('https://api.lanonasis.com/docs', '_blank')}>
            API Explorer
          </Button>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MemoryStatsCard />
        <APIUsageCard />
        <ServiceStatusWidget />
        <QuickActionsCard />
      </div>
      
      <Tabs defaultValue="search">
        <TabsList>
          <TabsTrigger value="search">Search</TabsTrigger>
          <TabsTrigger value="recent">Recent</TabsTrigger>
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="api-keys">API Keys</TabsTrigger>
        </TabsList>
        
        <TabsContent value="search">
          <MemorySearch />
        </TabsContent>
        
        <TabsContent value="recent">
          <RecentMemories />
        </TabsContent>
        
        <TabsContent value="upload">
          <MemoryUploader />
        </TabsContent>
        
        <TabsContent value="api-keys">
          <APIKeyManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

### 5. Create API Key Manager Component

```typescript
// components/APIKeyManager.tsx
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, Eye, EyeOff, Trash2 } from 'lucide-react';

export function APIKeyManager() {
  const [apiKeys, setApiKeys] = useState([]);
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  
  const generateNewKey = async () => {
    const name = prompt('Enter a name for this API key:');
    if (!name) return;
    
    try {
      const response = await fetch('/api/keys/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      
      const newKey = await response.json();
      setApiKeys([...apiKeys, newKey]);
      
      // Show the new key temporarily
      setShowKey({ ...showKey, [newKey.id]: true });
      setTimeout(() => {
        setShowKey(prev => ({ ...prev, [newKey.id]: false }));
      }, 30000); // Hide after 30 seconds
    } catch (error) {
      console.error('Failed to generate key:', error);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>API Keys</CardTitle>
        <Button onClick={generateNewKey}>Generate New Key</Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {apiKeys.map(key => (
            <div key={key.id} className="flex items-center gap-4 p-4 border rounded-lg">
              <div className="flex-1">
                <p className="font-medium">{key.name}</p>
                <p className="text-sm text-muted-foreground">Created: {key.created}</p>
              </div>
              <div className="flex items-center gap-2">
                <Input 
                  type={showKey[key.id] ? 'text' : 'password'} 
                  value={key.value} 
                  readOnly 
                  className="w-64"
                />
                <Button 
                  size="icon" 
                  variant="ghost"
                  onClick={() => setShowKey({ ...showKey, [key.id]: !showKey[key.id] })}
                >
                  {showKey[key.id] ? <EyeOff /> : <Eye />}
                </Button>
                <Button 
                  size="icon" 
                  variant="ghost"
                  onClick={() => navigator.clipboard.writeText(key.value)}
                >
                  <Copy />
                </Button>
                <Button 
                  size="icon" 
                  variant="ghost"
                  onClick={() => deleteKey(key.id)}
                >
                  <Trash2 />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

### 6. Add SSE Integration for Real-time Updates

```typescript
// lib/sse/client.ts
export class SSEClient {
  private eventSource: EventSource | null = null;
  private apiKey: string;
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  
  connect() {
    const url = `https://api.lanonasis.com/sse?key=${this.apiKey}`;
    this.eventSource = new EventSource(url);
    
    this.eventSource.addEventListener('memory.created', (event) => {
      const data = JSON.parse(event.data);
      // Emit to global event bus or state management
      window.dispatchEvent(new CustomEvent('memory:created', { detail: data }));
    });
    
    this.eventSource.addEventListener('memory.updated', (event) => {
      const data = JSON.parse(event.data);
      window.dispatchEvent(new CustomEvent('memory:updated', { detail: data }));
    });
    
    this.eventSource.addEventListener('usage.limit', (event) => {
      const data = JSON.parse(event.data);
      window.dispatchEvent(new CustomEvent('usage:limit', { detail: data }));
    });
    
    this.eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      this.reconnect();
    };
  }
  
  private reconnect() {
    setTimeout(() => {
      console.log('Reconnecting to SSE...');
      this.connect();
    }, 5000);
  }
  
  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }
}

// Hook for React components
export function useSSE() {
  const [connected, setConnected] = useState(false);
  
  useEffect(() => {
    const apiKey = localStorage.getItem('lanonasis_api_key');
    if (!apiKey) return;
    
    const client = new SSEClient(apiKey);
    client.connect();
    setConnected(true);
    
    return () => {
      client.disconnect();
      setConnected(false);
    };
  }, []);
  
  return { connected };
}
```

### 7. Update Environment Variables

```env
# .env.local
NEXT_PUBLIC_API_URL=https://api.lanonasis.com
NEXT_PUBLIC_DOCS_URL=https://docs.lanonasis.com
NEXT_PUBLIC_SSE_URL=https://api.lanonasis.com/sse
NEXT_PUBLIC_DASHBOARD_URL=https://lanonasis.com/dashboard

# Memory Service specific
NEXT_PUBLIC_MEMORY_API_URL=https://api.lanonasis.com/api/v1/memory
NEXT_PUBLIC_MCP_WS_URL=wss://api.lanonasis.com/mcp
```

### 8. Create Landing Page CTA

```typescript
// app/page.tsx - Update the landing page
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <section className="hero bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-6">
            AI-Powered Infrastructure for Africa
          </h1>
          <p className="text-xl mb-8">
            Access 1000+ APIs including Memory as a Service, VortexCore AI, and more
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/dashboard/onboarding">
              <Button size="lg" variant="secondary">
                Get Started Free
              </Button>
            </Link>
            <Link href="https://docs.lanonasis.com">
              <Button size="lg" variant="outline">
                View Documentation
              </Button>
            </Link>
          </div>
        </div>
      </section>
      
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Our Services</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <ServiceCard 
              icon="🧠"
              title="Memory as a Service"
              description="Vector-based memory with semantic search"
              href="/dashboard/memory"
            />
            <ServiceCard 
              icon="🤖"
              title="VortexCore AI"
              description="Intelligent business assistant"
              href="/dashboard/vortexcore"
            />
            <ServiceCard 
              icon="🌐"
              title="API Gateway"
              description="18+ integrated services"
              href="https://api.lanonasis.com"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
```

### 9. Implement Route Guards

```typescript
// middleware.ts - Update to include auth checks
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Public routes
  const publicRoutes = ['/', '/login', '/register', '/docs'];
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }
  
  // Check for API key or session
  const apiKey = request.cookies.get('lanonasis_api_key');
  const session = request.cookies.get('session');
  
  if (!apiKey && !session && pathname.startsWith('/dashboard')) {
    // Redirect to onboarding
    return NextResponse.redirect(new URL('/dashboard/onboarding', request.url));
  }
  
  // Add API key to headers for API routes
  if (pathname.startsWith('/api/') && apiKey) {
    const response = NextResponse.next();
    response.headers.set('X-API-Key', apiKey.value);
    return response;
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

### 10. Quick Deployment Steps

```bash
# 1. Install dependencies
bun add @lanonasis/memory-client eventsource

# 2. Update environment variables
cp .env.example .env.local
# Edit .env.local with production URLs

# 3. Build and test
bun run build
bun run start

# 4. Deploy
bun run deploy
```

## Summary

This implementation:
1. ✅ Adds onboarding flow for API key generation
2. ✅ Integrates all service endpoints
3. ✅ Provides real-time updates via SSE
4. ✅ Creates unified dashboard experience
5. ✅ Implements proper authentication flow
6. ✅ Adds service status monitoring
7. ✅ Links to documentation and API explorer

The frontend is now ready to capture users and drive traffic to the Lanonasis platform!