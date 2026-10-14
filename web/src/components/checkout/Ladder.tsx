import type { Intent } from "@/lib/intentTypes";
import { HAPPY_PATH, STATES, type CheckoutState } from "@/lib/states";
import { StatusBlock } from "../StatusBlock";
import styles from "./Ladder.module.css";

const time = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "UTC" });

/** The lifecycle as named states. An exception state replaces the steps it cut off. */
export function Ladder({ intent }: { intent: Intent }) {
  const entered = new Map<CheckoutState, string>();
  for (const h of intent.history) entered.set(h.state, h.at);

  const current = intent.state;
  const onPath = HAPPY_PATH.includes(current);
  const reached = onPath ? HAPPY_PATH.indexOf(current) : Math.max(...HAPPY_PATH.map((s, i) => (entered.has(s) ? i : -1)));
  const steps: CheckoutState[] = onPath ? HAPPY_PATH : [...HAPPY_PATH.slice(0, reached + 1), current];
  const position = steps.indexOf(current);

  return (
    <div className={styles.wrap}>
      {/* Phone: one row of segments with the current state's name. */}
      <div className={styles.compact} aria-hidden="true">
        <div className={styles.segments}>
          {steps.map((s, i) => (
            <span
              key={s}
              className={`${styles.segment} ${i < position ? styles.segDone : ""} ${i === position ? styles[`seg_${STATES[s].tone}`] : ""}`}
            />
          ))}
        </div>
        <span className={styles.compactLabel}>{STATES[current].label}</span>
      </div>

      <ol className={styles.ladder} aria-label="Checkout progress" data-reveal="rows">
        {steps.map((s, i) => {
          const at = entered.get(s);
          if (i === position) {
            return (
              <li key={s} className={styles.current} aria-current="step">
                <StatusBlock tone={STATES[s].tone} size="panel">
                  {STATES[s].label}
                </StatusBlock>
                {at && <span className="small nums">since {time(at)} UTC</span>}
              </li>
            );
          }
          return (
            <li key={s} className={i < position ? styles.passed : styles.future}>
              <span>{STATES[s].label}</span>
              {i < position && at && <span className="small nums">{time(at)} UTC</span>}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
