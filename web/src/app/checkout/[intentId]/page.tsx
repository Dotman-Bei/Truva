import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getOffering } from "@/config/offerings";
import { refreshIntent } from "@/lib/intents";
import { previewIntent } from "@/lib/preview";
import { CheckoutView } from "@/components/checkout/CheckoutView";
import { PreviewBanner } from "@/components/PreviewBanner";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ intentId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: `Checkout ${(await params).intentId}` };
}

export default async function CheckoutPage({ params }: Props) {
  const { intentId } = await params;
  const intent = previewIntent(intentId) ?? (await refreshIntent(intentId));

  if (!intent) notFound();

  const offering = getOffering(intent.offeringId);
  return (
    <>
      {intent.preview && (
        <PreviewBanner>Interface preview with example data. No payment or delivery took place.</PreviewBanner>
      )}
      <CheckoutView
        initial={intent}
        config={{
          paymentToken: offering?.payment.address ?? null,
          treasury: offering?.treasury ?? null,
          identityRegistry: offering?.suite.identityRegistry ?? null,
          issuerContact: offering?.issuer.contact ?? "",
          issuerName: offering?.issuer.legalName ?? "",
        }}
      />
    </>
  );
}
