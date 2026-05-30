import { RefreshCw, DollarSign, Leaf, Users } from 'lucide-react';
import { motion } from 'motion/react';

export default function StatsSection() {
  const stats = [
    { icon: RefreshCw, value: '320K+', longValue: '320,000+', label: 'Successful Swaps' },
    { icon: DollarSign, value: '$4.2M+', longValue: '$4.2M+', label: 'Saved by Members' },
    { icon: Leaf, value: '120T', longValue: '120 Tons', label: 'CO\u2082 Saved' },
    { icon: Users, value: '25K+', longValue: '25,000+', label: 'Active Trendsetters' },
  ];

  return (
    <section className="bg-[#FAF9F5] border-t border-b border-border/40 relative z-10">
      <div className="max-w-6xl mx-auto w-full px-4 sm:px-8 lg:px-12 py-6 sm:py-8 md:py-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 md:gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, margin: '-10%' }}
                transition={{ duration: 0.5, delay: index * 0.07, ease: 'easeOut' }}
                className={`flex flex-col items-center text-center px-1.5 py-1.5 sm:p-2.5 md:p-3 ${
                  index !== 0 ? 'lg:border-l border-border/50' : ''
                }`}
              >
                <div className="text-accent/80 mb-1.5 sm:mb-2 bg-accent/5 p-1.5 sm:p-2 rounded-full">
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                </div>
                <span className="font-headings text-lg sm:text-xl md:text-2xl font-black text-primary tracking-tight leading-none">
                  <span className="sm:hidden">{stat.value}</span>
                  <span className="hidden sm:inline">{stat.longValue}</span>
                </span>
                <span className="text-[9px] sm:text-[11px] md:text-xs text-muted-foreground font-semibold mt-1 sm:mt-1.5 uppercase tracking-wider leading-tight">
                  {stat.label}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
