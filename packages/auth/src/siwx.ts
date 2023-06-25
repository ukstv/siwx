import { isAuth, type Signer, type Auth } from "./auth.js";
import type { MakeFields, SiwxMessageFields } from "@siwx/message";
import { SiwxMessage } from "@siwx/message";
import { fromString } from "uint8arrays/from-string";
import { SignedSiwxMessage } from "@siwx/message";
import { AccountId } from "caip";

export type RequestFields<TAuth extends Auth | Signer> = TAuth extends Auth ? MakeFields : SiwxMessageFields;

async function populateProviderFields<TAuth extends Auth | Signer>(
  auth: TAuth,
  fields: RequestFields<TAuth>
): Promise<SiwxMessage> {
  const hasProviderFields = "network" in fields && "address" in fields && "chainId" in fields;
  if (hasProviderFields) {
    return new SiwxMessage(fields);
  }
  if (!isAuth(auth)) throw new Error(`No provider fields present`);
  const accountId = await auth.accountId();
  return SiwxMessage.make(accountId, fields);
}

async function request<TAuth extends Auth | Signer>(
  auth: TAuth,
  fields: RequestFields<TAuth>
): Promise<SignedSiwxMessage> {
  const message = await populateProviderFields<TAuth>(auth, fields);
  const signature = await auth.sign(fromString(message.toString()));
  return new SignedSiwxMessage(message, signature);
}

export class SIWx {
  static request = request;
  static make = make;

  constructor(readonly message: SiwxMessage) {}

  async sign(signFn: Signer["sign"]): Promise<SignedSiwxMessage> {
    const signingInput = fromString(this.message.toString());
    const signature = await signFn(signingInput);
    return new SignedSiwxMessage(this.message, signature);
  }
}

function make(accountId: AccountId, params: MakeFields) {
  const message = SiwxMessage.make(accountId, params);
  return new SIWx(message);
}
