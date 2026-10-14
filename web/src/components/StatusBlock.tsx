import type { Tone } from "@/lib/states";
import styles from "./StatusBlock.module.css";

export function StatusBlock({
  tone,
  children,
  size = "row",
  className = "",
}: {
  tone: Tone;
  children: React.ReactNode;
  size?: "row" | "panel";
  className?: string;
}) {
  return (
    <span className={`${styles.block} ${styles[tone]} ${styles[size]} ${className}`}>{children}</span>
  );
}
