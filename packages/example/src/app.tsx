import React, { useCallback } from "react";
import {
  RainbowKitProvider,
  connectorsForWallets,
  useConnectModal,
  type AuthenticationStatus,
} from "@rainbow-me/rainbowkit";
import { WagmiConfig, createConfig, configureChains, useAccount, useDisconnect } from "wagmi";
import { publicProvider } from "wagmi/providers/public";
import { QueryClient } from "@tanstack/react-query";
import { polygon, mainnet } from "wagmi/chains";
import { injectedWallet, metaMaskWallet, rainbowWallet, walletConnectWallet } from "@rainbow-me/rainbowkit/wallets";
import { AccountId } from "caip";
import { SignedSiwxMessage } from "@siwx/message";
import { GetAccountResult } from "@wagmi/core";
import { SIWx } from "@siwx/auth";
import { fromViem } from "@siwx/auth/eip155";
import { map } from "nanostores";
import { useStore } from "@nanostores/react";
import { toHex } from "viem";

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

interface Events {
  status: (status: AuthenticationStatus) => void;
}

type $Account =
  | {
      kind: "ready";
      accountId: AccountId;
      siwx: SignedSiwxMessage;
      disconnect: () => Promise<void>;
    }
  | { kind: "absent" };

export const $account = map<$Account>({ kind: "absent" });

function WithEthereum() {
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

function SignIn() {
  return (
    <>
      <h1>Sign In With ...</h1>
      <ul className={"sign-in-options"}>
        <li>
          <WithEthereum />
        </li>
        <li>
          <button className={"tezos"}>Tezos</button>
        </li>
        <li>
          <button className={"solana"}>Solana</button>
        </li>
        <li>
          <button className={"stacks"}>Stacks</button>
        </li>
      </ul>
    </>
  );
}

function DisplayAccount() {
  const account = useStore($account);
  if (account.kind === "absent") return <></>;

  const handleDisconnect = async () => {
    await account.disconnect();
  };

  return (
    <div>
      <h2>Current account:</h2>
      <pre>
        <code>{account.accountId.toString()}</code>
      </pre>
      <p>SIWx message:</p>
      <pre>
        <code>{account.siwx.message.toString()}</code>
      </pre>
      <pre>
        <code>{toHex(account.siwx.signature.bytes)}</code>
      </pre>
      <p>
        <button onClick={handleDisconnect}>Disconnect</button>
      </p>
    </div>
  );
}

export function App() {
  return (
    <WagmiConfig config={config}>
      <RainbowKitProvider chains={chains}>
        <div className={"container"}>
          <SignIn />
          <DisplayAccount />
        </div>
      </RainbowKitProvider>
    </WagmiConfig>
  );
}
