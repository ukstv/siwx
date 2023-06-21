import { createWalletClient, createTestClient, custom } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { mainnet } from "viem/chains";
import { randomBytes } from "@noble/hashes/utils";
import { test } from "uvu";
import { SiwxMessage } from "@siwx/message";
import { AccountId } from "caip";
import { SIWx } from "@siwx/auth";
import { fromSignFunction, fromViem } from "@siwx/auth/eip155";
import { verify } from "./ethereum.js";

const privateKey = `0xa4589f35643994d435330c2b1a10eaa42b606cff27c5c00e640d54cd13f09f2d`;
const account = privateKeyToAccount(privateKey);

test("verify message", async () => {
  const message = SIWx.make("Ethereum", new AccountId({ chainId: `eip155:1`, address: account.address }), {
    domain: "example.com",
    uri: "https://example.com",
  });
  const signed = await message.sign(fromViem(account.signMessage));
  const a = await verify(signed)
  console.log('a', a)
});

test.run();
