import { AccountId, ChainId } from "caip";
import type { Signature } from "@siwx/message";
import type { Auth, SigningInput } from "./auth.js";

export const CHAIN_NAMESPACE = "Solana";

type WithSignMessage = {
  signMessage: (message: Uint8Array, type: "utf8") => Promise<{ signature: Uint8Array }>;
};

type WithGetGenesisHash = {
  getGenesisHash: () => Promise<string>;
};

function hasGetGenesisHash(provider: any): provider is WithGetGenesisHash {
  return Boolean(provider.getGenesisHash);
}

function hasSignMessage(provider: any): provider is WithSignMessage {
  return Boolean(provider.signMessage);
}

export async function getChainId(provider: any): Promise<ChainId> {
  if (!hasGetGenesisHash(provider)) {
    throw new Error(`Unsupported provider: must implement getGenesisHash`);
  }
  const genesisHash = await provider.getGenesisHash();
  const reference = genesisHash.slice(0, 32);
  return new ChainId({ namespace: CHAIN_NAMESPACE, reference });
}

export async function getAccountId(provider: any): Promise<AccountId> {
  const chainId = await getChainId(provider);
  const retrievedAddress = provider.publicKey.toString();
  return new AccountId({ address: retrievedAddress, chainId: chainId });
}

export async function sign(provider: any, input: Uint8Array): Promise<Signature> {
  if (!hasSignMessage(provider)) {
    throw new Error(`Unsupported provider: must implement signMessage`);
  }
  const { signature } = await provider.signMessage(input, "utf8");
  return {
    kind: "solana:ed25519",
    bytes: signature,
  };
}

export function fromPhantom(provider: any): Auth {
  return {
    network: "Solana",
    accountId: () => getAccountId(provider),
    sign: (input: SigningInput) => sign(provider, input),
  };
}
