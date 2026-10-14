import Link from "next/link";
import { PageHead } from "@/components/PageHead";

export default function NotFound() {
  return (
    <div style={{ paddingBottom: "var(--section)" }}>
      <PageHead
        title="Not found"
        note="There’s nothing at this address. Checkout references look like TRV-7Q4K-2M9D and are shown on every receipt."
      >
        <Link href="/activity" className="button">
          Open activity
        </Link>
        <Link href="/" className="link-plain">
          Home
        </Link>
      </PageHead>
    </div>
  );
}
