"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { formatUnits } from "viem";
import { useReadContracts } from "wagmi";
import { botChain, explorerAddress, networkLabel } from "@/config/chain";
import type { Offering } from "@/config/offerings";
import { erc20Abi, identityRegistryAbi } from "@/lib/abi";
import type { ActivityRow } from "@/lib/activity";
import { formatAmount } from "@/lib/format";
import type { Intent } from "@/lib/intentTypes";
import { useWallet } from "@/lib/useWallet";
import { ActivityList } from "../ActivityList";
import { HashLine } from "../HashLine";
import { PageHead } from "../PageHead";
import { StatusBlock } from "../StatusBlock";
import { WalletButton } from "../WalletButton";
import styles from "./PortfolioView.module.css";

export type PortfolioPreview = { address: string; balances: Record<string, string>; intents: Intent[] };

const toRow = (i: Intent): ActivityRow => ({
  intentId: i.id,
  offeringId: i.offeringId,
  offeringName: i.offeringName,
  buyer: i.buyer,
  amount: formatUnits(BigInt(i.payUnits), i.paymentDecimals),
  paymentSymbol: i.paymentSymbol,
  state: i.state,
  paymentTx: i.payment?.hash ?? null,
  deliveryTx: i.delivery?.hash ?? null,
  updatedAt: i.updatedAt,
  testnet: i.testnet,
});

const since = (iso: string) => {
  const m = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 60000));
  return m < 60 ? `${m} min` : `${Math.round(m / 60)} h`;
};

export function PortfolioView({ offerings, preview }: { offerings: Offering[]; preview?: PortfolioPreview }) {
  const wallet = useWallet();
  const address = preview?.address ?? wallet.address;
  const connected = !!preview || wallet.connected;

  const [intents, setIntents] = useState<Intent[] | null>(preview?.intents ?? null);
  const [loadError, setLoadError] = useState(false);
  useEffect(() => {
    if (preview || !address) return;
    let live = true;
    fetch(`/api/intents?buyer=${address}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => live && setIntents(j.intents ?? []))
      .catch(() => live && setLoadError(true));
    return () => {
      live = false;
    };
  }, [address, preview]);

  const configured = offerings.filter((o) => o.token.address);
  const reads = useReadContracts({
    contracts: configured.flatMap((o) => [
      { address: o.token.address!, abi: erc20Abi, functionName: "balanceOf", args: [address!], chainId: botChain.id } as const,
      ...(o.suite.identityRegistry
        ? [{ address: o.suite.identityRegistry, abi: identityRegistryAbi, functionName: "isVerified", args: [address!], chainId: botChain.id } as const]
        : []),
    ]),
    query: { enabled: !preview && !!address && !wallet.wrongNetwork },
  });

  if (!connected || !address) {
    return (
      <div className={styles.page}>
        <PageHead title="Portfolio" note={`Connect a wallet to read your balances from ${networkLabel}.`}>
          <WalletButton />
        </PageHead>
        <div className={`${styles.disconnected} wrap`}>
          <p className={`${styles.disconnectedText} lead`} data-reveal>
            Your holdings here are balances on {networkLabel}, read from each token contract. They are records, not
            certificates: what a token represents is set out by its issuer on the offering page.
          </p>
          <div className={styles.certificate} data-reveal style={{ "--i": 1 } as React.CSSProperties}>
            <Image
              src="/archive/stock-certificate-for-50-issued-to-a.webp"
              alt="A paper stock certificate from 1900, the kind of record a token balance does not replace"
              fill
              sizes="(min-width: 1024px) 58vw, 100vw"
              className={styles.img}
            />
          </div>
        </div>
      </div>
    );
  }

  // Map read results back to offerings, in the order they were requested.
  let cursor = 0;
  const holdings = offerings.map((o) => {
    if (preview) return { o, balance: preview.balances[o.id] ?? null, eligible: true as boolean | null, error: false };
    if (!o.token.address) return { o, balance: null, eligible: null, error: false };
    const bal = reads.data?.[cursor++];
    const elig = o.suite.identityRegistry ? reads.data?.[cursor++] : undefined;
    return {
      o,
      balance: bal?.status === "success" ? formatUnits(bal.result as bigint, o.token.decimals) : null,
      eligible: elig?.status === "success" ? (elig.result as boolean) : null,
      error: bal?.status === "failure",
    };
  });

  const pending = (intents ?? []).filter((i) => i.state === "DELIVERY_PENDING");
  const recent = (intents ?? []).slice(0, 10).map(toRow);

  return (
    <div className={styles.page}>
      <PageHead title="Portfolio" note={`Balances for this wallet, read from the token contracts on ${networkLabel}. Truva shows no valuations.`}>
        <HashLine value={address} href={preview ? null : explorerAddress(address)} label="wallet address" />
      </PageHead>

      {pending.length > 0 && (
        <section className={styles.pending} aria-labelledby="pending-title">
          <h2 id="pending-title" className="head" data-reveal>
            {pending.length} {pending.length === 1 ? "delivery" : "deliveries"} pending
          </h2>
          <ul className={styles.pendingList} data-reveal="rows">
            {pending.map((i) => {
              const confirmed = i.history.find((h) => h.state === "PAYMENT_CONFIRMED")?.at ?? i.updatedAt;
              return (
                <li key={i.id}>
                  <span className="nums">{i.id}</span>
                  <span className="nums">
                    Paid {formatAmount(formatUnits(BigInt(i.payUnits), i.paymentDecimals))} {i.paymentSymbol}
                  </span>
                  <span className="nums">Payment confirmed {since(confirmed)} ago</span>
                  <Link className="button" href={preview ? "/checkout/preview-delivery-pending" : `/checkout/${i.id}`}>
                    Open checkout
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className={`${styles.holdings} wrap`} aria-labelledby="holdings-title">
        <h2 id="holdings-title" className="sr-only">
          Holdings
        </h2>
        {holdings.map(({ o, balance, eligible, error }) => (
          <article key={o.id} className={styles.holding} data-reveal>
            <div className={styles.figure}>
              {balance === null ? (
                <p className={styles.unread}>
                  {!o.token.address ? "Not readable" : wallet.wrongNetwork && !preview ? "Wrong network" : error ? "Unreadable" : "Reading…"}
                </p>
              ) : (
                <p className={`${styles.balance} nums`}>{formatAmount(balance, 0)}</p>
              )}
              <p className={styles.symbol}>{o.token.symbol} held</p>
            </div>
            <div className={styles.meta}>
              <h3 className={styles.tokenName}>{o.token.name}</h3>
              <div className={styles.tags}>
                <StatusBlock tone="progress">{o.network}</StatusBlock>
                {eligible === true && <StatusBlock tone="done">Eligible</StatusBlock>}
                {eligible === false && <StatusBlock tone="fail">Not eligible</StatusBlock>}
              </div>
              {o.token.address ? (
                <HashLine value={o.token.address} href={explorerAddress(o.token.address)} label="token contract" />
              ) : (
                !preview && <p className="small">The token contract isn’t configured yet, so no balance can be read.</p>
              )}
              {o.status === "Demo" && (
                <p className={styles.demo}>Demo token on {networkLabel}. It has no value and represents no real-world asset.</p>
              )}
              {balance !== null && Number(balance) === 0 && (
                <p>
                  You don’t hold {o.token.symbol} yet.{" "}
                  <Link className="link-plain" href={`/assets/${o.id}`}>
                    See the offering
                  </Link>
                </p>
              )}
            </div>
          </article>
        ))}
      </section>

      <section className={`${styles.recent} wrap`} aria-labelledby="recent-title">
        <h2 id="recent-title" className="head" data-reveal>
          Recent checkouts
        </h2>
        {loadError ? (
          <p className={styles.note}>Your checkouts couldn’t be loaded just now. Balances above are read from chain directly.</p>
        ) : intents === null ? (
          <p className={styles.note}>Loading your checkouts…</p>
        ) : recent.length === 0 ? (
          <p className={styles.note}>
            This wallet hasn’t started a checkout yet.{" "}
            <Link className="link-plain" href="/assets">
              See the offering
            </Link>
          </p>
        ) : (
          <ActivityList
            rows={recent}
            preview={!!preview}
            showBuyer={false}
            hrefFor={(r) =>
              preview ? `/checkout/preview-${r.state.toLowerCase().replace(/_/g, "-")}` : `/checkout/${r.intentId}`
            }
          />
        )}
      </section>
    </div>
  );
}
