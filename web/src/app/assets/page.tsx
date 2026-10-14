import type { Metadata } from "next";
import { networkLabel } from "@/config/chain";
import { offerings } from "@/config/offerings";
import { verifyOffering } from "@/lib/verify";
import { PageHead } from "@/components/PageHead";
import { OfferingsBoard, type OfferingRow } from "@/components/offerings/OfferingsBoard";
import styles from "./page.module.css";

export const metadata: Metadata = { title: "Offerings" };
// Configuration is re-checked against the chain at most once a minute.
export const revalidate = 60;

export default async function OfferingsPage() {
  const rows: OfferingRow[] = await Promise.all(
    offerings.map(async (o) => {
      const v = await verifyOffering(o);
      return {
        id: o.id,
        name: o.name,
        symbol: o.token.symbol,
        shortDescription: o.shortDescription,
        issuer: o.issuer.legalName,
        category: o.category,
        network: o.network,
        paymentSymbol: o.payment.symbol,
        pricePerToken: o.pricePerToken,
        status: o.status,
        verified: v.ok,
        checkedAt: v.checkedAt,
        problems: v.problems,
      };
    }),
  );

  return (
    <>
      <PageHead
        title="Offerings"
        note="Truva lists only offerings an issuer has configured and verified, or demos labelled as demos. There is no open marketplace."
      />
      <section className={styles.board} aria-label="Configured offerings">
        <OfferingsBoard rows={rows} network={networkLabel} />
        <p className={styles.more} data-reveal>
          More offerings appear here when issuers complete configuration and disclosures.
        </p>
      </section>
    </>
  );
}
