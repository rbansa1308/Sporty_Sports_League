import styles from "./StatusMessage.module.css";

interface StatusMessageProps {
  title: string;
  detail?: string;
  onRetry?: () => void;
  /** Errors announce assertively (role="alert"); info stays polite. */
  tone?: "info" | "error";
}

export function StatusMessage({ title, detail, onRetry, tone = "info" }: StatusMessageProps) {
  return (
    <div className={styles.wrap} role={tone === "error" ? "alert" : "status"}>
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
