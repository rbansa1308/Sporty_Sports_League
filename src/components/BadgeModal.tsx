import { useEffect, useRef } from "react";
import type { League } from "../api/types";
import { useSeasonBadge } from "../hooks/useSeasonBadge";
import styles from "./BadgeModal.module.css";

interface BadgeModalProps {
  league: League;
  onClose: () => void;
}

export function BadgeModal({ league, onClose }: BadgeModalProps) {
  const { data: season, loading, error } = useSeasonBadge(league.idLeague);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Close on Escape and move focus into the dialog; restore focus on unmount.
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus();
    };
  }, [onClose]);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="badge-title"
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className={styles.close}
          onClick={onClose}
          aria-label="Close"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <line x1="6" y1="6" x2="18" y2="18" />
            <line x1="18" y1="6" x2="6" y2="18" />
          </svg>
        </button>

        <span className={styles.sport}>{league.strSport}</span>
        <h2 id="badge-title" className={styles.title}>
          {league.strLeague}
        </h2>

        <div className={styles.stage}>
          <BadgeContent
            loading={loading}
            error={error}
            badge={season?.strBadge ?? null}
            season={season?.strSeason ?? null}
            leagueName={league.strLeague}
          />
        </div>
      </div>
    </div>
  );
}

interface BadgeContentProps {
  loading: boolean;
  error: string | null;
  badge: string | null;
  season: string | null;
  leagueName: string;
}

function BadgeContent({ loading, error, badge, season, leagueName }: BadgeContentProps) {
  if (loading) {
    return <div className={styles.spinner} role="status" aria-label="Loading badge" />;
  }

  if (error) {
    return <p className={styles.fallback}>Couldn’t load the badge. Please try again.</p>;
  }

  if (!badge) {
    return <p className={styles.fallback}>No badge available for this league.</p>;
  }

  return (
    <figure className={styles.badgeFigure}>
      <img className={styles.badge} src={badge} alt={`${leagueName} season badge`} />
      {season && <figcaption className={styles.season}>Season {season}</figcaption>}
    </figure>
  );
}
