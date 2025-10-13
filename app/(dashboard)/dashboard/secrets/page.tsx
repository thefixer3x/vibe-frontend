'use client';

import { useState, useEffect, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Key,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  TestTube,
  CheckCircle,
  XCircle,
  RefreshCw,
  Shield
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSearchParams } from 'next/navigation';

interface APIKey {
  id: number;
  service: string;
  keyName: string;
  maskedValue: string;
  isActive: boolean;
  lastUsed: string | null;
  createdAt: string;
}

interface ServiceConfig {
  name: string;
  description: string;
  keyFormats: string[];
  testable: boolean;
  icon: string;
}

const SUPPORTED_SERVICES: Record<string, ServiceConfig> = {
  stripe: {
    name: 'Stripe',
    description: 'Payment processing and billing',
    keyFormats: ['sk_test_*', 'sk_live_*', 'pk_test_*', 'pk_live_*'],
    testable: true,
    icon: '💳'
  },
  openai: {
    name: 'OpenAI',
    description: 'AI language models and chat completions',
    keyFormats: ['sk-*'],
    testable: true,
    icon: '🧠'
  },
  github: {
    name: 'GitHub',
    description: 'Repository management and CI/CD',
    keyFormats: ['ghp_*', 'github_pat_*'],
    testable: true,
    icon: '🐙'
  },
  vercel: {
    name: 'Vercel',
    description: 'Deployment and hosting platform',
    keyFormats: ['*'],
    testable: false,
    icon: '▲'
  },
  netlify: {
    name: 'Netlify',
    description: 'JAMstack deployment platform',
    keyFormats: ['*'],
    testable: false,
    icon: '🔷'
  },
  supabase: {
    name: 'Supabase',
    description: 'Backend as a service platform',
    keyFormats: ['sbp_*', 'eyJ*'],
    testable: false,
    icon: '🟢'
  }
};

const SecretsPageContent = () => {
  const [keys, setKeys] = useState<APIKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [revealedKeys, setRevealedKeys] = useState<Set<number>>(new Set());
  const [testingKeys, setTestingKeys] = useState<Set<number>>(new Set());
  const { toast } = useToast();
  const searchParams = useSearchParams();

  const selectedService = searchParams.get('service');
  const initialSelectedService = selectedService && SUPPORTED_SERVICES[selectedService] ? selectedService : '';
  const [selectedServiceState, setSelectedServiceState] = useState<string>(initialSelectedService);
  const [keyName, setKeyName] = useState<string>('');
  const [keyValue, setKeyValue] = useState<string>('');

  useEffect(() => {
    fetchKeys();
  }, []);

  useEffect(() => {
    if (selectedService && SUPPORTED_SERVICES[selectedService]) {
      setSelectedServiceState(selectedService);
      setShowCreateDialog(true);
    }
  }, [searchParams]);

  const fetchKeys = async () => {
    try {
      const response = await fetch('/api/keys');
      if (response.ok) {
        const data = await response.json();
        setKeys(data.keys);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to fetch API keys',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch API keys',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const createKey = async () => {
    if (!selectedServiceState || !keyName || !keyValue) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive'
      });
      return;
    }

    try {
      const response = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service: selectedServiceState,
          keyName,
          keyValue
        })
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'API key created successfully',
        });
        setShowCreateDialog(false);
        setSelectedServiceState('');
        setKeyName('');
        setKeyValue('');
        fetchKeys();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to create API key',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create API key',
        variant: 'destructive'
      });
    }
  };

  const deleteKey = async (id: number) => {
    if (!confirm('Are you sure you want to delete this API key?')) return;

    try {
      const response = await fetch(`/api/keys/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'API key deleted successfully',
        });
        fetchKeys();
      } else {
        toast({
          title: 'Error',
          description: 'Failed to delete API key',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete API key',
        variant: 'destructive'
      });
    }
  };

  const revealKey = async (id: number) => {
    try {
      const response = await fetch(`/api/keys/${id}/reveal`, {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        setRevealedKeys(prev => new Set([...prev, id]));

        // Auto-hide after 30 seconds
        setTimeout(() => {
          setRevealedKeys((prev: Set<number>) => {
            const newSet = new Set(prev);
            newSet.delete(id);
            return newSet;
          });
        }, 30000);

        toast({
          title: 'Key Revealed',
          description: 'Key will be hidden again in 30 seconds',
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to reveal API key',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reveal API key',
        variant: 'destructive'
      });
    }
  };

  const testKey = async (key: APIKey) => {
    const service = SUPPORTED_SERVICES[key.service];
    if (!service?.testable) {
      toast({
        title: 'Not Testable',
        description: `${service?.name || key.service} keys cannot be automatically tested`,
        variant: 'destructive'
      });
      return;
    }

    setTestingKeys((prev: Set<number>) => new Set([...prev, key.id]));

    try {
      // Get the decrypted key value first
      const revealResponse = await fetch(`/api/keys/${key.id}/reveal`, {
        method: 'POST'
      });

      if (!revealResponse.ok) {
        throw new Error('Failed to get key value');
      }

      const { keyValue } = await revealResponse.json();

      // Test the key
      const testResponse = await fetch('/api/keys/test', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service: key.service,
          keyValue
        })
      });

      const result = await testResponse.json();

      if (result.valid) {
        toast({
          title: 'Test Successful',
          description: result.message,
        });
      } else {
        toast({
          title: 'Test Failed',
          description: result.message,
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Test Error',
        description: 'Failed to test API key',
        variant: 'destructive'
      });
    } finally {
      setTestingKeys((prev: Set<number>) => {
        const newSet = new Set(prev);
        newSet.delete(key.id);
        return newSet;
      });
    }
  };

  const toggleActive = async (id: number, isActive: boolean) => {
    try {
      const response = await fetch(`/api/keys/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive })
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: `Key ${!isActive ? 'activated' : 'deactivated'} successfully`,
        });
        fetchKeys();
      } else {
        toast({
          title: 'Error',
          description: 'Failed to update key status',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update key status',
        variant: 'destructive'
      });
    }
  };

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg lg:text-2xl font-medium flex items-center gap-2">
              <Shield className="h-6 w-6 text-blue-500" />
              Secret Management
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Securely store and manage your API keys and credentials
            </p>
          </div>

          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-blue-500 hover:bg-blue-600">
                <Plus className="h-4 w-4 mr-2" />
                Add Secret
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add New API Key</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="service">Service</Label>
                  <Select value={selectedServiceState} onValueChange={setSelectedServiceState}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a service" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(SUPPORTED_SERVICES).map(([key, service]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <span>{service.icon}</span>
                            <span>{service.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedServiceState && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {SUPPORTED_SERVICES[selectedServiceState].description}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="keyName">Key Name</Label>
                  <Input
                    id="keyName"
                    value={keyName}
                    onChange={(e) => setKeyName(e.target.value)}
                    placeholder="e.g., STRIPE_SECRET_KEY"
                  />
                </div>

                <div>
                  <Label htmlFor="keyValue">API Key Value</Label>
                  <Input
                    id="keyValue"
                    type="password"
                    value={keyValue}
                    onChange={(e) => setKeyValue(e.target.value)}
                    placeholder="Enter your API key"
                  />
                  {selectedService && SUPPORTED_SERVICES[selectedService].keyFormats.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Expected format: {SUPPORTED_SERVICES[selectedService].keyFormats.join(', ')}
                    </p>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={createKey}>Create Key</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Service Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(SUPPORTED_SERVICES).slice(0, 3).map(([key, service]) => {
            const serviceKeys = keys.filter(k => k.service === key);
            const activeKeys = serviceKeys.filter(k => k.isActive);

            return (
              <Card key={key}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <span className="text-lg">{service.icon}</span>
                    {service.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">{activeKeys.length}</p>
                      <p className="text-xs text-muted-foreground">
                        {activeKeys.length === 1 ? 'Active Key' : 'Active Keys'}
                      </p>
                    </div>
                    {serviceKeys.length > 0 && (
                      <Badge variant={activeKeys.length > 0 ? 'default' : 'secondary'}>
                        {activeKeys.length > 0 ? 'Configured' : 'Inactive'}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* API Keys List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              API Keys ({keys.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {keys.length === 0 ? (
              <div className="text-center py-12">
                <Key className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No API keys yet</h3>
                <p className="text-gray-500 mb-4">
                  Add your first API key to enable service integrations
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Secret
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {keys.map((key) => {
                  const service = SUPPORTED_SERVICES[key.service];
                  const isRevealed = revealedKeys.has(key.id);
                  const isTesting = testingKeys.has(key.id);

                  return (
                    <div key={key.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{service?.icon || '🔑'}</span>
                          <div>
                            <p className="font-medium">{key.keyName}</p>
                            <p className="text-sm text-muted-foreground">
                              {service?.name || key.service}
                            </p>
                          </div>
                        </div>

                        <div className="flex-1">
                          <p className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                            {isRevealed ? '••••••••••••••••' : key.maskedValue}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge variant={key.isActive ? 'default' : 'secondary'}>
                            {key.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          {key.lastUsed && (
                            <Badge variant="outline">
                              Used {new Date(key.lastUsed).toLocaleDateString()}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {service?.testable && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => testKey(key)}
                            disabled={isTesting}
                          >
                            {isTesting ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <TestTube className="h-4 w-4" />
                            )}
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => revealKey(key.id)}
                        >
                          {isRevealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleActive(key.id, key.isActive)}
                        >
                          {key.isActive ? (
                            <XCircle className="h-4 w-4 text-red-500" />
                          ) : (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteKey(key.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

const SecretsPage = () => {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-6 w-6 animate-spin" />
        </div>
      }
    >
      <SecretsPageContent />
    </Suspense>
  );
};

export default SecretsPage;