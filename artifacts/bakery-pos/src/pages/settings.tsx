import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, LockKeyhole, Printer, RefreshCw, Save, Settings as SettingsIcon, Store } from 'lucide-react';
import { updatePassword } from 'firebase/auth';
import { AppShell } from '@/components/layout/app-shell';
import DashboardShell from '@/components/layout/dashboard-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/auth-context';
import { useStoreSettings } from '@/hooks/use-rtdb';
import { ReceiptWidth, StoreProfile, updateCustomerCredit, updateReceiptWidth, updateStoreProfile } from '@/lib/rtdb';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

const emptyProfile: StoreProfile = {
  bakeryName: '',
  branchAddress: '',
  phone: '',
  panVat: '',
  greeting: '',
  footer: '',
};

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { settings, loading, error } = useStoreSettings();
  const [profile, setProfile] = useState<StoreProfile>(emptyProfile);
  const [profileSaving, setProfileSaving] = useState(false);
  const [creditSaving, setCreditSaving] = useState(false);
  const [receiptSaving, setReceiptSaving] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    setProfile(settings.profile);
  }, [settings.profile]);

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!profile.bakeryName.trim()) return;
    setProfileSaving(true);
    try {
      await updateStoreProfile({
        ...profile,
        bakeryName: profile.bakeryName.trim(),
        branchAddress: profile.branchAddress.trim(),
        phone: profile.phone.trim(),
        panVat: profile.panVat.trim(),
        greeting: profile.greeting.trim(),
        footer: profile.footer.trim(),
      });
      toast({ title: 'Business profile saved', description: 'Receipt header and footer details are up to date.' });
    } catch (err: any) {
      toast({ title: 'Profile not saved', description: err?.message || 'Could not save business profile.', variant: 'destructive' });
    } finally {
      setProfileSaving(false);
    }
  };

  const toggleCredit = async (enabled: boolean) => {
    setCreditSaving(true);
    try {
      await updateCustomerCredit(enabled);
      toast({ title: enabled ? 'Customer credit enabled' : 'Customer credit disabled', description: 'The register remains Cash and QR only while this feature is dormant.' });
    } catch (err: any) {
      toast({ title: 'Feature setting not saved', description: err?.message || 'Could not update customer credit.', variant: 'destructive' });
    } finally {
      setCreditSaving(false);
    }
  };

  const changeReceiptWidth = async (width: ReceiptWidth) => {
    setReceiptSaving(true);
    try {
      await updateReceiptWidth(width);
      toast({ title: 'Receipt format updated', description: `${width} thermal roll selected for new receipts.` });
    } catch (err: any) {
      toast({ title: 'Receipt format not saved', description: err?.message || 'Could not update receipt format.', variant: 'destructive' });
    } finally {
      setReceiptSaving(false);
    }
  };

  const changePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setPasswordError('');
    if (password.length < 6) {
      setPasswordError('Use at least 6 characters for the new password.');
      return;
    }
    if (password !== passwordConfirm) {
      setPasswordError('The password confirmation does not match.');
      return;
    }
    if (!auth || !user) {
      setPasswordError('No active Firebase staff session is available.');
      return;
    }
    setPasswordSaving(true);
    try {
      await updatePassword(user, password);
      setPassword('');
      setPasswordConfirm('');
      toast({ title: 'Password updated', description: 'Your Firebase staff password was changed successfully.' });
    } catch (err: any) {
      const message = err?.code === 'auth/requires-recent-login'
        ? 'For security, sign in again before changing your password.'
        : err?.message || 'Could not update the password.';
      setPasswordError(message);
    } finally {
      setPasswordSaving(false);
    }
  };

  if (error) {
    return (
      <AppShell>
        <DashboardShell>
          <div className="flex min-h-full flex-col items-center justify-center bg-[#0E0F12] p-8 text-center">
            <AlertCircle className="mb-4 h-10 w-10 text-[#F4511E]" />
            <p className="font-bold text-white">Unable to load store settings</p>
            <Button onClick={() => window.location.reload()} variant="outline" className="mt-5 border-[#F4511E]/25 bg-[#14161B] text-white hover:bg-[#2A2D35]">
              <RefreshCw className="mr-2 h-4 w-4" /> Retry
            </Button>
          </div>
        </DashboardShell>
      </AppShell>
    );
  }

  if (loading) {
    return (
      <AppShell>
        <DashboardShell>
          <div className="flex min-h-full items-center justify-center bg-[#0E0F12]">
            <SettingsIcon className="h-8 w-8 animate-pulse text-[#FF6D00]" />
          </div>
        </DashboardShell>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <DashboardShell>
        <div className="min-h-full bg-[#0E0F12]">
          <main className="mx-auto w-full max-w-5xl space-y-6">
            <header>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#FFB300]">Configuration & security</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-white md:text-4xl">Store Settings</h1>
              <p className="mt-2 text-sm text-[#94A3B8]">Manage the business identity, receipts, feature readiness, and staff access.</p>
            </header>

            <form onSubmit={saveProfile} className="rounded-2xl border border-[#FF6D00]/15 bg-[#14161B] p-5 md:p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-amber-500/30 bg-[#F7F0E3] p-1">
                    <img src="/brand-mark.png?v=1" alt="Valora Bakes brand mark" className="h-10 w-10 object-contain" />
                  </div>
                  <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#94A3B8]">Business identity</p>
                  <h2 className="mt-2 text-xl font-bold text-white">Business Profile</h2>
                  </div>
                </div>
                <Store className="h-5 w-5 text-[#FFD54F]" />
              </div>
              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Bakery Name" value={profile.bakeryName} onChange={(value) => setProfile({ ...profile, bakeryName: value })} required />
                <Field label="Branch / Address" value={profile.branchAddress} onChange={(value) => setProfile({ ...profile, branchAddress: value })} placeholder="Pepsicola, Kathmandu" />
                <Field label="Contact Phone Number" value={profile.phone} onChange={(value) => setProfile({ ...profile, phone: value })} />
                <Field label="PAN / VAT Registration Number" value={profile.panVat} onChange={(value) => setProfile({ ...profile, panVat: value })} />
                <Field label="Receipt Greeting" value={profile.greeting} onChange={(value) => setProfile({ ...profile, greeting: value })} placeholder="Fresh Bakes Everyday" />
                <Field label="Receipt Footer" value={profile.footer} onChange={(value) => setProfile({ ...profile, footer: value })} placeholder="Thank you for your visit!" />
              </div>
              <div className="mt-5 flex justify-end">
                <Button type="submit" disabled={profileSaving || !profile.bakeryName.trim()} className="border-none bg-gradient-to-r from-[#FFB300] via-[#FF6D00] to-[#F4511E] font-bold text-white hover:brightness-110">
                  <Save className="mr-2 h-4 w-4" /> {profileSaving ? 'Saving…' : 'Save Profile'}
                </Button>
              </div>
            </form>

            <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <article className="rounded-2xl border border-[#FF6D00]/15 bg-[#14161B] p-5 md:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#94A3B8]">Feature readiness</p>
                    <h2 className="mt-2 text-xl font-bold text-white">Feature Toggles</h2>
                  </div>
                  <SettingsIcon className="h-5 w-5 text-[#FFD54F]" />
                </div>
                <div className="mt-6 flex items-start justify-between gap-4 rounded-xl border border-[#2A2D35] bg-[#0E0F12] p-4">
                  <div>
                    <p className="font-semibold text-white">Customer Credit / Udharo System</p>
                    <p className="mt-1 text-xs leading-5 text-[#94A3B8]">Readiness toggle only. The register continues to process Cash and QR while credit workflows remain dormant.</p>
                  </div>
                  <Switch checked={settings.features.customerCredit} disabled={creditSaving} onCheckedChange={toggleCredit} aria-label="Customer Credit / Udharo System" />
                </div>
              </article>

              <article className="rounded-2xl border border-[#FF6D00]/15 bg-[#14161B] p-5 md:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#94A3B8]">Thermal output</p>
                    <h2 className="mt-2 text-xl font-bold text-white">Receipt Format</h2>
                  </div>
                  <Printer className="h-5 w-5 text-[#FFD54F]" />
                </div>
                <div className="mt-6 grid grid-cols-2 gap-2 rounded-xl border border-[#2A2D35] bg-[#0E0F12] p-1">
                  {(['80mm', '58mm'] as ReceiptWidth[]).map((width) => (
                    <button
                      key={width}
                      type="button"
                      disabled={receiptSaving}
                      onClick={() => void changeReceiptWidth(width)}
                      className={`min-h-12 rounded-lg px-3 text-xs font-bold transition ${
                        settings.receipt.width === width
                          ? 'bg-[#FF6D00]/20 text-[#FFD54F] shadow-[inset_0_0_0_1px_rgba(255,109,0,0.35)]'
                          : 'text-[#94A3B8] hover:bg-[#2A2D35] hover:text-white'
                      }`}
                    >
                      {width === '80mm' ? '80mm Standard Roll' : '58mm Handheld Roll'}
                    </button>
                  ))}
                </div>
              </article>
            </section>

            <form onSubmit={changePassword} className="rounded-2xl border border-[#FF6D00]/15 bg-[#14161B] p-5 md:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#94A3B8]">Staff access</p>
                  <h2 className="mt-2 text-xl font-bold text-white">Security & Password</h2>
                </div>
                <LockKeyhole className="h-5 w-5 text-[#FFD54F]" />
              </div>
              <p className="mt-3 text-sm text-[#94A3B8]">Update the password for the currently signed-in Firebase staff account.</p>
              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="New Password" value={password} onChange={setPassword} type="password" placeholder="At least 6 characters" />
                <Field label="Confirm New Password" value={passwordConfirm} onChange={setPasswordConfirm} type="password" />
              </div>
              {passwordError && <p role="alert" className="mt-4 rounded-lg border border-[#F4511E]/25 bg-[#F4511E]/10 px-3 py-2 text-xs font-semibold text-[#FFB39D]">{passwordError}</p>}
              <div className="mt-5 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                <p className="text-xs text-[#64748B]">{user?.email || 'Authenticated staff account'}</p>
                <Button type="submit" disabled={passwordSaving || !password || !passwordConfirm} variant="outline" className="border-[#FFB300]/35 bg-[#FFB300]/10 font-bold text-[#FFD54F] hover:bg-[#FFB300]/20 hover:text-white">
                  <LockKeyhole className="mr-2 h-4 w-4" /> {passwordSaving ? 'Updating…' : 'Update Password'}
                </Button>
              </div>
            </form>
          </main>
        </div>
      </DashboardShell>
    </AppShell>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-bold text-[#E2E8F0]">{label}</span>
      <Input
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 border-[#2A2D35] bg-[#0E0F12] text-white focus-visible:ring-[#FF6D00]"
      />
    </label>
  );
}