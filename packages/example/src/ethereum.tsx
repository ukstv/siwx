import { connectorsForWallets, RainbowKitProvider, useConnectModal } from "@rainbow-me/rainbowkit";
import { configureChains, createConfig, useAccount, useDisconnect, WagmiConfig } from "wagmi";
import { GetAccountResult } from "@wagmi/core";
import { AccountId } from "caip";
import { SIWx } from "@siwx/auth";
import { fromViem } from "@siwx/auth/eip155";
import { $account } from "./account";
import React, { PropsWithChildren, useCallback } from "react";
import { mainnet, polygon } from "wagmi/chains";
import { publicProvider } from "wagmi/providers/public";
import { injectedWallet, metaMaskWallet, rainbowWallet, walletConnectWallet } from "@rainbow-me/rainbowkit/wallets";
import { QueryClient } from "@tanstack/react-query";

export function WithEthereum() {
  const connectModal = useConnectModal();
  const disconnect = useDisconnect();

  useAccount({
    onConnect({
      address,
      connector,
    }: {
      address?: GetAccountResult["address"];
      connector?: GetAccountResult["connector"];
    }) {
      if (!connector || !address) return;
      connector.getChainId().then(async (chainId) => {
        const accountId = new AccountId({ address: address, chainId: `eip155:${chainId}` });
        const walletClient = await connector.getWalletClient();
        const signedSiwxMessage = await SIWx.make("Ethereum", accountId, {
          domain: window.location.host,
          uri: window.location.origin,
        }).sign(fromViem(walletClient.signMessage));
        $account.set({
          kind: "ready",
          siwx: signedSiwxMessage,
          accountId: accountId,
          disconnect: async () => {
            await disconnect.disconnectAsync();
            $account.set({ kind: "absent" });
          },
        });
      });
    },
  });

  const handleClick = useCallback(() => {
    if (connectModal.connectModalOpen) return;
    if (connectModal.openConnectModal) connectModal.openConnectModal();
  }, [connectModal]);

  return (
    <button onClick={handleClick} type="button">
      Ethereum
    </button>
  );
}

const { publicClient, webSocketPublicClient, chains } = configureChains([mainnet, polygon], [publicProvider()]);

const projectId = "81d9f4a7bc6d0c61f049e8a34b088f95";

const connectors = connectorsForWallets([
  {
    groupName: "Recommended",
    wallets: [
      injectedWallet({ chains }),
      metaMaskWallet({ chains, projectId }),
      rainbowWallet({ projectId, chains }),
      walletConnectWallet({ projectId, chains }),
    ],
  },
]);

const config = createConfig({
  publicClient,
  queryClient: new QueryClient(),
  webSocketPublicClient,
  connectors,
});

export function RainbowProvider(props: PropsWithChildren) {
  return (
    <WagmiConfig config={config}>
      <RainbowKitProvider chains={chains}>{props.children}</RainbowKitProvider>
    </WagmiConfig>
  );
}
