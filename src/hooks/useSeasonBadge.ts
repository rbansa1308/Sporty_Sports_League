import { useEffect, useState } from "react";
import { getSeasonBadge } from "../api/client";
import type { Season } from "../api/types";

interface BadgeState {
  data: Season | null;
  loading: boolean;
  error: string | null;
}

const IDLE: BadgeState = { data: null, loading: false, error: null };

/**
 * Lazily loads the season badge for a league. Pass null to stay idle (e.g. when
 * no league is selected). Caching is handled by the API client.
 */
export function useSeasonBadge(leagueId: string | null) {
  const [state, setState] = useState<BadgeState>(IDLE);

  useEffect(() => {
    if (!leagueId) {
      setState(IDLE);
      return;
    }

    let active = true;
    setState({ data: null, loading: true, error: null });

    getSeasonBadge(leagueId)
      .then((data) => {
        if (active) setState({ data, loading: false, error: null });
      })
      .catch((error: unknown) => {
        if (!active) return;
        const message = error instanceof Error ? error.message : "Failed to load badge";
        setState({ data: null, loading: false, error: message });
      });

    return () => {
      active = false;
    };
  }, [leagueId]);

  return state;
}
