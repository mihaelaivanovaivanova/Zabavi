function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-5 w-5 shrink-0">
      <circle cx="10" cy="10" r="10" className="fill-sage-500" />
      <path
        d="M6 10.3l2.6 2.6 5.4-5.6"
        fill="none"
        stroke="white"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CheckBadgeList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="flex items-center gap-2 text-ink-800">
          <CheckIcon />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
