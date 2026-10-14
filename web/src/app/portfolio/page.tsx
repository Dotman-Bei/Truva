import type { Metadata } from "next";
import { offerings } from "@/config/offerings";
import { PREVIEW_SLUGS, previewEnabled, previewIntent } from "@/lib/preview";
import { PreviewBanner } from "@/components/PreviewBanner";
import { PortfolioView, type PortfolioPreview } from "@/components/portfolio/PortfolioView";

export const metadata: Metadata = { title: "Portfolio" };

type Props = { searchParams: Promise<{ preview?: string }> };

export default async function PortfolioPage({ searchParams }: Props) {
  const usePreview = previewEnabled() && (await searchParams).preview === "1";
  let preview: PortfolioPreview | undefined;
  if (usePreview) {
    const intents = PREVIEW_SLUGS.map((s) => previewIntent(`preview-${s}`)!).map((i, n) => ({
      ...i,
      id: `TRV-PREV-${String(n + 1).padStart(4, "0")}`,
      updatedAt: new Date(Date.now() - (n + 1) * 47 * 60_000).toISOString(),
      history: i.history.map((h) => ({ ...h, at: new Date(Date.now() - (n + 2) * 47 * 60_000).toISOString() })),
    }));
    preview = { address: intents[0].buyer, balances: { [offerings[0].id]: "25" }, intents };
  }

  return (
    <>
      {preview && <PreviewBanner>Interface preview with an example wallet. These balances and checkouts are not real.</PreviewBanner>}
      <PortfolioView offerings={offerings} preview={preview} />
    </>
  );
}
