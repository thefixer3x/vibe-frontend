'use client';

import { getMCPClient } from '@/lib/mcp/client';

export interface ServiceConnection {
    id: string;
    name: string;
    type: 'sse' | 'ws' | 'mcp' | 'api';
    url: string;
    status: 'connected' | 'disconnected' | 'error' | 'connecting';
    lastCheck: Date;
    capabilities: string[];
    metadata?: Record<string, any>;
}

export interface ServiceMetrics {
    responseTime: number;
    uptime: number;
    errorRate: number;
    requestsPerMinute: number;
    lastActivity: Date;
}

export class UnifiedServiceManager {
    private services: Map<string, ServiceConnection> = new Map();
    private eventSource: EventSource | null = null;
    private websocket: WebSocket | null = null;
    private mcpClient = getMCPClient();
    private onStatusChangeCallbacks: ((service: ServiceConnection) => void)[] = [];
    private onMetricsUpdateCallbacks: ((metrics: Map<string, ServiceMetrics>) => void)[] = [];

    constructor() {
        this.initializeServices();
    }

    private initializeServices() {
        // Initialize all deployed services with development fallbacks
        const isDevelopment = process.env.NODE_ENV === 'development';

        this.services.set('sse', {
            id: 'sse',
            name: 'Server-Sent Events',
            type: 'sse',
            url: isDevelopment ? '/api/sse' : 'https://link.seyederick.com/sse',
            status: 'disconnected',
            lastCheck: new Date(),
            capabilities: ['real-time-updates', 'notifications', 'live-data']
        });

        this.services.set('ws', {
            id: 'ws',
            name: 'WebSocket Connection',
            type: 'ws',
            url: isDevelopment ? 'ws://localhost:3000/ws' : 'https://link.seyederick.com/ws',
            status: 'disconnected',
            lastCheck: new Date(),
            capabilities: ['real-time-communication', 'bidirectional-data', 'low-latency']
        });

        this.services.set('mcp', {
            id: 'mcp',
            name: 'Model Context Protocol',
            type: 'mcp',
            url: isDevelopment ? '/api/mcp' : 'https://link.seyederick.com/mcp',
            status: 'disconnected',
            lastCheck: new Date(),
            capabilities: ['ai-tools', 'memory-management', 'semantic-search', 'workflow-orchestration']
        });
    }

    async connectAllServices(): Promise<Map<string, ServiceConnection>> {
        const connectionPromises = Array.from(this.services.entries()).map(
            async ([id, service]) => {
                try {
                    await this.connectService(service);
                    return [id, { ...service, status: 'connected' as const }] as [string, ServiceConnection];
                } catch (error) {
                    console.error(`Failed to connect to ${service.name}:`, error);
                    return [id, { ...service, status: 'error' as const }] as [string, ServiceConnection];
                }
            }
        );

        const results = await Promise.all(connectionPromises);
        results.forEach(([id, service]) => {
            this.services.set(id, service);
            this.notifyStatusChange(service);
        });

        return this.services;
    }

    private async connectService(service: ServiceConnection): Promise<void> {
        switch (service.type) {
            case 'sse':
                await this.connectSSE(service);
                break;
            case 'ws':
                await this.connectWebSocket(service);
                break;
            case 'mcp':
                await this.connectMCP(service);
                break;
            default:
                throw new Error(`Unsupported service type: ${service.type}`);
        }
    }

    private async connectSSE(service: ServiceConnection): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                this.eventSource = new EventSource(service.url);

                this.eventSource.onopen = () => {
                    console.log('SSE connection established');
                    resolve();
                };

                this.eventSource.onerror = (error) => {
                    console.warn('SSE connection error (this is expected in development):', error);
                    // Don't reject in development mode, just log the warning
                    if (process.env.NODE_ENV === 'development') {
                        resolve();
                    } else {
                        reject(error);
                    }
                };

                // Listen for various event types
                this.eventSource.addEventListener('service-status', (event) => {
                    const data = JSON.parse(event.data);
                    this.handleServiceEvent('sse', data);
                });

                this.eventSource.addEventListener('metrics-update', (event) => {
                    const data = JSON.parse(event.data);
                    this.handleMetricsUpdate('sse', data);
                });

            } catch (error) {
                reject(error);
            }
        });
    }

    private async connectWebSocket(service: ServiceConnection): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                this.websocket = new WebSocket(service.url);

                this.websocket.onopen = () => {
                    console.log('WebSocket connection established');
                    resolve();
                };

                this.websocket.onerror = (error) => {
                    console.warn('WebSocket connection error (this is expected in development):', error);
                    // Don't reject in development mode, just log the warning
                    if (process.env.NODE_ENV === 'development') {
                        resolve();
                    } else {
                        reject(error);
                    }
                };

                this.websocket.onmessage = (event) => {
                    const data = JSON.parse(event.data);
                    this.handleServiceEvent('ws', data);
                };

            } catch (error) {
                reject(error);
            }
        });
    }

    private async connectMCP(service: ServiceConnection): Promise<void> {
        try {
            const connected = await this.mcpClient.connect();
            if (!connected) {
                if (process.env.NODE_ENV === 'development') {
                    console.warn('MCP connection failed (this is expected in development)');
                    return; // Don't throw error in development
                }
                throw new Error('MCP connection failed');
            }
            console.log('MCP connection established');
        } catch (error) {
            if (process.env.NODE_ENV === 'development') {
                console.warn('MCP connection failed (this is expected in development):', error);
                return; // Don't throw error in development
            }
            throw new Error(`MCP connection failed: ${error}`);
        }
    }

    private handleServiceEvent(serviceId: string, data: any): void {
        const service = this.services.get(serviceId);
        if (service) {
            service.lastCheck = new Date();
            this.services.set(serviceId, service);
            this.notifyStatusChange(service);
        }
    }

    private handleMetricsUpdate(serviceId: string, metrics: ServiceMetrics): void {
        // Update metrics and notify callbacks
        this.notifyMetricsUpdate(this.services);
    }

    async executeServiceAction(serviceId: string, action: string, params?: any): Promise<any> {
        const service = this.services.get(serviceId);
        if (!service) {
            throw new Error(`Service ${serviceId} not found`);
        }

        switch (service.type) {
            case 'mcp':
                return await this.executeMCPAction(action, params);
            case 'ws':
                return await this.executeWebSocketAction(action, params);
            case 'sse':
                return await this.executeSSEAction(action, params);
            default:
                throw new Error(`Unsupported action for service type: ${service.type}`);
        }
    }

    private async executeMCPAction(action: string, params?: any): Promise<any> {
        return await this.mcpClient.callTool({
            name: action,
            arguments: params || {}
        });
    }

    private async executeWebSocketAction(action: string, params?: any): Promise<any> {
        if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
            throw new Error('WebSocket not connected');
        }

        return new Promise((resolve, reject) => {
            const messageId = Math.random().toString(36).substr(2, 9);

            const handleMessage = (event: MessageEvent) => {
                const data = JSON.parse(event.data);
                if (data.id === messageId) {
                    this.websocket!.removeEventListener('message', handleMessage);
                    if (data.error) {
                        reject(new Error(data.error));
                    } else {
                        resolve(data.result);
                    }
                }
            };

            this.websocket!.addEventListener('message', handleMessage);

            this.websocket!.send(JSON.stringify({
                id: messageId,
                action,
                params
            }));

            // Timeout after 30 seconds
            setTimeout(() => {
                this.websocket!.removeEventListener('message', handleMessage);
                reject(new Error('Action timeout'));
            }, 30000);
        });
    }

    private async executeSSEAction(action: string, params?: any): Promise<any> {
        // SSE is typically read-only, but we can send commands via fetch
        const response = await fetch('https://link.seyederick.com/sse', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action,
                params
            })
        });

        if (!response.ok) {
            throw new Error(`SSE action failed: ${response.statusText}`);
        }

        return await response.json();
    }

    getServiceStatus(serviceId: string): ServiceConnection | undefined {
        return this.services.get(serviceId);
    }

    getAllServices(): Map<string, ServiceConnection> {
        return new Map(this.services);
    }

    onStatusChange(callback: (service: ServiceConnection) => void): () => void {
        this.onStatusChangeCallbacks.push(callback);
        return () => {
            const index = this.onStatusChangeCallbacks.indexOf(callback);
            if (index > -1) {
                this.onStatusChangeCallbacks.splice(index, 1);
            }
        };
    }

    onMetricsUpdate(callback: (metrics: Map<string, ServiceMetrics>) => void): () => void {
        this.onMetricsUpdateCallbacks.push(callback);
        return () => {
            const index = this.onMetricsUpdateCallbacks.indexOf(callback);
            if (index > -1) {
                this.onMetricsUpdateCallbacks.splice(index, 1);
            }
        };
    }

    private notifyStatusChange(service: ServiceConnection): void {
        this.onStatusChangeCallbacks.forEach(callback => callback(service));
    }

    private notifyMetricsUpdate(metrics: Map<string, ServiceMetrics>): void {
        this.onMetricsUpdateCallbacks.forEach(callback => callback(metrics));
    }

    async disconnectAll(): Promise<void> {
        if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
        }

        if (this.websocket) {
            this.websocket.close();
            this.websocket = null;
        }

        await this.mcpClient.disconnect();

        // Update all services to disconnected
        this.services.forEach((service, id) => {
            this.services.set(id, { ...service, status: 'disconnected' });
        });
    }
}

// Singleton instance
let serviceManagerInstance: UnifiedServiceManager | null = null;

export function getUnifiedServiceManager(): UnifiedServiceManager {
    if (!serviceManagerInstance) {
        serviceManagerInstance = new UnifiedServiceManager();
    }
    return serviceManagerInstance;
}
