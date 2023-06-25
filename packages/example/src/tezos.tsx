import React from "react";
import { DAppClient } from "@airgap/beacon-sdk";
import { $account } from "./account";
import { fromDappClient } from "@siwx/auth/tezos";
import { SIWx } from "@siwx/auth";

const dAppClient = new DAppClient({ name: "Sign in with Tezos example" });

export function WithTezos() {
  const handleClick = async () => {
    const signed = await SIWx.request(fromDappClient(dAppClient), {
      domain: window.location.host,
      uri: window.location.origin,
    });
    $account.set({
      kind: "ready",
      accountId: signed.message.accountId,
      siwx: signed,
      disconnect: async () => {
        await dAppClient.disconnect();
        $account.set({
          kind: "absent",
        });
      },
    });
  };

  return <button onClick={handleClick}>Tezos</button>;
}
