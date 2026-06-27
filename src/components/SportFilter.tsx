import styles from "./SportFilter.module.css";

interface SportFilterProps {
  value: string;
  options: string[];
  onChange: (value: string) => void;
}

export function SportFilter({ value, options, onChange }: SportFilterProps) {
  return (
    <div className={styles.field}>
      <label htmlFor="sport-filter" className={styles.label}>
        Sport
      </label>
      <div className={styles.selectWrap}>
        <select
          id="sport-filter"
          className={styles.select}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        >
          <option value="">All sports</option>
          {options.map((sport) => (
            <option key={sport} value={sport}>
              {sport}
            </option>
          ))}
        </select>
        <svg
          className={styles.chevron}
          viewBox="0 0 24 24"
          aria-hidden="true"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
    </div>
  );
}
