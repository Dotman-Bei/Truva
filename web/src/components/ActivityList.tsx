import Link from "next/link";
import { explorerTx } from "@/config/chain";
import type { ActivityRow } from "@/lib/activity";
import { formatAmount, shortHex } from "@/lib/format";
import { STATES } from "@/lib/states";
import { StatusBlock } from "./StatusBlock";
import styles from "./ActivityList.module.css";

const when = (iso: string) =>
  `${new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "UTC" })} UTC`;

function TxLink({ hash, label, preview }: { hash: string | null; label: string; preview?: boolean }) {
  if (!hash) return <span className={styles.none}>{label}: not sent</span>;
  const href = preview ? null : explorerTx(hash);
  return href ? (
    <a className={styles.tx} href={href} target="_blank" rel="noreferrer" title={hash}>
      {label}
    </a>
  ) : (
    <span className={styles.tx} title={hash}>
      {label} {shortHex(hash, 6, 4)}
    </span>
  );
}

/** Checkout rows: a real table on wide screens, stacked bands on phones. */
export function ActivityList({
  rows,
  hrefFor,
  preview,
  showBuyer = true,
}: {
  rows: ActivityRow[];
  hrefFor: (r: ActivityRow) => string;
  preview?: boolean;
  showBuyer?: boolean;
}) {
  return (
    <table className={`${styles.table} nums`}>
      <thead>
        <tr>
          <th scope="col">Updated</th>
          <th scope="col">Checkout</th>
          {showBuyer && <th scope="col">Buyer</th>}
          <th scope="col">Amount</th>
          <th scope="col">State</th>
          <th scope="col">Transactions</th>
        </tr>
      </thead>
      <tbody data-reveal="rows">
        {rows.map((r) => (
          <tr key={r.intentId}>
            <td className={styles.time}>{when(r.updatedAt)}</td>
            <td>
              <Link className={styles.ref} href={hrefFor(r)}>
                {r.intentId}
              </Link>
              <span className={styles.offering}>{r.offeringName}</span>
            </td>
            {showBuyer && (
              <td className={styles.buyer} title={r.buyer}>
                {shortHex(r.buyer)}
              </td>
            )}
            <td className={styles.amount}>
              {formatAmount(r.amount)} {r.paymentSymbol}
            </td>
            <td className={styles.state}>
              <StatusBlock tone={STATES[r.state].tone}>{STATES[r.state].label}</StatusBlock>
            </td>
            <td className={styles.links}>
              <TxLink hash={r.paymentTx} label="Payment" preview={preview} />
              <TxLink hash={r.deliveryTx} label="Delivery" preview={preview} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
