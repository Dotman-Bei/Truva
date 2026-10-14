import { createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { botChain } from "@/config/chain";

export const wagmiConfig = createConfig({
  chains: [botChain],
  connectors: [injected()],
  transports: { [botChain.id]: http() },
  ssr: true,
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
