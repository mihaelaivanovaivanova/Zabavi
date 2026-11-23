import type { ReactNode } from "react";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { Container } from "@/components/ui/Container";

export function LegalPage({ title, version, children }: { title: string; version?: string; children: ReactNode }) {
  return (
    <>
      <Header />
      <main className="bg-paper-100 py-16">
        <Container className="max-w-3xl">
          <h1 className="text-3xl font-semibold text-ink-900">{title}</h1>
          {version ? <p className="mt-2 text-sm text-ink-500">{version}</p> : null}
          <div className="mt-8">{children}</div>
        </Container>
      </main>
      <Footer />
    </>
  );
}

export function LegalHeading({ children }: { children: ReactNode }) {
  return <h2 className="mt-8 text-xl font-semibold text-ink-900">{children}</h2>;
}

export function LegalParagraph({ children }: { children: ReactNode }) {
  return <p className="mt-3 text-ink-700">{children}</p>;
}

export function LegalList({ children }: { children: ReactNode }) {
  return <ul className="mt-3 list-disc space-y-1 pl-5 text-ink-700">{children}</ul>;
}
