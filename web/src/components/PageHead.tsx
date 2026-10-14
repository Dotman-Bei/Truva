import type { ReactNode } from "react";
import styles from "./PageHead.module.css";

/** App-page title on the axis, with a side note in the zone left of it. */
export function PageHead({ title, note, children }: { title: string; note?: ReactNode; children?: ReactNode }) {
  return (
    <header className={`${styles.head} wrap`}>
      <h1 className={`${styles.title} display lines`}>
        <span className="line">
          <span data-line>{title}</span>
        </span>
      </h1>
      {note && (
        <p className={styles.note} data-rise>
          {note}
        </p>
      )}
      {children && <div className={styles.extra}>{children}</div>}
    </header>
  );
}
