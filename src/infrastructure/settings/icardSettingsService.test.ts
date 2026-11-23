import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const REQUIRED_ENV = {
  SETTINGS_ENCRYPTION_KEY: "test-encryption-key",
  ICARD_ORIGINATOR: "33",
  ICARD_MID: "000000000000123",
  ICARD_MID_NAME: "ЗАБАВЍ (env)",
  ICARD_PRIVATE_KEY: "env-private-key",
  ICARD_IPG_PUBLIC_KEY: "env-public-key",
};

beforeEach(() => {
  for (const [key, value] of Object.entries(REQUIRED_ENV)) {
    vi.stubEnv(key, value);
  }
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("icardSettingsService", () => {
  it("falls back to env vars when nothing has been saved yet", async () => {
    const { getICardSettings, isICardConfigured, getICardSettingsForAdmin } = await import(
      "@/infrastructure/settings/icardSettingsService"
    );

    expect(await isICardConfigured()).toBe(true);
    const settings = await getICardSettings();
    expect(settings).toMatchObject({ mid: "000000000000123", midName: "ЗАБАВЍ (env)" });

    const admin = await getICardSettingsForAdmin();
    expect(admin.privateKeyConfigured).toBe(true);
    expect(admin).not.toHaveProperty("privateKey");
  });

  it("saves settings and prefers them over env vars afterwards", async () => {
    const { saveICardSettings, getICardSettings, getICardSettingsForAdmin } = await import(
      "@/infrastructure/settings/icardSettingsService"
    );

    await saveICardSettings({
      enabled: true,
      apiUrl: "https://ipay.bg/paymentpage",
      originator: "99",
      mid: "000000000000999",
      midName: "ЗАБАВЍ (admin)",
      keyIndex: "2",
      ipgVersion: "3.3",
      language: "BG",
      privateKey: "saved-private-key",
      icardPublicKey: "saved-public-key",
    });

    const settings = await getICardSettings();
    expect(settings.mid).toBe("000000000000999");
    expect(settings.midName).toBe("ЗАБАВЍ (admin)");
    expect(settings.privateKey).toBe("saved-private-key");

    const admin = await getICardSettingsForAdmin();
    expect(admin.mid).toBe("000000000000999");
    expect(admin.privateKeyConfigured).toBe(true);
  });

  it("keeps the previously stored secret when the update omits it", async () => {
    const { saveICardSettings, getICardSettings } = await import("@/infrastructure/settings/icardSettingsService");

    await saveICardSettings({
      enabled: true,
      apiUrl: "https://ipay.bg/paymentpage",
      originator: "99",
      mid: "000000000000999",
      midName: "ЗАБАВЍ (admin)",
      keyIndex: "2",
      ipgVersion: "3.3",
      language: "BG",
      privateKey: "first-private-key",
      icardPublicKey: "first-public-key",
    });

    // Re-save without touching the keys (as the admin form does when the fields are left blank).
    await saveICardSettings({
      enabled: true,
      apiUrl: "https://ipay.bg/paymentpage",
      originator: "99",
      mid: "000000000000999",
      midName: "ЗАБАВЍ (renamed)",
      keyIndex: "2",
      ipgVersion: "3.3",
      language: "BG",
    });

    const settings = await getICardSettings();
    expect(settings.midName).toBe("ЗАБАВЍ (renamed)");
    expect(settings.privateKey).toBe("first-private-key");
  });

  it("is not configured once disabled, even with valid credentials", async () => {
    const { saveICardSettings, isICardConfigured } = await import("@/infrastructure/settings/icardSettingsService");

    await saveICardSettings({
      enabled: false,
      apiUrl: "https://ipay.bg/paymentpage",
      originator: "99",
      mid: "000000000000999",
      midName: "ЗАБАВЍ",
      keyIndex: "2",
      ipgVersion: "3.3",
      language: "BG",
      privateKey: "key",
      icardPublicKey: "key",
    });

    expect(await isICardConfigured()).toBe(false);
  });
});
