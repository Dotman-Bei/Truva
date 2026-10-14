"use client";

import { useState } from "react";
import { BOARD_ORDER, STATES, type CheckoutState } from "@/lib/states";
import { StatusBlock } from "../StatusBlock";
import styles from "./LifecycleBoard.module.css";

export function LifecycleBoard() {
  const [open, setOpen] = useState<CheckoutState>("DELIVERY_PENDING");

  return (
    <section id="lifecycle" className={`${styles.board} on-ink`} aria-labelledby="lifecycle-title">
      <div className={styles.intro}>
        <h2 id="lifecycle-title" className="sr-only">
          How settlement works
        </h2>
        <p className={styles.lede} data-reveal>
          Every state a Truva checkout can reach, including the ones that go wrong. Open one to see what the
          buyer is shown.
        </p>
      </div>

      <ul className={styles.rows} data-ui data-reveal="rows">
        {BOARD_ORDER.map((key) => {
          const s = STATES[key];
          const isOpen = key === open;
          const id = `state-${key.toLowerCase()}`;
          return (
            <li key={key} className={`${styles.row} ${isOpen ? styles.open : ""}`}>
              <button
                type="button"
                className={styles.trigger}
                aria-expanded={isOpen}
                aria-controls={id}
                onClick={() => setOpen(key)}
              >
                <span className={styles.name}>{s.label}</span>
                <span className={styles.meaning}>{s.meaning}</span>
                <span className={styles.next}>
                  <span className="sr-only">Next: </span>
                  {s.next}
                </span>
                <span className={styles.status}>
                  <StatusBlock tone={s.tone}>{s.label}</StatusBlock>
                </span>
              </button>
              <div className={styles.panel} id={id}>
                <div>
                  <dl className={styles.facts}>
                    <div>
                      <dt>What it means</dt>
                      <dd>{s.meaning}</dd>
                    </div>
                    <div>
                      <dt>Who acts next</dt>
                      <dd>{s.next}</dd>
                    </div>
                  </dl>
                  <p className={styles.detail}>{s.detail}</p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
