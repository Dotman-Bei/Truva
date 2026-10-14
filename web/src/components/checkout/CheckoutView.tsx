"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { formatUnits, type Address } from "viem";
import { useReadContract, useSwitchChain, useWriteContract } from "wagmi";
import { botChain, chainId, explorerAddress, explorerTx, networkLabel } from "@/config/chain";
import { erc20Abi, identityRegistryAbi } from "@/lib/abi";
import { contactHref, formatAmount, shortHex } from "@/lib/format";
import type { Intent } from "@/lib/intentTypes";
import { isTerminal } from "@/lib/stateMachine";
import { STATES, type CheckoutState } from "@/lib/states";
import { useWallet } from "@/lib/useWallet";
import { HashLine } from "../HashLine";
import { StatusBlock } from "../StatusBlock";
import { WalletButton } from "../WalletButton";
import { Ladder } from "./Ladder";
import styles from "./CheckoutView.module.css";

export type CheckoutConfig = {
  paymentToken: Address | null;
  treasury: Address | null;
  identityRegistry: Address | null;
  issuerContact: string;
  issuerName: string;
};

const TITLES: Partial<Record<CheckoutState, [string, string?]>> = {
  CREATED: ["Intent", "created"],
  AWAITING_PAYMENT: ["Ready", "to pay"],
  PAYMENT_SUBMITTED: ["Payment", "sent"],
  PAYMENT_CONFIRMED: ["Payment", "confirmed"],
  DELIVERY_PENDING: ["Paid, delivery", "pending"],
  SETTLED: ["Settled"],
  PAYMENT_FAILED: ["Payment", "failed"],
  DELIVERY_FAILED: ["Delivery", "rejected"],
  EXPIRED: ["Intent", "expired"],
  REFUND_PENDING: ["Refund", "pending"],
  REFUNDED: ["Refunded"],
  CANCELLED: ["Intent", "cancelled"],
};

const POLL_MS = 6000;

const stamp = (iso: string) =>
  `${new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" })} UTC`;

export function CheckoutView({ initial, config }: { initial: Intent; config: CheckoutConfig }) {
  const [intent, setIntent] = useState(initial);
  const [checkedAt, setCheckedAt] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [paying, setPaying] = useState(false);

  const { address, connected, wrongNetwork } = useWallet();
  const { switchChain } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();

  const preview = !!intent.preview;
  const pay = `${formatAmount(formatUnits(BigInt(intent.payUnits), intent.paymentDecimals))} ${intent.paymentSymbol}`;
  const receive = `${formatAmount(formatUnits(BigInt(intent.tokenUnits), intent.tokenDecimals), 0)} ${intent.tokenSymbol}`;
  const info = STATES[intent.state];
  const title = TITLES[intent.state] ?? [info.label];
  const link = (hash: string) => (preview ? null : explorerTx(hash));

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch(`/api/intents/${initial.id}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setIntent(json.intent);
      setCheckedAt(Date.now());
      setError(null);
    } catch {
      setError("Truva couldn’t reach the server just now. Your payment, if sent, is safe on-chain.");
    } finally {
      setRefreshing(false);
    }
  }, [initial.id]);

  // Poll while the checkout can still move. Polling only reads; it never sends anything.
  useEffect(() => {
    if (preview || isTerminal(intent.state)) return;
    const t = window.setInterval(refresh, POLL_MS);
    return () => window.clearInterval(t);
  }, [preview, intent.state, refresh]);

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);
  const sinceCheck = Math.max(0, Math.round((now - checkedAt) / 1000));

  // Fresh eligibility read right before paying (PRD §8). Only a clear `true` lets the payment go.
  const isBuyer = !!address && address.toLowerCase() === intent.buyer.toLowerCase();
  const eligibility = useReadContract({
    address: config.identityRegistry ?? undefined,
    abi: identityRegistryAbi,
    functionName: "isVerified",
    args: address ? [address] : undefined,
    chainId: botChain.id,
    query: { enabled: intent.state === "AWAITING_PAYMENT" && isBuyer && !wrongNetwork && !!config.identityRegistry },
  });

  let blocked: string | null = null;
  if (preview) blocked = "This is an interface preview; paying is disabled.";
  else if (!connected) blocked = "Connect the wallet that created this checkout to pay.";
  else if (wrongNetwork) blocked = `Your wallet is on another network. Switch to ${networkLabel} to pay.`;
  else if (!isBuyer) blocked = `This checkout belongs to ${shortHex(intent.buyer)}. Connect that wallet to pay.`;
  else if (!config.paymentToken || !config.treasury) blocked = "The payment asset isn’t configured, so paying is disabled.";
  else if (eligibility.isLoading) blocked = "Re-checking eligibility…";
  else if (eligibility.data !== true) blocked = "Eligibility couldn’t be re-confirmed, so paying is disabled.";

  async function sendPayment() {
    if (blocked || !config.paymentToken || !config.treasury) return;
    setPaying(true);
    setError(null);
    try {
      const hash = await writeContractAsync({
        address: config.paymentToken,
        abi: erc20Abi,
        functionName: "transfer",
        args: [config.treasury, BigInt(intent.payUnits)],
        chainId: botChain.id,
      });
      setConfirmOpen(false);
      const res = await fetch(`/api/intents/${intent.id}/payment`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ txHash: hash }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `Payment sent (${shortHex(hash)}) but not yet linked. Refresh to retry linking.`);
      setIntent(json.intent);
      setCheckedAt(Date.now());
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      setError(
        /reject|denied/i.test(msg)
          ? "You declined the transaction in your wallet. Nothing was sent."
          : msg || "The payment didn’t go through. Nothing was sent unless your wallet shows a transaction.",
      );
    } finally {
      setPaying(false);
    }
  }

  // ---------- the one action for this state ----------
  let action: React.ReactNode = null;
  switch (intent.state) {
    case "AWAITING_PAYMENT":
      action = (
        <>
          {!connected && !preview ? (
            <WalletButton />
          ) : wrongNetwork && !preview ? (
            <button type="button" className="button" onClick={() => switchChain({ chainId: botChain.id })}>
              Switch network
            </button>
          ) : (
            <button
              type="button"
              className="button button--primary"
              disabled={!!blocked}
              onClick={() => setConfirmOpen(true)}
            >
              Pay {pay}
            </button>
          )}
          {blocked && <p className="small">{blocked}</p>}
        </>
      );
      break;
    case "PAYMENT_SUBMITTED":
    case "PAYMENT_CONFIRMED":
    case "DELIVERY_PENDING":
    case "REFUND_PENDING":
    case "CREATED":
      action = (
        <>
          <button type="button" className="button" onClick={refresh} disabled={refreshing || preview}>
            {refreshing ? "Checking…" : "Refresh status"}
          </button>
          <p className="small nums" aria-live="polite">
            {preview ? "Checked moments ago" : `Checked ${sinceCheck}s ago`}. Refreshing never sends a payment.
          </p>
        </>
      );
      break;
    case "SETTLED":
      action = (
        <>
          <a href="#receipt" className="button button--primary">
            View receipt
          </a>
          <button type="button" className="link-plain" onClick={() => window.print()}>
            Print receipt
          </button>
        </>
      );
      break;
    case "PAYMENT_FAILED":
    case "EXPIRED":
    case "CANCELLED":
      action = (
        <Link href={`/assets/${intent.offeringId}`} className="button button--primary">
          Start a new checkout
        </Link>
      );
      break;
    case "DELIVERY_FAILED":
      action = (
        <>
          <a
            className="button button--primary"
            href={contactHref(config.issuerContact, `Delivery failed for ${intent.id}`)}
          >
            Contact the issuer
          </a>
          <p className="small">This checkout is not complete. Keep reference {intent.id}.</p>
        </>
      );
      break;
  }

  const explanation =
    intent.state === "PAYMENT_SUBMITTED" && intent.payment
      ? `Truva is watching ${shortHex(intent.payment.hash)} on ${networkLabel}. A refresh never sends a second payment.`
      : intent.state === "PAYMENT_CONFIRMED" && intent.payment?.block
        ? `Confirmed in block ${intent.payment.block}. Truva checked the amount, the token and the recipient against the intent.`
        : intent.state === "AWAITING_PAYMENT"
          ? `Sign a transfer of ${pay} to the issuer’s treasury. The quote is held until ${stamp(intent.expiresAt)}. Truva will not retry a payment without a fresh click from you.`
          : info.detail;

  return (
    <div className={`${styles.layout} wrap`}>
      <div className={styles.side}>
        <Ladder intent={intent} />
      </div>

      <div className={styles.main}>
        <h1 key={intent.state} className={`${styles.title} display lines`} aria-live="polite">
          <span className="line">
            <span data-line style={{ "--i": 0 } as React.CSSProperties}>
              {title[0]}
            </span>
          </span>
          {title[1] && (
            <span className="line">
              <span data-line style={{ "--i": 1 } as React.CSSProperties}>
                {title[1]}
              </span>
            </span>
          )}
        </h1>

        <p className={`${styles.explain} lead`} data-rise>
          {explanation}
        </p>
        {intent.note && <p className={styles.note}>{intent.note}</p>}
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}

        <div className={styles.action} data-rise style={{ "--i": 1 } as React.CSSProperties}>
          {action}
        </div>

        <section className={styles.block} aria-labelledby="details-title">
          <h2 id="details-title" className={styles.blockTitle} data-reveal>
            Intent details
          </h2>
          <table className={`${styles.table} nums`} data-reveal style={{ "--i": 1 } as React.CSSProperties}>
            <tbody>
              <tr>
                <th scope="row">Reference</th>
                <td>{intent.id}</td>
              </tr>
              <tr>
                <th scope="row">Offering</th>
                <td>
                  <Link className="link-plain" href={`/assets/${intent.offeringId}`}>
                    {intent.offeringName}
                  </Link>
                </td>
              </tr>
              <tr>
                <th scope="row">Buyer wallet</th>
                <td>
                  <HashLine value={intent.buyer} href={preview ? null : explorerAddress(intent.buyer)} label="buyer wallet" />
                </td>
              </tr>
              <tr>
                <th scope="row">You pay</th>
                <td>{pay}</td>
              </tr>
              <tr>
                <th scope="row">You receive</th>
                <td>{receive}</td>
              </tr>
              <tr>
                <th scope="row">Created</th>
                <td>{stamp(intent.createdAt)}</td>
              </tr>
              <tr>
                <th scope="row">Quote held until</th>
                <td>{stamp(intent.expiresAt)}</td>
              </tr>
              <tr>
                <th scope="row">Last updated</th>
                <td>{stamp(intent.updatedAt)}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section className={styles.block} aria-labelledby="tx-title">
          <h2 id="tx-title" className={styles.blockTitle} data-reveal>
            Transactions
          </h2>
          <ul className={styles.txs} data-reveal="rows">
            {(
              [
                ["Payment", intent.payment, intent.state === "PAYMENT_FAILED" ? "fail" : intent.payment?.block ? "done" : "progress"],
                ["Delivery", intent.delivery, intent.state === "DELIVERY_FAILED" ? "fail" : intent.state === "SETTLED" ? "done" : "progress"],
              ] as const
            ).map(([label, tx, tone]) => (
              <li key={label} className={styles.tx}>
                <span className={styles.txLabel}>{label}</span>
                {tx ? (
                  <>
                    <StatusBlock tone={tone}>
                      {tone === "done" ? "Confirmed" : tone === "fail" ? "Failed" : "Pending"}
                    </StatusBlock>
                    <HashLine value={tx.hash} href={link(tx.hash)} label={`${label.toLowerCase()} transaction`} />
                    <span className="small nums muted">{tx.block ? `Block ${tx.block}` : "Not in a block yet"}</span>
                  </>
                ) : (
                  <span className="muted">Not sent yet</span>
                )}
              </li>
            ))}
          </ul>
        </section>

        {intent.state === "SETTLED" && intent.payment && intent.delivery && (
          <section id="receipt" className={styles.receipt} aria-labelledby="receipt-title">
            <div className={styles.receiptHead}>
              <h2 id="receipt-title">Truva receipt</h2>
              <span className="nums">{intent.id}</span>
            </div>
            <dl className={`${styles.receiptBody} nums`} data-reveal="rows">
              <div>
                <dt>Offering</dt>
                <dd>{intent.offeringName}</dd>
              </div>
              <div>
                <dt>Issuer</dt>
                <dd>{config.issuerName}</dd>
              </div>
              <div>
                <dt>Buyer wallet</dt>
                <dd>{intent.buyer}</dd>
              </div>
              <div>
                <dt>Paid</dt>
                <dd>
                  {pay}, transaction {intent.payment.hash}, block {intent.payment.block}
                </dd>
              </div>
              <div>
                <dt>Delivered</dt>
                <dd>
                  {receive}, transaction {intent.delivery.hash}, block {intent.delivery.block}
                </dd>
              </div>
              <div>
                <dt>Network</dt>
                <dd>
                  {networkLabel}, chain {chainId || "not configured"}
                </dd>
              </div>
              <div>
                <dt>Settled at</dt>
                <dd>{stamp(intent.updatedAt)}</dd>
              </div>
            </dl>
            <p className={`${styles.receiptNote} small`}>
              This receipt summarises verified on-chain transactions. It is not a certificate of legal ownership of any
              underlying asset.
            </p>
          </section>
        )}
      </div>

      {confirmOpen && (
        <div className={styles.dialogBack} role="presentation" onClick={() => !paying && setConfirmOpen(false)}>
          <div
            className={styles.dialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.key === "Escape" && !paying && setConfirmOpen(false)}
          >
            <h2 id="confirm-title" className="head">
              Confirm payment
            </h2>
            <dl className={`${styles.confirmList} nums`}>
              <div>
                <dt>Amount</dt>
                <dd>{pay}</dd>
              </div>
              <div>
                <dt>To</dt>
                <dd>Issuer treasury {config.treasury ? shortHex(config.treasury) : ""}</dd>
              </div>
              <div>
                <dt>Network</dt>
                <dd>
                  {networkLabel}, chain {chainId}
                </dd>
              </div>
              <div>
                <dt>Truva fee</dt>
                <dd>None</dd>
              </div>
            </dl>
            <p>Your wallet will ask you to sign. Truva never sends a payment without this click.</p>
            <div className={styles.dialogActions}>
              <button type="button" className="button button--primary" onClick={sendPayment} disabled={paying} autoFocus>
                {paying ? "Check your wallet…" : `Sign and pay ${pay}`}
              </button>
              <button type="button" className="link-plain" onClick={() => setConfirmOpen(false)} disabled={paying}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
