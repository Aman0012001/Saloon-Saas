import SalonCard from "./SalonCard";

const salons = [
  {
    name: "Trendz Salon",
    location: "Tamil Nadu, Chennai",
    rating: 5,
    services: 2,
    employees: 2,
    coverImage: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&h=400&fit=crop",
    logoImage: "https://images.unsplash.com/photo-1620331311520-246422ff8347?w=120&h=120&fit=crop",
  },
  {
    name: "Caner",
    location: "Tamil Nadu, Chennai",
    rating: 4,
    services: 2,
    employees: 2,
    coverImage: "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=600&h=400&fit=crop",
    logoImage: "https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?w=120&h=120&fit=crop",
  },
  {
    name: "The Cut Hut",
    location: "Tamil Nadu, Chennai",
    rating: 5,
    services: 2,
    employees: 2,
    coverImage: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=600&h=400&fit=crop",
    logoImage: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=120&h=120&fit=crop",
  },
  {
    name: "Ship & Style",
    location: "Tamil Nadu, Chennai",
    rating: 5,
    services: 2,
    employees: 2,
    coverImage: "https://images.unsplash.com/photo-1600948836101-f9ffda59d250?w=600&h=400&fit=crop",
    logoImage: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=120&h=120&fit=crop",
  },
];

const ServicesSection = () => {
  return (
    <section id="services" className="py-12 md:py-20 px-4">
      <div className="container mx-auto">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-8 md:mb-12">Our Services</h2>

        {/* Mobile: Horizontal scroll */}
        <div className="flex md:hidden gap-4 overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide">
          {salons.map((salon) => (
            <div key={salon.name} className="flex-shrink-0 w-72 snap-center">
              <SalonCard {...salon} />
            </div>
          ))}
        </div>

        {/* Desktop: Grid */}
        <div className="hidden md:grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {salons.map((salon) => (
            <SalonCard key={salon.name} {...salon} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
