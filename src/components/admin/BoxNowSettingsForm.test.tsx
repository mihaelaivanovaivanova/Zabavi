import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BoxNowSettingsForm } from "@/components/admin/BoxNowSettingsForm";
import type { BoxNowSettingsPublic } from "@/domain/settings/types";

const initial: BoxNowSettingsPublic = {
  enabled: true,
  apiUrl: "https://partner-api.boxnow.bg",
  clientId: "client-1",
  originLocationId: "loc-1",
  originContactName: "ЗАБАВЍ Склад",
  originContactEmail: "warehouse@zabavi.bg",
  originContactNumber: "+359888000000",
  partnerId: "",
  clientSecretConfigured: true,
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("BoxNowSettingsForm — BOX NOW marketing fields", () => {
  it("saves the banner/badge toggles and message to their own endpoint, separate from the credentials save", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ data: { bannerEnabled: false, badgeEnabled: true, bannerMessage: "Нов текст" } }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(
      <BoxNowSettingsForm
        initial={initial}
        initialMarketing={{ bannerEnabled: true, badgeEnabled: true, bannerMessage: "Безплатна доставка с BOX NOW" }}
      />,
    );

    fireEvent.click(screen.getByLabelText("Показвай горната лента"));
    fireEvent.change(screen.getByLabelText("Текст на горната лента"), { target: { value: "Нов текст" } });
    fireEvent.click(screen.getByRole("button", { name: "Запази BOX NOW маркетинг" }));

    await waitFor(() => expect(screen.getByText("Запазено.")).toBeInTheDocument());

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/admin/settings/box-now-marketing",
      expect.objectContaining({ method: "PUT" }),
    );
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body).toEqual({ bannerEnabled: false, badgeEnabled: true, bannerMessage: "Нов текст" });
  });
});
