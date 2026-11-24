import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { IllustrationsSectionForm } from "@/components/admin/IllustrationsSectionForm";
import type { IllustrationsSectionContent } from "@/domain/content/types";

const initial: IllustrationsSectionContent = {
  heading: "Четирите илюстрации",
  intro: "Избери си настроение.",
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("IllustrationsSectionForm", () => {
  it("submits the edited heading and intro", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: initial }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    render(<IllustrationsSectionForm initial={initial} />);

    fireEvent.change(screen.getByLabelText("Заглавие на секцията"), { target: { value: "Нашите скици" } });
    fireEvent.change(screen.getByLabelText("Текст под заглавието"), { target: { value: "" } });

    fireEvent.click(screen.getByRole("button", { name: "Запази" }));

    await waitFor(() => expect(screen.getByText("Запазено.")).toBeInTheDocument());

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/admin/settings/illustrations",
      expect.objectContaining({ method: "PUT" }),
    );
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.heading).toBe("Нашите скици");
    expect(body.intro).toBe("");
  });

  it("shows the error message when the save request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: "Нещо се обърка." }), { status: 400 })),
    );

    render(<IllustrationsSectionForm initial={initial} />);
    fireEvent.click(screen.getByRole("button", { name: "Запази" }));

    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Нещо се обърка."));
  });
});
