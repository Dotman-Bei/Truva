"use client";

import { useState } from "react";
import { shortHex } from "@/lib/format";
import styles from "./HashLine.module.css";

/** A truncated address or hash with copy and an explorer link. `href` null means no link exists. */
export function HashLine({ value, href, label }: { value: string; href: string | null; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <span className={styles.line}>
      <span className="nums" title={value}>
        {shortHex(value)}
      </span>
      <button
        type="button"
        className={styles.action}
        aria-label={`Copy ${label}`}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1500);
          } catch {
            /* clipboard blocked: the full value is still in the title attribute */
          }
        }}
      >
        {copied ? "Copied" : "Copy"}
      </button>
      {href && (
        <a className={styles.action} href={href} target="_blank" rel="noreferrer">
          View on explorer
        </a>
      )}
    </span>
  );
}
