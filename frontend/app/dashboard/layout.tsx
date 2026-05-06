'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Package, User, Shield, MapPin, CreditCard, LogOut, Heart, Store } from 'lucide-react';
import { useAuthStore } from '@/lib/store/authStore';
import { toast } from 'sonner';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { href: '/dashboard/wishlist', icon: Heart, label: 'Wishlist' },
  { href: '/dashboard/orders', icon: Package, label: 'My Orders' },
  { href: '/dashboard/vendor-applications', icon: Store, label: 'My Bazar Vendor' },
  { href: '/dashboard/profile', icon: User, label: 'Profile' },
  { href: '/dashboard/addresses', icon: MapPin, label: 'Addresses' },
  { href: '/dashboard/payments', icon: CreditCard, label: 'Payments' },
  { href: '/dashboard/security', icon: Shield, label: 'Security' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    router.push('/');
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[var(--eth-section-bg)] via-background to-background dark:from-gray-950 dark:via-gray-950 dark:to-gray-950">
      <div className="w-full px-4 sm:px-6 lg:px-8 2xl:px-12 py-6 sm:py-8 pt-28 sm:pt-32">
        <div className="grid gap-6 lg:gap-8 lg:grid-cols-[320px_minmax(0,1fr)] items-start">
          {/* Sidebar */}
          <div className="lg:sticky lg:top-28">
            <div className="bg-white/80 dark:bg-gray-900/60 backdrop-blur-md rounded-3xl p-5 sm:p-6 shadow-sm border border-gray-100/70 dark:border-white/10">
              <div className="flex items-center gap-3 mb-5 pb-5 border-b border-gray-100/70 dark:border-white/10">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-sm bg-gradient-to-br from-violet-500 via-indigo-500 to-sky-500">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">{user?.name}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
              </div>

              <nav className="space-y-1 max-h-[calc(100vh-10rem)] overflow-auto pr-1 -mr-1">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-violet-100/80 text-violet-800 dark:bg-violet-900/25 dark:text-violet-200 shadow-sm'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100/70 dark:hover:bg-white/10'
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </Link>
                  );
                })}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50/80 dark:hover:bg-red-900/15 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </div>
  );
}
