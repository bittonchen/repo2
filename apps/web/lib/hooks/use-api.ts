'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { getToken } from '@/lib/auth';

interface UseApiOptions {
  immediate?: boolean;
}

export function useApi<T>(endpoint: string, options: UseApiOptions = { immediate: true }) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async (queryParams?: Record<string, string>) => {
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      let url = endpoint;
      if (queryParams) {
        const params = new URLSearchParams(
          Object.entries(queryParams).filter(([, v]) => v !== undefined && v !== ''),
        );
        if (params.toString()) url += `?${params.toString()}`;
      }
      const result = await apiFetch<T>(url, { token: token || undefined });
      setData(result);
      return result;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    if (options.immediate) {
      fetch();
    }
  }, [fetch, options.immediate]);

  return { data, loading, error, refetch: fetch, setData };
}

export function useApiMutation<TInput, TOutput = any>(endpoint: string, method: string = 'POST') {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(async (body?: TInput, pathSuffix?: string): Promise<TOutput | null> => {
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      const url = pathSuffix ? `${endpoint}/${pathSuffix}` : endpoint;
      const result = await apiFetch<TOutput>(url, {
        method,
        token: token || undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      return result;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [endpoint, method]);

  return { mutate, loading, error };
}
