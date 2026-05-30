import { ArrowRight } from 'lucide-react';

export default function CTASection() {
  return (
    <section className="px-4 sm:px-8 lg:px-12 py-8 sm:py-10 md:py-12">
      <div className="max-w-5xl mx-auto relative overflow-hidden bg-accent rounded-2xl sm:rounded-3xl text-accent-foreground shadow-xl">
        <div className="absolute top-0 right-0 w-32 h-32 sm:w-48 sm:h-48 md:w-64 md:h-64 opacity-[0.12] pointer-events-none mix-blend-overlay">
          <div
            className="bg-no-repeat aspect-square w-full h-full"
            style={{
              backgroundImage:
                'url("https://firebasestorage.googleapis.com/v0/b/banani-prod.appspot.com/o/reference-images%2Fe990e254-554b-48ad-bb2d-626d12a0ed9d?alt=media&token=c1c20cfa-7e92-4db2-bbc9-10de0b3f81b6")',
              backgroundPosition: '69.5% 70%',
              backgroundSize: '1000% 500%',
            }}
          />
        </div>
        <div className="absolute bottom-0 left-0 w-32 h-32 sm:w-48 sm:h-48 md:w-64 md:h-64 opacity-[0.12] pointer-events-none transform rotate-180 mix-blend-overlay">
          <div
            className="bg-no-repeat aspect-square w-full h-full"
            style={{
              backgroundImage:
                'url("https://firebasestorage.googleapis.com/v0/b/banani-prod.appspot.com/o/reference-images%2Fe990e254-554b-48ad-bb2d-626d12a0ed9d?alt=media&token=c1c20cfa-7e92-4db2-bbc9-10de0b3f81b6")',
              backgroundPosition: '77.5% 68%',
              backgroundSize: '1200% 600%',
            }}
          />
        </div>

        <div className="max-w-2xl mx-auto px-5 sm:px-8 py-8 sm:py-10 md:py-12 lg:py-14 text-center relative z-10 flex flex-col items-center">
          <h2 className="font-headings text-2xl sm:text-3xl md:text-4xl font-bold mb-2.5 sm:mb-3 tracking-tight text-white leading-tight">
            Ready to refresh your wardrobe?
          </h2>
          <p className="text-accent-foreground/85 text-[13px] sm:text-sm md:text-base max-w-sm sm:max-w-md mb-5 sm:mb-6 md:mb-7 leading-relaxed font-medium">
            Join thousands of trendsetters swapping clothes and embracing conscious style.
          </p>
          <button className="px-6 py-3 sm:py-3.5 bg-white text-accent hover:bg-muted/10 transition-colors font-bold rounded-full text-xs sm:text-sm flex items-center gap-2 shadow-[0_6px_24px_rgba(255,255,255,0.18)] hover:shadow-[0_8px_30px_rgba(255,255,255,0.28)] hover:-translate-y-0.5 transform duration-300">
            <span>Join ReWearX</span>
            <ArrowRight size={14} className="sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
