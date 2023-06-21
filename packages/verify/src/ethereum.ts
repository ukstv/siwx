import { keccak_256 } from "@noble/hashes/sha3";
import { secp256k1 } from "@noble/curves/secp256k1";
import type { SignedSiwxMessage } from "@siwx/message";
import type { RecoveredSignatureType } from "@noble/curves/abstract/weierstrass";
import { bytesToNumberBE, utf8ToBytes, bytesToHex, concatBytes } from "@noble/curves/abstract/utils";

const MessagePrefix = utf8ToBytes("\x19Ethereum Signed Message:\n");

function signatureFromBytes(bytes: Uint8Array): RecoveredSignatureType {
  if (bytes.byteLength !== 65) throw new Error(`Invalid Ethereum signature`);
  const r = bytesToNumberBE(bytes.subarray(0, 32));
  const s = bytesToNumberBE(bytes.subarray(32, 64));
  const v = bytes[64] - 27;
  return new secp256k1.Signature(r, s).addRecoveryBit(v);
}

export async function verify(message: SignedSiwxMessage): Promise<boolean> {
  const string = message.message.toString();
  const digest = keccak_256(concatBytes(MessagePrefix, utf8ToBytes(String(string.length)), utf8ToBytes(string)));
  const signature = signatureFromBytes(message.signature.bytes);
  const pubKey = signature.recoverPublicKey(digest).toRawBytes(false);
  const d2 = keccak_256(pubKey.subarray(1)).subarray(-20);
  const address = `0x${bytesToHex(d2)}`;
  return address === message.message.address.toLowerCase();
}
