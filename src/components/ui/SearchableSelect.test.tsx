import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SearchableSelect } from "@/components/ui/SearchableSelect";

const OPTIONS = [
  { value: "sofia", label: "София" },
  { value: "varna", label: "Варна" },
];

describe("SearchableSelect", () => {
  it("shows the selected option's label when closed", () => {
    render(<SearchableSelect id="city" value="sofia" options={OPTIONS} placeholder="Избери град" onChange={() => {}} />);

    expect(screen.getByRole("combobox")).toHaveValue("София");
  });

  it("opens the option list on focus and calls onChange when an option is clicked", () => {
    const onChange = vi.fn();
    render(<SearchableSelect id="city" value="" options={OPTIONS} placeholder="Избери град" onChange={onChange} />);

    fireEvent.focus(screen.getByRole("combobox"));
    fireEvent.click(screen.getByRole("option", { name: "Варна" }));

    expect(onChange).toHaveBeenCalledWith("varna");
  });

  it("matches a Latin-typed query against Cyrillic option labels", () => {
    render(<SearchableSelect id="city" value="" options={OPTIONS} placeholder="Избери град" onChange={() => {}} />);

    fireEvent.focus(screen.getByRole("combobox"));
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "varna" } });

    expect(screen.getByRole("option", { name: "Варна" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "София" })).not.toBeInTheDocument();
  });

  it("matches a Cyrillic-typed query directly", () => {
    render(<SearchableSelect id="city" value="" options={OPTIONS} placeholder="Избери град" onChange={() => {}} />);

    fireEvent.focus(screen.getByRole("combobox"));
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "соф" } });

    expect(screen.getByRole("option", { name: "София" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Варна" })).not.toBeInTheDocument();
  });

  it("closes the list and keeps the previous selection when clicking outside", () => {
    render(
      <div>
        <SearchableSelect id="city" value="sofia" options={OPTIONS} placeholder="Избери град" onChange={() => {}} />
        <button type="button">outside</button>
      </div>,
    );

    fireEvent.focus(screen.getByRole("combobox"));
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByRole("button", { name: "outside" }));
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(screen.getByRole("combobox")).toHaveValue("София");
  });

  it("disables the input when disabled is set", () => {
    render(<SearchableSelect id="city" value="" options={OPTIONS} placeholder="Избери град" onChange={() => {}} disabled />);

    expect(screen.getByRole("combobox")).toBeDisabled();
  });

  it("shows a loading message instead of 'no matches' when isLoading is set and options is empty", () => {
    render(<SearchableSelect id="city" value="" options={[]} placeholder="Избери град" onChange={() => {}} isLoading />);

    fireEvent.focus(screen.getByRole("combobox"));

    expect(screen.getByText("Зареждане…")).toBeInTheDocument();
    expect(screen.queryByText("Няма съвпадения.")).not.toBeInTheDocument();
  });

  it("shows 'no matches' (not loading) when isLoading is false and there are genuinely no options", () => {
    render(<SearchableSelect id="city" value="" options={[]} placeholder="Избери град" onChange={() => {}} />);

    fireEvent.focus(screen.getByRole("combobox"));

    expect(screen.getByText("Няма съвпадения.")).toBeInTheDocument();
    expect(screen.queryByText("Зареждане…")).not.toBeInTheDocument();
  });
});
