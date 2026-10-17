import Link from "next/link";
import { explorerHome, isTestnet, networkLabel } from "@/config/chain";
import styles from "./Footer.module.css";

export function Footer() {
  return (
    <footer className={`${styles.footer} on-field`}>
      <p className={styles.name} aria-hidden="true">
        Truva
      </p>

      <div className={styles.row}>
        <div className={styles.chain}>
          <h2 className={styles.colHead}>Built on BOT Chain</h2>
          <ul className={styles.places} data-reveal="rows">
            <li>
              <a className="link" href="https://www.botchain.ai/en/" target="_blank" rel="noreferrer">
                BOT Chain official website
              </a>
            </li>
            <li>
              <a className="link" href={explorerHome ?? "https://scan.botchain.ai"} target="_blank" rel="noreferrer">
                BOT Chain Explorer{isTestnet ? " (Bohr testnet)" : ""}
              </a>
            </li>
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
            {isTestnet && (
              <li>
                <a className="link" href="https://faucet.botchain.ai/basic" target="_blank" rel="noreferrer">
                  Testnet faucet
                </a>
              </li>
            )}
          </ul>
        </div>

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
