import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '@/services/api';
import { useAuth } from './AuthContext';

type FavoritesContextValue = {
  ids: Set<string>;
  toggle: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
};

const Context = createContext<FavoritesContextValue>({
  ids: new Set(),
  toggle: async () => undefined,
  refresh: async () => undefined
});

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [ids, setIds] = useState<Set<string>>(new Set());

  const refresh = async () => {
    if (!user) {
      setIds(new Set());
      return;
    }
    try {
      const response = await api('/favorites');
      const next = new Set<string>(
        (response.data?.favorites || [])
          .map((item: any) => item.listing?._id)
          .filter(Boolean)
      );
      setIds(next);
    } catch {
      // Keep the current local state when the server is temporarily unavailable.
    }
  };

  useEffect(() => {
    if (!authLoading) refresh();
  }, [user?._id, authLoading]);

  const toggle = async (id: string) => {
    const has = ids.has(id);
    setIds((previous) => {
      const next = new Set(previous);
      has ? next.delete(id) : next.add(id);
      return next;
    });

    try {
      await api(`/favorites/${id}`, { method: has ? 'DELETE' : 'POST' });
    } catch {
      setIds((previous) => {
        const next = new Set(previous);
        has ? next.add(id) : next.delete(id);
        return next;
      });
    }
  };

  return <Context.Provider value={{ ids, toggle, refresh }}>{children}</Context.Provider>;
}

export const useFavorites = () => useContext(Context);
