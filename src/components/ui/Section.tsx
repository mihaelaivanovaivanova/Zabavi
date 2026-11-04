import type { ReactNode } from "react";
import { Container } from "@/components/ui/Container";

interface SectionProps {
  children: ReactNode;
  id?: string;
  className?: string;
  tone?: "paper" | "lavender" | "burgundy";
}

const toneClasses: Record<Required<SectionProps>["tone"], string> = {
  paper: "bg-paper-100",
  lavender: "bg-lavender-50",
  burgundy: "bg-burgundy-800 text-paper-50",
};

export function Section({ children, id, className = "", tone = "paper" }: SectionProps) {
  return (
    <section id={id} className={`${toneClasses[tone]} py-16 sm:py-24 ${className}`}>
      <Container>{children}</Container>
    </section>
  );
}
