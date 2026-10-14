import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { explorerAddress, networkLabel } from "@/config/chain";
import { offerings } from "@/config/offerings";
import { liveOffering } from "@/lib/offeringMeta";
import { contactHref, formatAmount } from "@/lib/format";
import { previewEnabled } from "@/lib/preview";
import { verifyOffering } from "@/lib/verify";
import { HashLine } from "@/components/HashLine";
import { PreviewBanner } from "@/components/PreviewBanner";
import { StatusBlock } from "@/components/StatusBlock";
import { PurchasePanel, type PanelPreview } from "@/components/offering/PurchasePanel";
import styles from "./page.module.css";

export const revalidate = 60;

export function generateStaticParams() {
  return offerings.map((o) => ({ assetId: o.id }));
}

type Props = { params: Promise<{ assetId: string }>; searchParams: Promise<{ preview?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const o = await liveOffering((await params).assetId);
  return { title: o ? o.name : "Offering" };
}

const PREVIEWS: PanelPreview[] = ["eligible", "not-eligible", "unable", "checking"];

export default async function OfferingPage({ params, searchParams }: Props) {
  const { assetId } = await params;
  const offering = await liveOffering(assetId);
  if (!offering) notFound();

  const { preview: previewParam } = await searchParams;
  const preview =
    previewEnabled() && PREVIEWS.includes(previewParam as PanelPreview) ? (previewParam as PanelPreview) : undefined;

  const v = await verifyOffering(offering);
  const statusOpen = offering.status === "Active" || offering.status === "Demo";
  const checkoutOpen = preview ? true : statusOpen && v.ok;
  const closedReason = !statusOpen
    ? "Checkout is closed for this offering."
    : !v.ok
      ? `This offering’s configuration could not be verified against ${networkLabel}, so checkout is closed. ${v.problems[0] ?? ""}`
      : null;

  const pay = offering.payment.symbol;
  const contracts: [string, string | null][] = [
    ["Token", offering.token.address],
    ["IdentityRegistry", offering.suite.identityRegistry],
    ["ModularCompliance", offering.suite.compliance],
    [`Payment token (${pay})`, offering.payment.address],
    ["Issuer treasury", offering.treasury],
    ["Issuer inventory", offering.inventory],
  ];

  return (
    <>
      {preview && <PreviewBanner />}

      <div className={styles.masthead} aria-hidden="true">
        <div className={styles.scan}>
          <Image
            src="/archive/administrative-bill-of-exchange-issued-at-quebec-paper.webp"
            alt=""
            fill
            priority
            sizes="50vw"
            className={styles.img}
          />
        </div>
        <div className={styles.tileInk} />
        <div className={styles.tileField} />
        <div className={styles.tileStone} />
      </div>

      <header className={`${styles.head} wrap`}>
        <h1 className={`${styles.title} display lines`}>
          <span className="line">
            <span data-line style={{ "--i": 0 } as React.CSSProperties}>
              {offering.titleLines[0]}
            </span>
          </span>
          {offering.titleLines[1] && (
            <span className="line">
              <span data-line style={{ "--i": 1 } as React.CSSProperties}>
                {offering.titleLines[1]}
              </span>
            </span>
          )}
        </h1>
        <p className={styles.standfirst} data-rise>
          {offering.shortDescription}
        </p>
        <div className={styles.tags} data-rise style={{ "--i": 1 } as React.CSSProperties}>
          <StatusBlock tone="neutral" size="panel">
            {offering.token.symbol}
          </StatusBlock>
          <StatusBlock tone={offering.status === "Demo" ? "demo" : offering.status === "Active" ? "done" : "closed"} size="panel">
            {offering.status}
          </StatusBlock>
          <StatusBlock tone="progress" size="panel">
            {offering.network}
          </StatusBlock>
        </div>
      </header>

      <div className={`${styles.body} wrap`}>
        <div className={styles.aside}>
          <PurchasePanel offering={offering} checkoutOpen={checkoutOpen} closedReason={closedReason} preview={preview} />
        </div>

        <div className={styles.sections}>
          <section aria-labelledby="token-title">
            <h2 id="token-title" className="head" data-reveal>
              What one token is
            </h2>
            <div className={styles.pair}>
              <div data-reveal style={{ "--i": 1 } as React.CSSProperties}>
                <h3 className={styles.sub}>Represents</h3>
                <p>{offering.represents}</p>
              </div>
              <div className={styles.not} data-reveal style={{ "--i": 2 } as React.CSSProperties}>
                <h3 className={styles.sub}>Does not represent</h3>
                <p>{offering.doesNotRepresent}</p>
              </div>
            </div>
          </section>

          <section aria-labelledby="issuer-title">
            <h2 id="issuer-title" className="head" data-reveal>
              Issuer
            </h2>
            <dl className={styles.facts} data-reveal="rows">
              <div>
                <dt>Responsible entity</dt>
                <dd>{offering.issuer.legalName}</dd>
              </div>
              <div>
                <dt>Contact</dt>
                <dd>
                  <a className="link-plain" href={contactHref(offering.issuer.contact)} target="_blank" rel="noreferrer">
                    {offering.issuer.contact.replace(/^https?:\/\//, "")}
                  </a>
                </dd>
              </div>
              <div>
                <dt>Asset category</dt>
                <dd>{offering.category}</dd>
              </div>
              <div>
                <dt>How tokens are delivered</dt>
                <dd>{offering.fulfilment}</dd>
              </div>
            </dl>
          </section>

          <section aria-labelledby="terms-title">
            <h2 id="terms-title" className="head" data-reveal>
              Terms
            </h2>
            <table className={`${styles.table} nums`} data-reveal>
              <tbody>
                <tr>
                  <th scope="row">Price per token</th>
                  <td>
                    {formatAmount(offering.pricePerToken)} {pay}
                  </td>
                </tr>
                <tr>
                  <th scope="row">Payment asset</th>
                  <td>
                    {pay}, {offering.payment.decimals} decimals
                  </td>
                </tr>
                <tr>
                  <th scope="row">Minimum purchase</th>
                  <td>
                    {formatAmount(offering.minPurchase)} {pay}
                  </td>
                </tr>
                <tr>
                  <th scope="row">Maximum purchase</th>
                  <td>
                    {formatAmount(offering.maxPurchase)} {pay}
                  </td>
                </tr>
                <tr>
                  <th scope="row">Truva fee</th>
                  <td>{offering.truvaFee ?? "None"}</td>
                </tr>
                <tr>
                  <th scope="row">Offering window</th>
                  <td>
                    From {new Date(offering.window.start).toLocaleDateString("en-GB", { dateStyle: "long" })}
                    {offering.window.end
                      ? ` to ${new Date(offering.window.end).toLocaleDateString("en-GB", { dateStyle: "long" })}`
                      : ", no end date set"}
                  </td>
                </tr>
                <tr>
                  <th scope="row">Status</th>
                  <td>{offering.status}</td>
                </tr>
                <tr>
                  <th scope="row">Last configuration check</th>
                  <td>
                    {new Date(v.checkedAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" })}{" "}
                    UTC, {v.ok ? "verified" : "not verified"}
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          <section aria-labelledby="contracts-title">
            <h2 id="contracts-title" className="head" data-reveal>
              Contracts
            </h2>
            <p className={styles.lede} data-reveal>
              Truva reads these contracts on {networkLabel}; it does not control them.
            </p>
            <ul className={styles.contracts} data-reveal="rows">
              {contracts.map(([label, value]) => (
                <li key={label}>
                  <span className={styles.contractLabel}>{label}</span>
                  {value ? (
                    <HashLine value={value} href={explorerAddress(value)} label={`${label} address`} />
                  ) : (
                    <StatusBlock tone="closed">Not configured</StatusBlock>
                  )}
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="disclosures-title">
            <h2 id="disclosures-title" className="head" data-reveal>
              Disclosures
            </h2>
            {offering.disclosures.length === 0 ? (
              <p className={styles.lede} data-reveal>
                The issuer has not published disclosures for this demo offering.
              </p>
            ) : (
              <ul className={styles.contracts}>
                {offering.disclosures.map((d) => (
                  <li key={d.href}>
                    <a className="link-plain" href={d.href} target="_blank" rel="noreferrer">
                      {d.title}
                    </a>
                    <span className="muted small">
                      {d.type}, {d.date}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
