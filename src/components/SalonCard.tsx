import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SalonCardProps {
  id: string;
  name: string;
  location: string;
  rating: number;
  services: number;
  employees: number;
  coverImage: string;
  logoImage: string;
}

import { useNavigate } from "react-router-dom";

const SalonCard = ({
  id,
  name,
  location,
  rating,
  services,
  employees,
  coverImage,
  logoImage,
}: SalonCardProps) => {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/salons/${id}`)}
      className="group bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 cursor-pointer"
    >
      {/* Cover Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={coverImage}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>

      {/* Content */}
      <div className="p-5 relative">
        {/* Logo */}
        <div className="absolute -top-8 left-5">
          <div className="w-16 h-16 rounded-full border-4 border-background overflow-hidden shadow-lg">
            <img
              src={logoImage}
              alt={`${name} logo`}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <div className="pt-6 space-y-3">
          <h3 className="font-semibold text-lg">{name}</h3>
          <p className="text-sm text-muted-foreground">{location}</p>

          {/* Rating */}
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${i < rating ? "fill-gold text-gold" : "fill-muted text-muted"
                  }`}
              />
            ))}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span><strong className="text-foreground">{services}</strong> Services</span>
            <span><strong className="text-foreground">{employees}</strong> Employees</span>
          </div>

          {/* Book Button */}
          <Button
            variant="ghost"
            className="w-full mt-2 text-foreground group-hover:text-accent font-medium"
          >
            Book Now →
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SalonCard;
