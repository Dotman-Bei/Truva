import type { Metadata } from "next";
import credits from "../../../public/archive/credits.json";
import { PageHead } from "@/components/PageHead";
import styles from "./page.module.css";

export const metadata: Metadata = { title: "Image credits" };

export default function CreditsPage() {
  return (
    <div className={styles.page}>
      <PageHead
        title="Credits"
        note="The archive pictures on Truva show historical payment and delivery documents. They are not Truva’s assets."
      />
      <ul className={`${styles.list} wrap`}>
        {credits.map((c) => (
          <li key={c.ref}>
            <a className="link-plain" href={c.page} target="_blank" rel="noreferrer">
              {c.title.replace(/\s*\(\d+\)$/, "")}
            </a>
            <span className="muted">
              {c.creator ? `${c.creator}, ` : ""}
              {c.license}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
