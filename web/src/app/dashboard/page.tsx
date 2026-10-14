import type { Metadata } from "next";
import { primaryOffering } from "@/config/offerings";
import { listIntents } from "@/lib/intents";
import { liveOffering, metaLog } from "@/lib/offeringMeta";
import { PREVIEW_SLUGS, previewEnabled, previewIntent } from "@/lib/preview";
import { DashboardView } from "@/components/dashboard/DashboardView";
import { PreviewBanner } from "@/components/PreviewBanner";

export const metadata: Metadata = { title: "Issuer dashboard" };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ preview?: string }> };

export default async function DashboardPage({ searchParams }: Props) {
  const preview = previewEnabled() && (await searchParams).preview === "agent";
  const offering = (await liveOffering(primaryOffering.id))!;

  const intents = preview
    ? PREVIEW_SLUGS.map((s, n) => ({ ...previewIntent(`preview-${s}`)!, id: `TRV-PREV-${String(n + 1).padStart(4, "0")}` }))
    : (await listIntents()).filter((i) => i.offeringId === offering.id);

  return (
    <>
      {preview && (
        <PreviewBanner>Interface preview of issuer access with example checkouts. No role was checked and saving is disabled.</PreviewBanner>
      )}
      <DashboardView
        offering={offering}
        baseStatus={primaryOffering.status}
        intents={intents}
        log={preview ? [] : await metaLog(offering.id)}
        reconciledAt={new Date().toISOString()}
        preview={preview}
      />
    </>
  );
}
