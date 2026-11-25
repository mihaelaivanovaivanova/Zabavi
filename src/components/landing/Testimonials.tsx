import { Section } from "@/components/ui/Section";
import { StarRating } from "@/components/ui/StarRating";
import { product, testimonials } from "@/config/site";

export function Testimonials() {
  if (testimonials.length === 0) return null;

  return (
    <Section tone="lavender">
      <div className="text-center">
        <h2 className="text-3xl font-semibold text-ink-900">Какво казват клиентите</h2>
        <div className="mt-4 flex justify-center">
          <StarRating value={product.rating} count={testimonials.length} starClassName="h-7 w-7" />
        </div>
      </div>
      <ul className="mx-auto mt-10 grid max-w-5xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {testimonials.map((testimonial) => (
          <li key={testimonial.author} className="rounded-xl border border-lavender-200 bg-paper-100 p-5">
            <p className="text-ink-800">„{testimonial.quote}“</p>
            <p className="mt-4 text-sm font-semibold text-ink-900">{testimonial.author}</p>
          </li>
        ))}
      </ul>
    </Section>
  );
}
