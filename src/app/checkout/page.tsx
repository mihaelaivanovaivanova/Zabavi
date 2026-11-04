import type { Metadata } from "next";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "Поръчка (демо)",
};

export default function CheckoutPage() {
  return (
    <>
      <Header />
      <main className="bg-paper-100 py-12 sm:py-16">
        <Container>
          <h1 className="text-3xl font-semibold text-ink-900">Завърши поръчката</h1>
          <p className="mt-2 text-ink-700">Гостово плащане — не е необходим акаунт.</p>
          <div className="mt-10">
            <CheckoutForm />
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
