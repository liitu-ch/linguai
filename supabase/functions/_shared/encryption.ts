const IV_LENGTH = 12;
const TAG_LENGTH = 16;

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function getKey(): Promise<CryptoKey> {
  const secret = Deno.env.get("API_KEY_ENCRYPTION_SECRET");
  if (!secret) throw new Error("API_KEY_ENCRYPTION_SECRET not configured");
  const keyBytes = hexToBytes(secret);
  return crypto.subtle.importKey("raw", keyBytes, "AES-GCM", false, [
    "encrypt",
    "decrypt",
  ]);
}

/** Encrypt a plaintext API key. Returns hex string: iv + ciphertext + authTag */
export async function encrypt(plainKey: string): Promise<string> {
  const key = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encoded = new TextEncoder().encode(plainKey);
  // Web Crypto AES-GCM returns ciphertext || authTag concatenated
  const encrypted = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded),
  );
  // Output format: iv (12) || ciphertext || tag (16) — same as Node version
  const result = new Uint8Array(iv.length + encrypted.length);
  result.set(iv, 0);
  result.set(encrypted, iv.length);
  return bytesToHex(result);
}

/** Decrypt an encrypted key (hex string) back to plaintext */
export async function decrypt(encryptedHex: string): Promise<string> {
  const key = await getKey();
  const buf = hexToBytes(encryptedHex);
  const iv = buf.slice(0, IV_LENGTH);
  // Web Crypto expects ciphertext || tag as input
  const ciphertextWithTag = buf.slice(IV_LENGTH);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertextWithTag,
  );
  return new TextDecoder().decode(decrypted);
}

/** Create a masked hint from an API key, e.g. "sk-...abc123" */
export function maskKey(key: string): string {
  if (key.length <= 8) return "****";
  return key.slice(0, 3) + "..." + key.slice(-6);
}
