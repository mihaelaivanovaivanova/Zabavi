import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FaqSectionForm } from "@/components/admin/FaqSectionForm";
import type { FaqContent } from "@/domain/content/types";

const initial: FaqContent = {
  items: [
    { question: "За кого е подходящ комплектът?", answer: "За начинаещи и за хора без опит с акварел." },
    { question: "Мога ли да добавя лично послание?", answer: "Да, при поръчката има поле за това." },
  ],
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("FaqSectionForm", () => {
  it("submits the edited questions and answers", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: initial }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    render(<FaqSectionForm initial={initial} />);

    fireEvent.change(screen.getByLabelText("Въпрос №1"), { target: { value: "Променен въпрос?" } });
    fireEvent.click(screen.getByRole("button", { name: "Запази" }));

    await waitFor(() => expect(screen.getByText("Запазено.")).toBeInTheDocument());

    expect(fetchMock).toHaveBeenCalledWith("/api/admin/settings/faq", expect.objectContaining({ method: "PUT" }));
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.items[0].question).toBe("Променен въпрос?");
    expect(body.items).toHaveLength(2);
  });

  it("adds a new question and drops it again if left blank on save", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: initial }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    render(<FaqSectionForm initial={initial} />);

    fireEvent.click(screen.getByRole("button", { name: "+ Добави въпрос" }));
    expect(screen.getByLabelText("Въпрос №3")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Запази" }));

    await waitFor(() => expect(screen.getByText("Запазено.")).toBeInTheDocument());
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.items).toHaveLength(2);
  });

  it("removes a question when its remove button is clicked", () => {
    render(<FaqSectionForm initial={initial} />);

    fireEvent.click(screen.getAllByRole("button", { name: "Премахни въпроса" })[0]);

    expect(screen.queryByDisplayValue("За кого е подходящ комплектът?")).not.toBeInTheDocument();
    expect(screen.getByDisplayValue("Мога ли да добавя лично послание?")).toBeInTheDocument();
  });

  it("shows the error message when the save request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: "Нещо се обърка." }), { status: 400 })),
    );

    render(<FaqSectionForm initial={initial} />);
    fireEvent.click(screen.getByRole("button", { name: "Запази" }));

    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Нещо се обърка."));
  });
});
