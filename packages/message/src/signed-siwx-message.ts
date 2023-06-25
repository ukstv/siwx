import type { SiwxMessage } from "./siwx-message.js";

export interface Signature {
  readonly kind: string;
  readonly bytes: Uint8Array;
  toString(): string;
}

export class SignedSiwxMessage {
  constructor(readonly message: SiwxMessage, readonly signature: Signature) {}
}
