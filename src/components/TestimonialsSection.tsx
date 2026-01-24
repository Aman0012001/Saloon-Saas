const testimonials = [
  {
    quote: "We love it.",
    content: "Salon Website has transformed the way we manage our bookings. It's incredibly user-friendly. Highly recommend trying it out!",
    author: "Jenny Wilson",
    role: "Salon User",
  },
  {
    quote: "Effortless Customer Management",
    content: "Salon's customer management service is designed to simplify your workflow. Keep all your important information at your fingertips, accessible from any device, whenever you need it.",
    author: "John Doe",
    role: "Booking User",
  },
  {
    quote: "Excellent Support",
    content: "The support team at Salon is phenomenal! They are quick to respond and truly understand our needs.",
    author: "Hailey",
    role: "Booking User",
  },
  {
    quote: "Time-saving and reliable",
    content: "Salon has saved us so much time in scheduling and organization. It's a reliable tool that makes complex bookings feel easy. From layout to functionality, it covers everything we need.",
    author: "Jenifer",
    role: "Salon User",
  },
];

const TestimonialsSection = () => {
  return (
    <section className="py-12 md:py-20 px-4 bg-secondary/30">
      <div className="container mx-auto">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-8 md:mb-12">
          Customers love using Salon.
        </h2>
        
        {/* Mobile: Horizontal scroll */}
        <div className="flex md:hidden gap-4 overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="flex-shrink-0 w-72 snap-center bg-background rounded-2xl p-5 shadow-card"
            >
              <h3 className="text-base font-semibold mb-2">"{testimonial.quote}"</h3>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-4">{testimonial.content}</p>
              <div className="border-t border-border pt-3">
                <p className="font-medium text-sm">{testimonial.author}</p>
                <p className="text-xs text-muted-foreground">{testimonial.role}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop: Grid */}
        <div className="hidden md:grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-background rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-shadow"
            >
              <h3 className="text-lg font-semibold mb-3">"{testimonial.quote}"</h3>
              <p className="text-sm text-muted-foreground mb-6">{testimonial.content}</p>
              <div className="border-t border-border pt-4">
                <p className="font-medium text-sm">{testimonial.author}</p>
                <p className="text-xs text-muted-foreground">{testimonial.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
