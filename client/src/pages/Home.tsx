import HeroSection from '../components/home/HeroSection';
import StatsSection from '../components/home/StatsSection';
import InfiniteCategoriesMarquee from '../components/home/InfiniteCategoriesMarquee';
import FeaturedSwaps from '../components/home/FeaturedSwaps';
import ProcessSection from '../components/home/ProcessSection';
import TrendingCategories from '../components/home/TrendingCategories';
import TestimonialsSection from '../components/home/TestimonialsSection';
import SwapperOfTheWeek from '../components/home/SwapperOfTheWeek';
import CTASection from '../components/home/CTASection';

export default function Home() {
  return (
    <div className="flex flex-col w-full">
      <HeroSection />
      <StatsSection />
      <InfiniteCategoriesMarquee />
      <FeaturedSwaps />
      <ProcessSection />
      <SwapperOfTheWeek />
      <TrendingCategories />
      <TestimonialsSection />
      <CTASection />
    </div>
  );
}
