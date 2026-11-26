import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HowItWorksSectionForm } from "@/components/admin/HowItWorksSectionForm";
import type { HowItWorksContent } from "@/domain/content/types";

const initial: HowItWorksContent = {
  heading: "Как протича рисуването",
  steps: [
    { title: "Избери илюстрация", description: "Описание 1." },
    { title: "Смеси цветовете", description: "Описание 2." },
  ],
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("HowItWorksSectionForm", () => {
  it("submits the edited heading and steps", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: initial }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    render(<HowItWorksSectionForm initial={initial} />);

    fireEvent.change(screen.getByLabelText("Заглавие на секцията"), { target: { value: "Нов процес" } });
    fireEvent.change(screen.getByLabelText("Стъпка №1"), { target: { value: "Нова първа стъпка" } });
    fireEvent.click(screen.getByRole("button", { name: "Запази" }));

    await waitFor(() => expect(screen.getByText("Запазено.")).toBeInTheDocument());

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/admin/settings/how-it-works",
      expect.objectContaining({ method: "PUT" }),
    );
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.heading).toBe("Нов процес");
    expect(body.steps[0].title).toBe("Нова първа стъпка");
    expect(body.steps).toHaveLength(2);
  });

  it("adds a new step and drops it again if left blank on save", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: initial }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    render(<HowItWorksSectionForm initial={initial} />);

    fireEvent.click(screen.getByRole("button", { name: "+ Добави стъпка" }));
    expect(screen.getByLabelText("Стъпка №3")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Запази" }));

    await waitFor(() => expect(screen.getByText("Запазено.")).toBeInTheDocument());
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.steps).toHaveLength(2);
  });

  it("removes a step when its remove button is clicked", () => {
    render(<HowItWorksSectionForm initial={initial} />);

    fireEvent.click(screen.getAllByRole("button", { name: "Премахни стъпката" })[0]);

    expect(screen.queryByDisplayValue("Избери илюстрация")).not.toBeInTheDocument();
    expect(screen.getByDisplayValue("Смеси цветовете")).toBeInTheDocument();
  });

  it("shows the error message when the save request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: "Нещо се обърка." }), { status: 400 })),
    );

    render(<HowItWorksSectionForm initial={initial} />);
    fireEvent.click(screen.getByRole("button", { name: "Запази" }));

    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Нещо се обърка."));
  });
});
