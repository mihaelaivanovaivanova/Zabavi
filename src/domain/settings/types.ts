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
 * Speedy Web API credentials plus the account-specific config their real
 * `shipment` endpoint needs (see `speedyApiClient.ts`). `dropoffOfficeId` is
 * the Speedy office this account drops parcels off at (`sender.dropoff`,
 * no courier pickup from a warehouse). `serviceId` defaults to Speedy's
 * commonly used standard courier service id (505), but it is
 * account-specific — verify it in this account's own Speedy profile rather
 * than trusting the default blindly.
 */
export interface SpeedySettings {
  enabled: boolean;
  apiUrl: string;
  username: string;
  password: string;
  dropoffOfficeId: string;
  serviceId: string;
}

export type SpeedySettingsPublic = Omit<SpeedySettings, "password"> & {
  passwordConfigured: boolean;
};
