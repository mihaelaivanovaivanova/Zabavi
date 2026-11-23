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
    expect(settings).toMatchObject({ enabled: false, username: "", apiUrl: "" });

    const admin = await getSpeedySettingsForAdmin();
    expect(admin.passwordConfigured).toBe(false);
  });

  it("saves credentials and keeps the stored password when a later update omits it", async () => {
    const { saveSpeedySettings, getSpeedySettings, getSpeedySettingsForAdmin } = await import(
      "@/infrastructure/settings/speedySettingsService"
    );

    await saveSpeedySettings({
      enabled: true,
      apiUrl: "https://api.speedy.bg",
      username: "zabavi",
      password: "first-password",
    });

    let settings = await getSpeedySettings();
    expect(settings).toMatchObject({ enabled: true, username: "zabavi", password: "first-password" });

    await saveSpeedySettings({ enabled: true, apiUrl: "https://api.speedy.bg", username: "zabavi-renamed" });

    settings = await getSpeedySettings();
    expect(settings.username).toBe("zabavi-renamed");
    expect(settings.password).toBe("first-password");

    const admin = await getSpeedySettingsForAdmin();
    expect(admin.passwordConfigured).toBe(true);
  });
});
