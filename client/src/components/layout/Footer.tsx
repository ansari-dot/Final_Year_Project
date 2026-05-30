import { RefreshCw, Instagram, Twitter, Facebook } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#f2efe8] border-t border-border/80 font-body text-primary relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 pt-8 sm:pt-10 md:pt-12 pb-5 sm:pb-7 md:pb-9">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-5 gap-6 sm:gap-7">
          <div className="col-span-2 sm:col-span-2 flex flex-col gap-2.5 sm:gap-3">
            <div className="flex items-center gap-2">
              <div className="bg-accent text-accent-foreground rounded-full p-1.5 flex items-center justify-center">
                <RefreshCw size={13} className="md:w-3.5 md:h-3.5" />
              </div>
              <span className="font-headings text-base md:text-lg font-bold tracking-tight">ReWearX</span>
            </div>
            <p className="text-[13px] sm:text-sm text-muted-foreground max-w-xs leading-relaxed">
              Swap clothes. Share style. No money. Just better choices.
            </p>
            <div className="flex items-center gap-3.5 mt-1 text-muted-foreground">
              <a href="#" aria-label="Instagram" className="hover:text-accent transition-colors">
                <Instagram size={16} />
              </a>
              <a href="#" aria-label="Twitter" className="hover:text-accent transition-colors">
                <Twitter size={16} />
              </a>
              <a href="#" aria-label="Facebook" className="hover:text-accent transition-colors">
                <Facebook size={16} />
              </a>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:gap-2.5">
            <h5 className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Platform</h5>
            <ul className="flex flex-col gap-1.5 text-[13px] sm:text-sm font-medium text-primary/80">
              <li><a href="#" className="hover:text-accent transition-colors">How It Works</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Browse Swaps</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Categories</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Safety & Tips</a></li>
            </ul>
          </div>

          <div className="flex flex-col gap-2 sm:gap-2.5">
            <h5 className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Company</h5>
            <ul className="flex flex-col gap-1.5 text-[13px] sm:text-sm font-medium text-primary/80">
              <li><a href="#" className="hover:text-accent transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Our Mission</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Careers</a></li>
            </ul>
          </div>

          <div className="col-span-2 sm:col-span-2 md:col-span-1 flex flex-col gap-2 sm:gap-2.5">
            <h5 className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Support & Legal</h5>
            <ul className="flex flex-col gap-1.5 text-[13px] sm:text-sm font-medium text-primary/80">
              <li><a href="#" className="hover:text-accent transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Community Rules</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 sm:mt-10 pt-4 sm:pt-5 border-t border-border/40 flex flex-col sm:flex-row justify-between items-center text-center sm:text-left text-[10px] sm:text-[11px] font-medium text-muted-foreground gap-1.5 sm:gap-4">
          <span>© {new Date().getFullYear()} ReWearX. All rights reserved.</span>
          <span>Made with love for a circular future.</span>
        </div>
      </div>
    </footer>
  );
}
