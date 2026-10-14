"use client";

import Link from "next/link";
import { useState } from "react";
import type { OfferingStatus } from "@/config/offerings";
import { formatAmount } from "@/lib/format";
import type { Tone } from "@/lib/states";
import { StatusBlock } from "../StatusBlock";
import styles from "./OfferingsBoard.module.css";

export type OfferingRow = {
  id: string;
  name: string;
  symbol: string;
  shortDescription: string;
  issuer: string;
  category: string;
  network: string;
  paymentSymbol: string;
  pricePerToken: string;
  status: OfferingStatus;
  verified: boolean;
  checkedAt: string;
  problems: string[];
};

const FILTERS: ("All" | OfferingStatus)[] = ["All", "Active", "Demo", "Paused", "Closed"];

const STATUS_TONE: Record<OfferingStatus, Tone> = {
  Active: "done",
  Demo: "demo",
  Paused: "progress",
  Closed: "closed",
  Draft: "neutral",
};

function checkedLabel(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  });
}

export function OfferingsBoard({ rows, network }: { rows: OfferingRow[]; network: string }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [open, setOpen] = useState<string | null>(rows[0]?.id ?? null);

  // Drafts are never listed publicly.
  const listed = rows.filter((r) => r.status !== "Draft");
  const visible = filter === "All" ? listed : listed.filter((r) => r.status === filter);

  return (
    <div className={styles.wrap}>
      <ul className={`${styles.filters} wrap`} aria-label="Filter by status" data-reveal="rows">
        {FILTERS.map((f) => {
          const count = f === "All" ? listed.length : listed.filter((r) => r.status === f).length;
          const active = filter === f;
          return (
            <li key={f}>
              <button
                type="button"
                className={`${styles.filter} ${active ? styles.filterActive : ""} ${count === 0 ? styles.filterEmpty : ""}`}
                aria-pressed={active}
                onClick={() => setFilter(f)}
              >
                <span>{f}</span>
                <span className="small nums">{count}</span>
              </button>
            </li>
          );
        })}
      </ul>

      <ul className={styles.rows} data-ui data-reveal="rows">
        {visible.length === 0 && (
          <li className={styles.none}>No {filter.toLowerCase()} offerings on {network} right now.</li>
        )}
        {visible.map((r) => {
          const isOpen = open === r.id;
          const panelId = `offering-${r.id}`;
          return (
            <li key={r.id} className={`${styles.row} ${isOpen ? styles.open : ""}`}>
              <button
                type="button"
                className={styles.trigger}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpen(isOpen ? null : r.id)}
              >
                <span className={styles.nameCell}>
                  <span className={styles.name}>{r.name}</span>
                  <span className={styles.symbol}>{r.symbol}</span>
                </span>
                <span className={styles.issuer}>{r.issuer}</span>
                <span className={styles.payment}>Pays in {r.paymentSymbol}</span>
                <span className={styles.status}>
                  <StatusBlock tone={STATUS_TONE[r.status]} className={styles.statusBlock}>
                    {r.status}
                  </StatusBlock>
                  {!r.verified && <StatusBlock tone="closed">Unable to verify</StatusBlock>}
                </span>
              </button>

              <div className={styles.panel} id={panelId}>
                <div>
                  <div className={styles.detail}>
                    <p className={styles.description}>{r.shortDescription}</p>
                    <dl className={`${styles.facts} nums`}>
                      <div>
                        <dt>Issuer</dt>
                        <dd>{r.issuer}</dd>
                      </div>
                      <div>
                        <dt>Network</dt>
                        <dd>{r.network}</dd>
                      </div>
                      <div>
                        <dt>Price</dt>
                        <dd>
                          {formatAmount(r.pricePerToken)} {r.paymentSymbol} per {r.symbol}
                        </dd>
                      </div>
                      <div>
                        <dt>Last configuration check</dt>
                        <dd>{checkedLabel(r.checkedAt)}</dd>
                      </div>
                    </dl>

                    {r.verified ? (
                      <Link href={`/assets/${r.id}`} className={`button ${styles.cta}`}>
                        Open offering
                      </Link>
                    ) : (
                      <div className={styles.closed}>
                        <p>
                          Configuration could not be verified against {r.network}. Checkout is closed for this
                          offering.
                        </p>
                        <ul className="small">
                          {r.problems.map((p) => (
                            <li key={p}>{p}</li>
                          ))}
                        </ul>
                        <Link href={`/assets/${r.id}`} className="link-plain">
                          Read the offering
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
