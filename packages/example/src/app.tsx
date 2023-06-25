import React, { useCallback, useEffect } from "react";
import { createNanoEvents } from "nanoevents";
import {
  RainbowKitProvider,
  ConnectButton,
  connectorsForWallets,
  createAuthenticationAdapter,
  RainbowKitAuthenticationProvider,
} from "@rainbow-me/rainbowkit";
import { WagmiConfig, createConfig, configureChains, useConnect, useAccount, useChainId } from "wagmi";
import { publicProvider } from "wagmi/providers/public";
import { QueryClient } from "@tanstack/react-query";
import { polygon, mainnet } from "wagmi/chains";
import { injectedWallet, metaMaskWallet, rainbowWallet, walletConnectWallet } from "@rainbow-me/rainbowkit/wallets";
import { useState } from "react";
import { AccountId } from "caip";
import {
  AuthenticationAdapter,
  AuthenticationStatus,
} from "@rainbow-me/rainbowkit/dist/components/RainbowKitProvider/AuthenticationContext";
import { SignedSiwxMessage, SiwxMessage } from "@siwx/message";

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

class RainbowAuthenticationAdapter implements AuthenticationAdapter<SiwxMessage> {
  #status: AuthenticationStatus = "unauthenticated";
  readonly events = createNanoEvents<Events>();

  get status(): AuthenticationStatus {
    return this.#status;
  }

  set status(value: AuthenticationStatus) {
    this.events.emit("status", value);
    this.#status = value;
  }

  async getNonce() {
    return "33";
  }

  createMessage(args: { nonce: string; address: string; chainId: number }) {
    const accountId = new AccountId({ address: args.address, chainId: `eip155:${args.chainId}` });
    return SiwxMessage.make("Ethereum", accountId, {
      domain: window.location.host,
      uri: window.location.origin,
    });
  }

  getMessageBody(args: { message: SiwxMessage }) {
    return args.message.toString();
  }

  async verify(args: { message: SiwxMessage; signature: string }) {
    this.status = "authenticated";
    console.log("s", args.signature);
    // const signed = new SignedSiwxMessage(args.message, )
    return true;
  }

  async signOut() {
    console.log("signOut");
  }
}

const aa = new RainbowAuthenticationAdapter();
const authenticationAdapter = createAuthenticationAdapter(aa);

function ConnectedAs() {
  return <div>Connected</div>;
}

export function SignIn() {
  return (
    <>
      <h1>Sign In With ...</h1>
      <ul className={"sign-in-options"}>
        <li>
          <ConnectButton.Custom>
            {({
              account,
              chain,
              openAccountModal,
              openChainModal,
              openConnectModal,
              authenticationStatus,
              mounted,
            }) => {
              // Note: If your app doesn't use authentication, you
              // can remove all 'authenticationStatus' checks
              const ready = mounted && authenticationStatus !== "loading";
              const connected =
                ready && account && chain && (!authenticationStatus || authenticationStatus === "authenticated");

              // const accountId = new AccountId({ address: account.address, chainId: `eip155:${chain.id}` });
              // handleSignIn(accountId);

              return (
                <div
                  {...(!ready && {
                    "aria-hidden": true,
                    style: {
                      opacity: 0,
                      pointerEvents: "none",
                      userSelect: "none",
                    },
                  })}
                >
                  {(() => {
                    if (!connected) {
                      return (
                        <button onClick={openConnectModal} type="button">
                          Ethereum
                        </button>
                      );
                    }

                    if (chain.unsupported) {
                      return (
                        <button onClick={openChainModal} type="button">
                          Wrong network
                        </button>
                      );
                    }

                    return (
                      <button onClick={openConnectModal} type="button">
                        Ethereum
                      </button>
                    );
                  })()}
                </div>
              );
            }}
          </ConnectButton.Custom>
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
  return <p>Account</p>;
}

export function App() {
  const [authStatus, setAuthStatus] = useState(aa.status);

  useEffect(() => {
    setAuthStatus(authStatus);
    const unsubscribe = aa.events.on("status", (status) => {
      setAuthStatus(status);
    });
    return () => {
      unsubscribe();
    };
  }, [aa]);

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
