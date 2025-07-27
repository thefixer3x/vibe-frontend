'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Play, 
  Database, 
  Key, 
  Globe, 
  CreditCard, 
  Image, 
  FileText, 
  Cloud,
  Code,
  Zap,
  Activity,
  Settings,
  Server
} from 'lucide-react';

// Mock API configurations - in real app, fetch from your Universal API server
const mockAPIs = [
  {
    id: 'picsart',
    name: 'Picsart',
    description: 'AI Image Generation & Editing',
    status: 'active',
    icon: Image,
    color: 'bg-purple-500',
    tools: ['generate_image', 'remove_background', 'upscale_image'],
    category: 'AI/ML'
  },
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'ChatGPT & DALL-E APIs',
    status: 'active',
    icon: Code,
    color: 'bg-green-500',
    tools: ['chat_completion', 'create_image'],
    category: 'AI/ML'
  },
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Payment Processing',
    status: 'active',
    icon: CreditCard,
    color: 'bg-blue-500',
    tools: ['create_payment', 'get_customer', 'create_subscription'],
    category: 'Payment'
  },
  {
    id: 'github',
    name: 'GitHub',
    description: 'Repository Management',
    status: 'active',
    icon: Globe,
    color: 'bg-gray-700',
    tools: ['get_user', 'list_repos', 'create_repo'],
    category: 'Development'
  },
  {
    id: 'namecheap',
    name: 'Namecheap',
    description: 'Domain & SSL Management',
    status: 'active',
    icon: Database,
    color: 'bg-orange-500',
    tools: ['check_domains', 'get_domain_list', 'renew_domain'],
    category: 'Infrastructure'
  },
  {
    id: 'weather',
    name: 'OpenWeather',
    description: 'Weather Information',
    status: 'active',
    icon: Cloud,
    color: 'bg-cyan-500',
    tools: ['current_weather', 'forecast'],
    category: 'Data'
  }
];

interface APIResponse {
  status: number;
  data: {
    success: boolean;
    message: string;
    result: unknown; // This can be more specific if the structure is known
    timestamp: string;
  } | null;
  error?: string;
  timestamp: Date;
}

export default function APIWarehousePage() {
  const [selectedAPI, setSelectedAPI] = useState<string>('');
  const [selectedTool, setSelectedTool] = useState<string>('');
  const [requestData, setRequestData] = useState<string>('{}');
  const [response, setResponse] = useState<APIResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredAPIs = mockAPIs.filter(api => {
    const matchesSearch = api.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         api.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || api.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', ...Array.from(new Set(mockAPIs.map(api => api.category)))];

  const handleTestAPI = async () => {
    if (!selectedAPI || !selectedTool) return;
    
    setIsLoading(true);
    try {
      // Simulate API call - replace with actual API call to your Universal API server
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockResponse: APIResponse = {
        status: 200,
        data: {
          success: true,
          message: `Successfully executed ${selectedTool} on ${selectedAPI}`,
          result: JSON.parse(requestData || '{}'),
          timestamp: new Date().toISOString()
        },
        timestamp: new Date()
      };
      
      setResponse(mockResponse);
    } catch (error) { // eslint-disable-line @typescript-eslint/no-unused-vars
      setResponse({
        status: 500,
        data: null,
        error: 'Failed to execute API call',
        timestamp: new Date()
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getSelectedAPIData = () => {
    return mockAPIs.find(api => api.id === selectedAPI);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">API Warehouse</h1>
          <p className="text-gray-600 mt-1">
            Manage and test all your aggregated backend APIs in one place
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-green-500" />
            <span className="text-sm text-gray-600">{mockAPIs.length} APIs Active</span>
          </div>
          <Button variant="outline" asChild>
            <a href="/dashboard/apis/server">
              <Server className="h-4 w-4 mr-2" />
              Manage Servers
            </a>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="testing">API Testing</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Search and Filters */}
          <div className="flex space-x-4">
            <div className="flex-1">
              <Input
                placeholder="Search APIs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* API Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAPIs.map((api) => {
              const IconComponent = api.icon;
              return (
                <Card key={api.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${api.color}`}>
                          <IconComponent className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{api.name}</CardTitle>
                          <Badge variant="outline" className="mt-1">
                            {api.category}
                          </Badge>
                        </div>
                      </div>
                      <Badge
                        variant={api.status === 'active' ? 'default' : 'secondary'}
                      >
                        {api.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="mb-4">
                      {api.description}
                    </CardDescription>
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Available Tools:</div>
                      <div className="flex flex-wrap gap-1">
                        {api.tools.map(tool => (
                          <Badge key={tool} variant="secondary" className="text-xs">
                            {tool}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button 
                      className="w-full mt-4" 
                      variant="outline"
                      onClick={() => {
                        setSelectedAPI(api.id);
                        setSelectedTool(api.tools[0]);
                      }}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Test API
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Testing Tab */}
        <TabsContent value="testing" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Request Panel */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="h-5 w-5 mr-2" />
                  API Testing
                </CardTitle>
                <CardDescription>
                  Test your APIs with custom parameters
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="api-select">Select API</Label>
                  <Select value={selectedAPI} onValueChange={setSelectedAPI}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an API" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockAPIs.map(api => (
                        <SelectItem key={api.id} value={api.id}>
                          {api.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedAPI && (
                  <div>
                    <Label htmlFor="tool-select">Select Tool</Label>
                    <Select value={selectedTool} onValueChange={setSelectedTool}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a tool" />
                      </SelectTrigger>
                      <SelectContent>
                        {getSelectedAPIData()?.tools.map(tool => (
                          <SelectItem key={tool} value={tool}>
                            {tool}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label htmlFor="request-data">Request Data (JSON)</Label>
                  <Textarea
                    id="request-data"
                    placeholder='{"key": "value"}'
                    value={requestData}
                    onChange={(e) => setRequestData(e.target.value)}
                    rows={6}
                    className="font-mono text-sm"
                  />
                </div>

                <Button 
                  onClick={handleTestAPI} 
                  disabled={!selectedAPI || !selectedTool || isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Activity className="h-4 w-4 mr-2 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Execute API Call
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Response Panel */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Response
                </CardTitle>
                <CardDescription>
                  API response will appear here
                </CardDescription>
              </CardHeader>
              <CardContent>
                {response ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Badge
                        variant={response.status === 200 ? 'default' : 'destructive'}
                      >
                        Status: {response.status}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {response.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <div>
                      <Label>Response Data:</Label>
                      <pre className="mt-2 p-4 bg-gray-50 rounded-lg text-sm overflow-auto max-h-96">
                        {JSON.stringify(response.data, null, 2)}
                      </pre>
                    </div>
                    {response.error && (
                      <div>
                        <Label className="text-red-600">Error:</Label>
                        <p className="text-red-600 text-sm mt-1">{response.error}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No response yet. Execute an API call to see results.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Configuration Tab */}
        <TabsContent value="configuration" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                API Configuration
              </CardTitle>
              <CardDescription>
                Manage your API credentials and settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Universal API Server URL</Label>
                    <Input 
                      placeholder="http://localhost:3001" 
                      defaultValue="http://localhost:3001"
                    />
                  </div>
                  <div>
                    <Label>Server Status</Label>
                    <div className="flex items-center space-x-2 mt-2">
                      <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Connected</span>
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Environment Variables</Label>
                  <div className="mt-2 space-y-2">
                    {['PICSART_API_KEY', 'OPENAI_API_KEY', 'GITHUB_TOKEN', 'STRIPE_SECRET_KEY'].map(env => (
                      <div key={env} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Key className="h-4 w-4 text-gray-500" />
                          <span className="font-mono text-sm">{env}</span>
                        </div>
                        <Badge variant="outline">
                          {env.includes('PICSART') ? 'Set' : 'Not Set'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex space-x-4">
                  <Button variant="outline">
                    Reload Configuration
                  </Button>
                  <Button variant="outline">
                    Test Connection
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}