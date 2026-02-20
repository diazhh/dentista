import { useState, useEffect } from 'react';
import api from '../services/api';

export interface ActiveModule {
  id: string;
  moduleKey: string;
  isActive: boolean;
  config: Record<string, unknown> | null;
  activatedAt: string;
  // From module definition (merged by backend)
  name: string;
  description: string;
  icon: string;
}

export function useActiveModules() {
  const [activeModules, setActiveModules] = useState<ActiveModule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchModules = async () => {
      try {
        setIsLoading(true);
        const response = await api.get('/modules/active');
        if (!cancelled) {
          setActiveModules(response.data);
          setError(null);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Error loading modules';
          setError(message);
          setActiveModules([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };
    fetchModules();
    return () => { cancelled = true; };
  }, []);

  return { activeModules, isLoading, error };
}
