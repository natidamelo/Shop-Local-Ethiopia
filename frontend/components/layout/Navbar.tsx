'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, User, Menu, X, Sun, Moon, Search, Package, LogOut, Settings, LayoutDashboard } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/lib/store/authStore';
import { useCartStore } from '@/lib/store/cartStore';
import { useLanguageStore, translations } from '@/lib/store/languageStore';
import { useSiteSettings } from '@/lib/useSiteSettings';
import { toast } from 'sonner';

const defaultNavLinks = [
  { href: '/shop', labelKey: 'shopNow', defaultLabel: 'Shop Now' },
  { href: '/why-choose-as', labelKey: 'whyChooseUs', defaultLabel: 'Why Choose Us' },
  { href: '/shop?featured=true', labelKey: 'bestSeller', defaultLabel: 'Best Seller' },
  { href: '/traditional-club', labelKey: 'traditionalClub', defaultLabel: 'Traditional Club' },
  { href: '/bazar-vendor-apply', labelKey: 'aboutBazaar', defaultLabel: 'About Our Bazaar' },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const { user, isAuthenticated, logout } = useAuthStore();
  const itemCount = useCartStore((s) => s.getItemCount());
  const { language, toggleLanguage, setLanguage } = useLanguageStore();
  const t = translations[language];
  const router = useRouter();
  const pathname = usePathname();
  const { siteName, logoUrl, navLinks = defaultNavLinks } = useSiteSettings();

  // Use solid header (cream bg + dark text) when scrolled OR on any page other than homepage (dashboard, shop, etc. have light backgrounds)
  const hasSolidHeader = scrolled || (pathname !== '/' && pathname !== '');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    router.push('/');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        hasSolidHeader ? 'backdrop-blur-md shadow-md' : ''
      }`}
      style={hasSolidHeader ? { background: 'var(--eth-nav-bg)' } : {}}
    >
      <div className="w-full px-4 sm:px-6 lg:px-8 2xl:px-12">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0 min-w-0 max-w-[160px] xs:max-w-[200px] sm:max-w-none">
            {logoUrl ? (
              <img src={logoUrl} alt={siteName} className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 object-contain flex-shrink-0" />
            ) : (
              <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--gold-500)' }}>
                <Package className="w-4 h-4 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" />
              </div>
            )}
            <span className="text-sm sm:text-base md:text-xl font-bold whitespace-nowrap truncate" style={{ color: 'var(--gold-500)' }}>
              {siteName}
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link: any) => {
              const label = (link.labelKey && t[link.labelKey as keyof typeof t]) || link.label || link.defaultLabel;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium transition-colors cursor-pointer hover:underline hover:text-[var(--gold-500)] text-[var(--white)]/80 hover:text-[var(--white)]"
                  style={{ color: 'var(--white)' }}
                >
                  {label}
                </Link>
              );
            })}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            {/* Language Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="px-1.5 sm:px-2.5 py-0.5 h-8 text-[11px] sm:text-xs font-semibold rounded-full border border-white/20 text-[var(--white)]/90 hover:text-[var(--gold-500)] hover:bg-white/10 flex items-center gap-1 transition-all"
                  title="Switch Language / ቋንቋ ይቀይሩ"
                >
                  <span>{language === 'am' ? '🇪🇹' : '🇺🇸'}</span>
                  <span>{language === 'am' ? 'አማ' : 'EN'}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36">
                <DropdownMenuItem
                  onClick={() => setLanguage('en')}
                  className={`flex items-center gap-2 cursor-pointer ${language === 'en' ? 'font-bold text-[var(--gold-600)]' : ''}`}
                >
                  <span>🇺🇸</span> English {language === 'en' && '✓'}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setLanguage('am')}
                  className={`flex items-center gap-2 cursor-pointer ${language === 'am' ? 'font-bold text-[var(--gold-600)]' : ''}`}
                >
                  <span>🇪🇹</span> አማርኛ {language === 'am' && '✓'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {/* Search */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (searchOpen && searchQuery.trim()) {
                  router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
                  setSearchOpen(false);
                  setSearchQuery('');
                } else {
                  setSearchOpen(!searchOpen);
                }
              }}
              className="h-8 w-8 sm:h-9 sm:w-9 text-[var(--white)]/80 hover:text-[var(--white)] hover:bg-white/10 hover:text-[var(--gold-500)]"
            >
              <Search className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="h-8 w-8 sm:h-9 sm:w-9 text-[var(--white)]/80 hover:text-[var(--white)] hover:bg-white/10 hover:text-[var(--gold-500)]"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
            </Button>

            {/* Cart */}
            <Link href="/cart">
              <Button
                variant="ghost"
                size="icon"
                className="relative h-8 w-8 sm:h-9 sm:w-9 text-[var(--white)]/80 hover:text-[var(--white)] hover:bg-white/10 hover:text-[var(--gold-500)]"
              >
                <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                {mounted && itemCount > 0 && (
                  <Badge
                    className="absolute -top-1 -right-1 h-4 min-w-4 sm:h-5 sm:min-w-5 flex items-center justify-center p-0.5 text-[10px] sm:text-xs"
                    style={{ background: 'var(--gold-500)', color: 'var(--navy-800)' }}
                  >
                    {itemCount > 99 ? '99+' : itemCount}
                  </Badge>
                )}
              </Button>
            </Link>

            {/* User Menu */}
            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback className="text-sm font-medium" style={{ background: 'var(--eth-gold-light)', color: 'var(--eth-gold-muted)' }}>
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="flex items-center gap-2">
                      <LayoutDashboard className="w-4 h-4" /> Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/orders" className="flex items-center gap-2">
                      <Package className="w-4 h-4" /> My Orders
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/profile" className="flex items-center gap-2">
                      <Settings className="w-4 h-4" /> Settings
                    </Link>
                  </DropdownMenuItem>
                  {user.role === 'admin' && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="flex items-center gap-2" style={{ color: '#b8860b' }}>
                          <LayoutDashboard className="w-4 h-4" /> Admin Panel
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 flex items-center gap-2">
                    <LogOut className="w-4 h-4" /> Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild className="text-[var(--white)]/80 hover:text-[var(--white)] hover:bg-white/10 hover:text-[var(--gold-500)]">
                  <Link href="/login">Login</Link>
                </Button>
                <Button size="sm" asChild className="hover:opacity-90" style={{ background: 'var(--gold-500)', color: 'var(--white)' }}>
                  <Link href="/register">Sign Up</Link>
                </Button>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <Button variant="ghost" size="icon" className="md:hidden text-[var(--white)]/80 hover:text-[var(--white)] hover:bg-white/10 hover:text-[var(--gold-500)]" onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="pb-4"
            >
              <form onSubmit={handleSearch} className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  autoFocus
                  className="flex-1 px-4 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2"
                  style={{ borderColor: 'var(--eth-border)', background: 'var(--eth-card-bg)', color: 'var(--eth-text-primary)', outlineColor: 'var(--eth-gold)' }}
                />
                <Button type="submit" style={{ background: 'var(--gold-500)', color: 'var(--white)' }} className="hover:opacity-90">
                  Search
                </Button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden pb-4 pt-4" style={{ borderTop: '1px solid rgba(184,134,11,0.2)' }}
            >
              <div className="flex flex-col gap-3">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`text-sm font-medium cursor-pointer hover:underline py-1 ${hasSolidHeader ? 'hover:text-amber-700' : 'text-white/80 hover:text-white'}`}
                    style={hasSolidHeader ? { color: 'var(--eth-text-primary)' } : {}}
                    onClick={() => setIsOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
                {!isAuthenticated && (
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" asChild className="flex-1" style={{ borderColor: '#b8860b', color: '#b8860b' }}>
                      <Link href="/login">Login</Link>
                    </Button>
                    <Button size="sm" asChild className="flex-1 hover:opacity-90" style={{ background: '#b8860b', color: '#fff' }}>
                      <Link href="/register">Sign Up</Link>
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
}
