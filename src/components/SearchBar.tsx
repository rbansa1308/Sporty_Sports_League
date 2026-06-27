import styles from "./SearchBar.module.css";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className={styles.field}>
      <label htmlFor="league-search" className={styles.label}>
        Search
      </label>
      <div className={styles.inputWrap}>
        <svg
          className={styles.icon}
          viewBox="0 0 24 24"
          aria-hidden="true"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        >
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.5" y2="16.5" />
        </svg>
        <input
          id="league-search"
          type="search"
          className={styles.input}
          placeholder="Search leagues by name…"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete="off"
        />
      </div>
    </div>
  );
}
