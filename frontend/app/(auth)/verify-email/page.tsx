'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle2, Package, XCircle } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { useSiteSettings } from '@/lib/useSiteSettings';

type Status = 'idle' | 'verifying' | 'success' | 'error';

function VerifyEmailInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { siteName } = useSiteSettings();
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('Verification token is missing.');
      return;
    }

    const verify = async () => {
      setStatus('verifying');
      try {
        const res = await api.get('/auth/verify-email', { params: { token } });
        setMessage(res.data?.message || 'Email verified successfully.');
        setStatus('success');
        // After a short delay, redirect to login
        setTimeout(() => router.push('/login'), 2500);
      } catch (error: any) {
        const errMsg = error.response?.data?.message || 'Verification failed. The link may have expired.';
        setMessage(errMsg);
        setStatus('error');
      }
    };

    verify();
  }, [searchParams, router]);

  const isLoading = status === 'idle' || status === 'verifying';

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-violet-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
              {siteName}
            </span>
          </Link>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center space-y-4">
          {isLoading && (
            <>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">Verifying your email...</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Please wait while we confirm your email address.
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <p className="text-lg font-semibold text-gray-900 dark:text-white">Email verified!</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
              <Button className="mt-4 w-full" onClick={() => router.push('/login')}>
                Go to Login
              </Button>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="w-12 h-12 text-red-500 mx-auto" />
              <p className="text-lg font-semibold text-gray-900 dark:text-white">Verification failed</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
              <Button variant="outline" className="mt-4 w-full" onClick={() => router.push('/login')}>
                Back to Login
              </Button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailInner />
    </Suspense>
  );
}

