'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Server,
    Activity,
    Zap,
    Brain,
    Globe,
    Settings,
    Play,
    Pause,
    RefreshCw,
    CheckCircle,
    XCircle,
    AlertTriangle,
    BarChart3,
    Network,
    Terminal,
    Database,
    Shield,
    Clock
} from 'lucide-react';
import { getUnifiedServiceManager, ServiceConnection, ServiceMetrics } from '@/lib/services/unified-service-manager';
import { OrchestratorInterface } from '@/components/orchestrator/OrchestratorInterface';
import { ServiceOrchestrator } from '@/components/orchestrator/service-orchestrator';
import { RealTimeMonitor } from '@/components/monitoring/real-time-monitor';

interface UnifiedPlatformDashboardProps {
    className?: string;
}

export function UnifiedPlatformDashboard({ className }: UnifiedPlatformDashboardProps) {
    const [services, setServices] = useState<Map<string, ServiceConnection>>(new Map());
    const [metrics, setMetrics] = useState<Map<string, ServiceMetrics>>(new Map());
    const [isConnecting, setIsConnecting] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');

    const serviceManager = getUnifiedServiceManager();

    useEffect(() => {
        // Connect to all services on mount
        connectAllServices();

        // Set up real-time updates
        const unsubscribeStatus = serviceManager.onStatusChange((service) => {
            setServices(prev => new Map(prev.set(service.id, service)));
        });

        const unsubscribeMetrics = serviceManager.onMetricsUpdate((newMetrics) => {
            setMetrics(newMetrics);
        });

        return () => {
            unsubscribeStatus();
            unsubscribeMetrics();
        };
    }, []);

    const connectAllServices = async () => {
        setIsConnecting(true);
        try {
            const connectedServices = await serviceManager.connectAllServices();
            setServices(connectedServices);
        } catch (error) {
            console.error('Failed to connect services:', error);
        } finally {
            setIsConnecting(false);
        }
    };

    const executeServiceAction = async (serviceId: string, action: string, params?: any) => {
        try {
            const result = await serviceManager.executeServiceAction(serviceId, action, params);
            console.log(`Action ${action} on ${serviceId}:`, result);
            return result;
        } catch (error) {
            console.error(`Failed to execute ${action} on ${serviceId}:`, error);
            throw error;
        }
    };

    const getStatusIcon = (status: ServiceConnection['status']) => {
        switch (status) {
            case 'connected':
                return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'error':
                return <XCircle className="w-4 h-4 text-red-500" />;
            case 'connecting':
                return <RefreshCw className="w-4 h-4 text-yellow-500 animate-spin" />;
            default:
                return <AlertTriangle className="w-4 h-4 text-gray-500" />;
        }
    };

    const getStatusColor = (status: ServiceConnection['status']) => {
        switch (status) {
            case 'connected':
                return 'bg-green-100 text-green-800';
            case 'error':
                return 'bg-red-100 text-red-800';
            case 'connecting':
                return 'bg-yellow-100 text-yellow-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const ServiceCard = ({ service }: { service: ServiceConnection }) => {
        const serviceMetrics = metrics.get(service.id);

        return (
            <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {getStatusIcon(service.status)}
                            <CardTitle className="text-sm font-medium">{service.name}</CardTitle>
                        </div>
                        <Badge variant="secondary" className={getStatusColor(service.status)}>
                            {service.status}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        <div className="text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                                <Network className="w-3 h-3" />
                                {service.type.toUpperCase()}
                            </div>
                            <div className="flex items-center gap-1 mt-1">
                                <Clock className="w-3 h-3" />
                                Last check: {service.lastCheck.toLocaleTimeString()}
                            </div>
                        </div>

                        {serviceMetrics && (
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="bg-gray-50 p-2 rounded">
                                    <div className="text-muted-foreground">Response Time</div>
                                    <div className="font-semibold">{serviceMetrics.responseTime}ms</div>
                                </div>
                                <div className="bg-gray-50 p-2 rounded">
                                    <div className="text-muted-foreground">Uptime</div>
                                    <div className="font-semibold">{serviceMetrics.uptime}%</div>
                                </div>
                            </div>
                        )}

                        <div className="flex flex-wrap gap-1">
                            {service.capabilities.map((capability) => (
                                <Badge key={capability} variant="outline" className="text-xs">
                                    {capability.replace('-', ' ')}
                                </Badge>
                            ))}
                        </div>

                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => executeServiceAction(service.id, 'health_check')}
                                disabled={service.status !== 'connected'}
                            >
                                <Activity className="w-3 h-3 mr-1" />
                                Test
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => executeServiceAction(service.id, 'get_status')}
                                disabled={service.status !== 'connected'}
                            >
                                <Settings className="w-3 h-3 mr-1" />
                                Status
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    };

    const QuickActions = () => {
        const actions = [
            {
                title: 'Test All Services',
                description: 'Run health checks on all connected services',
                icon: Activity,
                action: () => {
                    Array.from(services.values()).forEach(service => {
                        if (service.status === 'connected') {
                            executeServiceAction(service.id, 'health_check');
                        }
                    });
                }
            },
            {
                title: 'Refresh Metrics',
                description: 'Update performance metrics for all services',
                icon: BarChart3,
                action: () => {
                    Array.from(services.values()).forEach(service => {
                        if (service.status === 'connected') {
                            executeServiceAction(service.id, 'get_metrics');
                        }
                    });
                }
            },
            {
                title: 'Memory Search',
                description: 'Search across all memory services',
                icon: Brain,
                action: () => {
                    executeServiceAction('mcp', 'memory_search_memories', { query: '', limit: 10 });
                }
            },
            {
                title: 'Service Orchestration',
                description: 'Run intelligent service workflows',
                icon: Zap,
                action: () => {
                    setActiveTab('orchestration');
                }
            }
        ];

        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Zap className="h-5 w-5" />
                        Quick Actions
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                        {actions.map((action, index) => (
                            <Button
                                key={index}
                                variant="outline"
                                onClick={action.action}
                                className="h-auto p-3 flex flex-col items-start text-left"
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <action.icon className="h-4 w-4" />
                                    <span className="text-sm font-medium">{action.title}</span>
                                </div>
                                <span className="text-xs text-muted-foreground">{action.description}</span>
                            </Button>
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    };

    const ServiceMetrics = () => {
        const totalServices = services.size;
        const connectedServices = Array.from(services.values()).filter(s => s.status === 'connected').length;
        const avgResponseTime = Array.from(metrics.values()).reduce((acc, m) => acc + m.responseTime, 0) / metrics.size || 0;
        const totalRequests = Array.from(metrics.values()).reduce((acc, m) => acc + m.requestsPerMinute, 0);

        return (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center">
                            <Server className="h-8 w-8 text-blue-600" />
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Services</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {connectedServices}/{totalServices}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center">
                            <Activity className="h-8 w-8 text-green-600" />
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Avg Response</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {avgResponseTime.toFixed(0)}ms
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center">
                            <BarChart3 className="h-8 w-8 text-purple-600" />
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Requests/min</p>
                                <p className="text-2xl font-bold text-gray-900">{totalRequests}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center">
                            <Shield className="h-8 w-8 text-orange-600" />
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Security</p>
                                <p className="text-2xl font-bold text-gray-900">Active</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    };

    return (
        <div className={`space-y-6 ${className}`}>
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Unified Platform Dashboard</h1>
                    <p className="text-gray-600 mt-1">
                        Manage all your services from one central location
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={connectAllServices}
                        disabled={isConnecting}
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${isConnecting ? 'animate-spin' : ''}`} />
                        {isConnecting ? 'Connecting...' : 'Refresh Services'}
                    </Button>
                </div>
            </div>

            <ServiceMetrics />

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="services">Services</TabsTrigger>
                    <TabsTrigger value="orchestration">Orchestration</TabsTrigger>
                    <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        <div className="xl:col-span-2 space-y-6">
                            <div>
                                <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
                                    <Server className="h-5 w-5" />
                                    Service Status
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {Array.from(services.values()).map((service) => (
                                        <ServiceCard key={service.id} service={service} />
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="xl:col-span-1 space-y-6">
                            <QuickActions />

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Brain className="h-5 w-5" />
                                        AI Assistant
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-[300px]">
                                        <OrchestratorInterface />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="services" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Array.from(services.values()).map((service) => (
                            <ServiceCard key={service.id} service={service} />
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="orchestration" className="space-y-6">
                    <ServiceOrchestrator />
                </TabsContent>

                <TabsContent value="monitoring" className="space-y-6">
                    <RealTimeMonitor />
                </TabsContent>
            </Tabs>
        </div>
    );
}
