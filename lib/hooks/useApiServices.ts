'use client';

import useSWR from 'swr';
import { ServiceClients } from '@/lib/services/api-service';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useApiServices() {
  const { data, error, isLoading, mutate } = useSWR<ServiceClients>(
    '/api/services',
    fetcher
  );

  const refreshServices = async () => {
    await mutate();
  };

  const testService = async (serviceName: string) => {
    try {
      const response = await fetch(`/api/services/test?service=${serviceName}`, {
        method: 'POST',
      });
      const result = await response.json();
      await refreshServices(); // Refresh after test
      return result;
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Test failed',
      };
    }
  };

  return {
    services: data || null,
    loading: isLoading,
    error: error?.message || null,
    refreshServices,
    testService,
  };
}