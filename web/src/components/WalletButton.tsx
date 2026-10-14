"use client";

import { useEffect, useRef, useState } from "react";
import { useConnect, useDisconnect } from "wagmi";
import { explorerAddress } from "@/config/chain";
import { shortHex } from "@/lib/format";
import { useWallet } from "@/lib/useWallet";
import styles from "./WalletButton.module.css";

export function WalletButton({ block = false }: { block?: boolean }) {
  const { address, connected, connecting } = useWallet();
  const { connect, connectors, error, reset } = useConnect();
  const { disconnect } = useDisconnect();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onClick = (e: MouseEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  if (!connected || !address) {
    const noWallet = (error?.name as string | undefined) === "ProviderNotFoundError";
    return (
      <div className={styles.root} ref={root}>
        <button
          type="button"
          className={`button ${block ? styles.block : ""}`}
          onClick={() => {
            reset();
            const injected = connectors[0];
            if (injected) connect({ connector: injected });
          }}
          disabled={connecting}
        >
          {connecting ? "Connecting…" : "Connect wallet"}
        </button>
        {error && (
          <p className={`${styles.error} small`} role="alert">
            {noWallet
              ? "No browser wallet found. Install one, such as MetaMask, then reload this page."
              : "The wallet didn’t connect. Nothing was signed. Try again when you’re ready."}
          </p>
        )}
      </div>
    );
  }

  const explorer = explorerAddress(address);

  return (
    <div className={styles.root} ref={root}>
      <button
        type="button"
        className={`${styles.connected} nums ${block ? styles.block : ""}`}
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((v) => !v)}
        title={address}
      >
        {shortHex(address)}
      </button>
      {open && (
        <div className={styles.sheet} role="menu">
          <p className={`${styles.full} small nums`}>{address}</p>
          <button
            type="button"
            role="menuitem"
            className={styles.item}
            onClick={async () => {
              await navigator.clipboard.writeText(address);
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1500);
            }}
          >
            {copied ? "Copied" : "Copy address"}
          </button>
          {explorer && (
            <a role="menuitem" className={styles.item} href={explorer} target="_blank" rel="noreferrer">
              View on explorer
            </a>
          )}
          <button
            type="button"
            role="menuitem"
            className={styles.item}
            onClick={() => {
              disconnect();
              setOpen(false);
            }}
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
