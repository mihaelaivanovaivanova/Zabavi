import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { IllustrationsSectionForm } from "@/components/admin/IllustrationsSectionForm";
import type { IllustrationsSectionContent } from "@/domain/content/types";

const initial: IllustrationsSectionContent = {
  heading: "Четирите илюстрации",
  intro: "Избери си настроение.",
  items: [
    { title: "Илюстрация №1", description: "Описание 1" },
    { title: "Илюстрация №2", description: "Описание 2" },
    { title: "Илюстрация №3", description: "Описание 3" },
    { title: "Илюстрация №4", description: "Описание 4" },
  ],
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("IllustrationsSectionForm", () => {
  it("submits the edited heading, intro and per-illustration title/description", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: initial }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    render(<IllustrationsSectionForm initial={initial} />);

    fireEvent.change(screen.getByLabelText("Заглавие на секцията"), { target: { value: "Нашите скици" } });
    fireEvent.change(screen.getByLabelText("Заглавие на илюстрация №1"), { target: { value: "Зимна приказка" } });
    fireEvent.change(screen.getAllByLabelText("Обяснение под заглавието")[0], { target: { value: "" } });

    fireEvent.click(screen.getByRole("button", { name: "Запази" }));

    await waitFor(() => expect(screen.getByText("Запазено.")).toBeInTheDocument());

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/admin/settings/illustrations",
      expect.objectContaining({ method: "PUT" }),
    );
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.heading).toBe("Нашите скици");
    expect(body.items[0]).toEqual({ title: "Зимна приказка", description: "" });
    expect(body.items[1]).toEqual({ title: "Илюстрация №2", description: "Описание 2" });
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
