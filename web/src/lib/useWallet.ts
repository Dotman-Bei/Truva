"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { botChain, chainConfigured } from "@/config/chain";

export function useWallet() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const { address, isConnected, chainId, status } = useAccount();
  const connected = mounted && isConnected && !!address;
  return {
    mounted,
    address: connected ? address : undefined,
    connected,
    connecting: mounted && (status === "connecting" || status === "reconnecting"),
    wrongNetwork: connected && chainConfigured && chainId !== botChain.id,
  };
}
