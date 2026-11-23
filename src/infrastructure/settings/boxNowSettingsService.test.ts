import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const REQUIRED_ENV = {
  SETTINGS_ENCRYPTION_KEY: "test-encryption-key",
  BOXNOW_API_URL: "https://partner-api.boxnow.bg",
  BOXNOW_OAUTH_CLIENT_ID: "env-client-id",
  BOXNOW_OAUTH_CLIENT_SECRET: "env-client-secret",
  BOXNOW_ORIGIN_LOCATION_ID: "origin-location-1",
  BOXNOW_ORIGIN_CONTACT_NAME: "ЗАБАВЍ Склад",
  BOXNOW_ORIGIN_CONTACT_EMAIL: "warehouse@zabavi.example",
  BOXNOW_ORIGIN_CONTACT_NUMBER: "+359888000000",
};

beforeEach(() => {
  for (const [key, value] of Object.entries(REQUIRED_ENV)) {
    vi.stubEnv(key, value);
  }
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("boxNowSettingsService", () => {
  it("falls back to env vars when nothing has been saved yet", async () => {
    const { getBoxNowSettings, isBoxNowConfigured, getBoxNowSettingsForAdmin } = await import(
      "@/infrastructure/settings/boxNowSettingsService"
    );

    expect(await isBoxNowConfigured()).toBe(true);
    const settings = await getBoxNowSettings();
    expect(settings.clientId).toBe("env-client-id");

    const admin = await getBoxNowSettingsForAdmin();
    expect(admin.clientSecretConfigured).toBe(true);
    expect(admin).not.toHaveProperty("clientSecret");
  });

  it("saves settings and prefers them over env vars afterwards", async () => {
    const { saveBoxNowSettings, getBoxNowSettings } = await import("@/infrastructure/settings/boxNowSettingsService");

    await saveBoxNowSettings({
      enabled: true,
      apiUrl: "https://partner-api.boxnow.bg",
      clientId: "admin-client-id",
      originLocationId: "origin-location-2",
      originContactName: "ЗАБАВЍ Склад 2",
      originContactEmail: "warehouse2@zabavi.bg",
      originContactNumber: "+359888000001",
      partnerId: "",
      clientSecret: "admin-client-secret",
    });

    const settings = await getBoxNowSettings();
    expect(settings.clientId).toBe("admin-client-id");
    expect(settings.clientSecret).toBe("admin-client-secret");
  });

  it("keeps the previously stored secret when the update omits it", async () => {
    const { saveBoxNowSettings, getBoxNowSettings } = await import("@/infrastructure/settings/boxNowSettingsService");

    await saveBoxNowSettings({
      enabled: true,
      apiUrl: "https://partner-api.boxnow.bg",
      clientId: "admin-client-id",
      originLocationId: "origin-location-2",
      originContactName: "ЗАБАВЍ Склад 2",
      originContactEmail: "warehouse2@zabavi.bg",
      originContactNumber: "+359888000001",
      partnerId: "",
      clientSecret: "first-client-secret",
    });

    await saveBoxNowSettings({
      enabled: true,
      apiUrl: "https://partner-api.boxnow.bg",
      clientId: "renamed-client-id",
      originLocationId: "origin-location-2",
      originContactName: "ЗАБАВЍ Склад 2",
      originContactEmail: "warehouse2@zabavi.bg",
      originContactNumber: "+359888000001",
      partnerId: "",
    });

    const settings = await getBoxNowSettings();
    expect(settings.clientId).toBe("renamed-client-id");
    expect(settings.clientSecret).toBe("first-client-secret");
  });
});
