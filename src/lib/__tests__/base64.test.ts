import { expect, test } from "bun:test";
import { stringToBase64 } from "@/src/lib/base64";

const cases = ["", "hello", "café", "🍕 tastes great", "線香花火"];

for (const value of cases) {
  const expected = Buffer.from(value, "utf8").toString("base64");

  test(`encodes "${value}" to base64`, () => {
    expect(stringToBase64(value)).toBe(expected);
  });
}
