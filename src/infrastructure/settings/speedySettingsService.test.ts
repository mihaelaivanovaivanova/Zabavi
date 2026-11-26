import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
  vi.stubEnv("SETTINGS_ENCRYPTION_KEY", "test-encryption-key");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("speedySettingsService", () => {
  it("defaults to disabled and empty when nothing is configured anywhere", async () => {
    const { getSpeedySettings, getSpeedySettingsForAdmin } = await import(
      "@/infrastructure/settings/speedySettingsService"
    );

    const settings = await getSpeedySettings();
    expect(settings).toMatchObject({ enabled: false, username: "", apiUrl: "", dropoffOfficeId: "", serviceId: "505" });

    const admin = await getSpeedySettingsForAdmin();
    expect(admin.passwordConfigured).toBe(false);
  });

  it("saves credentials and keeps the stored password when a later update omits it", async () => {
    const { saveSpeedySettings, getSpeedySettings, getSpeedySettingsForAdmin } = await import(
      "@/infrastructure/settings/speedySettingsService"
    );

    await saveSpeedySettings({
      enabled: true,
      apiUrl: "https://api.speedy.bg/v1",
      username: "zabavi",
      password: "first-password",
      dropoffOfficeId: "123",
      serviceId: "505",
    });

    let settings = await getSpeedySettings();
    expect(settings).toMatchObject({
      enabled: true,
      username: "zabavi",
      password: "first-password",
      dropoffOfficeId: "123",
      serviceId: "505",
    });

    await saveSpeedySettings({
      enabled: true,
      apiUrl: "https://api.speedy.bg/v1",
      username: "zabavi-renamed",
      dropoffOfficeId: "456",
      serviceId: "505",
    });

    settings = await getSpeedySettings();
    expect(settings.username).toBe("zabavi-renamed");
    expect(settings.password).toBe("first-password");
    expect(settings.dropoffOfficeId).toBe("456");

    const admin = await getSpeedySettingsForAdmin();
    expect(admin.passwordConfigured).toBe(true);
  });

  it("isSpeedyConfigured requires enabled, credentials, and a dropoff office", async () => {
    // Runs after the previous test, which already left credentials saved in
    // the shared in-memory settings store — asserted via an explicit empty
    // dropoffOfficeId below rather than assuming a pristine starting state.
    const { isSpeedyConfigured, saveSpeedySettings } = await import("@/infrastructure/settings/speedySettingsService");

    await saveSpeedySettings({
      enabled: true,
      apiUrl: "https://api.speedy.bg/v1",
      username: "zabavi",
      password: "secret",
      dropoffOfficeId: "",
      serviceId: "505",
    });
    expect(await isSpeedyConfigured()).toBe(false);

    await saveSpeedySettings({
      enabled: true,
      apiUrl: "https://api.speedy.bg/v1",
      username: "zabavi",
      dropoffOfficeId: "123",
      serviceId: "505",
    });
    expect(await isSpeedyConfigured()).toBe(true);
  });
});
