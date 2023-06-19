import { AccountId } from "caip";
import { randomUint32 } from "@stablelib/random";
import { fromString } from "uint8arrays/from-string";
import { toString } from "uint8arrays/to-string";

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
    id: randomUint32(),
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

export async function getChainId<TProvider = unknown>(provider: TProvider): Promise<number> {
  const chainIdHex = await safeSend<string>(provider, "eth_chainId");
  return parseInt(chainIdHex, 16);
}

export async function getAccountId<TProvider = unknown>(provider: TProvider, address?: string): Promise<AccountId> {
  const ethChainId = await getChainId(provider);
  const chainId = `${CHAIN_NAMESPACE}:${ethChainId}`;
  if (address) {
    return new AccountId({ address: address.toLowerCase(), chainId: chainId });
  } else {
    const addresses = await safeSend<string[]>(provider, "eth_accounts");
    const address = addresses[0];
    return new AccountId({ address: address.toLowerCase(), chainId: chainId });
  }
}

export async function sign<TProvider = unknown>(
  provider: TProvider,
  input: Uint8Array,
  accountId?: AccountId
): Promise<Uint8Array> {
  accountId = normalizeAccountId(accountId || (await getAccountId(provider)));
  const signature = await safeSend<`0x${string}`>(provider, "personal_sign", [
    `0x${toString(input, "base16")}`,
    accountId.address,
  ]);
  return fromString(signature.replace(/^0x/, ""), "hex");
}
