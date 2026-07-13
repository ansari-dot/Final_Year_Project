import {
  RefreshCw,
  Menu,
  X,
  ChevronDown,
  ArrowRight,
  Bell,
  Heart,
  Home,
  Repeat,
  MessageCircle,
  Sparkles,
  Settings,
  User as UserIcon,
  LogOut,
  Plus,
} from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../contexts/AuthContext';
import { notificationsApi, swapsApi, chatApi } from '../../lib/api';
import { adaptNotification } from '../../lib/api/types';
import type { Notification as UINotification } from '../../lib/mockData';
import { getSocket } from '../../lib/socket';

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileCategoriesOpen, setIsMobileCategoriesOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);
  const [isBrowseOpen, setIsBrowseOpen] = useState(false);
  const browseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const openBrowse = () => {
    if (browseTimeoutRef.current) clearTimeout(browseTimeoutRef.current);
    setIsBrowseOpen(true);
  };
  const closeBrowse = () => {
    browseTimeoutRef.current = setTimeout(() => setIsBrowseOpen(false), 120);
  };
  const [location, setLocation] = useLocation();
  const { user, isAuthenticated, signOut } = useAuth();
  const [notifications, setNotifications] = useState<UINotification[]>([]);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [unreadChats, setUnreadChats] = useState(0);
  const [pendingSwaps, setPendingSwaps] = useState(0);

  // On chat & profile pages we ALWAYS show the compact (logo-only) pill,
  // regardless of scroll/screen. Otherwise: collapse only when scrolled AND on lg+ screens.
  const isCompactRoute =
    location.startsWith('/chat') ||
    location.startsWith('/profile') ||
    location.startsWith('/users/');
  const shouldCollapse = isCompactRoute || (isScrolled && isLargeScreen);

  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadNotifs(0);
      setUnreadChats(0);
      setPendingSwaps(0);
      return;
    }

    const refresh = async () => {
      try {
        const [{ items: notifs }, unreadCount, swapsList, convs] = await Promise.all([
          notificationsApi.list(1, 8).catch(() => ({ items: [] })),
          notificationsApi.unreadCount().catch(() => ({ unread: 0 })),
          swapsApi.list({ role: 'received', status: 'pending', limit: 1 }).catch(() => ({ items: [], pagination: { totalItems: 0 } as never })),
          chatApi.conversations(1, 50).catch(() => ({ items: [] })),
        ]);
        setNotifications(notifs.map(adaptNotification));
        setUnreadNotifs(unreadCount.unread);
        setPendingSwaps(swapsList.pagination?.totalItems ?? swapsList.items.length);
        let chatTotal = 0;
        for (const c of convs.items) chatTotal += c.unreadCount || 0;
        setUnreadChats(chatTotal);
      } catch {
        /* noop */
      }
    };
    refresh();

    const socket = getSocket();
    const onNew = () => refresh();
    socket.on('notification', onNew);
    socket.on('receive-message', onNew);
    return () => {
      socket.off('notification', onNew);
      socket.off('receive-message', onNew);
    };
  }, [isAuthenticated]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node))
        setIsUserMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node))
        setIsNotifOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Scroll-aware collapsing
  useEffect(() => {
    let raf = 0;
    const update = () => {
      setIsScrolled(window.scrollY > 60);
    };
    const onScroll = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    update();
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // Track large screens (collapse behavior only applies on lg+)
  useEffect(() => {
    const mql = window.matchMedia('(min-width: 1024px)');
    const update = () => setIsLargeScreen(mql.matches);
    update();
    mql.addEventListener('change', update);
    return () => mql.removeEventListener('change', update);
  }, []);

  // Close any open dropdowns when collapsing
  useEffect(() => {
    if (shouldCollapse) {
      setIsUserMenuOpen(false);
      setIsNotifOpen(false);
    }
  }, [shouldCollapse]);

  const pillTransition = { type: 'spring' as const, stiffness: 320, damping: 32, mass: 0.6 };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-3 sm:px-4 md:px-8 xl:px-10 mt-3 sm:mt-4 md:mt-6 font-body pointer-events-none">
      <motion.div
        layout
        transition={pillTransition}
        className={`${
          shouldCollapse
            ? 'ml-0 mr-auto w-fit pl-3 pr-4 py-1.5 sm:pl-4 sm:pr-5 sm:py-2'
            : 'mx-auto max-w-7xl w-full pl-4 pr-2 py-2 sm:px-5 sm:py-2.5 md:px-6 md:py-3 justify-between'
        } rounded-full border border-white/40 bg-white/80 backdrop-blur-xl flex items-center shadow-[0_8px_32px_rgba(0,0,0,0.08)] relative pointer-events-auto`}
      >
        
        {/* Left: Logo */}
        <motion.div layout="position" className="flex items-center">
          <Link href="/">
            <div className="flex items-center gap-2 md:gap-2.5 cursor-pointer group">
              <motion.div
                layout
                transition={pillTransition}
                className={`rounded-full bg-primary text-white flex items-center justify-center transform group-hover:-rotate-180 transition-transform duration-700 shadow-md ${
                  shouldCollapse ? 'w-8 h-8' : 'w-8 h-8 md:w-10 md:h-10'
                }`}
              >
                <RefreshCw size={14} className={shouldCollapse ? '' : 'md:w-[18px] md:h-[18px]'} />
              </motion.div>
              <motion.span
                layout
                transition={pillTransition}
                className={`font-headings font-black text-primary tracking-tight ${
                  shouldCollapse ? 'text-lg' : 'text-lg sm:text-xl md:text-2xl'
                }`}
              >
                ReWearX
              </motion.span>
            </div>
          </Link>
        </motion.div>

        {/* Center: Nav (absolutely centered so it stays mid-bar regardless of logo/actions widths) */}
        <AnimatePresence>
        {!shouldCollapse && (
        <motion.nav
          key="full-nav"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="hidden lg:flex items-center gap-8 text-[13px] uppercase tracking-widest font-bold text-primary/70 absolute left-1/2 -translate-x-1/2">
            <Link href="/how-it-works" className="hover:text-primary transition-colors cursor-pointer relative after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-[2px] after:bg-primary hover:after:w-full after:transition-all after:duration-300 py-4">How It Works</Link>

            <div
              className="py-4 relative"
              onMouseEnter={openBrowse}
              onMouseLeave={closeBrowse}
            >
              <Link
                href="/browse"
                className="hover:text-primary transition-colors cursor-pointer relative flex items-center gap-1.5 after:content-[''] after:absolute after:-bottom-1 after:left-0 after:h-[2px] after:bg-primary after:transition-all after:duration-300"
                style={{ '--tw-after-w': isBrowseOpen ? '100%' : '0%' } as React.CSSProperties}
              >
                Browse
                <ChevronDown size={14} className={`transition-transform duration-300 ${isBrowseOpen ? 'rotate-180' : ''}`} />
              </Link>
            </div>

            <Link href="/about" className="hover:text-primary transition-colors cursor-pointer relative after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-[2px] after:bg-primary hover:after:w-full after:transition-all after:duration-300 py-4">About</Link>
            <Link href="/contact" className="hover:text-primary transition-colors cursor-pointer relative after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-[2px] after:bg-primary hover:after:w-full after:transition-all after:duration-300 py-4">Contact Us</Link>
        </motion.nav>
        )}
        </AnimatePresence>

        {/* Right: Actions (full set, hidden when scrolled on big screens) */}
        <AnimatePresence>
        {!shouldCollapse && (
        <motion.div
          key="full-actions"
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 12 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="flex items-center gap-4"
        >
          
          {/* Authentication Actions */}
          {!isAuthenticated && (
            <div className="hidden md:flex items-center gap-2">
              <Link href="/login">
                <button className="px-5 py-2.5 rounded-full text-[13px] font-bold text-primary hover:bg-white/60 transition-colors">
                  Log In
                </button>
              </Link>
              <Link href="/signup">
                <button className="px-6 py-2.5 rounded-full text-[13px] font-bold bg-primary text-white hover:bg-primary/90 transition-all hover:scale-105 hover:shadow-lg hover:shadow-primary/30 active:scale-95 flex items-center gap-2">
                  Start Free
                </button>
              </Link>
            </div>
          )}

          {isAuthenticated && user && (
            <div className="hidden md:flex items-center gap-1.5 sm:gap-2">
              <Link href="/items/new">
                <button
                  aria-label="Create listing"
                  className="hidden lg:inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-[12px] font-bold uppercase tracking-wider bg-accent text-accent-foreground hover:scale-105 active:scale-95 transition-all shadow-md hover:shadow-lg"
                >
                  <Plus size={14} /> List
                </button>
              </Link>

              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => {
                    setIsNotifOpen((s) => !s);
                    setIsUserMenuOpen(false);
                  }}
                  aria-label="Notifications"
                  className="relative w-10 h-10 rounded-full flex items-center justify-center text-primary hover:bg-white/60 transition-colors"
                >
                  <Bell size={18} />
                  {unreadNotifs > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                      {unreadNotifs}
                    </span>
                  )}
                </button>
                <AnimatePresence>
                  {isNotifOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.97 }}
                      transition={{ duration: 0.18 }}
                      className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-border overflow-hidden"
                    >
                      <div className="px-4 py-3 border-b border-border/60 flex items-center justify-between">
                        <span className="font-headings font-bold text-primary">Notifications</span>
                        <Link
                          href="/notifications"
                          onClick={() => setIsNotifOpen(false)}
                          className="text-[11px] uppercase tracking-wider font-bold text-accent hover:underline"
                        >
                          View all
                        </Link>
                      </div>
                      <div className="max-h-80 overflow-y-auto divide-y divide-border/60">
                        {notifications.slice(0, 4).map((n) => (
                          <div
                            key={n.id}
                            className={`px-4 py-3 flex gap-3 cursor-pointer hover:bg-muted/30 transition-colors ${
                              !n.read ? 'bg-accent/5' : ''
                            }`}
                          >
                            {!n.read && (
                              <span className="w-2 h-2 rounded-full bg-accent mt-2 flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-primary truncate">{n.title}</p>
                              <p className="text-xs text-muted-foreground line-clamp-2">{n.message}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => {
                    setIsUserMenuOpen((s) => !s);
                    setIsNotifOpen(false);
                  }}
                  className="flex items-center gap-2 pr-2 pl-1 py-1 rounded-full hover:bg-white/60 transition-colors"
                  aria-label="Account menu"
                >
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-9 h-9 rounded-full object-cover ring-2 ring-white"
                  />
                  <ChevronDown size={14} className="text-primary/60" />
                </button>
                <AnimatePresence>
                  {isUserMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.97 }}
                      transition={{ duration: 0.18 }}
                      className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-border overflow-hidden"
                    >
                      <div className="px-4 py-4 border-b border-border/60 bg-muted/20">
                        <p className="font-headings font-bold text-primary text-sm">{user.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          ★ {user.rating} · {user.swapsCompleted} swaps
                        </p>
                      </div>
                      <div className="p-1.5">
                        {[
                          { icon: Home, label: 'My Feed', href: '/home' },
                          { icon: UserIcon, label: 'My Profile', href: '/profile' },
                          { icon: Repeat, label: 'My Swaps', href: '/swaps', badge: pendingSwaps },
                          { icon: MessageCircle, label: 'Messages', href: '/chat', badge: unreadChats },
                          { icon: Heart, label: 'Saved', href: '/saved' },
                          { icon: Sparkles, label: 'For You', href: '/recommendations' },
                          { icon: Settings, label: 'Settings', href: '/settings' },
                        ].map((it) => {
                          const Icon = it.icon;
                          return (
                            <Link key={it.href} href={it.href}>
                              <div
                                onClick={() => setIsUserMenuOpen(false)}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-muted/40 text-sm font-semibold text-primary/90"
                              >
                                <Icon size={16} className="text-primary/60" />
                                <span className="flex-1">{it.label}</span>
                                {it.badge && it.badge > 0 ? (
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-accent text-accent-foreground">
                                    {it.badge}
                                  </span>
                                ) : null}
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                      <div className="border-t border-border/60 p-1.5">
                        <button
                          onClick={async () => {
                            await signOut();
                            setIsUserMenuOpen(false);
                            setLocation('/');
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-50 text-sm font-semibold text-red-600 cursor-pointer"
                        >
                          <LogOut size={16} />
                          Sign out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}
          
          {/* Mobile-only quick icons (authenticated): chat + notifications */}
          {isAuthenticated && user && (
            <div className="flex md:hidden items-center gap-0.5">
              <Link href="/chat">
                <button
                  aria-label="Messages"
                  className="relative w-10 h-10 flex items-center justify-center text-primary hover:bg-white/50 rounded-full transition-colors"
                >
                  <MessageCircle size={19} />
                  {unreadChats > 0 && (
                    <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-accent text-accent-foreground text-[9px] font-bold flex items-center justify-center ring-2 ring-white/70">
                      {unreadChats > 9 ? '9+' : unreadChats}
                    </span>
                  )}
                </button>
              </Link>
              <Link href="/notifications">
                <button
                  aria-label="Notifications"
                  className="relative w-10 h-10 flex items-center justify-center text-primary hover:bg-white/50 rounded-full transition-colors"
                >
                  <Bell size={19} />
                  {unreadNotifs > 0 && (
                    <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white/70">
                      {unreadNotifs > 9 ? '9+' : unreadNotifs}
                    </span>
                  )}
                </button>
              </Link>
            </div>
          )}

          {/* Mobile menu button (visible only at < lg) */}
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Open menu"
            className="lg:hidden w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center text-primary hover:bg-white/50 rounded-full transition-colors"
          >
            <Menu size={20} className="sm:w-[22px] sm:h-[22px]" />
          </button>
        </motion.div>
        )}
        </AnimatePresence>

      </motion.div>

      {/* ── Full-width Browse Mega Menu ── */}
      <AnimatePresence>
        {isBrowseOpen && !shouldCollapse && (
          <motion.div
            key="mega-menu"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="fixed left-0 right-0 top-[72px] sm:top-[80px] md:top-[88px] z-40 pointer-events-auto"
            onMouseEnter={openBrowse}
            onMouseLeave={closeBrowse}
          >
            {/* Backdrop blur strip */}
            <div className="w-full bg-white/95 backdrop-blur-2xl border-y border-border/40 shadow-[0_20px_60px_rgba(0,0,0,0.10)]">
              <div className="max-w-7xl mx-auto px-6 md:px-12 py-10 md:py-12">
                <div className="grid grid-cols-12 gap-8 md:gap-12">

                  {/* ── Col 1: Clothing ── */}
                  <div className="col-span-3">
                    <p className="text-[9px] font-black tracking-[0.25em] text-primary/35 uppercase mb-4 pb-2.5 border-b border-border/50">Clothing</p>
                    <div className="flex flex-col gap-1">
                      {['Tops', 'Bottoms', 'Dresses', 'Outerwear', 'Activewear', 'Swimwear'].map((item, i) => (
                        <motion.div
                          key={item}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.25, delay: i * 0.04 }}
                        >
                          <Link
                            href="/browse"
                            onClick={() => setIsBrowseOpen(false)}
                            className="group/link flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-accent/6 transition-all duration-200"
                          >
                            <span className="text-[13px] font-semibold text-primary/80 group-hover/link:text-accent transition-colors">{item}</span>
                            <ArrowRight size={13} className="text-accent opacity-0 -translate-x-2 group-hover/link:opacity-100 group-hover/link:translate-x-0 transition-all duration-200" />
                          </Link>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* ── Col 2: Shoes & Accessories ── */}
                  <div className="col-span-3">
                    <p className="text-[9px] font-black tracking-[0.25em] text-primary/35 uppercase mb-4 pb-2.5 border-b border-border/50">Shoes & Accessories</p>
                    <div className="flex flex-col gap-1">
                      {['Footwear', 'Bags & Purses', 'Jewelry', 'Belts', 'Hats & Caps', 'Sunglasses'].map((item, i) => (
                        <motion.div
                          key={item}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.25, delay: 0.06 + i * 0.04 }}
                        >
                          <Link
                            href="/browse"
                            onClick={() => setIsBrowseOpen(false)}
                            className="group/link flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-accent/6 transition-all duration-200"
                          >
                            <span className="text-[13px] font-semibold text-primary/80 group-hover/link:text-accent transition-colors">{item}</span>
                            <ArrowRight size={13} className="text-accent opacity-0 -translate-x-2 group-hover/link:opacity-100 group-hover/link:translate-x-0 transition-all duration-200" />
                          </Link>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* ── Col 3: Collections ── */}
                  <div className="col-span-3">
                    <p className="text-[9px] font-black tracking-[0.25em] text-primary/35 uppercase mb-4 pb-2.5 border-b border-border/50">Collections</p>
                    <div className="flex flex-col gap-1">
                      {[
                        { label: 'Vintage', badge: 'Hot' },
                        { label: 'Designer', badge: '' },
                        { label: 'Y2K Era', badge: 'Trending' },
                        { label: 'Streetwear', badge: '' },
                        { label: 'Minimalist', badge: '' },
                        { label: 'Cottagecore', badge: 'New' },
                      ].map((item, i) => (
                        <motion.div
                          key={item.label}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.25, delay: 0.12 + i * 0.04 }}
                        >
                          <Link
                            href="/browse"
                            onClick={() => setIsBrowseOpen(false)}
                            className="group/link flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-accent/6 transition-all duration-200"
                          >
                            <span className="text-[13px] font-semibold text-primary/80 group-hover/link:text-accent transition-colors flex items-center gap-2">
                              {item.label}
                              {item.badge && (
                                <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
                                  {item.badge}
                                </span>
                              )}
                            </span>
                            <ArrowRight size={13} className="text-accent opacity-0 -translate-x-2 group-hover/link:opacity-100 group-hover/link:translate-x-0 transition-all duration-200" />
                          </Link>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* ── Col 4: Featured Card ── */}
                  <motion.div
                    className="col-span-3 border-l border-border/40 pl-8 md:pl-10 flex flex-col gap-5"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.18 }}
                  >
                    <p className="text-[9px] font-black tracking-[0.25em] text-primary/35 uppercase pb-2.5 border-b border-border/50">Featured Drop</p>

                    <Link href="/browse" onClick={() => setIsBrowseOpen(false)} className="group/feat block">
                      <div className="relative rounded-2xl overflow-hidden aspect-[3/4] shadow-md group-hover/feat:shadow-2xl transition-shadow duration-500">
                        <img
                          src="https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=400&h=520"
                          alt="Featured"
                          className="w-full h-full object-cover group-hover/feat:scale-105 transition-transform duration-700 ease-out"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-5">
                          <span className="text-white/70 text-[9px] font-black uppercase tracking-[0.22em] block mb-1">Trend Alert</span>
                          <span className="text-white font-headings font-bold text-xl leading-tight block group-hover/feat:text-accent/90 transition-colors">
                            Summer<br />Dresses
                          </span>
                          <span className="inline-flex items-center gap-1.5 mt-3 text-white/80 text-[11px] font-semibold group-hover/feat:text-white transition-colors">
                            Shop Now <ArrowRight size={12} />
                          </span>
                        </div>
                      </div>
                    </Link>

                    <Link
                      href="/browse"
                      onClick={() => setIsBrowseOpen(false)}
                      className="flex items-center justify-between px-4 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors group/all"
                    >
                      <span className="text-[11px] font-bold uppercase tracking-[0.16em]">View All Items</span>
                      <ArrowRight size={13} className="group-hover/all:translate-x-1 transition-transform" />
                    </Link>
                  </motion.div>

                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed top-0 left-0 right-0 p-3 sm:p-4 md:px-8 pt-3 sm:pt-4 md:pt-6 z-[60] lg:hidden pointer-events-auto"
          >
            <div className="bg-white/95 backdrop-blur-2xl rounded-3xl border border-white/60 shadow-2xl p-5 sm:p-6 flex flex-col gap-5 sm:gap-7">
              <div className="flex items-center justify-between">
                <Link href="/">
                  <div className="flex items-center gap-2 md:gap-2.5 cursor-pointer group" onClick={() => setIsMobileMenuOpen(false)}>
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary text-white flex items-center justify-center transform group-hover:-rotate-180 transition-transform duration-700 shadow-md">
                      <RefreshCw size={14} className="md:w-[18px] md:h-[18px]" />
                    </div>
                    <span className="font-headings text-xl md:text-2xl font-black text-primary tracking-tight">ReWearX</span>
                  </div>
                </Link>
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  aria-label="Close menu"
                  className="w-10 h-10 flex items-center justify-center text-primary hover:bg-primary/10 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <nav className="flex flex-col gap-5 sm:gap-6 text-sm uppercase tracking-widest font-bold text-primary">
                <Link href="/how-it-works" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-accent transition-colors">
                  How It Works
                </Link>
                
                <div className="flex flex-col gap-4">
                  <div
                    className="flex items-center gap-2 hover:text-accent transition-colors cursor-pointer"
                    onClick={() => setIsMobileCategoriesOpen(!isMobileCategoriesOpen)}
                  >
                    Browse
                    <ChevronDown size={16} className={`transition-transform duration-300 ${isMobileCategoriesOpen ? 'rotate-180' : ''}`} />
                  </div>

                  <AnimatePresence>
                    {isMobileCategoriesOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="flex flex-col gap-4 pl-4 border-l-2 border-primary/10 overflow-hidden"
                      >
                        <Link href="/browse" onClick={() => setIsMobileMenuOpen(false)} className="text-[13px] hover:text-accent transition-colors flex items-center gap-2">
                          Clothing
                        </Link>
                        <Link href="/browse" onClick={() => setIsMobileMenuOpen(false)} className="text-[13px] hover:text-accent transition-colors flex items-center gap-2">
                          Shoes & Acc.
                        </Link>
                        <Link href="/browse" onClick={() => setIsMobileMenuOpen(false)} className="text-[13px] hover:text-accent transition-colors flex items-center gap-2">
                          Collections
                        </Link>
                         <Link href="/browse" onClick={() => setIsMobileMenuOpen(false)} className="text-[13px] hover:text-accent transition-colors flex items-center gap-2 text-primary/70">
                          View All <ArrowRight size={14} />
                        </Link>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <Link href="/about" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-accent transition-colors">
                  About Us
                </Link>
                <Link href="/contact" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-accent transition-colors">
                  Contact
                </Link>
              </nav>

              {!isAuthenticated && (
                <div className="flex flex-col gap-3 pt-5 sm:pt-6 border-t border-primary/10">
                  <Link href="/login">
                    <button onClick={() => setIsMobileMenuOpen(false)} className="w-full py-3.5 rounded-full text-sm font-bold text-primary border border-primary/20 hover:bg-primary/5 transition-colors">
                      Log In
                    </button>
                  </Link>
                  <Link href="/signup">
                    <button onClick={() => setIsMobileMenuOpen(false)} className="w-full py-3.5 rounded-full text-sm font-bold bg-primary text-white hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-95">
                      Start Free
                    </button>
                  </Link>
                </div>
              )}

              {isAuthenticated && user && (
                <div className="flex flex-col gap-3 pt-5 sm:pt-6 border-t border-primary/10">
                  <div className="flex items-center gap-3 pb-1">
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-accent/30"
                    />
                    <div className="flex-1">
                      <p className="font-headings font-bold text-primary">{user.name}</p>
                      <p className="text-xs text-muted-foreground">
                        ★ {user.rating} · {user.swapsCompleted} swaps
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Link href="/home">
                      <button onClick={() => setIsMobileMenuOpen(false)} className="w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider border border-primary/20 hover:bg-primary/5">Feed</button>
                    </Link>
                    <Link href="/browse">
                      <button onClick={() => setIsMobileMenuOpen(false)} className="w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider border border-primary/20 hover:bg-primary/5">Browse</button>
                    </Link>
                    <Link href="/swaps">
                      <button onClick={() => setIsMobileMenuOpen(false)} className="w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider border border-primary/20 hover:bg-primary/5">Swaps</button>
                    </Link>
                    <Link href="/profile">
                      <button onClick={() => setIsMobileMenuOpen(false)} className="w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider border border-primary/20 hover:bg-primary/5">Profile</button>
                    </Link>
                  </div>
                  <Link href="/items/new">
                    <button onClick={() => setIsMobileMenuOpen(false)} className="w-full py-3.5 rounded-full text-sm font-bold bg-accent text-accent-foreground hover:bg-accent/90 transition-all active:scale-95">
                      + List an Item
                    </button>
                  </Link>
                  <button
                    onClick={async () => {
                      await signOut();
                      setIsMobileMenuOpen(false);
                      setLocation('/');
                    }}
                    className="w-full py-3 rounded-full text-sm font-bold text-red-600 border border-red-200 hover:bg-red-50"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
