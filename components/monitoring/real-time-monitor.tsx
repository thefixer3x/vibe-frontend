'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  Server, 
  Database, 
  Globe, 
  Zap, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  Play,
  Pause,
  Square,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import { getUnifiedServiceManager, ServiceConnection, ServiceMetrics } from '@/lib/services/unified-service-manager';

interface MonitoringData {
  timestamp: Date;
  serviceId: string;
  metric: string;
  value: number;
  unit: string;
}

interface Alert {
  id: string;
  serviceId: string;
  type: 'warning' | 'error' | 'info';
  message: string;
  timestamp: Date;
  acknowledged: boolean;
}

export function RealTimeMonitor() {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [services, setServices] = useState<Map<string, ServiceConnection>>(new Map());
  const [metrics, setMetrics] = useState<Map<string, ServiceMetrics>>(new Map());
  const [monitoringData, setMonitoringData] = useState<MonitoringData[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  
  const serviceManager = getUnifiedServiceManager();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Set up service status monitoring
    const unsubscribeStatus = serviceManager.onStatusChange((service) => {
      setServices(prev => new Map(prev.set(service.id, service)));
      
      // Check for service status changes and create alerts
      if (service.status === 'error') {
        addAlert({
          serviceId: service.id,
          type: 'error',
          message: `${service.name} is experiencing issues`
        });
      } else if (service.status === 'connected' && services.get(service.id)?.status === 'error') {
        addAlert({
          serviceId: service.id,
          type: 'info',
          message: `${service.name} has recovered`
        });
      }
    });

    const unsubscribeMetrics = serviceManager.onMetricsUpdate((newMetrics) => {
      setMetrics(newMetrics);
    });

    return () => {
      unsubscribeStatus();
      unsubscribeMetrics();
    };
  }, [services]);

  const addAlert = (alert: Omit<Alert, 'id' | 'timestamp' | 'acknowledged'>) => {
    const newAlert: Alert = {
      id: `alert_${Date.now()}`,
      ...alert,
      timestamp: new Date(),
      acknowledged: false
    };
    setAlerts(prev => [newAlert, ...prev.slice(0, 49)]); // Keep last 50 alerts
  };

  const startMonitoring = async () => {
    setIsMonitoring(true);
    
    // Connect to all services first
    await serviceManager.connectAllServices();
    
    // Start monitoring interval
    intervalRef.current = setInterval(async () => {
      try {
        // Collect metrics from all services
        for (const [serviceId, service] of services) {
          if (service.status === 'connected') {
            try {
              const startTime = Date.now();
              await serviceManager.executeServiceAction(serviceId, 'health_check');
              const responseTime = Date.now() - startTime;
              
              // Add monitoring data point
              const dataPoint: MonitoringData = {
                timestamp: new Date(),
                serviceId,
                metric: 'response_time',
                value: responseTime,
                unit: 'ms'
              };
              
              setMonitoringData(prev => {
                const newData = [dataPoint, ...prev.slice(0, 199)]; // Keep last 200 data points
                return newData;
              });

              // Check for performance issues
              if (responseTime > 5000) {
                addAlert({
                  serviceId,
                  type: 'warning',
                  message: `${service.name} response time is high: ${responseTime}ms`
                });
              }

            } catch (error) {
              addAlert({
                serviceId,
                type: 'error',
                message: `Failed to check ${service.name}: ${error}`
              });
            }
          }
        }
      } catch (error) {
        console.error('Monitoring error:', error);
      }
    }, 5000); // Check every 5 seconds
  };

  const stopMonitoring = () => {
    setIsMonitoring(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const acknowledgeAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ));
  };

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'info':
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
    }
  };

  const getAlertColor = (type: Alert['type']) => {
    switch (type) {
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'info':
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <TrendingUp className="w-4 h-4 text-red-500" />;
    if (current < previous) return <TrendingDown className="w-4 h-4 text-green-500" />;
    return <Minus className="w-4 h-4 text-gray-500" />;
  };

  const getServiceMetrics = (serviceId: string) => {
    return Array.from(monitoringData)
      .filter(data => data.serviceId === serviceId)
      .slice(0, 20); // Last 20 data points
  };

  const getAverageResponseTime = (serviceId: string) => {
    const data = getServiceMetrics(serviceId);
    if (data.length === 0) return 0;
    return data.reduce((sum, d) => sum + d.value, 0) / data.length;
  };

  const unacknowledgedAlerts = alerts.filter(alert => !alert.acknowledged);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Real-time Monitoring</h2>
          <p className="text-gray-600">Monitor your services in real-time</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={isMonitoring ? "destructive" : "default"}
            onClick={isMonitoring ? stopMonitoring : startMonitoring}
          >
            {isMonitoring ? (
              <>
                <Pause className="w-4 h-4 mr-2" />
                Stop Monitoring
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Start Monitoring
              </>
            )}
          </Button>
          <Button variant="outline" onClick={() => setMonitoringData([])}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Clear Data
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {unacknowledgedAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Active Alerts ({unacknowledgedAlerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {unacknowledgedAlerts.slice(0, 5).map(alert => (
                <div key={alert.id} className={`border rounded-lg p-3 ${getAlertColor(alert.type)}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getAlertIcon(alert.type)}
                      <span className="font-medium">{alert.message}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">
                        {alert.timestamp.toLocaleTimeString()}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => acknowledgeAlert(alert.id)}
                      >
                        Dismiss
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Service Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from(services.values()).map(service => {
          const serviceData = getServiceMetrics(service.id);
          const avgResponseTime = getAverageResponseTime(service.id);
          const isSelected = selectedService === service.id;
          
          return (
            <Card 
              key={service.id} 
              className={`cursor-pointer transition-all ${isSelected ? 'ring-2 ring-blue-500' : 'hover:shadow-md'}`}
              onClick={() => setSelectedService(isSelected ? null : service.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {service.status === 'connected' ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : service.status === 'error' ? (
                      <XCircle className="w-4 h-4 text-red-500" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-yellow-500" />
                    )}
                    <CardTitle className="text-sm font-medium">{service.name}</CardTitle>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {serviceData.length} data points
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Avg Response:</span>
                    <span className="font-medium">{avgResponseTime.toFixed(0)}ms</span>
                  </div>
                  
                  {serviceData.length > 1 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Trend:</span>
                      {getTrendIcon(serviceData[0].value, serviceData[1].value)}
                    </div>
                  )}
                  
                  <div className="text-xs text-gray-500">
                    Last check: {service.lastCheck.toLocaleTimeString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Detailed Metrics */}
      {selectedService && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {services.get(selectedService)?.name} - Detailed Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600">Average Response Time</div>
                  <div className="text-2xl font-bold">{getAverageResponseTime(selectedService).toFixed(0)}ms</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600">Data Points</div>
                  <div className="text-2xl font-bold">{getServiceMetrics(selectedService).length}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600">Status</div>
                  <div className="text-2xl font-bold">
                    {services.get(selectedService)?.status || 'Unknown'}
                  </div>
                </div>
              </div>
              
              <div className="h-64 bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-2">Response Time Over Time</div>
                <div className="h-full flex items-end gap-1">
                  {getServiceMetrics(selectedService).slice(0, 20).map((data, index) => (
                    <div
                      key={index}
                      className="bg-blue-500 rounded-t"
                      style={{
                        height: `${Math.min((data.value / 1000) * 100, 100)}%`,
                        width: '100%'
                      }}
                      title={`${data.value}ms at ${data.timestamp.toLocaleTimeString()}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Alerts History */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Alert History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {alerts.map(alert => (
                <div key={alert.id} className={`border rounded-lg p-3 ${getAlertColor(alert.type)} ${alert.acknowledged ? 'opacity-50' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getAlertIcon(alert.type)}
                      <span className="font-medium">{alert.message}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">
                        {alert.timestamp.toLocaleString()}
                      </span>
                      {!alert.acknowledged && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => acknowledgeAlert(alert.id)}
                        >
                          Acknowledge
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
