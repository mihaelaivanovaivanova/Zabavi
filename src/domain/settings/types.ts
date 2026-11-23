/** Server-side shape — secrets are plaintext here, never sent to the browser as-is. */
export interface ICardSettings {
  enabled: boolean;
  apiUrl: string;
  originator: string;
  mid: string;
  midName: string;
  keyIndex: string;
  ipgVersion: string;
  language: string;
  privateKey: string;
  icardPublicKey: string;
}

/** Admin-facing shape — secrets replaced by a "configured" flag, never the value itself. */
export type ICardSettingsPublic = Omit<ICardSettings, "privateKey" | "icardPublicKey"> & {
  privateKeyConfigured: boolean;
  icardPublicKeyConfigured: boolean;
};

export interface BoxNowSettings {
  enabled: boolean;
  apiUrl: string;
  clientId: string;
  clientSecret: string;
  originLocationId: string;
  originContactName: string;
  originContactEmail: string;
  originContactNumber: string;
  partnerId: string;
}

export type BoxNowSettingsPublic = Omit<BoxNowSettings, "clientSecret"> & {
  clientSecretConfigured: boolean;
};

/**
 * Credentials storage only — no `SpeedyApiClient` exists yet (unlike iCard
 * and BOX NOW, nobody has fetched Speedy's API docs or wired up real
 * shipment creation in this codebase). Saved here so the business can
 * record real credentials now; `courierProvider.ts` stays the demo stub
 * until that integration is actually built.
 */
export interface SpeedySettings {
  enabled: boolean;
  apiUrl: string;
  username: string;
  password: string;
}

export type SpeedySettingsPublic = Omit<SpeedySettings, "password"> & {
  passwordConfigured: boolean;
};
