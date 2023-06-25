import React from "react";
import { useStore } from "@nanostores/react";
import { toHex } from "viem";
import { $account } from "./account";
import { RainbowProvider, WithEthereum } from "./ethereum";

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
    <RainbowProvider>
      <div className={"container"}>
        <SignIn />
        <DisplayAccount />
      </div>
    </RainbowProvider>
  );
}
