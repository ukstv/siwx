import { connectorsForWallets, RainbowKitProvider, useConnectModal } from "@rainbow-me/rainbowkit";
import { configureChains, createConfig, useAccount, useDisconnect, WagmiConfig } from "wagmi";
import { GetAccountResult } from "@wagmi/core";
import { AccountId } from "caip";
import { SIWx } from "@siwx/auth";
import { fromViem, sign } from "@siwx/auth/eip155";
import { $account } from "./account";
import React, { PropsWithChildren, useCallback } from "react";
import { mainnet, polygon } from "wagmi/chains";
import { publicProvider } from "wagmi/providers/public";
import { injectedWallet, metaMaskWallet, rainbowWallet, walletConnectWallet } from "@rainbow-me/rainbowkit/wallets";
import { QueryClient } from "@tanstack/react-query";
import { AuthMethod, AuthMethodOpts, Cacao, SignatureType, SiweMessage } from "@didtools/cacao";
import { SignedSiwxMessage } from "@siwx/message";
import { DIDSession } from "did-session";

// export function WithEthereum() {
//   const connectModal = useConnectModal();
//   const disconnect = useDisconnect();
//
//   useAccount({
//     onConnect({
//       address,
//       connector,
//     }: {
//       address?: GetAccountResult["address"];
//       connector?: GetAccountResult["connector"];
//     }) {
//       if (!connector || !address) return;
//       connector.getChainId().then(async (chainId) => {
//         const accountId = new AccountId({ address: address, chainId: `eip155:${chainId}` });
//         const walletClient = await connector.getWalletClient();
//         const signedSiwxMessage = await SIWx.make(accountId, {
//           domain: window.location.host,
//           uri: window.location.origin,
//         }).sign(fromViem(walletClient.signMessage));
//         $account.set({
//           kind: "ready",
//           siwx: signedSiwxMessage,
//           accountId: accountId,
//           disconnect: async () => {
//             await disconnect.disconnectAsync();
//             $account.set({ kind: "absent" });
//           },
//         });
//       });
//     },
//   });
//
//   const handleClick = useCallback(() => {
//     if (connectModal.connectModalOpen) return;
//     if (connectModal.openConnectModal) connectModal.openConnectModal();
//   }, [connectModal]);
//
//   return (
//     <button onClick={handleClick} type="button">
//       Ethereum
//     </button>
//   );
// }

class LegacySignedSiwxMessage implements SiweMessage {
  constructor(readonly signed: SignedSiwxMessage) {}

  get address(): string {
    return this.signed.message.address;
  }

  get chainId(): string {
    return this.signed.message.chainId;
  }

  get domain(): string {
    return this.signed.message.domain;
  }

  get uri(): string {
    return this.signed.message.uri;
  }

  get version(): string {
    return this.signed.message.version;
  }

  get statement() {
    return this.signed.message.statement;
  }

  get nonce() {
    return this.signed.message.nonce;
  }

  get issuedAt(): string {
    return this.signed.message.issuedAt;
  }

  get expirationTime() {
    return this.signed.message.expirationTime;
  }

  get notBefore() {
    return this.signed.message.notBefore;
  }

  get requestId() {
    return this.signed.message.requestId;
  }

  get resources() {
    return this.signed.message.resources;
  }

  get signature() {
    return this.signed.signature.toString();
  }

  get type() {
    return SignatureType.PERSONAL_SIGNATURE;
  }

  signMessage(): string {
    return this.signed.message.toString();
  }

  toMessage(): string;
  toMessage(chain: string): string;
  toMessage(chain?: string): string {
    return this.signed.message.toString();
  }
}

export function WithEthereumCacao() {
  const connectModal = useConnectModal();
  const disconnect = useDisconnect();

  //   useAccount({
  //     onConnect({
  //       address,
  //       connector,
  //     }: {
  //       address?: GetAccountResult["address"];
  //       connector?: GetAccountResult["connector"];
  //     }) {
  //       if (!connector || !address) return;
  //       connector.getChainId().then(async (chainId) => {
  //         const accountId = new AccountId({ address: address, chainId: `eip155:${chainId}` });
  //         const walletClient = await connector.getWalletClient();
  //         const signedSiwxMessage = await SIWx.make(accountId, {
  //           domain: window.location.host,
  //           uri: window.location.origin,
  //         }).sign(fromViem(walletClient.signMessage));
  //         $account.set({
  //           kind: "ready",
  //           siwx: signedSiwxMessage,
  //           accountId: accountId,
  //           disconnect: async () => {
  //             await disconnect.disconnectAsync();
  //             $account.set({ kind: "absent" });
  //           },
  //         });
  //       });
  //     },
  //   });

  useAccount({
    async onConnect({
      address,
      connector,
    }: {
      address?: GetAccountResult["address"];
      connector?: GetAccountResult["connector"];
    }) {
      if (!connector || !address) return;
      let signedSiwxMessage;

      connector.getChainId().then(async (chainId) => {
        const authMethod: AuthMethod = async (opts: AuthMethodOpts): Promise<Cacao> => {
          const accountId = new AccountId({ address: address, chainId: `eip155:${chainId}` });
          const walletClient = await connector.getWalletClient();
          signedSiwxMessage = await SIWx.make(accountId, {
            domain: window.location.host,
            uri: window.location.origin,
            ...opts,
          }).sign(fromViem(walletClient.signMessage));
          return Cacao.fromSiweMessage(new LegacySignedSiwxMessage(signedSiwxMessage));
        };

        const accountId = new AccountId({ address: address, chainId: `eip155:${chainId}` });
        const session = await DIDSession.authorize(authMethod, { resources: ["ceramic://nil"] });
        const did = session.did;
        const signature = await did.createJWS({ hello: "world" });

        console.log("signature", signature);


        $account.set({
          kind: "ready",
          siwx: signedSiwxMessage!,
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
      Ethereum + CACAO (see console log)
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
