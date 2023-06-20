import { isAuth, type Signer, type Auth } from "./auth.js";
import type { SiwxMessageFields } from "@siwx/message";
import { SiwxMessage } from "@siwx/message";
import { fromString } from "uint8arrays/from-string";
import { SignedSiwxMessage } from "@siwx/message";

export type RequestFields<TAuth extends Signer> = TAuth extends Auth
  ? Omit<SiwxMessageFields, "network" | "address" | "chainId">
  : SiwxMessageFields;

async function populateProviderFields<TAuth extends Auth | Signer>(
  auth: TAuth,
  fields: RequestFields<TAuth>
): Promise<SiwxMessageFields> {
  const hasProviderFields = "network" in fields && "address" in fields && "chainId" in fields;
  if (hasProviderFields) {
    return fields;
  }
  if (!isAuth(auth)) throw new Error(`No provider fields present`);
  const accountId = await auth.accountId();
  return {
    ...fields,
    network: auth.network,
    chainId: accountId.chainId.reference,
    address: accountId.address,
  };
}

async function request<TAuth extends Auth | Signer>(
  auth: TAuth,
  fields: RequestFields<TAuth>
): Promise<SignedSiwxMessage> {
  const fullFields = await populateProviderFields<TAuth>(auth, fields);
  const message = new SiwxMessage(fullFields);
  const signature = await auth.sign(fromString(message.toString()));
  return new SignedSiwxMessage(message, signature);
}

export class SIWx {
  static request = request;
}
