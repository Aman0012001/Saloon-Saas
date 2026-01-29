import { Link } from "react-router-dom";
import {
  MapPin,
  Phone,
  Mail,
  Facebook,
  Instagram,
  Twitter,
  ArrowRight,
  Sparkles
} from "lucide-react";
import logo from "@/assets/logo.png";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 pt-20 pb-10 border-t border-border/40">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent opacity-50" />
      <div className="absolute -top-10 right-10 w-64 h-64 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-20 left-10 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand Column */}
          <div className="space-y-6">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="relative">
                <div className="absolute inset-0 bg-accent/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <img
                  src={logo}
                  alt="Noamskin Logo"
                  className="h-12 w-auto relative z-10"
                />
              </div>
            </Link>
            <p className="text-muted-foreground leading-relaxed max-w-sm">
              Experience the pinnacle of beauty and wellness. Where advanced skincare meets luxury relaxation.
            </p>
            <div className="flex items-center gap-4">
              <SocialLink href="#" icon={Facebook} label="Facebook" />
              <SocialLink href="#" icon={Instagram} label="Instagram" />
              <SocialLink href="#" icon={Twitter} label="Twitter" />
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            <h3 className="text-foreground font-semibold text-lg flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent" />
              Contact Us
            </h3>
            <ul className="space-y-4">
              <ContactItem
                icon={MapPin}
                text="46 Jalan Limau Nipis, 59000 Bangsar, Kuala Lumpur"
                href="https://maps.google.com/?q=46+Jalan+Limau+Nipis+59000+Bangsar+Kuala+Lumpur"
              />
              <ContactItem
                icon={Phone}
                text="011 23198819"
                href="tel:01123198819"
              />
              <ContactItem
                icon={Mail}
                text="skinnoam@gmail.com"
                href="mailto:skinnoam@gmail.com"
              />
            </ul>
          </div>

          {/* Quick Links */}
          <div className="space-y-6">
            <h3 className="text-foreground font-semibold text-lg">Quick Links</h3>
            <ul className="space-y-3">
              <FooterLink to="/" label="Home" />
              <FooterLink to="/about" label="About Us" />
              <FooterLink to="/salons" label="Our Services" />
              <FooterLink to="/book" label="Book Appointment" />
              {/* <FooterLink to="/admin-access" label="Admin Login" /> */}
            </ul>
          </div>

          {/* Newsletter / Hours */}
          {/* <div className="space-y-6">
            <h3 className="text-foreground font-semibold text-lg">Opening Hours</h3>
            <div className="p-5 rounded-2xl bg-white dark:bg-gray-800/50 border border-border/50 shadow-sm backdrop-blur-sm">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Mon - Fri</span>
                  <span className="font-medium text-foreground">10:00 AM - 8:00 PM</span>
                </div>
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Saturday</span>
                  <span className="font-medium text-foreground">10:00 AM - 6:00 PM</span>
                </div>
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Sunday</span>
                  <span className="font-medium text-foreground">Closed</span>
                </div>
              </div>
              <Link
                to="/book"
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
              >
                Book Now
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div> */}
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 mt-8 border-t border-border/40 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>© {currentYear} Noamskin Salon. All rights reserved.</p>
          <div className="flex gap-6">
            <Link to="/privacy" className="hover:text-accent transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-accent transition-colors">Terms of Service</Link>
            <Link to="/cookies" className="hover:text-accent transition-colors">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

// Helper Components
const SocialLink = ({ href, icon: Icon, label }: { href: string; icon: any; label: string }) => (
  <a
    href={href}
    className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-white transition-all duration-300 hover:scale-110"
    aria-label={label}
  >
    <Icon className="w-5 h-5" />
  </a>
);

const ContactItem = ({ icon: Icon, text, href }: { icon: any; text: string; href: string }) => (
  <li className="flex items-start gap-3 group">
    <div className="mt-1 w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0 group-hover:bg-accent/20 transition-colors">
      <Icon className="w-4 h-4 text-accent" />
    </div>
    <a href={href} className="text-muted-foreground hover:text-accent transition-colors text-sm leading-relaxed">
      {text}
    </a>
  </li>
);

const FooterLink = ({ to, label }: { to: string; label: string }) => (
  <li>
    <Link
      to={to}
      className="text-muted-foreground hover:text-accent transition-colors text-sm flex items-center gap-2 group"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-accent/40 group-hover:bg-accent transition-colors" />
      {label}
    </Link>
  </li>
);

export default Footer;
