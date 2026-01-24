import { Search, Calendar, Sparkles } from "lucide-react";

const steps = [
  {
    icon: Search,
    title: "Find Experts",
    description: "Browse through a list of service providers to find the expert that meets your needs.",
  },
  {
    icon: Calendar,
    title: "Schedule Your Appointment",
    description: "Choose a convenient time and book your appointment directly through our platform.",
  },
  {
    icon: Sparkles,
    title: "Enjoy Seamless Service",
    description: "Relax and let the professionals handle your needs, ensuring a top-notch experience every time.",
  },
];

const HowItWorksSection = () => {
  return (
    <section className="py-12 md:py-20 px-4 bg-secondary/30">
      <div className="container mx-auto">
        <div className="text-center mb-8 md:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 md:mb-4">How Salon Works</h2>
          <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto px-4">
            Book your preferred service provider in just a few simple steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 relative">
          {/* Connecting Line - Desktop only */}
          <div className="hidden md:block absolute top-16 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-transparent via-border to-transparent" />

          {steps.map((step, index) => (
            <div
              key={index}
              className="relative flex flex-col items-center text-center p-5 md:p-6 rounded-2xl bg-background shadow-card"
            >
              {/* Step Number */}
              <div className="absolute -top-3 md:-top-4 left-1/2 -translate-x-1/2 w-7 h-7 md:w-8 md:h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs md:text-sm font-bold">
                {index + 1}
              </div>

              {/* Icon */}
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-secondary flex items-center justify-center mb-3 md:mb-4 mt-3 md:mt-4">
                <step.icon className="w-6 h-6 md:w-8 md:h-8 text-foreground" />
              </div>

              <h3 className="text-lg md:text-xl font-semibold mb-2 md:mb-3">{step.title}</h3>
              <p className="text-muted-foreground text-sm">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
