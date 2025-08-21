'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Terminal, 
  Globe, 
  Brain, 
  Settings, 
  Activity,
  Server,
  Plus,
  ExternalLink,
  Check,
  X,
  AlertCircle
} from 'lucide-react';
import { OrchestratorInterface } from '@/components/orchestrator/OrchestratorInterface';

interface ServiceStatus {
  name: string;
  status: 'online' | 'offline' | 'warning';
  description: string;
  lastCheck: string;
  url?: string;
}

interface APIEndpoint {
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  description: string;
  status: 'active' | 'inactive';
}

const mockServices: ServiceStatus[] = [
  {
    name: 'Memory Service',
    status: 'online',
    description: 'Vector database and semantic search',
    lastCheck: '2 minutes ago',
    url: '/dashboard/memory'
  },
  {
    name: 'MCP Server',
    status: 'warning',
    description: 'Model Context Protocol integration',
    lastCheck: '5 minutes ago',
    url: '/dashboard/mcp-test'
  },
  {
    name: 'Stripe Payments',
    status: 'online',
    description: 'Payment processing service',
    lastCheck: '1 minute ago',
    url: '/pricing'
  },
  {
    name: 'App Store Connect',
    status: 'offline',
    description: 'Apple App Store integration',
    lastCheck: '10 minutes ago',
    url: '/dashboard/appstore'
  }
];

const mockAPIs: APIEndpoint[] = [
  {
    name: 'Health Check',
    method: 'GET',
    endpoint: '/api/health',
    description: 'System health and status',
    status: 'active'
  },
  {
    name: 'Memory Search',
    method: 'POST',
    endpoint: '/api/memory/search',
    description: 'Semantic memory search',
    status: 'active'
  },
  {
    name: 'Memory Create',
    method: 'POST',
    endpoint: '/api/memory',
    description: 'Create new memory entry',
    status: 'active'
  },
  {
    name: 'Stripe Checkout',
    method: 'POST',
    endpoint: '/api/stripe/checkout',
    description: 'Create payment session',
    status: 'active'
  },
  {
    name: 'App Store Apps',
    method: 'GET',
    endpoint: '/api/appstore/apps',
    description: 'List App Store applications',
    status: 'inactive'
  }
];

function ServiceCard({ service }: { service: ServiceStatus }) {
  const statusColors = {
    online: 'bg-green-100 text-green-800',
    offline: 'bg-red-100 text-red-800',
    warning: 'bg-yellow-100 text-yellow-800'
  };

  const StatusIcon = service.status === 'online' ? Check : 
                   service.status === 'offline' ? X : AlertCircle;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{service.name}</CardTitle>
          <div className="flex items-center gap-2">
            <StatusIcon className="h-4 w-4" />
            <Badge variant="secondary" className={statusColors[service.status]}>
              {service.status}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-3">{service.description}</p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Last check: {service.lastCheck}</span>
          {service.url && (
            <Button size="sm" variant="outline" asChild>
              <a href={service.url}>
                <ExternalLink className="h-3 w-3 mr-1" />
                View
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function APITester() {
  const [selectedAPI, setSelectedAPI] = useState<APIEndpoint>(mockAPIs[0]);
  const [requestBody, setRequestBody] = useState('{}');
  const [response, setResponse] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleTest = async () => {
    setLoading(true);
    try {
      const options: RequestInit = {
        method: selectedAPI.method,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      if (selectedAPI.method !== 'GET') {
        options.body = requestBody;
      }

      const res = await fetch(selectedAPI.endpoint, options);
      const data = await res.text();
      setResponse(`Status: ${res.status} ${res.statusText}\n\n${data}`);
    } catch (error) {
      setResponse(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Terminal className="h-5 w-5" />
          API Tester
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Select API Endpoint</label>
          <select 
            value={selectedAPI.endpoint}
            onChange={(e) => {
              const api = mockAPIs.find(a => a.endpoint === e.target.value);
              if (api) setSelectedAPI(api);
            }}
            className="w-full p-2 border rounded-md text-sm"
          >
            {mockAPIs.map((api) => (
              <option key={api.endpoint} value={api.endpoint}>
                {api.method} {api.endpoint} - {api.name}
              </option>
            ))}
          </select>
        </div>

        {selectedAPI.method !== 'GET' && (
          <div>
            <label className="text-sm font-medium mb-2 block">Request Body (JSON)</label>
            <textarea
              value={requestBody}
              onChange={(e) => setRequestBody(e.target.value)}
              className="w-full p-2 border rounded-md text-sm font-mono"
              rows={3}
              placeholder='{"key": "value"}'
            />
          </div>
        )}

        <Button onClick={handleTest} disabled={loading} className="w-full">
          {loading ? 'Testing...' : `Test ${selectedAPI.method} Request`}
        </Button>

        {response && (
          <div>
            <label className="text-sm font-medium mb-2 block">Response</label>
            <pre className="bg-gray-50 p-3 rounded-md text-xs overflow-auto max-h-40 border">
              {response}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function QuickActions() {
  const actions = [
    {
      title: 'Create Memory',
      description: 'Add new knowledge to memory system',
      href: '/dashboard/memory/upload',
      icon: Brain
    },
    {
      title: 'Test API',
      description: 'Test API endpoints and responses',
      href: '/dashboard/apis',
      icon: Globe
    },
    {
      title: 'MCP Tools',
      description: 'Model Context Protocol testing',
      href: '/dashboard/mcp-test',
      icon: Settings
    },
    {
      title: 'View Logs',
      description: 'Check system activity logs',
      href: '/dashboard/activity',
      icon: Activity
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action) => (
            <Button
              key={action.title}
              variant="outline"
              asChild
              className="h-auto p-3 flex flex-col items-start text-left"
            >
              <a href={action.href}>
                <div className="flex items-center gap-2 mb-1">
                  <action.icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{action.title}</span>
                </div>
                <span className="text-xs text-muted-foreground">{action.description}</span>
              </a>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function OverviewPage() {
  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left column - Main Dashboard */}
        <div className="xl:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-lg lg:text-2xl font-medium">Vibe Dashboard</h1>
            <Button size="sm" variant="outline" asChild>
              <a href="/dashboard/settings">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </a>
            </Button>
          </div>

          {/* Service Status Grid */}
          <div>
            <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
              <Server className="h-5 w-5" />
              Service Status
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mockServices.map((service) => (
                <ServiceCard key={service.name} service={service} />
              ))}
            </div>
          </div>

          {/* API Tester */}
          <APITester />
        </div>

        {/* Right column - Quick Actions & AI Assistant */}
        <div className="xl:col-span-1 space-y-6">
          <QuickActions />
          
          {/* AI Assistant */}
          <div className="h-[400px]">
            <OrchestratorInterface />
          </div>
        </div>
      </div>
    </section>
  );
}