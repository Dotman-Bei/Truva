import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { formatUnits } from "viem";
import { isTestnet, networkLabel } from "@/config/chain";
import { GROUPS, getActivity, inGroup, type ActivityRow, type Group } from "@/lib/activity";
import { PREVIEW_SLUGS, previewEnabled, previewIntent } from "@/lib/preview";
import { ActivityList } from "@/components/ActivityList";
import { PageHead } from "@/components/PageHead";
import { PreviewBanner } from "@/components/PreviewBanner";
import styles from "./page.module.css";

export const metadata: Metadata = { title: "Activity" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;
const FILTERS: [string, Group | null][] = [
  ["All", null],
  ["Pending", "pending"],
  ["Delivery pending", "delivery-pending"],
  ["Settled", "settled"],
  ["Failed", "failed"],
  ["Expired", "expired"],
];

function previewRows(): ActivityRow[] {
  return PREVIEW_SLUGS.map((slug, i) => {
    const p = previewIntent(`preview-${slug}`)!;
    return {
      intentId: `TRV-PREV-${String(i + 1).padStart(4, "0")}`,
      offeringId: p.offeringId,
      offeringName: p.offeringName,
      buyer: p.buyer,
      amount: formatUnits(BigInt(p.payUnits), p.paymentDecimals),
      paymentSymbol: p.paymentSymbol,
      state: p.state,
      paymentTx: p.payment?.hash ?? null,
      deliveryTx: p.delivery?.hash ?? null,
      updatedAt: new Date(Date.parse(p.updatedAt) - i * 3_600_000).toISOString(),
      testnet: true,
    };
  });
}

type Props = { searchParams: Promise<{ state?: string; page?: string; preview?: string }> };

export default async function ActivityPage({ searchParams }: Props) {
  const sp = await searchParams;
  const preview = previewEnabled() && sp.preview === "1";
  const group = (sp.state && sp.state in GROUPS ? sp.state : null) as Group | null;
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);

  const all = preview ? previewRows() : await getActivity();
  const filtered = all.filter((r) => inGroup(r.state, group));
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const href = (g: Group | null, p = 1) => {
    const q = new URLSearchParams();
    if (g) q.set("state", g);
    if (p > 1) q.set("page", String(p));
    if (preview) q.set("preview", "1");
    const s = q.toString();
    return s ? `/activity?${s}` : "/activity";
  };

  return (
    <>
      {preview && <PreviewBanner>Interface preview with example rows. None of these checkouts happened.</PreviewBanner>}
      <PageHead
        title="Activity"
        note={`Every checkout on ${networkLabel}, reconciled against BOT Chain. If Truva’s record and the chain ever disagree, the chain wins.`}
      />

      {isTestnet && (
        <p className={styles.env}>Testnet transactions. Nothing here moved a real asset.</p>
      )}

      <section className={`${styles.body} wrap`} aria-label="Checkouts">
        <ul className={styles.filters} aria-label="Filter by state" data-reveal="rows">
          {FILTERS.map(([label, g]) => {
            const count = all.filter((r) => inGroup(r.state, g)).length;
            const active = g === group;
            return (
              <li key={label}>
                <Link
                  href={href(g)}
                  aria-current={active ? "page" : undefined}
                  className={`${styles.filter} ${active ? styles.active : ""} ${count === 0 ? styles.empty : ""}`}
                >
                  <span>{label}</span>
                  <span className="small nums">{count}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        {rows.length > 0 ? (
          <ActivityList
            rows={rows}
            preview={preview}
            hrefFor={(r) => (preview ? `/checkout/preview-${PREVIEW_SLUGS[Number(r.intentId.slice(-4)) - 1]}` : `/checkout/${r.intentId}`)}
          />
        ) : all.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.engraving}>
              <Image
                src="/archive/counting-house-hogarth.webp"
                alt="Hogarth’s 1747 engraving of an apprentice entrusted with his master’s ledger and keys at a counting-house desk"
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className={styles.img}
              />
            </div>
            <div className={styles.emptyText} data-reveal>
              <p className="lead">
                No checkouts on {networkLabel} yet. The first one will appear here with both of its transaction
                links.
              </p>
              <Link href="/assets" className="button">
                See the offering
              </Link>
            </div>
          </div>
        ) : (
          <p className={styles.noMatch}>
            No checkouts in this state. <Link className="link-plain" href={href(null)}>Show all</Link>
          </p>
        )}

        {pages > 1 && (
          <nav className={styles.pager} aria-label="Pages">
            {page < pages ? (
              <Link className="link-plain" href={href(group, page + 1)}>
                Older
              </Link>
            ) : (
              <span />
            )}
            <span className="small nums muted">
              Page {page} of {pages}
            </span>
            {page > 1 ? (
              <Link className="link-plain" href={href(group, page - 1)}>
                Newer
              </Link>
            ) : (
              <span />
            )}
          </nav>
        )}
      </section>
    </>
  );
}
