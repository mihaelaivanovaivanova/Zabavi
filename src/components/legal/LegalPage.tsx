import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { Container } from "@/components/ui/Container";

export function LegalPage({ title }: { title: string }) {
  return (
    <>
      <Header />
      <main className="bg-paper-100 py-16">
        <Container>
          <h1 className="text-3xl font-semibold text-ink-900">{title}</h1>
          <p className="mt-4 max-w-2xl text-ink-700">
            Очаквайте подробности. Този текст предстои да бъде допълнен с окончателното съдържание.
          </p>
        </Container>
      </main>
      <Footer />
    </>
  );
}
