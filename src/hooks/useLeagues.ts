import { useCallback, useEffect, useState } from "react";
import { getAllLeagues } from "../api/client";
import type { League } from "../api/types";

interface LeaguesState {
  data: League[];
  loading: boolean;
  error: string | null;
}

/** Loads all leagues once on mount. Caching is handled by the API client. */
export function useLeagues() {
  const [state, setState] = useState<LeaguesState>({
    data: [],
    loading: true,
    error: null,
  });

  const load = useCallback(async () => {
    setState({ data: [], loading: true, error: null });
    try {
      const data = await getAllLeagues();
      setState({ data, loading: false, error: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load leagues";
      setState({ data: [], loading: false, error: message });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { ...state, retry: load };
}
