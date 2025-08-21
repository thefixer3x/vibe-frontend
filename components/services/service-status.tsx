'use client';

import { CheckCircleIcon, XCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useApiServices } from '@/lib/hooks/useApiServices';
import { useState } from 'react';

interface ServiceStatusProps {
  serviceName: string;
  showTestButton?: boolean;
  compact?: boolean;
}

export function ServiceStatus({ serviceName, showTestButton = false, compact = false }: ServiceStatusProps) {
  const { services, testService } = useApiServices();
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!services) {
    return (
      <Badge variant="secondary" className="flex items-center gap-1">
        <ExclamationCircleIcon className="h-3 w-3" />
        Loading...
      </Badge>
    );
  }

  const service = services[serviceName as keyof typeof services];
  if (!service) {
    return (
      <Badge variant="destructive" className="flex items-center gap-1">
        <XCircleIcon className="h-3 w-3" />
        Unknown Service
      </Badge>
    );
  }

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await testService(serviceName);
      setTestResult(result);
    } catch (err) {
      setTestResult({
        success: false,
        message: err instanceof Error ? err.message : 'Test failed'
      });
    } finally {
      setTesting(false);
    }
  };

  const getStatusColor = () => {
    if (service.isConfigured && service.hasValidKey) return 'default';
    if (service.isConfigured) return 'secondary';
    return 'destructive';
  };

  const getStatusIcon = () => {
    if (service.isConfigured && service.hasValidKey) {
      return <CheckCircleIcon className="h-3 w-3" />;
    }
    return <XCircleIcon className="h-3 w-3" />;
  };

  const getStatusText = () => {
    if (service.isConfigured && service.hasValidKey) return 'Configured';
    if (service.isConfigured) return 'Needs Validation';
    return 'Not Configured';
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant={getStatusColor()} className="flex items-center gap-1">
          {getStatusIcon()}
          {getStatusText()}
        </Badge>
        {testResult && (
          <span className={`text-xs ${testResult.success ? 'text-green-600' : 'text-red-600'}`}>
            {testResult.message}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-3 border rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h4 className="font-medium capitalize">{serviceName}</h4>
          <Badge variant={getStatusColor()} className="flex items-center gap-1">
            {getStatusIcon()}
            {getStatusText()}
          </Badge>
        </div>
        {showTestButton && service.isConfigured && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleTest}
            disabled={testing}
          >
            {testing ? 'Testing...' : 'Test Connection'}
          </Button>
        )}
      </div>
      
      {service.isConfigured && (
        <div className="text-sm text-muted-foreground">
          {service.keyCount} API key{service.keyCount !== 1 ? 's' : ''} configured
          {service.lastTested && (
            <span className="ml-2">
              • Last tested: {service.lastTested.toLocaleDateString()}
            </span>
          )}
        </div>
      )}

      {testResult && (
        <div className={`text-sm p-2 rounded ${
          testResult.success 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {testResult.message}
        </div>
      )}
    </div>
  );
}

export function ServiceStatusGrid({ services, showTestButtons = false }: { 
  services: string[]; 
  showTestButtons?: boolean; 
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {services.map((service) => (
        <ServiceStatus
          key={service}
          serviceName={service}
          showTestButton={showTestButtons}
        />
      ))}
    </div>
  );
}