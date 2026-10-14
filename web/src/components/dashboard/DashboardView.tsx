"use client";

import { useRouter } from "next/navigation";
import { useId, useMemo, useState } from "react";
import { formatUnits, type Address } from "viem";
import { useReadContracts, useSignMessage } from "wagmi";
import { botChain, explorerAddress, networkLabel } from "@/config/chain";
import type { Offering } from "@/config/offerings";
import { agentRoleAbi } from "@/lib/abi";
import type { ActivityRow } from "@/lib/activity";
import { formatAmount, shortHex } from "@/lib/format";
import type { Intent } from "@/lib/intentTypes";
import { metaMessage } from "@/lib/metaMessage";
import type { EditableMeta, MetaChange } from "@/lib/offeringMeta";
import type { CheckoutState } from "@/lib/states";
import { useWallet } from "@/lib/useWallet";
import { ActivityList } from "../ActivityList";
import { HashLine } from "../HashLine";
import { PageHead } from "../PageHead";
import { StatusBlock } from "../StatusBlock";
import { WalletButton } from "../WalletButton";
import styles from "./DashboardView.module.css";

const GROUPS: [string, CheckoutState[] | null][] = [
  ["All", null],
  ["Pending", ["CREATED", "AWAITING_PAYMENT", "PAYMENT_SUBMITTED", "PAYMENT_CONFIRMED"]],
  ["Delivery pending", ["DELIVERY_PENDING"]],
  ["Settled", ["SETTLED"]],
  ["Failed", ["PAYMENT_FAILED", "DELIVERY_FAILED"]],
  ["Expired", ["EXPIRED", "CANCELLED"]],
];
const PAID: CheckoutState[] = ["PAYMENT_CONFIRMED", "DELIVERY_PENDING", "SETTLED", "DELIVERY_FAILED", "REFUND_PENDING", "REFUNDED"];

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

const stamp = (iso: string) =>
  `${new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" })} UTC`;

export function DashboardView({
  offering,
  intents: initialIntents,
  log,
  reconciledAt,
  preview,
  baseStatus,
}: {
  baseStatus: Offering["status"];
  offering: Offering;
  intents: Intent[];
  log: MetaChange[];
  reconciledAt: string;
  preview?: boolean;
}) {
  const router = useRouter();
  const { address, connected, wrongNetwork } = useWallet();
  const { signMessageAsync } = useSignMessage();
  const ids = { hash: useId(), name: useId(), desc: useId(), contact: useId(), disc: useId() };

  const token = offering.token.address;
  const roleRead = useReadContracts({
    contracts: token && address
      ? [
          { address: token, abi: agentRoleAbi, functionName: "isAgent", args: [address], chainId: botChain.id },
          { address: token, abi: agentRoleAbi, functionName: "owner", chainId: botChain.id },
        ]
      : [],
    query: { enabled: !preview && !!token && !!address && !wrongNetwork },
  });
  const isAgent = roleRead.data?.[0]?.status === "success" ? (roleRead.data[0].result as boolean) : null;
  const owner = roleRead.data?.[1]?.status === "success" ? (roleRead.data[1].result as string) : null;
  const role: "granted" | "denied" | "reading" | "unreadable" = preview
    ? "granted"
    : !token
      ? "unreadable"
      : roleRead.isLoading
        ? "reading"
        : isAgent === null && !owner
          ? "unreadable"
          : isAgent || owner?.toLowerCase() === address?.toLowerCase()
            ? "granted"
            : "denied";

  const [intents, setIntents] = useState(initialIntents);
  const [filter, setFilter] = useState(0);
  const counts = useMemo(
    () => GROUPS.map(([, states]) => intents.filter((i) => !states || states.includes(i.state)).length),
    [intents],
  );
  const paidUnits = intents.filter((i) => PAID.includes(i.state)).reduce((sum, i) => sum + BigInt(i.payUnits), 0n);
  const paid = formatAmount(formatUnits(paidUnits, offering.payment.decimals));
  const deliveryPending = intents.filter((i) => i.state === "DELIVERY_PENDING");
  const failed = intents.filter((i) => i.state === "PAYMENT_FAILED" || i.state === "DELIVERY_FAILED");
  const visible = intents.filter((i) => !GROUPS[filter][1] || GROUPS[filter][1]!.includes(i.state)).map(toRow);

  // ---------- record a delivery ----------
  const [deliveryFor, setDeliveryFor] = useState(deliveryPending[0]?.id ?? "");
  const [deliveryHash, setDeliveryHash] = useState("");
  const [deliveryMsg, setDeliveryMsg] = useState<{ ok: boolean; text: string } | null>(null);
  async function recordDelivery(e: React.FormEvent) {
    e.preventDefault();
    setDeliveryMsg(null);
    const res = await fetch(`/api/intents/${deliveryFor}/delivery`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ txHash: deliveryHash.trim() }),
    });
    const json = await res.json();
    if (!res.ok) return setDeliveryMsg({ ok: false, text: json.error });
    setIntents((list) => list.map((i) => (i.id === json.intent.id ? json.intent : i)));
    setDeliveryHash("");
    setDeliveryMsg({
      ok: true,
      text:
        json.intent.state === "SETTLED"
          ? `${json.intent.id} is settled: the chain shows the delivery.`
          : `Linked to ${json.intent.id}. It settles once the chain shows the exact transfer.`,
    });
  }

  // ---------- metadata edits, signed by an agent wallet ----------
  const [name, setName] = useState(offering.name);
  const [desc, setDesc] = useState(offering.shortDescription);
  const [contact, setContact] = useState(offering.issuer.contact);
  const [disc, setDisc] = useState(offering.disclosures.map((d) => `${d.title} | ${d.href}`).join("\n"));
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [confirmStatus, setConfirmStatus] = useState(false);

  async function signAndSave(changes: EditableMeta) {
    if (!address || preview) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      const issuedAt = new Date().toISOString();
      const signature = await signMessageAsync({ message: metaMessage(offering.id, issuedAt, changes) });
      const res = await fetch(`/api/offerings/${offering.id}/meta`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ address, issuedAt, changes, signature }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setSaveMsg({ ok: true, text: "Saved. The change is logged with your wallet and the time." });
      router.refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      setSaveMsg({ ok: false, text: /reject|denied/i.test(msg) ? "You declined to sign. Nothing changed." : msg || "Nothing changed." });
    } finally {
      setSaving(false);
      setConfirmStatus(false);
    }
  }

  function saveMeta(e: React.FormEvent) {
    e.preventDefault();
    const changes: EditableMeta = {};
    if (name !== offering.name) changes.name = name;
    if (desc !== offering.shortDescription) changes.shortDescription = desc;
    if (contact !== offering.issuer.contact) changes.issuerContact = contact;
    const parsed = disc
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => {
        const [title, href] = l.split("|").map((x) => x.trim());
        return { title, href, type: "Link", date: new Date().toISOString().slice(0, 10) };
      });
    if (JSON.stringify(parsed.map((d) => [d.title, d.href])) !== JSON.stringify(offering.disclosures.map((d) => [d.title, d.href]))) {
      changes.disclosures = parsed;
    }
    if (Object.keys(changes).length === 0) return setSaveMsg({ ok: false, text: "Nothing has changed yet." });
    signAndSave(changes);
  }

  const paused = offering.status === "Paused";
  const nextStatus = paused ? baseStatus : "Paused";

  // ---------- gate ----------
  if (!connected && !preview) {
    return (
      <div className={styles.page}>
        <PageHead title="Dashboard" note="Connect the wallet that holds your issuer or operator role.">
          <WalletButton />
        </PageHead>
      </div>
    );
  }
  if (role !== "granted") {
    const text =
      role === "reading"
        ? "Reading this wallet’s role from the token contract…"
        : role === "denied"
          ? "This wallet has no issuer or operator role for any offering configured in Truva."
          : wrongNetwork
            ? `Switch your wallet to ${networkLabel} so the role can be read.`
            : "The issuer role couldn’t be read, because the token contract isn’t configured or didn’t answer. Access stays closed.";
    return (
      <div className={styles.page}>
        <PageHead title="Dashboard" note={text}>
          {role === "denied" && <StatusBlock tone="fail" size="panel">No access</StatusBlock>}
          {role === "unreadable" && <StatusBlock tone="closed" size="panel">Unable to verify</StatusBlock>}
        </PageHead>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <PageHead
        title="Dashboard"
        note={`${offering.name}. Checkout records here can be read, not rewritten: every state comes from ${networkLabel}.`}
      >
        <StatusBlock tone="done" size="panel">
          Issuer access
        </StatusBlock>
        {address && <HashLine value={address} href={preview ? null : explorerAddress(address)} label="your wallet" />}
      </PageHead>

      <section className={styles.attention} aria-labelledby="attention-title">
        <h2 id="attention-title" className="sr-only">
          Needs attention
        </h2>
        <button type="button" className={styles.figure} onClick={() => setFilter(2)} data-reveal>
          <span className={`${styles.big} nums`}>{deliveryPending.length}</span>
          <span>delivery pending</span>
        </button>
        <button type="button" className={styles.figure} onClick={() => setFilter(4)} data-reveal style={{ "--i": 1 } as React.CSSProperties}>
          <span className={`${styles.big} nums`}>{failed.length}</span>
          <span>failed</span>
        </button>
      </section>

      <div className={`${styles.body} wrap`}>
        <section aria-labelledby="totals-title">
          <h2 id="totals-title" className="head" data-reveal>
            Totals
          </h2>
          <dl className={`${styles.totals} nums`} data-reveal="rows">
            {[
              ["Checkouts", counts[0]],
              ["Settled", counts[3]],
              ["Pending", counts[1] + counts[2]],
              ["Failed", counts[4]],
              ["Expired", counts[5]],
              [`Paid in ${offering.payment.symbol}`, paid],
            ].map(([label, value]) => (
              <div key={label as string}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <p className={`${styles.derived} small`}>
            Derived from Truva’s checkout records, each reconciled against {networkLabel}. Last reconciled {stamp(reconciledAt)}.
          </p>
        </section>

        <section aria-labelledby="checkouts-title">
          <h2 id="checkouts-title" className="head" data-reveal>
            Checkouts
          </h2>
          <ul className={styles.filters} aria-label="Filter by state">
            {GROUPS.map(([label], i) => (
              <li key={label}>
                <button
                  type="button"
                  aria-pressed={filter === i}
                  className={`${styles.filter} ${filter === i ? styles.active : ""}`}
                  onClick={() => setFilter(i)}
                >
                  <span>{label}</span>
                  <span className="small nums">{counts[i]}</span>
                </button>
              </li>
            ))}
          </ul>
          {visible.length ? (
            <ActivityList
              rows={visible}
              preview={preview}
              hrefFor={(r) => (preview ? `/checkout/preview-${r.state.toLowerCase().replace(/_/g, "-")}` : `/checkout/${r.intentId}`)}
            />
          ) : (
            <p className={styles.note}>No checkouts in this state.</p>
          )}
        </section>

        <section aria-labelledby="delivery-title">
          <h2 id="delivery-title" className="head" data-reveal>
            Record a delivery
          </h2>
          <p className={styles.lede}>
            After your inventory wallet sends the tokens, link the transaction here. Truva settles the checkout only if
            {` ${networkLabel}`} shows the exact transfer from {offering.inventory ? shortHex(offering.inventory) : "the inventory wallet"} to the buyer.
          </p>
          {deliveryPending.length === 0 ? (
            <p className={styles.note}>No checkout is waiting for delivery.</p>
          ) : (
            <form className={styles.form} onSubmit={recordDelivery}>
              <label>
                <span>Checkout</span>
                <select className={styles.input} value={deliveryFor} onChange={(e) => setDeliveryFor(e.target.value)}>
                  {deliveryPending.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.id}, {formatAmount(formatUnits(BigInt(i.tokenUnits), i.tokenDecimals), 0)} {i.tokenSymbol} to {shortHex(i.buyer)}
                    </option>
                  ))}
                </select>
              </label>
              <label htmlFor={ids.hash}>
                <span>Delivery transaction hash</span>
                <input
                  id={ids.hash}
                  className={`${styles.input} nums`}
                  value={deliveryHash}
                  onChange={(e) => setDeliveryHash(e.target.value)}
                  placeholder="0x…"
                  pattern="^0x[0-9a-fA-F]{64}$"
                  required
                  autoComplete="off"
                />
              </label>
              <button type="submit" className="button button--primary" disabled={preview}>
                Link delivery
              </button>
              {deliveryMsg && <p className={deliveryMsg.ok ? styles.ok : styles.bad} role="status">{deliveryMsg.text}</p>}
            </form>
          )}
        </section>

        <section aria-labelledby="settings-title">
          <h2 id="settings-title" className="head" data-reveal>
            Offering settings
          </h2>
          <div className={styles.settings}>
            <form className={styles.form} onSubmit={saveMeta}>
              <h3 className={styles.sub}>Editable</h3>
              <label htmlFor={ids.name}>
                <span>Display name</span>
                <input id={ids.name} className={styles.input} value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
              </label>
              <label htmlFor={ids.desc}>
                <span>Short description</span>
                <textarea id={ids.desc} className={styles.input} rows={3} value={desc} onChange={(e) => setDesc(e.target.value)} maxLength={280} />
              </label>
              <label htmlFor={ids.contact}>
                <span>Issuer contact</span>
                <input id={ids.contact} className={styles.input} value={contact} onChange={(e) => setContact(e.target.value)} />
              </label>
              <label htmlFor={ids.disc}>
                <span>Disclosure links, one per line as “Title | https://…”</span>
                <textarea id={ids.disc} className={styles.input} rows={3} value={disc} onChange={(e) => setDisc(e.target.value)} />
              </label>
              <button type="submit" className="button button--primary" disabled={saving || !!preview}>
                {saving ? "Check your wallet…" : "Sign and save changes"}
              </button>
              {saveMsg && <p className={saveMsg.ok ? styles.ok : styles.bad} role="status">{saveMsg.text}</p>}
            </form>

            <div className={styles.locked}>
              <h3 className={styles.sub}>Locked</h3>
              <p className="small">Changed only through a verified configuration update.</p>
              <ul>
                {(
                  [
                    ["Token", offering.token.address],
                    ["IdentityRegistry", offering.suite.identityRegistry],
                    ["ModularCompliance", offering.suite.compliance],
                    [`Payment token (${offering.payment.symbol})`, offering.payment.address],
                    ["Issuer treasury", offering.treasury],
                    ["Issuer inventory", offering.inventory],
                  ] as [string, Address | null][]
                ).map(([label, value]) => (
                  <li key={label}>
                    <span className={styles.lockLabel}>{label}</span>
                    {value ? <span className="nums" title={value}>{shortHex(value)}</span> : <span className="muted">Not configured</span>}
                  </li>
                ))}
                <li>
                  <span className={styles.lockLabel}>Price per token</span>
                  <span className="nums">
                    {formatAmount(offering.pricePerToken)} {offering.payment.symbol}
                  </span>
                </li>
                <li>
                  <span className={styles.lockLabel}>Purchase limits</span>
                  <span className="nums">
                    {formatAmount(offering.minPurchase)} to {formatAmount(offering.maxPurchase)}
                  </span>
                </li>
              </ul>

              <h3 className={styles.sub}>Status</h3>
              <div className={styles.statusRow}>
                <StatusBlock tone={paused ? "progress" : "demo"} size="panel">
                  {offering.status}
                </StatusBlock>
                <button type="button" className="button" onClick={() => setConfirmStatus(true)} disabled={!!preview || saving}>
                  {paused ? "Resume offering" : "Pause offering"}
                </button>
              </div>
            </div>
          </div>

          {log.length > 0 && (
            <div className={styles.log}>
              <h3 className={styles.sub}>Change log</h3>
              <ul className="nums">
                {log.map((c) => (
                  <li key={c.at}>
                    {stamp(c.at)}: {c.fields.join(", ")} by {shortHex(c.by)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>

      {confirmStatus && (
        <div className={styles.dialogBack} role="presentation" onClick={() => !saving && setConfirmStatus(false)}>
          <div className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="status-title" onClick={(e) => e.stopPropagation()}>
            <h2 id="status-title" className="head">
              {paused ? "Resume offering" : "Pause offering"}
            </h2>
            <p>
              {paused
                ? "New checkouts open again for eligible wallets."
                : "New checkouts stop. Checkouts already paid continue to delivery."}
            </p>
            <div className={styles.dialogActions}>
              <button type="button" className="button button--primary" onClick={() => signAndSave({ status: nextStatus as EditableMeta["status"] })} disabled={saving} autoFocus>
                {saving ? "Check your wallet…" : `Sign and ${paused ? "resume" : "pause"}`}
              </button>
              <button type="button" className="link-plain" onClick={() => setConfirmStatus(false)} disabled={saving}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
