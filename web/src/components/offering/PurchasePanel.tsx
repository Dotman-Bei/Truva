"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useState } from "react";
import { useReadContract, useSwitchChain } from "wagmi";
import { botChain, networkLabel } from "@/config/chain";
import type { Offering } from "@/config/offerings";
import { identityRegistryAbi } from "@/lib/abi";
import { formatAmount, shortHex } from "@/lib/format";
import { quoteFor } from "@/lib/quote";
import { useWallet } from "@/lib/useWallet";
import { StatusBlock } from "../StatusBlock";
import { WalletButton } from "../WalletButton";
import styles from "./PurchasePanel.module.css";

export type PanelPreview = "eligible" | "not-eligible" | "unable" | "checking";

function useElapsed(running: boolean) {
  const [s, setS] = useState(0);
  useEffect(() => {
    if (!running) return setS(0);
    const t = window.setInterval(() => setS((v) => v + 1), 1000);
    return () => window.clearInterval(t);
  }, [running]);
  return s;
}

export function PurchasePanel({
  offering,
  checkoutOpen,
  closedReason,
  preview,
}: {
  offering: Offering;
  checkoutOpen: boolean;
  closedReason: string | null;
  preview?: PanelPreview;
}) {
  const router = useRouter();
  const amountId = useId();
  const { address, connected, wrongNetwork } = useWallet();
  const { switchChain, isPending: switching } = useSwitchChain();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [amount, setAmount] = useState("250");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const registry = offering.suite.identityRegistry;
  const read = useReadContract({
    address: registry ?? undefined,
    abi: identityRegistryAbi,
    functionName: "isVerified",
    args: address ? [address] : undefined,
    chainId: botChain.id,
    query: { enabled: !preview && checkoutOpen && connected && !wrongNetwork && !!registry, retry: 1 },
  });

  // Every path that isn't a clear `true` from the registry keeps checkout closed.
  type Eligibility = "checking" | "eligible" | "not-eligible" | "unable";
  const eligibility: Eligibility = preview
    ? preview
    : !registry || read.isError
      ? "unable"
      : read.isLoading || read.isFetching
        ? "checking"
        : read.data === true
          ? "eligible"
          : read.data === false
            ? "not-eligible"
            : "unable";
  const elapsed = useElapsed(eligibility === "checking");

  const quote = useMemo(() => quoteFor(offering, amount), [offering, amount]);
  const pay = offering.payment.symbol;
  const tok = offering.token.symbol;
  const walletShown = preview ? "0x3f2a…91c4" : address ? shortHex(address) : "";
  const live = preview ? true : connected && !wrongNetwork;

  async function continueToCheckout() {
    if (!address || !quote.ok) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/intents", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ offeringId: offering.id, buyer: address, amount }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "The checkout couldn’t be created.");
      router.push(`/checkout/${json.intent.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "The checkout couldn’t be created.");
      setSubmitting(false);
      read.refetch();
    }
  }

  // ---------- the one-line summary shown in the phone bar ----------
  let barState: React.ReactNode;
  let barAction = "Check eligibility";
  if (!checkoutOpen) {
    barState = <StatusBlock tone="closed">Checkout closed</StatusBlock>;
    barAction = "Why";
  } else if (!live) {
    barState = <span>Not connected</span>;
  } else if (eligibility === "eligible") {
    barState = <StatusBlock tone="done">Eligible</StatusBlock>;
    barAction = "Continue to checkout";
  } else if (eligibility === "not-eligible") {
    barState = <StatusBlock tone="fail">Not eligible</StatusBlock>;
    barAction = "Details";
  } else if (eligibility === "unable") {
    barState = <StatusBlock tone="closed">Unable to verify</StatusBlock>;
    barAction = "Details";
  } else {
    barState = <span>Checking…</span>;
  }

  // ---------- the panel body ----------
  let body: React.ReactNode;
  if (!checkoutOpen) {
    body = (
      <>
        <StatusBlock tone="closed" size="panel">
          Checkout closed
        </StatusBlock>
        <p>{closedReason}</p>
      </>
    );
  } else if (!preview && !connected) {
    body = (
      <>
        <p>Connect a wallet to check eligibility.</p>
        <WalletButton block />
      </>
    );
  } else if (!preview && wrongNetwork) {
    body = (
      <>
        <StatusBlock tone="fail" size="panel">
          Wrong network
        </StatusBlock>
        <p>Eligibility is read on {networkLabel}. Switch your wallet to check it.</p>
        <button type="button" className="button" disabled={switching} onClick={() => switchChain({ chainId: botChain.id })}>
          {switching ? "Check your wallet…" : "Switch network"}
        </button>
      </>
    );
  } else if (eligibility === "checking") {
    body = (
      <p aria-live="polite">
        Checking {walletShown} against the IdentityRegistry on {networkLabel}…{" "}
        <span className="nums muted">{elapsed}s</span>
      </p>
    );
  } else if (eligibility === "not-eligible") {
    body = (
      <>
        <StatusBlock tone="fail" size="panel">
          Not eligible
        </StatusBlock>
        <p>
          {walletShown} is not registered as eligible for {tok}. Truva can’t change that; eligibility is set by
          the issuer’s identity process.
        </p>
        <a className="link-plain" href={`mailto:${offering.issuer.contact}?subject=${encodeURIComponent(`Eligibility for ${offering.name}`)}`}>
          Contact the issuer
        </a>
      </>
    );
  } else if (eligibility === "unable") {
    body = (
      <>
        <StatusBlock tone="closed" size="panel">
          Unable to verify
        </StatusBlock>
        <p>
          The eligibility check didn’t complete, so checkout stays closed. This is usually an RPC problem, not
          your wallet.
        </p>
        <button type="button" className="button" onClick={() => read.refetch()}>
          Try again
        </button>
      </>
    );
  } else {
    body = (
      <>
        <StatusBlock tone="done" size="panel">
          Eligible
        </StatusBlock>
        <p className="small">
          {walletShown}, checked against the offering’s IdentityRegistry. The token contract still enforces it on
          every transfer.
        </p>
        <div className={styles.field}>
          <label htmlFor={amountId}>Amount</label>
          <div className={styles.inputWrap}>
            <input
              id={amountId}
              className={`${styles.input} nums`}
              inputMode="decimal"
              autoComplete="off"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              aria-describedby={`${amountId}-hint`}
              aria-invalid={!quote.ok}
            />
            <span className={styles.unit}>{pay}</span>
          </div>
          <p id={`${amountId}-hint`} className={`small nums ${quote.ok ? "muted" : styles.invalid}`}>
            {quote.ok
              ? `Minimum ${formatAmount(offering.minPurchase)} · Maximum ${formatAmount(offering.maxPurchase)}`
              : quote.reason}
          </p>
        </div>
        <dl className={`${styles.quote} nums`} aria-live="polite">
          <div>
            <dt>You pay</dt>
            <dd>{quote.ok ? `${formatAmount(quote.pay)} ${pay}` : "Not calculated"}</dd>
          </div>
          <div>
            <dt>You receive</dt>
            <dd>{quote.ok ? `${formatAmount(quote.receive, 0)} ${tok}` : "Not calculated"}</dd>
          </div>
          <div>
            <dt>Truva fee</dt>
            <dd>{offering.truvaFee ?? "None"}</dd>
          </div>
          <div>
            <dt>Network fee</dt>
            <dd>Paid in BOT, shown by your wallet before you sign</dd>
          </div>
        </dl>
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        <button
          type="button"
          className={`button button--primary ${styles.cta}`}
          disabled={!quote.ok || submitting || !!preview}
          onClick={continueToCheckout}
        >
          {submitting ? "Re-checking eligibility…" : "Continue to checkout"}
        </button>
      </>
    );
  }

  return (
    <aside id="eligibility" className={`${styles.panel} ${sheetOpen ? styles.sheetOpen : ""}`} aria-label="Buy this offering">
      <div className={styles.bar}>
        <span className={styles.barState}>{barState}</span>
        <button type="button" className="button" aria-expanded={sheetOpen} onClick={() => setSheetOpen((v) => !v)}>
          {sheetOpen ? "Close" : barAction}
        </button>
      </div>
      <div className={styles.body}>{body}</div>
    </aside>
  );
}
