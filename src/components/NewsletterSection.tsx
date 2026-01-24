import { Button } from "@/components/ui/button";

const NewsletterSection = () => {
  return (
    <section className="py-12 md:py-20 px-4">
      <div className="container mx-auto">
        <div className="bg-primary text-primary-foreground rounded-2xl md:rounded-3xl p-6 md:p-12 text-center max-w-4xl mx-auto">
          <h2 className="text-xl sm:text-2xl md:text-4xl font-bold mb-3 md:mb-4">
            Stay Updated with the Latest Salon Trends
          </h2>
          <p className="text-sm md:text-base text-primary-foreground/80 mb-6 md:mb-8 max-w-2xl mx-auto">
            Subscribe to our newsletter and stay ahead in the beauty industry! Get exclusive salon tips and promotions.
          </p>
          <Button 
            variant="secondary" 
            size="lg" 
            className="rounded-full px-6 md:px-8 font-semibold h-11 md:h-12"
          >
            Subscribe Now
          </Button>
        </div>
      </div>
    </section>
  );
};

export default NewsletterSection;
