import { Star, MapPin } from "lucide-react";
import { getImageUrl } from "@/utils/imageUrl";
import { useNavigate } from "react-router-dom";
import { ApprovedBadge } from "./ApprovedBadge";

interface SalonCardProps {
  id: string;
  name: string;
  location: string;
  rating: number;
  coverImage: string;
  reviewCount?: number;
}

const SalonCard = ({
  id,
  name,
  location,
  rating,
  coverImage,
}: SalonCardProps) => {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/salons/${id}`)}
      className="group cursor-pointer space-y-5"
    >
      {/* Cover Image with Badge */}
      <div className="relative h-[200px] md:h-[250px] rounded-[2.5rem] overflow-hidden shadow-xl transition-all duration-700 hover:shadow-2xl active:scale-95">
        <img
          src={coverImage}
          alt={name}
          className="w-full h-full object-cover grayscale-[0.1] transition-all duration-1000 group-hover:scale-110 group-hover:grayscale-0"
          onError={(e) => {
            e.currentTarget.src = getImageUrl(null, 'cover', id);
          }}
        />

        {/* Top Badge (APPROVED) */}
        <div className="absolute top-6 left-6 z-10 transition-transform duration-500 group-hover:scale-105">
          <ApprovedBadge />
        </div>

        {/* Subtle Dark Overlay */}
        <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-all duration-500" />
      </div>

      {/* Content */}
      <div className="text-center space-y-1.5 px-2">
        <h3 className="font-black text-xl md:text-2xl text-[#1A2338] uppercase tracking-tight leading-tight group-hover:text-[#b07d62] transition-colors line-clamp-1">
          {name}
        </h3>

        <div className="flex items-center justify-center gap-4 text-slate-400 font-bold">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" />
            <span className="text-[10px] uppercase tracking-widest">{location.split(',')[0]}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5" />
            <span className="text-[10px] tracking-widest">{(typeof rating === 'number' ? rating : Number(rating || 0)).toFixed(4)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};


export default SalonCard;
