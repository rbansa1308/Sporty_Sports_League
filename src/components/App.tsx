import { useState } from "react";
import type { League } from "../api/types";
import { useLeagues } from "../hooks/useLeagues";
import { useLeagueFilters } from "../hooks/useLeagueFilters";
import { SearchBar } from "./SearchBar";
import { SportFilter } from "./SportFilter";
import { LeagueList, LeagueListSkeleton } from "./LeagueList";
import { BadgeModal } from "./BadgeModal";
import { StatusMessage } from "./StatusMessage";
import styles from "./App.module.css";

export function App() {
  const { data: leagues, loading, error, retry } = useLeagues();
  const [search, setSearch] = useState("");
  const [sport, setSport] = useState("");
  const [selected, setSelected] = useState<League | null>(null);

  const { filtered, sportOptions } = useLeagueFilters(leagues, { search, sport });

  return (
    <div className={styles.page}>
      <a className={styles.skipLink} href="#main-content">
        Skip to main content
      </a>

      <header className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.kicker}>The all-leagues directory</span>
          <h1 className={styles.title}>
            Spor<span className={styles.accent}>ty</span>
          </h1>
          <p className={styles.lede}>
            Every league, every sport — search the world’s competitions and tap one
            to light up its season badge.
          </p>
        </div>

        <div className={styles.controls}>
          <SearchBar value={search} onChange={setSearch} />
          <SportFilter value={sport} options={sportOptions} onChange={setSport} />
        </div>

        {/* aria-live announces result count changes as the user filters */}
        <p
          className={styles.count}
          aria-live="polite"
          aria-atomic="true"
        >
          {!loading && !error && (
            <>
              <span className={styles.countNum}>{filtered.length}</span>
              {filtered.length === 1 ? " league" : " leagues"}
              {sport && ` in ${sport}`}
            </>
          )}
        </p>
      </header>

      {/* aria-busy tells screen readers content is still loading */}
      <main id="main-content" className={styles.main} aria-busy={loading}>
        <Content
          loading={loading}
          error={error}
          retry={retry}
          filtered={filtered}
          onSelect={setSelected}
        />
      </main>

      {selected && (
        <BadgeModal league={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

interface ContentProps {
  loading: boolean;
  error: string | null;
  retry: () => void;
  filtered: League[];
  onSelect: (league: League) => void;
}

function Content({ loading, error, retry, filtered, onSelect }: ContentProps) {
  if (loading) return <LeagueListSkeleton />;

  if (error) {
    return (
      <StatusMessage
        title="Couldn’t load leagues"
        detail={error}
        onRetry={retry}
        tone="error"
      />
    );
  }

  if (filtered.length === 0) {
    return (
      <StatusMessage
        title="No leagues match"
        detail="Try a different name or sport."
      />
    );
  }

  return <LeagueList leagues={filtered} onSelect={onSelect} />;
}
