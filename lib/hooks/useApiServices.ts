'use client';

import { useState, useEffect } from 'react';
import { apiServiceManager, type ServiceClients } from '@/lib/services/api-service';

export function useApiServices() {
  const [services, setServices] = useState<ServiceClients | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshServices = async () => {
    try {
      setLoading(true);
      setError(null);
      const serviceClients = await apiServiceManager.getServiceClients();
      setServices(serviceClients);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const testService = async (serviceName: string) => {
    try {
      const result = await apiServiceManager.testServiceConnection(serviceName);
      await refreshServices(); // Refresh after test
      return result;
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Test failed',
      };
    }
  };

  const getServiceClient = async (serviceName: string) => {
    try {
      switch (serviceName.toLowerCase()) {
        case 'stripe':
          return await apiServiceManager.getStripeClient();
        case 'openai':
          return await apiServiceManager.getOpenAIClient();
        case 'github':
          return await apiServiceManager.getGitHubClient();
        default:
          throw new Error(`Service ${serviceName} not supported`);
      }
    } catch (err) {
      throw err;
    }
  };

  useEffect(() => {
    refreshServices();
  }, []);

  return {
    services,
    loading,
    error,
    refreshServices,
    testService,
    getServiceClient,
  };
}

export function useApiKey(service: string, keyName?: string) {
  const [key, setKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getKey = async () => {
    try {
      setLoading(true);
      setError(null);
      const apiKey = await apiServiceManager.getApiKey(service, keyName);
      setKey(apiKey);
      return apiKey;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get API key';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    key,
    loading,
    error,
    getKey,
  };
}