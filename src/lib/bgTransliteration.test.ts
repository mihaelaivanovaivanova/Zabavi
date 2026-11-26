import { describe, expect, it } from "vitest";
import { matchesBilingualQuery } from "@/lib/bgTransliteration";

describe("matchesBilingualQuery", () => {
  it("matches a direct Cyrillic substring", () => {
    expect(matchesBilingualQuery("Варна", "вар")).toBe(true);
  });

  it("matches a strict Latin transliteration", () => {
    expect(matchesBilingualQuery("Чирпан", "chirpan")).toBe(true);
  });

  it("matches a loose, commonly-written Latin spelling", () => {
    expect(matchesBilingualQuery("София", "sofia")).toBe(true);
  });

  it("is case-insensitive", () => {
    expect(matchesBilingualQuery("Варна", "VAR")).toBe(true);
  });

  it("returns true for an empty query (no filter applied)", () => {
    expect(matchesBilingualQuery("Варна", "")).toBe(true);
  });

  it("returns false when nothing matches", () => {
    expect(matchesBilingualQuery("Варна", "plovdiv")).toBe(false);
  });
});
