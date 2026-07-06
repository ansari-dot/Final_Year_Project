import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';

interface HeroBanner {
  id: number;
  imageUrl: string;
  title?: string | null;
  subtitle?: string | null;
  displayOrder: number;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

// Fallback images in case API fails
const fallbackImages = [
  "/assets/h1.png",
  "/assets/h2.png",
  "/assets/h3.png",
  "/assets/h4.png"
];

export default function HeroSection() {
  const [heroImages, setHeroImages] = useState<string[]>(fallbackImages);
  const [banners, setBanners] = useState<HeroBanner[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 1000], ["0%", "20%"]);

  useEffect(() => {
    // Fetch hero banners from API
    const fetchBanners = async () => {
      try {
        const response = await fetch(`${API_URL}/hero-banners/active`);
        const data = await response.json();
        
        if (data.success && data.data && data.data.length > 0) {
          setBanners(data.data);
          setHeroImages(data.data.map((b: HeroBanner) => b.imageUrl));
        }
      } catch (error) {
        console.error('Failed to fetch hero banners:', error);
        // Will use fallback images
      }
    };

    fetchBanners();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [heroImages.length]);

  const nextSlide = () => setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
  const prevSlide = () => setCurrentImageIndex((prev) => (prev - 1 + heroImages.length) % heroImages.length);

  return (
    <section
      className="
        relative w-full overflow-hidden bg-primary
        flex flex-col items-center justify-center
        h-[78svh] min-h-[480px] max-h-[640px]
        sm:h-[75svh] sm:min-h-[540px] sm:max-h-[720px]
        md:h-[78svh] md:min-h-[600px] md:max-h-[760px]
        lg:h-[88svh] lg:max-h-[860px]
        xl:h-screen xl:max-h-none
      "
    >
      {/* Background Image Slider */}
      {heroImages.map((src, index) => (
        <motion.div
          key={src}
          style={{ y }}
          className={`absolute -top-[10%] -left-[5%] w-[110%] h-[120%] transition-opacity duration-1000 ease-in-out ${
            index === currentImageIndex ? 'opacity-100 z-0' : 'opacity-0 -z-10'
          }`}
        >
          <img
            src={src}
            alt={`Fashion Editorial ${index + 1}`}
            className="w-full h-full object-cover object-center sm:object-top"
          />
        </motion.div>
      ))}

      {/* Readability gradient */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-black/65 via-black/25 to-black/70 pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-5 sm:px-8 lg:px-12 flex flex-col items-center text-center pointer-events-none pt-16 sm:pt-20 md:pt-24">
        <motion.span
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="text-white/85 uppercase tracking-[0.22em] sm:tracking-[0.28em] text-[10px] sm:text-[11px] font-bold mb-3 sm:mb-4 md:mb-5 pointer-events-auto"
        >
          The Circular Fashion Movement
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: 'easeOut' }}
          className="
            font-headings text-white font-normal pointer-events-auto
            text-[2rem] leading-[1.1]
            sm:text-4xl sm:leading-[1.08]
            md:text-5xl md:leading-[1.05]
            lg:text-6xl
            xl:text-7xl
            mb-3 sm:mb-4 md:mb-6
            max-w-[18ch] sm:max-w-none
          "
        >
          Style reinvented,<br />
          <span className="italic font-light text-white/90">never discarded.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: 'easeOut' }}
          className="
            text-white/85 font-body font-light leading-relaxed pointer-events-auto
            text-[13px] sm:text-sm md:text-base lg:text-lg
            max-w-[32ch] sm:max-w-md md:max-w-lg
            mb-5 sm:mb-7 md:mb-9
          "
        >
          Your next favorite piece is already in someone else's closet. No money, just style.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: 'easeOut' }}
          className="
            flex flex-col sm:flex-row items-stretch sm:items-center
            gap-2.5 sm:gap-3
            w-full max-w-[260px] sm:max-w-none sm:w-auto
            pointer-events-auto
          "
        >
          <button className="w-full sm:w-auto px-6 sm:px-7 py-3 sm:py-3.5 bg-white text-primary text-[10px] sm:text-xs uppercase tracking-[0.18em] font-semibold hover:bg-muted transition-colors rounded-full">
            Start Swapping
          </button>
          <button className="w-full sm:w-auto px-6 sm:px-7 py-3 sm:py-3.5 bg-transparent border border-white/80 text-white text-[10px] sm:text-xs uppercase tracking-[0.18em] font-semibold hover:bg-white/10 transition-colors flex items-center justify-center gap-2 backdrop-blur-sm rounded-full">
            Explore Collection <ArrowRight size={13} />
          </button>
        </motion.div>
      </div>

      {/* Slider Controls */}
      <div className="absolute bottom-4 sm:bottom-6 md:bottom-8 left-0 right-0 flex justify-center items-center gap-3 sm:gap-4 z-20 px-4">
        <button
          onClick={prevSlide}
          className="hidden sm:flex w-8 h-8 md:w-9 md:h-9 rounded-full border border-white/40 text-white items-center justify-center hover:bg-white/20 transition-colors backdrop-blur-md"
          aria-label="Previous slide"
        >
          <ChevronLeft size={15} />
        </button>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {heroImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentImageIndex(index)}
              className={`h-1 sm:h-1.5 rounded-full transition-all duration-500 ease-out ${
                index === currentImageIndex
                  ? 'w-6 sm:w-8 md:w-10 bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]'
                  : 'w-2 sm:w-2.5 md:w-3 bg-white/40 hover:bg-white/70'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        <button
          onClick={nextSlide}
          className="hidden sm:flex w-8 h-8 md:w-9 md:h-9 rounded-full border border-white/40 text-white items-center justify-center hover:bg-white/20 transition-colors backdrop-blur-md"
          aria-label="Next slide"
        >
          <ChevronRight size={15} />
        </button>
      </div>
    </section>
  );
}
