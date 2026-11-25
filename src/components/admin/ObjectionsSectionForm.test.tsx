import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ObjectionsSectionForm } from "@/components/admin/ObjectionsSectionForm";
import type { ObjectionsContent } from "@/domain/content/types";

const initial: ObjectionsContent = {
  items: [
    { question: "…не мога да рисувам?", answer: "Можеш да започнеш и без предишен опит." },
    { question: "…объркам нещо?", answer: "Тук няма оценяване." },
  ],
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ObjectionsSectionForm", () => {
  it("submits the edited replies", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: initial }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    render(<ObjectionsSectionForm initial={initial} />);

    fireEvent.change(screen.getByLabelText("Реплика №1"), { target: { value: "…променено възражение?" } });
    fireEvent.click(screen.getByRole("button", { name: "Запази" }));

    await waitFor(() => expect(screen.getByText("Запазено.")).toBeInTheDocument());

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/admin/settings/objections",
      expect.objectContaining({ method: "PUT" }),
    );
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.items[0].question).toBe("…променено възражение?");
    expect(body.items).toHaveLength(2);
  });

  it("removes a reply when its remove button is clicked", () => {
    render(<ObjectionsSectionForm initial={initial} />);

    fireEvent.click(screen.getAllByRole("button", { name: "Премахни репликата" })[0]);

    expect(screen.queryByDisplayValue("…не мога да рисувам?")).not.toBeInTheDocument();
    expect(screen.getByDisplayValue("…объркам нещо?")).toBeInTheDocument();
  });

  it("shows the error message when the save request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: "Нещо се обърка." }), { status: 400 })),
    );

    render(<ObjectionsSectionForm initial={initial} />);
    fireEvent.click(screen.getByRole("button", { name: "Запази" }));

    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Нещо се обърка."));
  });
});
