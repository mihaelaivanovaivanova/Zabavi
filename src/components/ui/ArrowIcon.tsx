interface ArrowIconProps {
  direction: "left" | "right";
  className?: string;
}

export function ArrowIcon({ direction, className = "h-8 w-8" }: ArrowIconProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static UI icon, not an optimized content photo
    <img
      src="/icons/ui/arrow-right.svg"
      alt=""
      aria-hidden="true"
      className={`${className} ${direction === "left" ? "-scale-x-100" : ""}`}
    />
  );
}
