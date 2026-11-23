"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export interface CookiePreferences {
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}

interface StoredConsent extends CookiePreferences {
  decidedAt: string;
}

interface CookieConsentContextValue {
  /** True once storage has been read and the visitor has not decided yet — show the banner. */
  showBanner: boolean;
  preferences: CookiePreferences;
  isSettingsOpen: boolean;
  acceptAll: () => void;
  acceptNecessaryOnly: () => void;
  savePreferences: (prefs: CookiePreferences) => void;
  openSettings: () => void;
  closeSettings: () => void;
}

const STORAGE_KEY = "zabavi-cookie-consent";
const NECESSARY_ONLY: CookiePreferences = { analytics: false, marketing: false, preferences: false };
const ALL_ACCEPTED: CookiePreferences = { analytics: true, marketing: true, preferences: true };

const CookieConsentContext = createContext<CookieConsentContextValue | null>(null);

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const [hasDecided, setHasDecided] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>(NECESSARY_ONLY);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    // Deferred to a microtask so the initial read doesn't set state
    // synchronously within the effect body (matches CartProvider's pattern).
    Promise.resolve().then(() => {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const stored: StoredConsent = JSON.parse(raw);
          setPreferences({
            analytics: stored.analytics,
            marketing: stored.marketing,
            preferences: stored.preferences,
          });
          setHasDecided(true);
        }
      } catch {
        // Ignore corrupt/inaccessible storage — the banner shows again.
      }
      setIsHydrated(true);
    });
  }, []);

  const persist = useCallback((prefs: CookiePreferences) => {
    setPreferences(prefs);
    setHasDecided(true);
    try {
      const stored: StoredConsent = { ...prefs, decidedAt: new Date().toISOString() };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    } catch {
      // Ignore storage failures — the in-memory choice still applies this visit.
    }
  }, []);

  const acceptAll = useCallback(() => {
    persist(ALL_ACCEPTED);
    setIsSettingsOpen(false);
  }, [persist]);

  const acceptNecessaryOnly = useCallback(() => {
    persist(NECESSARY_ONLY);
    setIsSettingsOpen(false);
  }, [persist]);

  const savePreferences = useCallback(
    (prefs: CookiePreferences) => {
      persist(prefs);
      setIsSettingsOpen(false);
    },
    [persist],
  );

  const openSettings = useCallback(() => setIsSettingsOpen(true), []);
  const closeSettings = useCallback(() => setIsSettingsOpen(false), []);

  return (
    <CookieConsentContext.Provider
      value={{
        showBanner: isHydrated && !hasDecided,
        preferences,
        isSettingsOpen,
        acceptAll,
        acceptNecessaryOnly,
        savePreferences,
        openSettings,
        closeSettings,
      }}
    >
      {children}
    </CookieConsentContext.Provider>
  );
}

export function useCookieConsent() {
  const context = useContext(CookieConsentContext);
  if (!context) throw new Error("useCookieConsent must be used within a CookieConsentProvider");
  return context;
}
