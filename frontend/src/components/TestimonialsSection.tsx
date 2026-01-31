import { useEffect, useState } from "react";
import { api } from "@/services/api";
import { Star } from "lucide-react";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  user_name: string;
  user_avatar: string | null;
  service_name: string;
}

const TestimonialsSection = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const data = await api.reviews.getAll();
        // The API returns { data: { reviews: [...] } } via fetchWithAuth, 
        // but fetchWithAuth already extracts .data or the body.
        // Let's handle the extraction.
        const fetchedReviews = data?.reviews || data || [];
        setReviews(fetchedReviews);
      } catch (error) {
        console.error("Failed to fetch reviews:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  if (loading) {
    return (
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4 text-center">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3 mx-auto"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 bg-muted rounded-2xl"></div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Fallback if no 5-star reviews exist yet
  if (reviews.length === 0) {
    return null; // Or show something else
  }

  return (
    <section className="py-12 md:py-24 px-4 bg-gradient-to-b from-secondary/30 to-background overflow-hidden">
      <div className="container mx-auto">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">
            Verified 5-Star Experiences
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Real stories from our community about their transformation and care.
          </p>
        </div>

        {/* Dynamic Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="group bg-background border border-border/50 rounded-3xl p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative"
            >
              <div className="flex gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-muted"
                      }`}
                  />
                ))}
              </div>

              <blockquote className="text-lg font-medium leading-relaxed mb-8 min-h-[100px] italic text-foreground/90">
                "{review.comment || "Amazing experience, definitely coming back!"}"
              </blockquote>

              <div className="flex items-center gap-4 mt-auto border-t border-border/50 pt-6">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center border border-border/50">
                  {review.user_avatar ? (
                    <img src={review.user_avatar} alt={review.user_name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-lg font-bold text-accent">
                      {review.user_name?.charAt(0) || "U"}
                    </span>
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-base">{review.user_name}</h4>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-accent"></span>
                    {review.service_name}
                  </p>
                </div>
              </div>

              <div className="absolute top-6 right-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <svg width="40" height="30" viewBox="0 0 40 30" fill="currentColor">
                  <path d="M11.4 0Q8.6 0 6.1 1.2 3.6 2.4 2.1 4.5.6 6.6 0 9.2q0 2 .5 3.7 1 .2 2 .2 3.3 0 5.6-2.2 2.3-2.2 2.3-5.6 0-.8-.1-1.3-.1-.5-.5-1.1L12.5 11l5-2.2Q15.9 4.8 13.9 2.4 11.9 0 11.4 0zm22 0q-2.8 0-5.3 1.2-2.5 1.2-4 3.3-1.5 2.1-2.1 4.7-.6 2-.6 4t.5 3.7q1 .2 2 .2 3.3 0 5.6-2.2 2.3-2.2 2.3-5.6 0-.8-.1-1.3-.1-.5-.5-1.1L34.5 11l5-2.2q-1.6-4-3.6-6.4Q33.9 0 33.4 0z" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
