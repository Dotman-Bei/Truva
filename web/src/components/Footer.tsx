import Link from "next/link";
import { explorerHome, networkLabel } from "@/config/chain";
import styles from "./Footer.module.css";

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
              <li><Link className="link" href="/credits">Image credits</Link></li>
            </ul>
          </div>
        </div>
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
