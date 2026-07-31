/**
 * Single Centralized Data Configuration for Bombay Chowpati
 * All restaurant details, awards, testimonials, media, GMB info, and social links are defined here.
 * Edit this file anytime to customize or update the website content.
 */

export const restaurantData = {
  // Core Brand Identity
  name: "Bombay Chowpati",
  subTitle: "Chat Bhandar",
  tagline: "100% Pure Veg Authentic Mumbai Chaat & Fast Food",
  description: "Experience the vibrant culinary heritage of authentic Mumbai street food in Hyderabad. From crispy Pani Puris and royal Raj Kachori to sizzling Amul Butter Pav Bhaji, every dish is prepared fresh with 100% pure vegetarian passion.",
  establishedYear: "2015",
  isPureVeg: true,
  currency: "₹",
  domain: "bombaychowpati.com",
  siteUrl: "https://bombaychowpati.com",
  footerText: "Bombay Chowpati - Chat Bhandar. 100% Pure Veg. All rights reserved.",
  developerCompany: "Notelia Private Limited",
  developerUrl: "https://company.notelia.com",

  // GMB & Store Contact Information
  gmbAddress: "MPM Mall, Abids Road, Hanuman Tekdi, Abids, Hyderabad, Telangana 500001",
  gmbLandmark: "Opposite GPO, Abids Commercial Hub",
  gmbLink: "https://share.google/UTb6BYgRPk9UBTQPX",
  googleMapsEmbedUrl: "https://maps.google.com/maps?q=Bombay+Chowpati+MPM+Mall+Abids+Road+Hyderabad&t=&z=16&ie=UTF8&iwloc=&output=embed",
  supportPhone: "072078 36300",
  formattedPhone: "+91 72078 36300",
  whatsappNumber: "917207836300",
  email: "info@bombaychowpati.com",
  operatingHours: "11:30 AM to 11:30 PM (Open All 7 Days)",

  // Social Links & Profiles
  instagramUrl: "https://www.instagram.com/bombay.chowpati?utm_source=qr&igsh=YmNoemx1Z3poZmFt",
  instagramHandle: "@bombay.chowpati",
  instagramFollowers: "25K+",
  beholdFeedUrl: "", // Add your behold.so JSON Feed URL here to fetch live posts automatically

  // Payment Details
  upiId: "bombaychowpati@upi",
  payeeName: "Bombay Chowpati Chat Bhandar",

  // Hero Video & Background Media Assets
  hero: {
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-chef-cooking-a-dish-in-a-restaurant-kitchen-41566-large.mp4",
    fallbackImage: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=1600",
    badgeText: "100% Pure Vegetarian Culinary Art",
    titleLine1: "Authentic Mumbai",
    titleLine2: "Chaat & Street Food",
    subtitle: "Crispy Puris, Tangy Chutneys, Sizzling Pav Bhaji & Pure Veg Feasts in Abids, Hyderabad."
  },

  // Restaurant Key Milestones & Stats
  stats: [
    { label: "Happy Foodies Served", value: "500,000+" },
    { label: "Signature Pure Veg Dishes", value: "50+" },
    { label: "Google Review Rating", value: "4.8 ★" },
    { label: "Years of Culinary Excellence", value: "10+ Years" }
  ],

  awards: [
    {
      id: 1,
      title: "Pride of Southern India Awards 2026",
      year: "2026",
      organization: "Best Chat Bhandar of the Year",
      description: "Honoured with the 'Best Chat Bhandar of the Year' award at the Pride of Southern India Awards 2026. The award was presented by legendary Bollywood Actress and former Member of Rajya Sabha, Jaya Prada, at The Park Hyderabad.",
      icon: "Trophy",
      images: [
        "/awards/img4.jpeg",
        "/awards/img1.jpg"
      ]
    },
    {
      id: 2,
      title: "Pride India Awards 2026",
      year: "2026",
      organization: "Indian Iconic Chat Bhandar of the Year",
      description: "Awarded the Certificate of Excellence as the Indian Iconic Chat Bhandar of the Year 2026, celebrating outstanding quality, hygiene, and authenticity in street food.",
      icon: "Award",
      images: [
        "/awards/img2.jpg"
      ]
    },
    {
      id: 3,
      title: "Pride India Awards 2025",
      year: "2025",
      organization: "Indian Iconic Chat Bhandar of the Year",
      description: "Winner of the Indian Iconic Chat Bhandar of the Year 2025 at the Pride India & Business Awards. Certificate of Excellence proudly presented to Bombay Chowpati.",
      icon: "Star",
      images: [
        "/awards/img5.jpeg",
        "/awards/img3.jpg"
      ]
    }
  ],

  // Live Party & Catering Packages
  cateringPackages: [
    {
      id: 1,
      title: "Live Pani Puri & Chaat Counter",
      subtitle: "Interactive Live Setup",
      description: "Hygienic Mineral Water Pani Puri (3 Flavors), Sev Puri, Dahi Puri, and Bhel Puri prepared fresh live for your guests.",
      badge: "Most Popular",
      items: ["Mineral Water Pani Puri", "Special Sev Puri", "Dahi Puri", "Bhel Puri", "Samosa Chaat"]
    },
    {
      id: 2,
      title: "Sizzling Amul Pav Bhaji Tawa",
      subtitle: "Hot Butter Feast",
      description: "Live hot Tawa Pav Bhaji cooked with pure Amul butter, served with soft toasted Pav, fresh lemon, and chopped onions.",
      badge: "Chef Special",
      items: ["Amul Butter Pav Bhaji", "Cheese Pav Bhaji", "Masala Pav", "Garlic Chutney", "Kachumber Salad"]
    },
    {
      id: 3,
      title: "Royal Raj Kachori & Sweets",
      subtitle: "Grand Wedding Station",
      description: "Crispy Royal Raj Kachoris filled with sprouts, sweet curd, pomegranate, topped with Gulab Jamun & Malai Kulfi.",
      badge: "Luxury Catering",
      items: ["Royal Raj Kachori", "Dahi Bhalla Stuffed", "Dry Fruit Sweet Lassi", "Hot Gulab Jamun", "Malai Kulfi Stick"]
    }
  ],

  // Playable Instagram Reels Video Showcase
  instagramReels: [
    {
      id: 1,
      title: "Live Amul Butter Pav Bhaji Tawa Preparation 🧈🍞",
      videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-frying-food-in-a-pan-41565-large.mp4",
      thumbnail: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600",
      views: "18.5K",
      likes: "3.2K",
      reelUrl: "https://www.instagram.com/bombay_chowpati_?igsh=MWFwYjZxanp3andvdQ=="
    },
    {
      id: 2,
      title: "Crispy Mineral Water Pani Puri Burst 💥",
      videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-chef-cooking-a-dish-in-a-restaurant-kitchen-41566-large.mp4",
      thumbnail: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=600",
      views: "24.1K",
      likes: "4.8K",
      reelUrl: "https://www.instagram.com/bombay_chowpati_?igsh=MWFwYjZxanp3andvdQ=="
    },
    {
      id: 3,
      title: "Royal Raj Kachori Assembly Live Counter 👑",
      videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-[#14151B]-preparing-a-salad-41568-large.mp4",
      thumbnail: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600",
      views: "15.9K",
      likes: "2.7K",
      reelUrl: "https://www.instagram.com/bombay_chowpati_?igsh=MWFwYjZxanp3andvdQ=="
    }
  ],

  // Instagram Feed Showcase Posts
  instagramPosts: [
    {
      id: 1,
      image: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=600",
      caption: "Crispy Pani Puri loaded with cold spiced mint water! Tag your pani puri lover friend 😍 #PaniPuri #BombayChowpati",
      likes: "2.4K",
      comments: "142"
    },
    {
      id: 2,
      image: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600",
      caption: "Sizzling Special Amul Butter Pav Bhaji served hot! Extra pav is mandatory 🧈🍞 #PavBhaji #StreetFood",
      likes: "3.8K",
      comments: "210"
    },
    {
      id: 3,
      image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600",
      caption: "Royal Raj Kachori stuffed with sweet curd, pomegranate, and crunchy sev! 👑 #RajKachori #PureVeg",
      likes: "1.9K",
      comments: "98"
    },
    {
      id: 4,
      image: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=600",
      caption: "Chilled Sweet Mango Lassi topped with saffron and sliced almonds! Perfect refresher 🥭 #Lassi #Dessert",
      likes: "2.1K",
      comments: "85"
    }
  ],

  // Customer Reviews & Testimonials
  testimonials: [
    {
      id: 1,
      name: "Aarav Sharma",
      role: "Food Blogger & Local Guide",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
      rating: 5,
      comment: "Undoubtedly the BEST Pani Puri and Amul Butter Pav Bhaji in Hyderabad! The taste takes you straight to Chowpati beach in Mumbai. Clean, fast service, and 100% pure veg."
    },
    {
      id: 2,
      name: "Ananya Reddy",
      role: "Event Planner",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
      rating: 5,
      comment: "We booked Bombay Chowpati's live chaat counter for our wedding reception. Guests could not stop raving about the Raj Kachori and Sev Puri. Outstanding quality and management!"
    },
    {
      id: 3,
      name: "Vikram Singh",
      role: "Regular Guest",
      avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150",
      rating: 5,
      comment: "Authentic Mumbai flavors right in Abids! Their Dahi Bhalla and Chole Bhature are unmatchable. The staff is polite and hygiene standards are top-notch."
    },
    {
      id: 4,
      name: "Sneha Kulkarni",
      role: "Software Engineer",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150",
      rating: 5,
      comment: "Love their online order scheduling feature! I order my evening snacks before leaving office and pick up hot fresh Pav Bhaji on my way home."
    },
    {
      id: 5,
      name: "Rajesh Varma",
      role: "Corporate Lead",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
      rating: 5,
      comment: "The live Pav Bhaji tawa setup at our office annual party was a massive hit. Professional team, pristine hygiene, and incredible taste!"
    },
    {
      id: 6,
      name: "Pooja Agarwal",
      role: "Food Enthusiast",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
      rating: 5,
      comment: "Best pure veg chaat in Abids hands down. The Pani Puri mint water is so refreshing and authentic. Highly recommended for families!"
    }
  ],

  // Footer Navigation Sections
  footerSections: {
    quickLinks: [
      { name: "Digital Menu Catalog", path: "/menu" },
      { name: "Party & Catering Inquiry", path: "/#catering" },
      { name: "Customer Sign In", path: "/account" },
      { name: "Staff & Admin Portal", path: "/admin/login" }
    ],
    topSpecialties: [
      { name: "Bombay Pani Puri (8 Pcs)", path: "/menu" },
      { name: "Special Amul Butter Pav Bhaji", path: "/menu" },
      { name: "Royal Raj Kachori", path: "/menu" },
      { name: "Chole Bhature & Lassi", path: "/menu" },
      { name: "Pure Veg Dum Biryani", path: "/menu" }
    ]
  }
};
