import { useState, useCallback, useEffect } from "react";
import { supabase } from "~/lib/supabase.ts";
import type { ApiProvider } from "~/types/database.ts";

export interface ApiKeyInfo {
  id: string;
  provider: ApiProvider;
  key_hint: string;
  is_valid: boolean;
  last_validated_at: string | null;
  created_at: string;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Not authenticated");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export function useApiKeys() {
  const [keys, setKeys] = useState<ApiKeyInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchKeys = useCallback(async () => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/api-keys", { headers });
      if (res.ok) {
        const data = await res.json();
        setKeys(data.keys ?? []);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  const saveKey = useCallback(
    async (provider: ApiProvider, key: string): Promise<{ valid: boolean; error?: string }> => {
      try {
        const headers = await getAuthHeaders();
        const res = await fetch("/api/api-keys", {
          method: "POST",
          headers,
          body: JSON.stringify({ provider, key }),
        });
        const data = await res.json();
        if (!res.ok) return { valid: false, error: data.error };
        await fetchKeys();
        return { valid: data.valid };
      } catch {
        return { valid: false, error: "Netzwerkfehler" };
      }
    },
    [fetchKeys]
  );

  const deleteKey = useCallback(
    async (provider: ApiProvider): Promise<{ error?: string }> => {
      try {
        const headers = await getAuthHeaders();
        const res = await fetch(`/api/api-keys?provider=${provider}`, {
          method: "DELETE",
          headers,
        });
        if (!res.ok) {
          const data = await res.json();
          return { error: data.error };
        }
        await fetchKeys();
        return {};
      } catch {
        return { error: "Netzwerkfehler" };
      }
    },
    [fetchKeys]
  );

  const validateKey = useCallback(
    async (provider: ApiProvider, key: string): Promise<boolean> => {
      try {
        const res = await fetch("/api/validate-key", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ provider, key }),
        });
        const data = await res.json();
        return data.valid === true;
      } catch {
        return false;
      }
    },
    []
  );

  const getKey = useCallback(
    (provider: ApiProvider): ApiKeyInfo | undefined => {
      return keys.find((k) => k.provider === provider);
    },
    [keys]
  );

  const hasValidKey = useCallback(
    (provider: ApiProvider): boolean => {
      return keys.some((k) => k.provider === provider && k.is_valid);
    },
    [keys]
  );

  return { keys, loading, fetchKeys, saveKey, deleteKey, validateKey, getKey, hasValidKey };
}
