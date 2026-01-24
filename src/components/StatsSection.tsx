const stats = [
  {
    value: "15k+",
    description: "Trusted by over 15k+ service providers and customers.",
  },
  {
    value: "100k+",
    description: "Over 100k+ bookings successfully completed across various services.",
  },
  {
    value: "95k+",
    description: "93k+ positive reviews from satisfied customers.",
  },
];

const StatsSection = () => {
  return (
    <section className="py-12 md:py-20 px-4 bg-secondary/50">
      <div className="container mx-auto">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-8 md:mb-16 px-2">
          Salon: The Ultimate Service Booking Platform
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="text-center space-y-2 md:space-y-4 p-4 md:p-6 rounded-2xl bg-background shadow-card"
            >
              <h3 className="text-3xl md:text-5xl font-bold text-foreground">{stat.value}</h3>
              <p className="text-sm md:text-base text-muted-foreground">{stat.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
