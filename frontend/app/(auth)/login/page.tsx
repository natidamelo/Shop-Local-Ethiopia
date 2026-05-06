'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Package, Lock, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/lib/store/authStore';
import { useSiteSettings } from '@/lib/useSiteSettings';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/dashboard';
  const { login, isLoading } = useAuthStore();
  const { siteName } = useSiteSettings();
  const [form, setForm] = useState({ email: '', password: '', mfaToken: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [requiresMfa, setRequiresMfa] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await login(form.email, form.password, requiresMfa ? form.mfaToken : undefined);
      if (result.requiresMfa) {
        setRequiresMfa(true);
        toast.info('Please enter your 2FA code');
        return;
      }
      toast.success('Welcome back!');
      router.push(redirectTo);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-violet-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">{siteName}</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-4">
            {requiresMfa ? 'Two-Factor Authentication' : 'Welcome back'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {requiresMfa ? 'Enter your 6-digit authenticator code' : "Don't have an account? "}
            {!requiresMfa && (
              <Link href="/register" className="text-violet-600 hover:underline font-medium">Sign up</Link>
            )}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {!requiresMfa ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                      className="pl-10"
                      autoComplete="username"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link href="/forgot-password" className="text-xs text-violet-600 hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={form.password}
                      onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                      className="pl-10 pr-10"
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="mfaToken">Authenticator Code</Label>
                <Input
                  id="mfaToken"
                  type="text"
                  placeholder="000000"
                  value={form.mfaToken}
                  onChange={(e) => setForm((p) => ({ ...p, mfaToken: e.target.value }))}
                  maxLength={6}
                  className="text-center text-2xl tracking-widest"
                  autoComplete="one-time-code"
                  required
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setRequiresMfa(false)}
                  className="text-xs text-violet-600 hover:underline"
                >
                  Back to login
                </button>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 bg-violet-600 hover:bg-violet-700 text-base"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : requiresMfa ? 'Verify' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center font-medium mb-2">Demo Accounts</p>
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400">
              <div className="text-center">
                <p className="font-medium">Admin</p>
                <p>admin@shopl.com</p>
                <p>Admin@123</p>
              </div>
              <div className="text-center">
                <p className="font-medium">User</p>
                <p>user@shopl.com</p>
                <p>User@123</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
