import { AccountId, ChainId } from "caip";
import { fromString } from "uint8arrays/from-string";
import { toString } from "uint8arrays/to-string";
import type { Auth } from "./auth.js";
import type { Signature } from "@siwx/message";
import type { PublicClient } from "viem";

/**
 * CAIP2 for ethereum, used in CAIP10 (acountId)
 */
export const CHAIN_NAMESPACE = "eip155";

export class RPCError extends Error {
  readonly code: number;
  readonly data: any;
  constructor(message: string, code: number, data: any) {
    super(message);
    this.code = code;
    this.data = data;
  }
}

function safeSend<T = unknown>(provider: any, method: string, params: Array<string | number> = []): Promise<T> {
  if (provider.request) {
    return provider.request({ method, params });
  }
  if (provider.sendAsync || provider.send) {
    const sendMethod = (provider.sendAsync || provider.send).bind(provider);
    const request = encodeRpcMessage(method, params);
    return new Promise((resolve, reject) => {
      sendMethod(request, (error: any, response: any) => {
        if (error) reject(error);
        if (response.error) {
          reject(new RPCError(response.error.message, response.error.code, response.error.data));
        }
        resolve(response.result);
      });
    });
  }
  throw new Error(
    `Unsupported provider; provider must implement one of the following methods: send, sendAsync, request`
  );
}

function encodeRpcMessage(method: string, params?: any): any {
  return {
    jsonrpc: "2.0",
    id: Math.floor(Math.random() * 100000),
    method,
    params,
  };
}

export function normalizeAccountId(input: AccountId): AccountId {
  return new AccountId({
    address: input.address.toLowerCase(),
    chainId: input.chainId,
  });
}

export async function getChainId(provider: any): Promise<ChainId> {
  const referenceHex = await safeSend<string>(provider, "eth_chainId");
  const reference = String(parseInt(referenceHex, 16));
  return new ChainId({ namespace: CHAIN_NAMESPACE, reference });
}

export async function getAccountId(provider: any): Promise<AccountId> {
  const chainId = await getChainId(provider);
  const addresses = await safeSend<string[]>(provider, "eth_accounts");
  const address = addresses[0];
  return new AccountId({ address: address.toLowerCase(), chainId: chainId });
}

export async function sign(provider: any, input: Uint8Array, accountId?: AccountId): Promise<Signature> {
  accountId ||= await getAccountId(provider);
  const address = normalizeAccountId(accountId).address;
  const hexPayload = `0x${toString(input, "hex")}`;
  const signatureP = safeSend<string>(provider, "personal_sign", [hexPayload, address]).catch(() => {
    return safeSend<string>(provider, "eth_sign", [address, hexPayload]);
  });
  const codeP = safeSend<string>(provider, "eth_getCode", [address, "latest"]);
  const [signature, code] = await Promise.all([signatureP, codeP]);
  return hexToSignature(signature, code);
}

export function fromEthereumProvider(provider: any, accountId?: AccountId): Auth {
  const accountIdFn = async () => {
    return accountId ? accountId : getAccountId(provider);
  };
  return {
    network: "Ethereum",
    accountId: accountIdFn,
    sign: async (input: Uint8Array) => {
      return sign(provider, input, await accountIdFn());
    },
  };
}

function hexToSignature(hex: string, code: string = "0x"): Signature {
  const signatureBytes = fromString(hex.replace(/^0x/, ""), "hex");
  const kind = code === `0x` ? "eip191" : "eip1271";
  // For SC signature, check if the address is a contract
  return {
    kind: kind,
    bytes: signatureBytes,
  };
}

/**
 * For WAGMI.
 *
 * @param address - Ethereum address
 * @param chainId - Chain ID
 * @param signFn - WAGMI sign hook
 * @param publicClient
 */
export function fromSignFunction(
  address: string,
  chainId: string | number,
  signFn: (input: { message: string }) => Promise<string>,
  publicClient?: PublicClient
): Auth {
  const accountId = new AccountId({
    address,
    chainId: `${CHAIN_NAMESPACE}:${chainId}`,
  });
  return {
    network: "Ethereum",
    accountId: () => Promise.resolve(accountId),
    sign: async (input: Uint8Array) => {
      const signatureP = signFn({ message: toString(input) });
      const codeP = publicClient?.getBytecode({ address: address as `0x${string}` });
      const [signature, code] = await Promise.all([signatureP, codeP]);
      return hexToSignature(signature, code);
    },
  };
}
