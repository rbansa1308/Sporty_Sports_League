import { useCallback, useEffect, useState } from "react";
import { getLeagueDetail, getSeasonBadge } from "../api/client";
import type { Season } from "../api/types";

interface ModalData {
  badge: Season | null;
  description: string | null;
  loading: boolean;
  error: string | null;
}

const IDLE: ModalData = { badge: null, description: null, loading: false, error: null };

function messageFrom(result: PromiseRejectedResult): string {
  return result.reason instanceof Error ? result.reason.message : "Failed to load";
}

/**
 * Loads a league's badge and detail in parallel when the modal opens. The two
 * calls degrade independently: a failure of one still shows the other, and the
 * error state appears only when both fail. Pass null to stay idle.
 */
export function useLeagueModalData(leagueId: string | null) {
  const [state, setState] = useState<ModalData>(IDLE);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!leagueId) {
      setState(IDLE);
      return;
    }

    let active = true;
    setState({ badge: null, description: null, loading: true, error: null });

    Promise.allSettled([getSeasonBadge(leagueId), getLeagueDetail(leagueId)]).then(
      ([badgeResult, descriptionResult]) => {
        if (!active) return;

        const bothFailed =
          badgeResult.status === "rejected" && descriptionResult.status === "rejected";

        setState({
          badge: badgeResult.status === "fulfilled" ? badgeResult.value : null,
          description:
            descriptionResult.status === "fulfilled" ? descriptionResult.value : null,
          loading: false,
          error: bothFailed ? messageFrom(badgeResult) : null,
        });
      },
    );

    return () => {
      active = false;
    };
  }, [leagueId, attempt]);

  const retry = useCallback(() => setAttempt((count) => count + 1), []);

  return { ...state, retry };
}
