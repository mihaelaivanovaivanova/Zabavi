"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { inputClasses } from "@/components/ui/Field";
import { matchesBilingualQuery } from "@/lib/bgTransliteration";

export interface SearchableSelectOption {
  value: string;
  label: string;
  /** What typed text is matched against, if narrower than the full displayed label. Defaults to `label`. */
  searchText?: string;
}

interface SearchableSelectProps {
  id: string;
  value: string;
  options: SearchableSelectOption[];
  placeholder: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
}

/**
 * A text-filterable dropdown over a fixed option list, matching typed text
 * (Cyrillic or Latin) against each option — native `<select>` elements have
 * no general search, just jump-to-first-letter, and can't match a Latin
 * query against Cyrillic option text. Ported from smisul.bg's own
 * SearchableSelect.tsx. Used for the BOX NOW city/locker cascade.
 */
export function SearchableSelect({
  id,
  value,
  options,
  placeholder,
  onChange,
  disabled = false,
  error,
}: SearchableSelectProps) {
  const selectedOption = options.find((option) => option.value === value) ?? null;

  // Only meaningful while `isOpen` — the live filter text being typed.
  // Closed, the input always shows `selectedOption.label` directly (derived
  // at render time), so there's nothing to keep in sync via an effect even
  // when `selectedOption` resolves asynchronously (e.g. its option list
  // arrives after the value it corresponds to was already set).
  const [searchText, setSearchText] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const displayValue = isOpen ? searchText : (selectedOption?.label ?? "");

  const filteredOptions = useMemo(
    () => (isOpen ? options.filter((option) => matchesBilingualQuery(option.searchText ?? option.label, searchText)) : options),
    [options, searchText, isOpen],
  );

  useEffect(() => {
    if (!isOpen) return;

    function handleOutsideClick(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isOpen]);

  function openWithFreshSearch() {
    setIsOpen(true);
    setSearchText("");
    setHighlightedIndex(0);
  }

  function selectOption(option: SearchableSelectOption) {
    onChange(option.value);
    setIsOpen(false);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setIsOpen(true);
      setHighlightedIndex((index) => Math.min(index + 1, filteredOptions.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const option = filteredOptions[highlightedIndex];
      if (isOpen && option) selectOption(option);
    } else if (event.key === "Escape") {
      setIsOpen(false);
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <input
        id={id}
        type="text"
        role="combobox"
        aria-expanded={isOpen}
        aria-controls={`${id}-listbox`}
        aria-invalid={Boolean(error)}
        autoComplete="off"
        className={`${inputClasses} w-full disabled:cursor-not-allowed disabled:opacity-50`}
        placeholder={placeholder}
        value={displayValue}
        disabled={disabled}
        onFocus={openWithFreshSearch}
        onChange={(event) => {
          setSearchText(event.target.value);
          setIsOpen(true);
          setHighlightedIndex(0);
        }}
        onKeyDown={handleKeyDown}
      />

      {isOpen ? (
        <ul
          id={`${id}-listbox`}
          role="listbox"
          className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-lavender-200 bg-paper-50 py-1 shadow-lg"
        >
          {filteredOptions.length === 0 ? (
            <li className="px-4 py-2 text-sm text-ink-700">Няма съвпадения.</li>
          ) : (
            filteredOptions.map((option, index) => (
              <li key={option.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={option.value === value}
                  className={`block w-full px-4 py-2 text-left text-sm ${
                    index === highlightedIndex ? "bg-burgundy-600 text-paper-50" : "text-ink-900 hover:bg-lavender-100"
                  }`}
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  onClick={() => selectOption(option)}
                >
                  {option.label}
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
      {error ? (
        <p role="alert" className="mt-1.5 text-sm text-burgundy-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
