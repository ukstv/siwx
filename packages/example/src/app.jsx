import { RainbowKitProvider, ConnectButton, connectorsForWallets } from "@rainbow-me/rainbowkit";
import { WagmiConfig, createConfig, configureChains } from "wagmi";
import { publicProvider } from "wagmi/providers/public";
import { QueryClient } from "@tanstack/react-query";
import { polygon, mainnet } from "wagmi/chains";
import { injectedWallet, rainbowWallet, walletConnectWallet } from "@rainbow-me/rainbowkit/wallets";
import { useState } from "react";
import { AccountId } from "caip";

const { publicClient, webSocketPublicClient, chains } = configureChains([mainnet, polygon], [publicProvider()]);

const projectId = "81d9f4a7bc6d0c61f049e8a34b088f95";

const connectors = connectorsForWallets([
  {
    groupName: "Recommended",
    wallets: [
      injectedWallet({ chains }),
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

function ConnectedAs() {
  return <div>Connected</div>;
}

export function SignIn(props) {
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
                      <div style={{ display: "flex", gap: 12 }}>
                        <button
                          onClick={openChainModal}
                          style={{ display: "flex", alignItems: "center" }}
                          type="button"
                        >
                          {chain.name}
                        </button>

                        <button onClick={openAccountModal} type="button">
                          {account.displayName}
                          {account.displayBalance ? ` (${account.displayBalance})` : ""}
                        </button>
                      </div>
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

export function App() {
  const [accountId, setAccountId] = useState(null);

  const renderBody = () => {
    if (accountId) {
      return <p>Account</p>;
    } else {
      return <SignIn onAccountId={(accountId) => setAccountId(accountId)} />;
    }
  };

  return (
    <WagmiConfig config={config}>
      <RainbowKitProvider chains={chains}>
        <div className={"container"}>{renderBody()}</div>
      </RainbowKitProvider>
    </WagmiConfig>
  );
}
