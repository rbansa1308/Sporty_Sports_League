import type { CSSProperties } from "react";
import type { League } from "../api/types";
import styles from "./LeagueCard.module.css";

interface LeagueCardProps {
  league: League;
  index: number;
  onSelect: (league: League) => void;
}

export function LeagueCard({ league, index, onSelect }: LeagueCardProps) {
  // Stagger the entrance, capped so long lists don't wait too long.
  const style = { animationDelay: `${Math.min(index, 12) * 45}ms` } as CSSProperties;

  return (
    <button
      type="button"
      className={styles.card}
      style={style}
      onClick={() => onSelect(league)}
    >
      <span className={styles.sport}>{league.strSport}</span>
      <span className={styles.name}>{league.strLeague}</span>
      {league.strLeagueAlternate && (
        <span className={styles.alt}>{league.strLeagueAlternate}</span>
      )}
      <span className={styles.cta} aria-hidden="true">
        View badge
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      </span>
    </button>
  );
}
