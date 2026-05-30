import React, { useState, useRef, useEffect } from 'react';
import { ScanSearch, X, Camera, Loader2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useToast } from '../../contexts/ToastContext';

// Mock data for results
const mockResults = [
  {
    id: 1,
    title: 'Vintage Denim Jacket',
    owner: 'Sarah M.',
    matchScore: 98,
    image: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&q=80&w=300&h=300',
    features: ['Denim', 'Blue', 'Vintage', 'Medium'],
  },
  {
    id: 2,
    title: 'Classic Blue Jeans',
    owner: 'Alex K.',
    matchScore: 85,
    image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&q=80&w=300&h=300',
    features: ['Denim', 'Blue', 'Pants', 'Size 32'],
  }
];

export default function AISearchWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setUploadedImage(url);
      simulateSearch();
    }
  };

  const simulateSearch = () => {
    setIsAnalyzing(true);
    setShowResults(false);
    
    // Simulate AI extraction and DB search delay
    setTimeout(() => {
      setIsAnalyzing(false);
      setShowResults(true);
    }, 2500);
  };

  const resetSearch = () => {
    if (uploadedImage) {
      URL.revokeObjectURL(uploadedImage);
    }
    setUploadedImage(null);
    setShowResults(false);
    setIsAnalyzing(false);
  };

  const handleRequestSwap = (itemTitle: string) => {
    toast(`Swap request sent for ${itemTitle}!`, 'success');
  };

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 bg-zinc-950 text-white w-[52px] h-[52px] sm:w-[56px] sm:h-[56px] sm:hover:w-[140px] rounded-full shadow-2xl flex items-center justify-center sm:hover:justify-start cursor-pointer overflow-hidden group transition-all duration-500 ease-out border border-white/10"
        aria-label="Open AI Visual Search"
      >
        <div className="flex items-center px-4 sm:px-[17px] w-full relative z-10">
          <ScanSearch size={20} className="sm:w-[22px] sm:h-[22px] shrink-0 text-white group-hover:scale-110 transition-transform duration-500" strokeWidth={2} />
          
          <div className="hidden sm:flex ml-3 overflow-hidden whitespace-nowrap">
            {"AI SEARCH".split('').map((char, index) => (
              <span 
                key={index} 
                className="font-bold text-[11px] font-headings text-white uppercase tracking-[0.15em] opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300"
                style={{ 
                  transitionDelay: `${50 + index * 20}ms`,
                }}
              >
                {char === ' ' ? '\u00A0' : char}
              </span>
            ))}
          </div>
        </div>
      </motion.button>

      {/* Sidebar Overlay and Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 lg:hidden"
            />
            
            <motion.div
              initial={isMobile ? { y: '100%', opacity: 0 } : { x: '100%', opacity: 0 }}
              animate={isMobile ? { y: 0, opacity: 1 } : { x: 0, opacity: 1 }}
              exit={isMobile ? { y: '100%', opacity: 0 } : { x: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-0 sm:inset-auto sm:top-0 sm:right-0 h-[100dvh] w-full sm:w-[400px] bg-[#fdfdfc] shadow-[0_0_60px_-15px_rgba(0,0,0,0.3)] z-50 flex flex-col sm:border-l border-border/40 font-body"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 sm:p-6 bg-white/80 backdrop-blur-xl border-b border-border/40 relative z-10">
                <div className="flex items-center gap-3 text-primary">
                  <div className="p-2 sm:p-2.5 bg-primary rounded-xl border border-primary/10">
                    <ScanSearch size={16} className="sm:w-[18px] sm:h-[18px] text-white" />
                  </div>
                  <div>
                    <h2 className="font-headings font-bold text-base sm:text-lg leading-none tracking-tight">AI Vision Search</h2>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-bold mt-1.5 opacity-80">Find Matches Instantly</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-9 h-9 sm:w-8 sm:h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors text-primary"
                  aria-label="Close panel"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 sm:py-6 pb-24 relative">
                
                {/* Initial Upload State */}
                {!uploadedImage && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="h-full flex flex-col items-center justify-center text-center -mt-10"
                  >
                    <div 
                      onClick={handleUploadClick}
                      className="w-full aspect-[4/3] rounded-3xl border-2 border-dashed border-primary/20 hover:border-primary/50 bg-white flex flex-col items-center justify-center cursor-pointer transition-all duration-300 group shadow-sm hover:shadow-md"
                    >
                      <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center text-primary mb-5 group-hover:scale-110 group-hover:bg-primary/10 transition-all duration-300">
                        <Camera size={28} className="group-hover:text-accent transition-colors" />
                      </div>
                      <h3 className="font-headings font-bold text-xl text-primary mb-1.5">Upload a product photo</h3>
                      <p className="text-xs text-muted-foreground px-8 font-medium leading-relaxed">
                        Snap a pic or upload an image to find similar or exact matches in our community catalog.
                      </p>
                      
                      <button className="mt-6 px-6 py-2.5 bg-primary text-white text-xs font-bold uppercase tracking-widest rounded-full hover:bg-accent transition-all duration-300 hover:-translate-y-1 shadow-md">
                        Browse Files
                      </button>
                    </div>
                    
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileChange} 
                      accept="image/*" 
                      className="hidden" 
                    />
                  </motion.div>
                )}

                {/* Uploaded Image & Analysis State */}
                {uploadedImage && (
                  <div className="space-y-6">
                    {/* Image Preview Container */}
                    <div className="relative rounded-3xl overflow-hidden bg-white p-2.5 shadow-sm border border-border/60">
                      <div className="aspect-[4/3] rounded-2xl overflow-hidden relative group">
                        <img src={uploadedImage} alt="Uploaded item" className="w-full h-full object-cover" />
                        
                        {/* Scanning Animation */}
                        {isAnalyzing && (
                          <div className="absolute inset-0 bg-primary/10 backdrop-blur-[2px]">
                            {/* Scanning line */}
                            <div className="absolute top-0 left-0 w-full h-[2px] bg-accent shadow-[0_0_20px_4px_rgba(var(--accent-rgb),0.8)] animate-[scan_2s_ease-in-out_infinite]" />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="bg-white/95 backdrop-blur-md px-5 py-3 rounded-full font-bold text-primary text-xs shadow-xl flex items-center gap-3 border border-border/40">
                                <Loader2 size={16} className="animate-spin text-accent" />
                                Extracting features...
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Close Preview Button */}
                        {showResults && (
                          <button 
                            onClick={resetSearch}
                            className="absolute top-4 right-4 bg-black/40 hover:bg-black/60 backdrop-blur-md text-white p-2 rounded-full transition-all opacity-0 group-hover:opacity-100 transform translate-y-[-10px] group-hover:translate-y-0"
                            aria-label="Remove image"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Results Area */}
                    {showResults && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="text-[11px] font-black tracking-[0.2em] text-primary/70 uppercase">
                            Matches Found ({mockResults.length})
                          </h3>
                        </div>
                        
                        <div className="space-y-3">
                          {mockResults.map((result, i) => (
                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.15, ease: 'easeOut' }}
                              key={result.id}
                              className="bg-white rounded-2xl p-3 flex gap-4 shadow-sm border border-border/50 hover:shadow-lg hover:border-primary/20 transition-all duration-300 group cursor-pointer"
                            >
                              <div className="w-[88px] h-[88px] rounded-xl overflow-hidden shrink-0 relative">
                                <img src={result.image} alt={result.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
                                <div className="absolute top-1.5 left-1.5 bg-white/95 backdrop-blur-md px-2 py-0.5 rounded-full text-[9px] font-black text-primary shadow-sm border border-border/40">
                                  {result.matchScore}% FIT
                                </div>
                              </div>
                              <div className="flex-1 flex flex-col justify-between py-1">
                                <div>
                                  <h4 className="font-bold text-sm text-primary line-clamp-1 group-hover:text-accent transition-colors">{result.title}</h4>
                                  <span className="text-[10px] text-muted-foreground font-semibold mt-0.5 block">by {result.owner}</span>
                                </div>
                                
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                  {result.features.slice(0, 3).map(f => (
                                    <span key={f} className="text-[9px] px-2 py-[2px] bg-muted/60 border border-border/40 rounded uppercase tracking-wider text-primary/70 font-bold">{f}</span>
                                  ))}
                                </div>
                                
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRequestSwap(result.title);
                                  }}
                                  className="mt-2.5 self-start text-[10px] font-black text-primary hover:text-accent flex items-center gap-1.5 transition-colors uppercase tracking-widest relative z-10"
                                >
                                  Swap Request <ArrowRight size={12} className="transform group-hover:translate-x-1 transition-transform" />
                                </button>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <style>{`
        @keyframes scan {
          0% { top: 0; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </>
  );
}
