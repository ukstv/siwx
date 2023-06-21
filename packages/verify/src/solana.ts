import type { SignedSiwxMessage } from "@siwx/message";
import { ed25519 } from "@noble/curves/ed25519";
import { fromString } from "uint8arrays";

export function verify(signed: SignedSiwxMessage): boolean {
  const string = signed.message.toString();
  const signature = signed.signature.bytes;
  const publicKey = fromString(signed.message.address, "base58btc");
  return ed25519.verify(signature, fromString(string), publicKey);
}
