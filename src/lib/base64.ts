const BASE64_ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

/**
 * Convex runtime does not expose Node's Buffer. Use a small UTF-8 to base64 encoder
 * that only relies on Web APIs available in both Convex and browsers.
 */
export function stringToBase64(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let output = "";

  for (let i = 0; i < bytes.length; i += 3) {
    const byte1 = bytes[i];
    const byte2 = bytes[i + 1];
    const byte3 = bytes[i + 2];

    const triple = (byte1 << 16) | ((byte2 ?? 0) << 8) | (byte3 ?? 0);

    output += BASE64_ALPHABET[(triple >> 18) & 0x3f];
    output += BASE64_ALPHABET[(triple >> 12) & 0x3f];
    output +=
      i + 1 < bytes.length ? BASE64_ALPHABET[(triple >> 6) & 0x3f] : "=";
    output += i + 2 < bytes.length ? BASE64_ALPHABET[triple & 0x3f] : "=";
  }

  return output;
}

/**
 * Convert an ArrayBuffer to base64 string without using Node's Buffer.
 * Uses only Web APIs available in Convex runtime.
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let output = "";

  for (let i = 0; i < bytes.length; i += 3) {
    const byte1 = bytes[i];
    const byte2 = bytes[i + 1];
    const byte3 = bytes[i + 2];

    const triple = (byte1 << 16) | ((byte2 ?? 0) << 8) | (byte3 ?? 0);

    output += BASE64_ALPHABET[(triple >> 18) & 0x3f];
    output += BASE64_ALPHABET[(triple >> 12) & 0x3f];
    output +=
      i + 1 < bytes.length ? BASE64_ALPHABET[(triple >> 6) & 0x3f] : "=";
    output += i + 2 < bytes.length ? BASE64_ALPHABET[triple & 0x3f] : "=";
  }

  return output;
}
