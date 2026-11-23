import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import { FeaturedReviews } from "@/components/landing/FeaturedReviews";
import { WhySpecial } from "@/components/landing/WhySpecial";
import { WhoItsFor } from "@/components/landing/WhoItsFor";
import { WhatsInTheBox } from "@/components/landing/WhatsInTheBox";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { IllustrationsShowcase } from "@/components/landing/IllustrationsShowcase";
import { Benefits } from "@/components/landing/Benefits";
import { GiftMeaning } from "@/components/landing/GiftMeaning";
import { Testimonials } from "@/components/landing/Testimonials";
import { Faq } from "@/components/landing/Faq";
import { Objections } from "@/components/landing/Objections";
import { FinalCta } from "@/components/landing/FinalCta";
import { Footer } from "@/components/landing/Footer";
import { product } from "@/config/site";
import { SelectedVariantProvider } from "@/lib/SelectedVariantContext";

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <SelectedVariantProvider defaultVariantId={product.variants[0].id}>
          <Hero />
          <FeaturedReviews />
          <WhatsInTheBox />
          <IllustrationsShowcase />
          <WhoItsFor />
          <WhySpecial />
          <HowItWorks />
          <Benefits />
        </SelectedVariantProvider>
        <GiftMeaning />
        <Testimonials />
        <Faq />
        <Objections />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
