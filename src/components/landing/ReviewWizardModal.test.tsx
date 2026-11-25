import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ReviewWizardModal } from "@/components/landing/ReviewWizardModal";

afterEach(() => {
  vi.unstubAllGlobals();
});

function openModal() {
  render(<ReviewWizardModal isOpen onClose={() => {}} />);
}

describe("ReviewWizardModal", () => {
  it("renders nothing when closed", () => {
    render(<ReviewWizardModal isOpen={false} onClose={() => {}} />);
    expect(screen.queryByText("Как бихте оценили този продукт?")).not.toBeInTheDocument();
  });

  it("keeps 'Напред' disabled on the rating step until a star is picked", () => {
    openModal();

    const next = screen.getByRole("button", { name: "Напред" });
    expect(next).toBeDisabled();

    fireEvent.click(screen.getByRole("radio", { name: "4 звезди" }));
    expect(next).toBeEnabled();
  });

  it("walks through all 4 steps and submits the collected answers", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    openModal();

    fireEvent.click(screen.getByRole("radio", { name: "5 звезди" }));
    fireEvent.click(screen.getByRole("button", { name: "Напред" }));

    expect(screen.getByText("Разкажи ни повече")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Отзив"), { target: { value: "Много съм доволна!" } });
    fireEvent.click(screen.getByRole("button", { name: "Напред" }));

    expect(screen.getByText("За вас")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Имейл адрес (Задължително)"), {
      target: { value: "client@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Име за показване (Задължително)"), {
      target: { value: "Мария" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Изпрати" }));

    await waitFor(() => expect(screen.getByText("Благодарим ти!")).toBeInTheDocument());

    expect(fetchMock).toHaveBeenCalledWith("/api/reviews/submit", expect.objectContaining({ method: "POST" }));
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body).toEqual({
      rating: 5,
      body: "Много съм доволна!",
      email: "client@example.com",
      displayName: "Мария",
      isAnonymous: false,
    });
  });

  it("shows a validation message instead of submitting when email/name are blank", () => {
    openModal();

    fireEvent.click(screen.getByRole("radio", { name: "3 звезди" }));
    fireEvent.click(screen.getByRole("button", { name: "Напред" }));
    fireEvent.change(screen.getByLabelText("Отзив"), { target: { value: "Нещо кратко." } });
    fireEvent.click(screen.getByRole("button", { name: "Напред" }));
    fireEvent.click(screen.getByRole("button", { name: "Изпрати" }));

    expect(screen.getByRole("alert")).toHaveTextContent("задължителни");
  });
});
