import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import { WhySpecial } from "@/components/landing/WhySpecial";
import { WhatsInTheBox } from "@/components/landing/WhatsInTheBox";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { IllustrationsShowcase } from "@/components/landing/IllustrationsShowcase";
import { Benefits } from "@/components/landing/Benefits";
import { GiftingScenarios } from "@/components/landing/GiftingScenarios";
import { ProductOffer } from "@/components/landing/ProductOffer";
import { Testimonials } from "@/components/landing/Testimonials";
import { Faq } from "@/components/landing/Faq";
import { TrustAndDelivery } from "@/components/landing/TrustAndDelivery";
import { FinalCta } from "@/components/landing/FinalCta";
import { Footer } from "@/components/landing/Footer";

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <WhySpecial />
        <WhatsInTheBox />
        <HowItWorks />
        <IllustrationsShowcase />
        <Benefits />
        <GiftingScenarios />
        <ProductOffer />
        <Testimonials />
        <Faq />
        <TrustAndDelivery />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
