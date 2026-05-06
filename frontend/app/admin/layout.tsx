'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Users, Package, ShoppingBag, Tag, BarChart3, Settings, LogOut, DollarSign, Palette, Warehouse, Store, Truck, HelpCircle, ChevronDown, ChevronRight, FolderOpen } from 'lucide-react';
import { useAuthStore } from '@/lib/store/authStore';
import { toast } from 'sonner';
import Navbar from '@/components/layout/Navbar';
import api from '@/lib/api';

type Category = { _id: string; name: string; slug: string; sortOrder?: number };

const navItemsBeforeProducts = [
  { href: '/admin', icon: LayoutDashboard, label: 'Overview' },
  { href: '/admin/users', icon: Users, label: 'Users' },
];
const navItemsAfterProducts = [
  { href: '/admin/inventory', icon: Warehouse, label: 'Inventory' },
  { href: '/admin/orders', icon: ShoppingBag, label: 'Orders' },
  { href: '/admin/finance', icon: DollarSign, label: 'Finance' },
  { href: '/admin/coupons', icon: Tag, label: 'Coupons' },
  { href: '/admin/shipping', icon: Truck, label: 'Shipping Rates' },
  { href: '/admin/vendor-applications', icon: Store, label: 'Bazar Vendors' },
  { href: '/admin/hero-editor', icon: Palette, label: 'Hero Page' },
  { href: '/admin/support-pages', icon: HelpCircle, label: 'Support Pages' },
  { href: '/admin/settings', icon: Settings, label: 'Site Settings' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [productsOpen, setProductsOpen] = useState(pathname.startsWith('/admin/products'));
  const [currentCategory, setCurrentCategory] = useState<string | null>(null);

  useEffect(() => {
    if (pathname === '/admin/products' && typeof window !== 'undefined')
      setCurrentCategory(new URLSearchParams(window.location.search).get('category'));
    else setCurrentCategory(null);
  }, [pathname]);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      router.push('/login');
    }
  }, [isAuthenticated, user, router]);

  useEffect(() => {
    api.get('/products/categories')
      .then((res) => setCategories(res.data?.data ?? []))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    if (pathname.startsWith('/admin/products')) setProductsOpen(true);
  }, [pathname]);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        <div className="grid lg:grid-cols-5 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm sticky top-24">
              <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-100 dark:border-gray-700">
                <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-gray-900 dark:text-white text-sm">Admin Panel</span>
              </div>
              <nav className="space-y-1">
                {navItemsBeforeProducts.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </Link>
                  );
                })}

                {/* Products: expandable with categories */}
                <div className="space-y-0.5">
                  <button
                    type="button"
                    onClick={() => setProductsOpen((o) => !o)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      pathname.startsWith('/admin/products')
                        ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Package className="w-4 h-4" />
                    Products
                    {productsOpen ? <ChevronDown className="w-4 h-4 ml-auto" /> : <ChevronRight className="w-4 h-4 ml-auto" />}
                  </button>
                  {productsOpen && (
                    <div className="pl-4 pr-2 py-1 space-y-0.5 border-l-2 border-gray-200 dark:border-gray-600 ml-3">
                      <Link
                        href="/admin/products"
                        className={`block py-2 px-2 rounded-lg text-sm transition-all ${
                          pathname === '/admin/products' && !currentCategory
                            ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 font-medium'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        All Products
                      </Link>
                      {categories.map((cat) => {
                        const isActive = currentCategory === cat.slug;
                        return (
                          <Link
                            key={cat._id}
                            href={`/admin/products?category=${encodeURIComponent(cat.slug)}`}
                            className={`flex items-center gap-2 py-2 px-2 rounded-lg text-sm transition-all ${
                              isActive
                                ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 font-medium'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                          >
                            <FolderOpen className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="truncate">{cat.name}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>

                {navItemsAfterProducts.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </Link>
                  );
                })}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-4">{children}</div>
        </div>
      </div>
    </div>
  );
}
