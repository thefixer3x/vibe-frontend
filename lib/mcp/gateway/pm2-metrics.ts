#!/usr/bin/env node
/**
 * PM2 Custom Metrics Module for vibe-mcp Gateway
 * 
 * Tracks custom application metrics and reports them to PM2
 * for monitoring and alerting.
 */

import pm2 from 'pm2';

interface Metrics {
  // Request metrics
  httpRequests: {
    total: number;
    success: number;
    errors: number;
    byEndpoint: Record<string, number>;
  };
  
  // WebSocket metrics
  websocket: {
    connections: {
      active: number;
      total: number;
      closed: number;
    };
    messages: {
      sent: number;
      received: number;
    };
  };
  
  // Tool call metrics
  toolCalls: {
    total: number;
    bySource: Record<string, number>;
    byTool: Record<string, number>;
    errors: number;
    avgResponseTime: number;
  };
  
  // Database metrics
  database: {
    poolSize: number;
    activeConnections: number;
    idleConnections: number;
    totalQueries: number;
    queryErrors: number;
  };
  
  // Source health metrics
  sources: {
    available: number;
    unavailable: number;
    bySource: Record<string, { available: boolean; lastCheck: number }>;
  };
  
  // Performance metrics
  performance: {
    avgResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    requestRate: number; // requests per second
  };
  
  // Timestamps
  lastUpdated: number;
  startTime: number;
}

class PM2Metrics {
  private metrics: Metrics;
  private processName: string;
  private updateInterval: NodeJS.Timeout | null = null;
  private responseTimes: number[] = [];
  private readonly MAX_RESPONSE_TIMES = 1000; // Keep last 1000 response times for percentile calculation

  constructor(processName: string = 'vibe-mcp') {
    this.processName = processName;
    this.metrics = this.initializeMetrics();
    this.startTime = Date.now();
  }

  private initializeMetrics(): Metrics {
    return {
      httpRequests: {
        total: 0,
        success: 0,
        errors: 0,
        byEndpoint: {},
      },
      websocket: {
        connections: {
          active: 0,
          total: 0,
          closed: 0,
        },
        messages: {
          sent: 0,
          received: 0,
        },
      },
      toolCalls: {
        total: 0,
        bySource: {},
        byTool: {},
        errors: 0,
        avgResponseTime: 0,
      },
      database: {
        poolSize: 0,
        activeConnections: 0,
        idleConnections: 0,
        totalQueries: 0,
        queryErrors: 0,
      },
      sources: {
        available: 0,
        unavailable: 0,
        bySource: {},
      },
      performance: {
        avgResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        requestRate: 0,
      },
      lastUpdated: Date.now(),
      startTime: Date.now(),
    };
  }

  /**
   * Connect to PM2 and start reporting metrics
   */
  public async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      pm2.connect((err) => {
        if (err) {
          console.error('Failed to connect to PM2:', err);
          reject(err);
          return;
        }
        console.log('Connected to PM2, starting metrics reporting...');
        this.startReporting();
        resolve();
      });
    });
  }

  /**
   * Start periodic reporting of metrics to PM2
   */
  private startReporting(): void {
    // Report metrics every 5 seconds
    this.updateInterval = setInterval(() => {
      this.reportMetrics();
    }, 5000);

    // Initial report
    this.reportMetrics();
  }

  /**
   * Report current metrics to PM2
   */
  private reportMetrics(): void {
    this.metrics.lastUpdated = Date.now();
    this.calculatePerformanceMetrics();

    pm2.list((err, processes) => {
      if (err) {
        console.error('Error listing PM2 processes:', err);
        return;
      }

      const process = processes.find((p) => p.name === this.processName || p.pm_id === 4);
      if (!process) {
        console.warn(`Process ${this.processName} not found in PM2`);
        return;
      }

      // Send custom metrics to PM2
      pm2.sendDataToProcessId(process.pm_id, {
        type: 'process:msg',
        data: {
          metrics: this.metrics,
          timestamp: Date.now(),
        },
        topic: 'metrics',
      }, (err) => {
        if (err) {
          console.error('Error sending metrics to PM2:', err);
        }
      });
    });
  }

  /**
   * Calculate performance metrics from response times
   */
  private calculatePerformanceMetrics(): void {
    if (this.responseTimes.length === 0) {
      return;
    }

    const sorted = [...this.responseTimes].sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);

    this.metrics.performance.avgResponseTime = sum / sorted.length;
    this.metrics.performance.p95ResponseTime = sorted[Math.floor(sorted.length * 0.95)] || 0;
    this.metrics.performance.p99ResponseTime = sorted[Math.floor(sorted.length * 0.99)] || 0;

    // Calculate request rate (requests per second over last minute)
    const oneMinuteAgo = Date.now() - 60000;
    const recentRequests = this.metrics.httpRequests.total;
    const uptimeSeconds = (Date.now() - this.startTime) / 1000;
    this.metrics.performance.requestRate = recentRequests / Math.max(uptimeSeconds, 1);
  }

  // HTTP Request Metrics
  public recordHttpRequest(endpoint: string, success: boolean, responseTime?: number): void {
    this.metrics.httpRequests.total++;
    if (success) {
      this.metrics.httpRequests.success++;
    } else {
      this.metrics.httpRequests.errors++;
    }

    this.metrics.httpRequests.byEndpoint[endpoint] = 
      (this.metrics.httpRequests.byEndpoint[endpoint] || 0) + 1;

    if (responseTime !== undefined) {
      this.responseTimes.push(responseTime);
      if (this.responseTimes.length > this.MAX_RESPONSE_TIMES) {
        this.responseTimes.shift();
      }
    }
  }

  // WebSocket Metrics
  public recordWebSocketConnection(): void {
    this.metrics.websocket.connections.active++;
    this.metrics.websocket.connections.total++;
  }

  public recordWebSocketDisconnection(): void {
    if (this.metrics.websocket.connections.active > 0) {
      this.metrics.websocket.connections.active--;
    }
    this.metrics.websocket.connections.closed++;
  }

  public recordWebSocketMessage(sent: boolean): void {
    if (sent) {
      this.metrics.websocket.messages.sent++;
    } else {
      this.metrics.websocket.messages.received++;
    }
  }

  // Tool Call Metrics
  public recordToolCall(source: string, tool: string, success: boolean, responseTime?: number): void {
    this.metrics.toolCalls.total++;
    
    this.metrics.toolCalls.bySource[source] = 
      (this.metrics.toolCalls.bySource[source] || 0) + 1;
    
    this.metrics.toolCalls.byTool[tool] = 
      (this.metrics.toolCalls.byTool[tool] || 0) + 1;

    if (!success) {
      this.metrics.toolCalls.errors++;
    }

    if (responseTime !== undefined) {
      // Update average response time
      const currentAvg = this.metrics.toolCalls.avgResponseTime;
      const count = this.metrics.toolCalls.total;
      this.metrics.toolCalls.avgResponseTime = 
        (currentAvg * (count - 1) + responseTime) / count;
    }
  }

  // Database Metrics
  public updateDatabaseMetrics(poolSize: number, active: number, idle: number): void {
    this.metrics.database.poolSize = poolSize;
    this.metrics.database.activeConnections = active;
    this.metrics.database.idleConnections = idle;
  }

  public recordDatabaseQuery(success: boolean): void {
    this.metrics.database.totalQueries++;
    if (!success) {
      this.metrics.database.queryErrors++;
    }
  }

  // Source Health Metrics
  public updateSourceHealth(sourceId: string, available: boolean): void {
    this.metrics.sources.bySource[sourceId] = {
      available,
      lastCheck: Date.now(),
    };

    // Recalculate available/unavailable counts
    const sources = Object.values(this.metrics.sources.bySource);
    this.metrics.sources.available = sources.filter((s) => s.available).length;
    this.metrics.sources.unavailable = sources.filter((s) => !s.available).length;
  }

  // Get current metrics
  public getMetrics(): Metrics {
    return { ...this.metrics };
  }

  // Reset metrics (useful for testing or periodic resets)
  public reset(): void {
    this.metrics = this.initializeMetrics();
    this.responseTimes = [];
  }

  // Stop reporting
  public stop(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    pm2.disconnect();
  }
}

// Export singleton instance
let metricsInstance: PM2Metrics | null = null;

export function getMetrics(): PM2Metrics {
  if (!metricsInstance) {
    metricsInstance = new PM2Metrics('vibe-mcp');
  }
  return metricsInstance;
}

export default PM2Metrics;

