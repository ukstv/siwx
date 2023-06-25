import { AccountId, ChainId } from "caip";
import type { Signature } from "@siwx/message";
import { toString } from "uint8arrays/to-string";
import { fromString } from "uint8arrays/from-string";
import type { Auth, SigningInput } from "./auth.js";

// TODO Add tz2 and tz3

export const CHAIN_NAMESPACE = "tezos";

const REFERENCE_MAP = {
  mainnet: "NetXdQprcVkpaWU",
  devnet: "NetXm8tYqnMWky1",
};

type TezosNetwork = keyof typeof REFERENCE_MAP;

type SupportedProvider = {
  requestSignPayload: (opts: { signingType: string; payload: string }) => Promise<{ signature: string }>;
  getActiveAccount: () => Promise<{ network: { type: TezosNetwork }; publicKey: string; address: string }>;
  requestPermissions: SupportedProvider["getActiveAccount"];
};

function assertSupportedProvider(provider: any): asserts provider is SupportedProvider {
  if (!provider.requestSignPayload || !provider.getActiveAccount) {
    throw new Error("Unsupported provider; provider must implement requestSignPayload");
  }
}

export async function getChainId(provider: any): Promise<ChainId> {
  assertSupportedProvider(provider);
  let activeAccount = await provider.getActiveAccount();
  if (!activeAccount) activeAccount = await provider.requestPermissions();
  const network = activeAccount.network.type;
  const reference = REFERENCE_MAP[network];
  if (!reference) throw new Error(`Unknown network: ${network}`);
  return new ChainId({ reference, namespace: CHAIN_NAMESPACE });
}

/**
 * @param provider - Instance of `DAppClient`
 */
export async function getAccountId(provider: any): Promise<AccountId> {
  assertSupportedProvider(provider);
  let activeAccount = await provider.getActiveAccount();
  if (!activeAccount) activeAccount = await provider.requestPermissions();
  const network = activeAccount.network.type;
  const reference = REFERENCE_MAP[network];
  if (!reference) throw new Error(`Unknown network: ${network}`);
  const address = activeAccount.address;
  return new AccountId({ address, chainId: new ChainId({ reference, namespace: CHAIN_NAMESPACE }) });
}

export async function sign(provider: any, input: SigningInput): Promise<Signature> {
  assertSupportedProvider(provider);
  const inputHex = toString(input, "hex");
  const bytesLength = (inputHex.length / 2).toString(16);
  const payload = "05" + "01" + bytesLength.padStart(8, "0") + inputHex;
  const rs = await provider.requestSignPayload({
    signingType: "micheline",
    payload: payload,
  });
  return {
    kind: "tezos:ed25519",
    bytes: fromString(rs.signature),
  };
}

export function fromDappClient(provider: any): Auth {
  return {
    network: "Tezos",
    accountId: () => getAccountId(provider),
    sign: (input: SigningInput) => sign(provider, input),
  };
}
