import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getImageUrl } from "@/utils/imageUrl";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface SalonCardProps {
  id: string;
  name: string;
  location: string;
  rating: number;
  services: number;
  employees: number;
  coverImage: string;
  logoImage: string;
  reviewCount?: number;
  ownerName?: string;
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
  reviewCount,
  ownerName,
}: SalonCardProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const handleBookNow = (e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering the card's click
    if (!user) {
      toast({
        title: "Login Required",
        description: "Join our elite registry to book your next bespoke experience.",
        variant: "default",
      });
      navigate("/signup");
      return;
    }
    navigate(`/book?salonId=${id}`);
  };

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
          onError={(e) => {
            e.currentTarget.src = getImageUrl(null, 'cover', id);
          }}
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
              onError={(e) => {
                e.currentTarget.src = getImageUrl(null, 'logo', id);
              }}
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
                className={`w-4 h-4 ${i < Math.floor(typeof rating === 'number' ? rating : Number(rating || 0)) ? "fill-[#F2A93B] text-[#F2A93B]" : "text-slate-200"}`}
              />
            ))}
            <span className="text-xs text-muted-foreground ml-1">
              ({(typeof rating === 'number' ? rating : Number(rating || 0)).toFixed(1)}) {reviewCount !== undefined && <span className="ml-1">· {reviewCount} reviews</span>}
            </span>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="font-bold text-sky-600">@ {ownerName?.toUpperCase()}</span>
            <span><strong className="text-foreground">{employees}</strong> Employees</span>
          </div>

          {/* Book Button */}
          <Button
            onClick={handleBookNow}
            variant="ghost"
            className="w-full mt-2 text-foreground hover:bg-[#533B26] hover:text-white font-medium transition-all duration-300"
          >
            Book Now →
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SalonCard;
