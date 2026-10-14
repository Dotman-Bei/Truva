"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useSwitchChain } from "wagmi";
import { botChain, chainConfigured, chainId, networkLabel, networkShortLabel } from "@/config/chain";
import { useWallet } from "@/lib/useWallet";
import { StatusBlock } from "./StatusBlock";
import { WalletButton } from "./WalletButton";
import styles from "./Header.module.css";

const LINKS = [
  { href: "/assets", label: "Offerings" },
  { href: "/activity", label: "Activity" },
  { href: "/portfolio", label: "Portfolio" },
];

function NetworkBlock({ short = false }: { short?: boolean }) {
  const { wrongNetwork } = useWallet();
  if (!chainConfigured) return <StatusBlock tone="closed">Network not set</StatusBlock>;
  if (wrongNetwork) return <StatusBlock tone="fail">Wrong network</StatusBlock>;
  return <StatusBlock tone="progress">{short ? networkShortLabel : networkLabel}</StatusBlock>;
}

export function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const { wrongNetwork } = useWallet();
  const { switchChain, isPending } = useSwitchChain();

  useEffect(() => setMenuOpen(false), [pathname]);
  useEffect(() => {
    document.documentElement.style.overflow = menuOpen ? "hidden" : "";
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <header className={styles.header}>
        <div className={styles.left}>
          <Link href="/" className={styles.wordmark} aria-label="Truva home">
            Truva
          </Link>
          <nav className={styles.tab} aria-label="Main">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`${styles.navLink} link`}
                aria-current={isActive(l.href) ? "page" : undefined}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className={styles.right}>
          <span className={styles.networkWide}>
            <NetworkBlock />
          </span>
          <span className={styles.networkShort}>
            <NetworkBlock short />
          </span>
          <span className={styles.walletWide}>
            <WalletButton />
          </span>
          <button
            type="button"
            className={styles.menuButton}
            aria-expanded={menuOpen}
            aria-controls="site-menu"
            onClick={() => setMenuOpen(true)}
          >
            Menu
          </button>
        </div>
      </header>

      {wrongNetwork && (
        <div className={styles.wrongBar} role="alert">
          <p>
            Your wallet is on another network. Truva only signs on {networkLabel} (chain {chainId}).
          </p>
          <button
            type="button"
            className="button button--paper"
            disabled={isPending}
            onClick={() => switchChain({ chainId: botChain.id })}
          >
            {isPending ? "Check your wallet…" : "Switch network"}
          </button>
        </div>
      )}

      {menuOpen && (
        <div className={styles.menu} id="site-menu" role="dialog" aria-modal="true" aria-label="Menu">
          <div className={styles.menuTop}>
            <Link href="/" className={styles.wordmark}>
              Truva
            </Link>
            <button type="button" className={styles.menuButton} onClick={() => setMenuOpen(false)} autoFocus>
              Close
            </button>
          </div>
          <nav className={styles.menuLinks} aria-label="Main">
            <Link href="/" aria-current={pathname === "/" ? "page" : undefined}>
              Home
            </Link>
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} aria-current={isActive(l.href) ? "page" : undefined}>
                {l.label}
              </Link>
            ))}
          </nav>
          <div className={styles.menuWallet}>
            <WalletButton block />
          </div>
        </div>
      )}
    </>
  );
}
