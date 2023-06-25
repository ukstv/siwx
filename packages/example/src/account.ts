import type { AccountId } from "caip";
import type { SignedSiwxMessage } from "@siwx/message";
import { map } from "nanostores";

export type $Account =
  | {
      kind: "ready";
      accountId: AccountId;
      siwx: SignedSiwxMessage;
      disconnect: () => Promise<void>;
    }
  | { kind: "absent" };

export const $account = map<$Account>({ kind: "absent" });
