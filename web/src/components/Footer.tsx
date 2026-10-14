import Link from "next/link";
import { explorerHome, networkLabel } from "@/config/chain";
import credits from "../../public/archive/credits.json";
import styles from "./Footer.module.css";

const shortTitle = (t: string) => t.replace(/\s*\(\d+\)$/, "");

export function Footer() {
  return (
    <footer className={`${styles.footer} on-field`}>
      <p className={styles.name} aria-hidden="true">
        Truva
      </p>

      <div className={styles.row}>
        <ul className={styles.places} data-reveal="rows">
          {explorerHome && (
            <li>
              <a className="link" href={explorerHome} target="_blank" rel="noreferrer">
                {networkLabel} explorer
              </a>
            </li>
          )}
          <li>
            <a
              className="link"
              href="https://dev-docs.botchain.ai/docs/RWA/project-rwa-developer-docs/"
              target="_blank"
              rel="noreferrer"
            >
              BOT Chain RWA docs
            </a>
          </li>
          <li>
            <a className="link" href="https://faucet.botchain.ai/basic" target="_blank" rel="noreferrer">
              Testnet faucet
            </a>
          </li>
        </ul>

        <div className={styles.columns} data-reveal="rows">
          <div>
            <h2 className={styles.colHead}>Product</h2>
            <ul>
              <li><Link className="link" href="/assets">Offerings</Link></li>
              <li><Link className="link" href="/activity">Activity</Link></li>
              <li><Link className="link" href="/portfolio">Portfolio</Link></li>
              <li><Link className="link" href="/dashboard">Issuer dashboard</Link></li>
            </ul>
          </div>
          <div>
            <h2 className={styles.colHead}>Read first</h2>
            <ul>
              <li><Link className="link" href="/#not-a-deed">What a token is not</Link></li>
              <li><Link className="link" href="/#lifecycle">How settlement works</Link></li>
            </ul>
          </div>
        </div>
      </div>

      <div className={styles.credits}>
        <h2 className={styles.colHead}>Archive pictures</h2>
        <ul>
          {credits.map((c) => (
            <li key={c.ref}>
              <a className="link" href={c.page} target="_blank" rel="noreferrer">
                {shortTitle(c.title)}
              </a>
              , {c.creator ? `${c.creator}, ` : ""}
              {c.license}
            </li>
          ))}
        </ul>
      </div>

      <div className={`${styles.legal} small`}>
        <p>
          {networkLabel} demonstration. No real-world asset is sold here. Transactions and wallet addresses on
          BOT Chain are public. Archive pictures show historical documents; they are not Truva’s assets.
        </p>
        <a className="link" href="#main">
          Back to top
        </a>
      </div>
    </footer>
  );
}
