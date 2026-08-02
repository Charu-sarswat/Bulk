import React, { useState } from 'react';
import { useSEO } from '../../hooks/useSEO';
import { Link } from 'react-router-dom';
import { 
  MapPin, Phone, Clock, Instagram, ChevronRight, 
  Calendar, HeartHandshake, ShieldCheck, CheckCircle2,
  Utensils, Trophy, Award, Star, Heart, MessageCircle,
  ExternalLink, Sparkles, Send, ChefHat
} from 'lucide-react';
import { restaurantData } from '../../config/restaurantData';
import CateringModal from '../components/CateringModal';
import Footer from '../components/Footer';
import WhatsAppIcon from '../components/WhatsAppIcon';

export default function Landing() {
  useSEO({
    title: 'Bombay Chowpati - Chat Bhandar | 100% Pure Veg Mumbai Street Food',
    description: "Hyderabad's favourite authentic Mumbai chat — Crispy Pani Puri, Amul Butter Pav Bhaji, Royal Raj Kachori, Bhel Puri & more. Order online or book live catering at MPM Mall, Abids.",
    canonical: 'https://bombaychowpati.com/',
  });
  const [isCateringOpen, setIsCateringOpen] = useState(false);

  React.useEffect(() => {
    if (window.__bhldScript) return;
    window.__bhldScript = true;
    const d = document;
    const s = d.createElement("script");
    s.type = "module";
    s.src = "https://w.behold.so/widget.js";
    setTimeout(() => {
      d.head.append(s);
    }, 0);
  }, []);



  const handleWhatsAppChat = (customMsg) => {
    const defaultText = `Hello Bombay Chowpati! I would like to place an order / ask a query.`;
    const text = encodeURIComponent(customMsg || defaultText);
    window.open(`https://wa.me/${restaurantData.whatsappNumber}?text=${text}`, '_blank');
  };



  return (
    <div className="bg-[#FFFDF9] text-gray-900 relative overflow-hidden font-sans scroll-smooth">

      {/* SECTION 1: HERO SECTION WITH BACKGROUND VIDEO */}
      <section id="hero" className="relative min-h-screen flex flex-col justify-center items-center text-center px-4 sm:px-6 overflow-hidden">
        
        {/* Background Video */}
        <video 
          autoPlay 
          loop 
          muted 
          playsInline
          poster={restaurantData.hero.fallbackImage}
          className="absolute inset-0 w-full h-full object-cover scale-105 pointer-events-none brightness-110"
        >
          <source src={restaurantData.hero.videoUrl} type="video/mp4" />
        </video>

        {/* Video Gradient Dark Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/15 to-black/35 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#691F1A]/12 via-transparent to-[#691F1A]/12 pointer-events-none" />

        {/* Hero Content */}
        <div className="relative z-10 max-w-4xl mx-auto space-y-8 animate-fade-in text-white">
          
          {/* Main Headline */}
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-serif font-black tracking-tight leading-none text-amber-50 drop-shadow-2xl">
              {restaurantData.hero.titleLine1} <br />
              <span className="bg-gradient-to-r from-[#F59E0B] via-[#D97706] to-[#F59E0B] bg-clip-text text-transparent drop-shadow-lg">
                {restaurantData.hero.titleLine2}
              </span>
            </h1>
            <p className="text-amber-200/90 text-sm sm:text-lg leading-relaxed max-w-2xl mx-auto font-semibold pt-2">
              {restaurantData.hero.subtitle}
            </p>
          </div>

          {/* Primary Action Buttons */}
          <div className="pt-4 flex justify-center">
            <Link
              to="/menu"
              className="w-full sm:w-auto bg-gradient-to-r from-[#F8A324] via-[#FFB74D] to-[#F8A324] hover:brightness-110 text-[#3C110D] font-black py-4 px-9 rounded-2xl shadow-2xl shadow-[#F8A324]/30 hover:shadow-[#F8A324]/50 transition-all duration-300 flex items-center justify-center gap-2.5 text-sm uppercase tracking-wider cursor-pointer"
            >
              <ChefHat className="w-5 h-5" />
              <span>Explore Digital Menu</span>
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>

        </div>
      </section>

      {/* SECTION 2: AWARDS & RECOGNITIONS */}
      <section id="awards" className="py-20 px-4 sm:px-6 bg-[#FFFDF9] border-t border-gray-100">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-1.5 bg-[#F8A324]/10 border border-[#F8A324]/30 px-3.5 py-1 rounded-full text-xs font-extrabold text-[#F8A324] uppercase tracking-wider">
              <Trophy className="w-4 h-4" />
              Honors & Excellence
            </div>
            <h2 className="text-3xl sm:text-5xl font-serif font-black text-gray-900">
              Awards & Recognitions
            </h2>
            <p className="text-gray-600 text-xs sm:text-sm max-w-xl mx-auto font-light">
              Celebrated by culinary critics, food bloggers, and thousands of satisfied foodies across Hyderabad.
            </p>
          </div>

          {/* Premium Layout: Left side shows active selected award, Right side shows vertical scrollable checklist of awards */}
          <AwardsShowcase />

        </div>
      </section>

      {/* SECTION 3: DIRECT INSTAGRAM REELS VIDEO SHOWCASE */}
      <section id="reels" className="py-20 px-4 sm:px-6 bg-[#FFF9EE] border-t border-gray-100">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 bg-pink-500/10 border border-pink-500/30 px-3.5 py-1 rounded-full text-xs font-extrabold text-pink-600 uppercase tracking-wider">
                <Instagram className="w-4 h-4" />
                Live Food Reels & Shorts
              </div>
              <h2 className="text-3xl sm:text-5xl font-serif font-black text-gray-900">
                Watch Our Instagram Videos
              </h2>
              <p className="text-gray-600 text-xs sm:text-sm max-w-xl font-light">
                Click play on any reel to watch authentic street food preparation videos right here on our site!
              </p>
            </div>

            <a
              href={restaurantData.instagramUrl}
              target="_blank"
              rel="noreferrer"
              className="bg-[#691F1A] hover:bg-[#551915] text-[#F8A324] border border-[#F8A324]/30 font-black py-3.5 px-6 rounded-2xl text-xs uppercase tracking-wider shadow-md transition-all flex items-center gap-2 shrink-0 cursor-pointer"
            >
              <span>Follow {restaurantData.instagramHandle}</span>
              <ExternalLink className="w-4 h-4 text-white" />
            </a>
          </div>

          <div className="p-0 sm:p-6 bg-transparent sm:bg-white border-0 sm:border border-transparent sm:border-[#F8A324]/30 rounded-none sm:rounded-3xl">
            <behold-widget feed-id="mxdvTa0NfYXzl03y9WQi"></behold-widget>
          </div>

        </div>
      </section>

      {/* SECTION 4: DEDICATED PARTY & CATERING SECTION */}
      <section id="catering" className="py-20 px-4 sm:px-6 bg-[#FFFDF9] relative border-t border-gray-100">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 bg-[#F8A324]/10 border border-[#F8A324]/30 px-4 py-1.5 rounded-full text-xs font-extrabold text-[#F8A324] uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              Live Street Food Counters & Events
            </div>
            <h2 className="text-3xl sm:text-5xl font-serif font-black text-gray-900">
              Party & Live Chat Catering
            </h2>
            <p className="text-gray-600 text-xs sm:text-sm max-w-2xl mx-auto font-light">
              Make your weddings, corporate bashes, birthdays, and anniversaries unforgettable with live Pani Puri, Pav Bhaji tawa, and sweet counters served fresh by expert chefs.
            </p>
          </div>

          {/* Catering Packages Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {restaurantData.cateringPackages.map((pkg) => (
              <div 
                key={pkg.id} 
                className="bg-white border border-[#F8A324]/30 rounded-3xl p-6 sm:p-8 flex flex-col justify-between hover:border-[#F8A324] hover:border-2 hover:shadow-xl transition-all duration-300 group"
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <span className="bg-[#691F1A] text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                      {pkg.badge}
                    </span>
                    <Utensils className="w-6 h-6 text-[#691F1A]" />
                  </div>

                  <div>
                    <h3 className="font-serif font-black text-xl text-gray-900 group-hover:text-[#691F1A] transition-colors">
                      {pkg.title}
                    </h3>
                    <p className="text-xs text-[#F8A324] font-semibold">{pkg.subtitle}</p>
                  </div>

                  <p className="text-gray-600 text-xs leading-relaxed font-light">
                    {pkg.description}
                  </p>

                  {/* Included Items List */}
                  <div className="pt-2 space-y-2 border-t border-gray-100">
                    <span className="text-[11px] font-extrabold text-gray-700 uppercase tracking-wider block">Key Menu Offerings:</span>
                    <ul className="space-y-1.5 text-xs text-gray-600 font-light">
                      {pkg.items.map((item, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-6 space-y-2">
                  <button
                    onClick={() => setIsCateringOpen(true)}
                    className="w-full bg-[#691F1A] hover:bg-[#551915] text-white font-black py-3.5 px-4 rounded-2xl text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Calendar className="w-4 h-4 text-[#F8A324]" />
                    <span>Inquire Package</span>
                  </button>

                  <button
                    onClick={() => handleWhatsAppChat(`Hi Bombay Chowpati! I want to inquire about your "${pkg.title}" package for my upcoming party.`)}
                    className="w-full bg-[#25D366]/10 hover:bg-[#25D366] text-[#25D366] hover:text-white border border-[#25D366]/40 font-bold py-3 px-4 rounded-2xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <WhatsAppIcon className="w-4.5 h-4.5" color="currentColor" />
                    <span>Instant WhatsApp Quote</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* SECTION 5: INFINITE SIDE-SCROLLING TESTIMONIALS */}
      <section className="py-20 bg-[#FFF9EE] border-t border-gray-100 overflow-hidden">
        <div className="space-y-12">
          
          <div className="text-center space-y-3 px-4">
            <div className="inline-flex items-center gap-1.5 bg-[#F8A324]/10 border border-[#F8A324]/30 px-3.5 py-1 rounded-full text-xs font-extrabold text-[#F8A324] uppercase tracking-wider">
              <Star className="w-4 h-4 fill-current" />
              Guest Experiences & Reviews
            </div>
            <h2 className="text-3xl sm:text-5xl font-serif font-black text-gray-900">
              What Foodies Say About Us
            </h2>
            <p className="text-gray-600 text-xs sm:text-sm max-w-xl mx-auto font-light">
              Continuous live feedback from verified guests (Hover over reviews to pause scrolling).
            </p>
          </div>

          {/* Infinite Marquee Side-Scrolling Track */}
          <div className="relative w-full overflow-hidden py-4">
            {/* Fade edges */}
            <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#FFF9EE] to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#FFF9EE] to-transparent z-10 pointer-events-none" />

            <div className="animate-marquee flex gap-6">
              {/* Duplicated list to create infinite seamless loop */}
              {[...restaurantData.testimonials, ...restaurantData.testimonials].map((review, idx) => (
                <div
                  key={`${review.id}-${idx}`}
                  className="w-80 sm:w-96 bg-white border border-[#F8A324] rounded-3xl p-6 shrink-0 space-y-4 hover:border-2 transition-all"
                >
                  <div className="flex text-[#F8A324] gap-1">
                    {[...Array(review.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>

                  <p className="text-gray-700 text-xs leading-relaxed font-light italic">
                    "{review.comment}"
                  </p>

                  <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                    <div>
                      <h4 className="font-serif font-bold text-xs text-gray-900">{review.name}</h4>
                      <span className="text-[10px] text-[#691F1A] font-semibold block">{review.role}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* SECTION 6: CLEAN CONTACT & STORE LOCATION SECTION */}
      <section id="contact" className="py-20 px-4 sm:px-6 bg-[#FFFDF9] border-t border-gray-100 relative">
        <div className="max-w-7xl mx-auto space-y-10">
          
          {/* Clean Section Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 bg-[#F8A324]/10 border border-[#F8A324]/30 px-4 py-1.5 rounded-full text-xs font-extrabold text-[#F8A324] uppercase tracking-wider">
              <MapPin className="w-4 h-4" />
              Store Location & Contact
            </div>
            <h2 className="text-3xl sm:text-5xl font-serif font-black text-gray-900">
              Visit Bombay Chowpati
            </h2>
            <p className="text-gray-600 text-xs sm:text-sm max-w-lg mx-auto font-light">
              Visit our store in Abids, Hyderabad or reach out to us directly via phone, WhatsApp, or Google Maps.
            </p>
          </div>

          {/* Clean 2-Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            
            {/* Left Column: Clean Contact Details Card (5 Cols) */}
            <div className="lg:col-span-5 bg-white border border-[#F8A324]/30 rounded-3xl p-6 sm:p-8 space-y-6 flex flex-col justify-between">
              
              <div className="space-y-6">
                <h3 className="font-serif font-black text-xl text-[#691F1A] border-b border-gray-100 pb-3">
                  Store Contact Details
                </h3>

                <div className="space-y-5 text-xs text-gray-600">
                  {/* Address */}
                  <div className="flex items-start gap-3.5">
                    <div className="w-8 h-8 rounded-lg bg-[#691F1A]/10 border border-[#691F1A]/20 flex items-center justify-center text-[#691F1A] shrink-0 mt-0.5 shadow-sm">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] font-extrabold text-[#691F1A] uppercase tracking-widest block">Address</span>
                      <a 
                        href={restaurantData.gmbLink} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-gray-900 hover:text-[#691F1A] hover:underline font-semibold text-xs leading-relaxed mt-0.5 block"
                      >
                        {restaurantData.gmbAddress}
                      </a>
                      <span className="text-[11px] text-gray-500 block mt-0.5">Landmark: {restaurantData.gmbLandmark}</span>
                    </div>
                  </div>

                  {/* Operating Hours */}
                  <div className="flex items-start gap-3.5">
                    <div className="w-8 h-8 rounded-lg bg-[#691F1A]/10 border border-[#691F1A]/20 flex items-center justify-center text-[#691F1A] shrink-0 mt-0.5 shadow-sm">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] font-extrabold text-[#691F1A] uppercase tracking-widest block">Operating Timings</span>
                      <p className="text-gray-900 font-bold text-xs mt-0.5">{restaurantData.operatingHours}</p>
                    </div>
                  </div>

                  {/* Phone Call */}
                  <div className="flex items-start gap-3.5">
                    <div className="w-8 h-8 rounded-lg bg-[#691F1A]/10 border border-[#691F1A]/20 flex items-center justify-center text-[#691F1A] shrink-0 mt-0.5 shadow-sm">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] font-extrabold text-[#691F1A] uppercase tracking-widest block">Phone Number</span>
                      <a href={`tel:${restaurantData.supportPhone}`} className="text-gray-900 hover:text-[#691F1A] font-bold text-sm mt-0.5 block transition-colors">
                        {restaurantData.formattedPhone}
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Links */}
              <div className="pt-4 space-y-3">
                <a
                  href={restaurantData.gmbLink}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full bg-[#F8A324] hover:bg-[#e08a0a] text-[#3C110D] font-black py-3.5 px-6 rounded-2xl transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md cursor-pointer"
                >
                  <MapPin className="w-4 h-4" />
                  <span>Google Maps Profile</span>
                  <ExternalLink className="w-4 h-4" />
                </a>

                <button
                  onClick={() => handleWhatsAppChat()}
                  className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-black py-3.5 px-6 rounded-2xl transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-lg cursor-pointer"
                >
                  <WhatsAppIcon className="w-4.5 h-4.5" color="currentColor" />
                  <span>Chat on WhatsApp</span>
                </button>
              </div>

            </div>

            {/* Right Column: Clean Map Iframe (7 Cols) */}
            <div className="lg:col-span-7 bg-white border border-[#F8A324]/30 rounded-3xl overflow-hidden min-h-[420px] relative">
              <iframe
                title="Bombay Chowpati Store Google Map Location"
                src={restaurantData.googleMapsEmbedUrl}
                width="100%"
                height="100%"
                style={{ border: 0, minHeight: '420px' }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full h-full"
              />
            </div>

          </div>

        </div>
      </section>

      {/* RICH MULTI-COLUMN FOOTER */}
      <Footer onOpenCatering={() => setIsCateringOpen(true)} />

      {/* Catering Modal */}
      <CateringModal 
        isOpen={isCateringOpen} 
        onClose={() => setIsCateringOpen(false)} 
      />
    </div>
  );
}

function AwardsShowcase() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const [lightboxImage, setLightboxImage] = useState(null);
  const activeAward = restaurantData.awards[activeIdx] || {};
  const awardImages = activeAward.images || [];

  // Reset active image index whenever the main award index changes
  React.useEffect(() => {
    setActiveImgIdx(0);
  }, [activeIdx]);

  const activeSrc = awardImages[activeImgIdx] || 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=600';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch md:bg-white md:border md:border-[#F8A324]/30 md:rounded-3xl p-0 md:p-6 sm:md:p-8">
      {/* Left Column: Active Highlight (7 Cols) */}
      <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
        <div className="space-y-4">
          <div 
            onClick={() => setLightboxImage(activeSrc)}
            className="relative aspect-video w-full rounded-2xl overflow-hidden bg-[#691F1A]/5 border border-[#F8A324]/10 shadow-inner group cursor-zoom-in"
            title="Click to view full image"
          >
            <img 
              src={activeSrc} 
              alt={activeAward.title} 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-103"
            />
            <div className="absolute top-4 left-4 bg-[#691F1A] text-white text-xs font-black px-3.5 py-1.5 rounded-full uppercase tracking-wider shadow-md border border-[#F8A324]/30 z-10">
              🏆 Award Year {activeAward.year}
            </div>

            {/* Lightbox Icon Indicator on Hover */}
            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300 pointer-events-none" />

            {/* If the active award has multiple images, show thumbnails on top of image to toggle */}
            {awardImages.length > 1 && (
              <div 
                className="absolute bottom-4 left-4 right-4 flex justify-center gap-2 z-10"
                onClick={(e) => e.stopPropagation()} // Prevent opening lightbox when clicking thumbnails
              >
                {awardImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImgIdx(idx)}
                    className={`w-12 h-10 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                      idx === activeImgIdx ? 'border-[#F8A324] scale-105 shadow-md' : 'border-white/50 opacity-80'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#691F1A]/10 border border-[#691F1A]/20 flex items-center justify-center text-[#691F1A] shrink-0">
                {activeAward.icon === 'Trophy' && <Trophy className="w-6 h-6" />}
                {activeAward.icon === 'Award' && <Award className="w-6 h-6" />}
                {activeAward.icon === 'Star' && <Star className="w-6 h-6" />}
              </div>
              <div>
                <h3 className="font-serif font-black text-2xl text-gray-900 leading-tight">
                  {activeAward.title}
                </h3>
                <p className="text-xs text-[#F8A324] font-extrabold uppercase tracking-widest mt-0.5">{activeAward.organization}</p>
              </div>
            </div>

            <p className="text-gray-700 text-sm leading-relaxed font-light whitespace-pre-line border-t border-gray-100 pt-4">
              {activeAward.description}
            </p>
          </div>
        </div>
      </div>

      {/* Right Column: Interactive List Selector (5 Cols) */}
      <div className="lg:col-span-5 flex flex-col justify-start space-y-3.5 max-h-[500px] overflow-y-auto pr-1">
        <span className="text-[10px] font-extrabold text-[#691F1A] uppercase tracking-widest block pb-1 border-b border-gray-100">
          Select Award ({restaurantData.awards.length} Recognitions)
        </span>
        
        {restaurantData.awards.map((award, index) => {
          const isActive = index === activeIdx;
          const firstImg = award.images && award.images[0];
          return (
            <button
              key={award.id}
              onClick={() => setActiveIdx(index)}
              className={`w-full text-left flex items-center gap-4 p-3 rounded-2xl border transition-all duration-200 cursor-pointer ${
                isActive 
                  ? 'bg-[#691F1A]/5 border-[#691F1A] shadow-sm' 
                  : 'bg-white border-[#F8A324]/20 hover:border-[#F8A324]/50'
              }`}
            >
              {/* Award preview thumbnail */}
              <div className="w-16 h-12 rounded-lg overflow-hidden bg-gray-50 shrink-0 border border-gray-100 relative">
                <img 
                  src={firstImg} 
                  alt={award.title} 
                  className="w-full h-full object-cover"
                />
                {award.images && award.images.length > 1 && (
                  <div className="absolute bottom-0.5 right-0.5 bg-[#691F1A] text-white text-[8px] font-bold px-1 rounded">
                    +{award.images.length - 1}
                  </div>
                )}
              </div>

              {/* Award brief details */}
              <div className="space-y-0.5 min-w-0 flex-1">
                <div className="flex justify-between items-center gap-2">
                  <span className="text-[11px] font-bold text-gray-900 truncate">{award.title}</span>
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full shrink-0 ${
                    isActive ? 'bg-[#691F1A] text-white' : 'bg-gray-100 text-gray-500'
                  }`}>{award.year}</span>
                </div>
                <p className="text-[10px] text-gray-500 truncate font-light leading-tight">
                  {award.organization}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Full Screen Lightbox Modal */}
      {lightboxImage && (
        <div 
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-center items-center p-4 cursor-zoom-out animate-fade-in"
        >
          {/* Close Button */}
          <button 
            onClick={() => setLightboxImage(null)}
            className="absolute top-6 right-6 w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors cursor-pointer text-xl font-bold shadow-lg z-10"
          >
            ✕
          </button>
          
          <div className="relative max-w-4xl max-h-[85vh] flex flex-col items-center justify-center">
            <img 
              src={lightboxImage} 
              alt="Award Full View" 
              className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-2xl border border-white/10 transition-transform duration-300 scale-100"
              onClick={(e) => e.stopPropagation()} // Prevent closing when clicking the image itself
            />
            
            {/* Description Overlay Banner */}
            <div 
              className="w-full mt-4 bg-[#1A0A09]/90 border border-[#F8A324]/30 p-4 rounded-xl text-center text-white space-y-1 cursor-default shrink-0 shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <h4 className="font-serif font-black text-base text-[#F8A324] leading-tight">
                {activeAward.title}
              </h4>
              <p className="text-[10px] sm:text-xs text-amber-100/90 font-light leading-relaxed max-w-2xl mx-auto">
                {activeAward.description}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
