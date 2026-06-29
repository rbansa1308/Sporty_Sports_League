import type { League } from "../api/types";
import { LeagueCard } from "./LeagueCard";
import styles from "./LeagueList.module.css";

interface LeagueListProps {
  leagues: League[];
  onSelect: (league: League) => void;
}

export function LeagueList({ leagues, onSelect }: LeagueListProps) {
  return (
    <ul className={styles.grid} aria-label="Sports leagues">
      {leagues.map((league, index) => (
        <li key={league.idLeague}>
          <LeagueCard league={league} index={index} onSelect={onSelect} />
        </li>
      ))}
    </ul>
  );
}

export function LeagueListSkeleton() {
  return (
    <>
      {/* Announce loading to screen readers; skeleton cards are decorative */}
      <p role="status" className={styles.srOnly}>
        Loading leagues…
      </p>
      <ul className={styles.grid} aria-hidden="true">
        {Array.from({ length: 9 }).map((_, index) => (
          <li key={index}>
            <div className={styles.skeleton} />
          </li>
        ))}
      </ul>
    </>
  );
}
