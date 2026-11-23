import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("encryptSecret/decryptSecret", () => {
  it("round-trips a plaintext value through encryption and decryption", async () => {
    vi.stubEnv("SETTINGS_ENCRYPTION_KEY", "test-encryption-key");
    const { encryptSecret, decryptSecret } = await import("@/infrastructure/settings/encryption");

    const encrypted = encryptSecret("super-secret-value");
    expect(encrypted).not.toBe("super-secret-value");
    expect(encrypted).toMatch(/^enc:v1:/);
    expect(decryptSecret(encrypted)).toBe("super-secret-value");
  });

  it("returns null for null/empty input instead of encrypting", async () => {
    vi.stubEnv("SETTINGS_ENCRYPTION_KEY", "test-encryption-key");
    const { encryptSecret } = await import("@/infrastructure/settings/encryption");

    expect(encryptSecret(null)).toBeNull();
    expect(encryptSecret("")).toBeNull();
  });

  it("throws when SETTINGS_ENCRYPTION_KEY is not configured", async () => {
    const { encryptSecret } = await import("@/infrastructure/settings/encryption");
    expect(() => encryptSecret("value")).toThrow(/SETTINGS_ENCRYPTION_KEY/);
  });

  it("isSecretConfigured only recognizes values this module encrypted", async () => {
    vi.stubEnv("SETTINGS_ENCRYPTION_KEY", "test-encryption-key");
    const { encryptSecret, isSecretConfigured } = await import("@/infrastructure/settings/encryption");

    expect(isSecretConfigured(encryptSecret("value"))).toBe(true);
    expect(isSecretConfigured("plain-text")).toBe(false);
    expect(isSecretConfigured(null)).toBe(false);
  });
});
