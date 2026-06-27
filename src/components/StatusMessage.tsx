import styles from "./StatusMessage.module.css";

interface StatusMessageProps {
  title: string;
  detail?: string;
  onRetry?: () => void;
}

export function StatusMessage({ title, detail, onRetry }: StatusMessageProps) {
  return (
    <div className={styles.wrap} role="status">
      <p className={styles.title}>{title}</p>
      {detail && <p className={styles.detail}>{detail}</p>}
      {onRetry && (
        <button type="button" className={styles.retry} onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}
