import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("checkoutSettingsService", () => {
  it("defaults to 0.5 when nothing is configured anywhere", async () => {
    const { getCodFeeEur } = await import("@/infrastructure/settings/checkoutSettingsService");
    expect(await getCodFeeEur()).toBe(0.5);
  });

  it("falls back to the COD_FEE_EUR env var when nothing is saved", async () => {
    vi.stubEnv("COD_FEE_EUR", "1.2");
    const { getCodFeeEur } = await import("@/infrastructure/settings/checkoutSettingsService");
    expect(await getCodFeeEur()).toBe(1.2);
  });

  it("saved value overrides both the default and the env var", async () => {
    vi.stubEnv("COD_FEE_EUR", "1.2");
    const { getCodFeeEur, saveCodFeeEur } = await import("@/infrastructure/settings/checkoutSettingsService");

    await saveCodFeeEur(0.9);

    expect(await getCodFeeEur()).toBe(0.9);
  });
});
