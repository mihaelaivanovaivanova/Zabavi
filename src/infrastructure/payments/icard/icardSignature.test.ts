import { generateKeyPairSync } from "node:crypto";
import { describe, expect, it } from "vitest";
import { parseFormUrlEncodedOrdered, phpUrlEncode, signIcardFields, verifyIcardFields } from "@/infrastructure/payments/icard/icardSignature";

describe("phpUrlEncode", () => {
  it("encodes spaces as + and leaves -_. unescaped, matching PHP's urlencode", () => {
    expect(phpUrlEncode("John Smith")).toBe("John+Smith");
    expect(phpUrlEncode("a-b_c.d")).toBe("a-b_c.d");
  });

  it("percent-encodes characters encodeURIComponent would leave unescaped (!~*'())", () => {
    expect(phpUrlEncode("a!b~c*d'e(f)g")).toBe("a%21b%7Ec%2Ad%27e%28f%29g");
  });
});

describe("parseFormUrlEncodedOrdered", () => {
  it("preserves field order and decodes + as space", () => {
    const pairs = parseFormUrlEncodedOrdered("IPGmethod=IPGPurchase&CardholderName=John+Smith&Amount=23.45");
    expect(pairs).toEqual([
      ["IPGmethod", "IPGPurchase"],
      ["CardholderName", "John Smith"],
      ["Amount", "23.45"],
    ]);
  });

  it("returns an empty array for an empty body", () => {
    expect(parseFormUrlEncodedOrdered("")).toEqual([]);
  });
});

describe("signIcardFields / verifyIcardFields", () => {
  const { publicKey, privateKey } = generateKeyPairSync("rsa", { modulusLength: 1024 });
  const privateKeyPem = privateKey.export({ type: "pkcs1", format: "pem" }).toString();
  const publicKeyPem = publicKey.export({ type: "spki", format: "pem" }).toString();

  const fields: [string, string][] = [
    ["IPGmethod", "IPGPurchase"],
    ["MID", "000000000000123"],
    ["Amount", "23.45"],
  ];

  it("round-trips: a signature produced by signIcardFields verifies with the matching public key", () => {
    const signature = signIcardFields(fields, privateKeyPem);
    expect(verifyIcardFields(fields, signature, publicKeyPem)).toBe(true);
  });

  it("fails verification when any signed value is tampered with", () => {
    const signature = signIcardFields(fields, privateKeyPem);
    const tampered: [string, string][] = [...fields.slice(0, -1), ["Amount", "99.99"]];
    expect(verifyIcardFields(tampered, signature, publicKeyPem)).toBe(false);
  });

  it("fails verification when the field order differs", () => {
    const signature = signIcardFields(fields, privateKeyPem);
    const reordered: [string, string][] = [fields[1], fields[0], fields[2]];
    expect(verifyIcardFields(reordered, signature, publicKeyPem)).toBe(false);
  });

  it("fails verification against a non-matching public key instead of throwing", () => {
    const otherKeyPair = generateKeyPairSync("rsa", { modulusLength: 1024 });
    const otherPublicKeyPem = otherKeyPair.publicKey.export({ type: "spki", format: "pem" }).toString();
    const signature = signIcardFields(fields, privateKeyPem);
    expect(verifyIcardFields(fields, signature, otherPublicKeyPem)).toBe(false);
  });
});
