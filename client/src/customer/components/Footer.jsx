import React from 'react';
import { Link } from 'react-router-dom';
import { 
  MapPin, Phone, Clock, Instagram, Send, ExternalLink, 
  ShieldCheck, Utensils, Award, Heart, CheckCircle2 
} from 'lucide-react';
import { restaurantData } from '../../config/restaurantData';
import logoBanner from '../../assets/bombay-logo-3.png';
import WhatsAppIcon from './WhatsAppIcon';

export default function Footer({ onOpenCatering }) {
  const handleWhatsAppChat = () => {
    const text = encodeURIComponent(`Hello Bombay Chowpati! I would like to place an order / ask a query.`);
    window.open(`https://wa.me/${restaurantData.whatsappNumber}?text=${text}`, '_blank');
  };

  return (
    <footer className="bg-[#1D0604] text-white border-t border-[#F8A324]/20 relative overflow-hidden font-sans">
      {/* Top Gold Border Highlight */}
      <div className="h-1 w-full bg-gradient-to-r from-[#691F1A] via-[#F8A324] to-[#691F1A]" />

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-16 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          
          {/* Column 1: Brand & Bio (2 Spans) */}
          <div className="lg:col-span-2 space-y-5">
            <Link to="/" className="inline-block">
              <img 
                src={logoBanner} 
                alt="Bombay Chowpati Chat Bhandar" 
                className="h-12 w-auto object-contain drop-shadow-lg"
              />
            </Link>
            
            <p className="text-amber-100/80 text-xs leading-relaxed max-w-sm font-light">
              {restaurantData.description}
            </p>

            {/* 100% Pure Veg Badge */}
            <div className="inline-flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/30 px-3.5 py-1.5 rounded-full text-xs font-bold text-emerald-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>100% Pure Vegetarian Guarantee</span>
            </div>

            {/* Social Links */}
            <div className="pt-2 flex items-center gap-3">
              <a
                href={restaurantData.instagramUrl}
                target="_blank"
                rel="noreferrer"
                className="w-10 h-10 rounded-xl bg-[#691F1A] hover:bg-[#F8A324] hover:text-[#3C110D] text-white border border-[#F8A324]/30 flex items-center justify-center transition-all shadow-md"
                title="Follow us on Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>

              <button
                onClick={handleWhatsAppChat}
                className="w-10 h-10 rounded-xl bg-[#691F1A] hover:bg-[#F8A324] hover:text-[#3C110D] text-white border border-[#F8A324]/30 flex items-center justify-center transition-all shadow-md cursor-pointer"
                title="Chat on WhatsApp"
              >
                <WhatsAppIcon className="w-5 h-5" color="currentColor" />
              </button>

              <a
                href={restaurantData.gmbLink}
                target="_blank"
                rel="noreferrer"
                className="w-10 h-10 rounded-xl bg-[#691F1A] hover:bg-[#F8A324] hover:text-[#3C110D] text-white border border-[#F8A324]/30 flex items-center justify-center transition-all shadow-md"
                title="View on Google Maps"
              >
                <MapPin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-4">
            <h4 className="font-serif font-black text-sm text-[#F8A324] uppercase tracking-widest border-b border-[#F8A324]/20 pb-2">
              Quick Navigation
            </h4>
            <ul className="space-y-2.5 text-xs text-amber-100/80">
              {restaurantData.footerSections.quickLinks.map((link, idx) => (
                <li key={idx}>
                  {link.path.startsWith('/#') ? (
                    <button 
                      onClick={onOpenCatering} 
                      className="hover:text-[#F8A324] transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <span className="text-[#F8A324]">›</span> {link.name}
                    </button>
                  ) : (
                    <Link to={link.path} className="hover:text-[#F8A324] transition-colors flex items-center gap-1.5">
                      <span className="text-[#F8A324]">›</span> {link.name}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Popular Specialties */}
          <div className="space-y-4">
            <h4 className="font-serif font-black text-sm text-[#F8A324] uppercase tracking-widest border-b border-[#F8A324]/20 pb-2">
              Signature Dishes
            </h4>
            <ul className="space-y-2.5 text-xs text-amber-100/80">
              {restaurantData.footerSections.topSpecialties.map((item, idx) => (
                <li key={idx}>
                  <Link to={item.path} className="hover:text-[#F8A324] transition-colors flex items-center gap-1.5">
                    <span className="text-[#F8A324]">›</span> {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Contact & Operating Hours */}
          <div className="space-y-4">
            <h4 className="font-serif font-black text-sm text-[#F8A324] uppercase tracking-widest border-b border-[#F8A324]/20 pb-2">
              Store Location
            </h4>
            <div className="space-y-3 text-xs text-amber-100/80">
              <p className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#F8A324] shrink-0 mt-0.5" />
                <a 
                  href={restaurantData.gmbLink} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="hover:text-[#F8A324] hover:underline transition-colors"
                >
                  {restaurantData.gmbAddress}
                </a>
              </p>
              
              <p className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{restaurantData.operatingHours}</span>
              </p>

              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#F8A324] shrink-0" />
                <a href={`tel:${restaurantData.supportPhone}`} className="hover:text-[#F8A324]">
                  {restaurantData.formattedPhone}
                </a>
              </p>

              <div className="pt-2">
                <a
                  href={restaurantData.gmbLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 bg-[#691F1A] hover:bg-[#F8A324] hover:text-[#3C110D] border border-[#F8A324]/40 px-3 py-2 rounded-xl text-[11px] font-bold text-white transition-all shadow-md"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Google Maps Location</span>
                </a>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Bar */}
      <div className="bg-[#120302] border-t border-white/5 py-6 px-4 text-center text-xs text-amber-100/70">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="text-[11px] text-amber-100/80">
            &copy; {new Date().getFullYear()} {restaurantData.footerText}
          </div>

          <div className="text-[11px] text-amber-100/60">
            Maintained &amp; Developed by{' '}
            <a 
              href={restaurantData.developerUrl}
              target="_blank"
              rel="noreferrer"
              className="text-[#F8A324] hover:text-[#ffb74d] hover:underline font-bold transition-colors"
            >
              {restaurantData.developerCompany}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
