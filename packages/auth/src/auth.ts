import type { AccountId } from "caip";
import type { Signature } from "@siwx/message";

export type SigningInput = Uint8Array;

export type SignFn = (input: SigningInput) => Promise<Signature>;

export interface Signer {
  readonly sign: SignFn;
}

export interface Auth extends Signer {
  readonly network: string;
  accountId(): Promise<AccountId>;
  sign(input: SigningInput): Promise<Signature>;
}

export function isAuth(input: object): input is Auth {
  return (
    "network" in input &&
    "accountId" in input &&
    "sign" in input &&
    typeof input.network === "string" &&
    typeof input.accountId === "function" &&
    typeof input.sign === "function"
  );
}
