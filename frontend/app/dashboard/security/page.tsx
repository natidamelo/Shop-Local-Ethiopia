'use client';

import { useState } from 'react';
import { Shield, Lock, Smartphone, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Navbar from '@/components/layout/Navbar';
import { useAuthStore } from '@/lib/store/authStore';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function SecurityPage() {
  const { user, updateUser } = useAuthStore();
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [mfaSetup, setMfaSetup] = useState<{ qrCode: string; secret: string } | null>(null);
  const [mfaToken, setMfaToken] = useState('');
  const [mfaLoading, setMfaLoading] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setPasswordLoading(true);
    try {
      await api.put('/users/password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success('Password changed successfully!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSetupMfa = async () => {
    setMfaLoading(true);
    try {
      const res = await api.post('/auth/mfa/setup');
      setMfaSetup(res.data.data);
    } catch (err: any) {
      toast.error('Failed to setup MFA');
    } finally {
      setMfaLoading(false);
    }
  };

  const handleVerifyMfa = async () => {
    if (!mfaToken) return;
    setMfaLoading(true);
    try {
      await api.post('/auth/mfa/verify', { token: mfaToken });
      updateUser({ mfaEnabled: true });
      toast.success('Two-factor authentication enabled!');
      setMfaSetup(null);
      setMfaToken('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid token');
    } finally {
      setMfaLoading(false);
    }
  };

  const handleDisableMfa = async () => {
    if (!mfaToken) return;
    setMfaLoading(true);
    try {
      await api.post('/auth/mfa/disable', { token: mfaToken });
      updateUser({ mfaEnabled: false });
      toast.success('Two-factor authentication disabled');
      setMfaToken('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid token');
    } finally {
      setMfaLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Security Settings</h1>

        {/* Change Password */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-violet-100 dark:bg-violet-900/30 rounded-xl flex items-center justify-center">
              <Lock className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">Change Password</h2>
              <p className="text-sm text-gray-500">Update your account password</p>
            </div>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
            <div className="space-y-2">
              <Label>Current Password</Label>
              <div className="relative">
                <Input
                  type={showPasswords.current ? 'text' : 'password'}
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }))}
                  className="pr-10"
                  autoComplete="current-password"
                  required
                />
                <button type="button" onClick={() => setShowPasswords((p) => ({ ...p, current: !p.current }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>New Password</Label>
              <div className="relative">
                <Input
                  type={showPasswords.new ? 'text' : 'password'}
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))}
                  className="pr-10"
                  autoComplete="new-password"
                  required
                  minLength={6}
                />
                <button type="button" onClick={() => setShowPasswords((p) => ({ ...p, new: !p.new }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Confirm New Password</Label>
              <Input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                autoComplete="new-password"
                required
              />
            </div>
            <Button type="submit" className="bg-violet-600 hover:bg-violet-700" disabled={passwordLoading}>
              {passwordLoading ? 'Changing...' : 'Change Password'}
            </Button>
          </form>
        </div>

        {/* MFA */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">Two-Factor Authentication</h2>
              <p className="text-sm text-gray-500">Add an extra layer of security</p>
            </div>
            <div className="ml-auto">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${user?.mfaEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                {user?.mfaEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>

          {!user?.mfaEnabled ? (
            <>
              {!mfaSetup ? (
                <Button onClick={handleSetupMfa} disabled={mfaLoading} className="bg-green-600 hover:bg-green-700">
                  <Shield className="w-4 h-4 mr-2" />
                  {mfaLoading ? 'Setting up...' : 'Enable 2FA'}
                </Button>
              ) : (
                <div className="space-y-4 max-w-sm">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                  </p>
                  <img src={mfaSetup.qrCode} alt="QR Code" className="w-48 h-48 rounded-xl border" />
                  <div className="space-y-2">
                    <Label>Enter the 6-digit code from your app</Label>
                    <Input
                      type="text"
                      placeholder="000000"
                      value={mfaToken}
                      onChange={(e) => setMfaToken(e.target.value)}
                      maxLength={6}
                      className="text-center text-xl tracking-widest"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleVerifyMfa} disabled={mfaLoading || mfaToken.length !== 6} className="bg-green-600 hover:bg-green-700">
                      Verify & Enable
                    </Button>
                    <Button variant="outline" onClick={() => setMfaSetup(null)}>Cancel</Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-4 max-w-sm">
              <p className="text-sm text-gray-600 dark:text-gray-400">Enter your authenticator code to disable 2FA</p>
              <Input
                type="text"
                placeholder="000000"
                value={mfaToken}
                onChange={(e) => setMfaToken(e.target.value)}
                maxLength={6}
                className="text-center text-xl tracking-widest"
              />
              <Button onClick={handleDisableMfa} disabled={mfaLoading || mfaToken.length !== 6} variant="destructive">
                Disable 2FA
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
