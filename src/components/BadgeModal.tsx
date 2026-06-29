import { useEffect, useRef, useState } from "react";
import type { League, Season } from "../api/types";
import { useLeagueModalData } from "../hooks/useLeagueModalData";
import styles from "./BadgeModal.module.css";

interface BadgeModalProps {
  league: League;
  onClose: () => void;
}

const FOCUSABLE =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export function BadgeModal({ league, onClose }: BadgeModalProps) {
  const { badge, description, loading, error, retry } = useLeagueModalData(league.idLeague);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Keep onClose current without making it an effect dependency: the effect
  // should run once for the modal's lifetime, not on every parent re-render.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    dialog?.focus();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCloseRef.current();
        return;
      }
      if (event.key === "Tab") trapFocus(event, dialog);
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, []);

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
            badge={badge}
            description={description}
            leagueName={league.strLeague}
            onRetry={retry}
          />
        </div>
      </div>
    </div>
  );
}

// Wrap focus around the dialog's focusable elements so Tab/Shift+Tab can't
// reach the inert background behind the modal.
function trapFocus(event: KeyboardEvent, dialog: HTMLDivElement | null) {
  if (!dialog) return;
  const focusable = dialog.querySelectorAll<HTMLElement>(FOCUSABLE);
  if (focusable.length === 0) return;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const active = document.activeElement;

  if (event.shiftKey && active === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && active === last) {
    event.preventDefault();
    first.focus();
  }
}

interface BadgeContentProps {
  loading: boolean;
  error: string | null;
  badge: Season | null;
  description: string | null;
  leagueName: string;
  onRetry: () => void;
}

function BadgeContent({
  loading,
  error,
  badge,
  description,
  leagueName,
  onRetry,
}: BadgeContentProps) {
  if (loading) {
    return <div className={styles.spinner} role="status" aria-label="Loading league" />;
  }

  if (error) {
    return (
      <div className={styles.fallbackBlock}>
        <p className={styles.fallback}>Couldn’t load this league’s details.</p>
        <button type="button" className={styles.retry} onClick={onRetry}>
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className={styles.detail}>
      {badge?.strBadge ? (
        <figure className={styles.badgeFigure}>
          <BadgeImage key={badge.strBadge} src={badge.strBadge} leagueName={leagueName} />
          {badge.strSeason && (
            <figcaption className={styles.season}>Season {badge.strSeason}</figcaption>
          )}
        </figure>
      ) : (
        <p className={styles.fallback}>No badge available for this league.</p>
      )}
      {description && <p className={styles.description}>{description}</p>}
    </div>
  );
}

function BadgeImage({ src, leagueName }: { src: string; leagueName: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <p className={styles.fallback}>No badge available for this league.</p>;
  }

  return (
    <img
      className={styles.badge}
      src={src}
      alt={`${leagueName} season badge`}
      onError={() => setFailed(true)}
    />
  );
}
