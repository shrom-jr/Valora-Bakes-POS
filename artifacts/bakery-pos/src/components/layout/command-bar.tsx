import React, { useState, useEffect } from 'react';
import { LogOut, Cloud, CloudOff, LayoutDashboard, ShoppingCart } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useLocation, Link } from 'wouter';
import { useStoreSettings } from '@/hooks/use-rtdb';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

export default function CommandBar() {
  const { signOut, user } = useAuth();
  const { settings } = useStoreSettings();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const isDashboard = location.startsWith('/dashboard');
  const primaryHref = isDashboard ? '/register' : '/dashboard';
  const primaryLabel = isDashboard ? 'Counter Register' : 'Dashboard';
  const businessName = settings.profile.bakeryName.trim() || 'Valora Cakes & Pastries';
  const emailPrefix = user?.email?.split('@')[0]?.replace(/[._-]+/g, ' ').trim() || '';
  const staffName = user?.displayName?.trim()
    || emailPrefix.replace(/\b[a-z]/g, (letter) => letter.toUpperCase())
    || 'Staff';
  const staffInitials = staffName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => Array.from(part)[0]?.toUpperCase() || '')
    .join('') || 'ST';

  const confirmSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      setIsLogoutOpen(false);
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <header className="h-14 w-full bg-[#14161B] border-b border-[#FF6D00]/20 flex items-center justify-between px-4 sticky top-0 z-50 select-none shadow-[0_4px_20px_-2px_rgba(255,109,0,0.15)]">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/30 bg-[#F7F0E3] p-1">
          <img
            src={__LOGO_URL__}
            alt="Valora Bakes"
            className="h-8 w-8 object-contain"
          />
        </div>
        
        <div className="min-w-0">
          <div className="brand-business-name max-w-[220px] truncate text-sm leading-none text-white" title={businessName}>{businessName}</div>
          <div className="brand-powered-by mt-1 text-[7px] leading-none text-[#FFD54F]">Powered by Shramik Rawal</div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Link
          href={primaryHref}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-[#FFB300] via-[#FF6D00] to-[#F4511E] px-3 text-xs font-bold text-white shadow-[0_0_16px_rgba(255,109,0,0.22)] transition hover:brightness-110 sm:px-4 sm:text-sm"
        >
          {isDashboard ? <ShoppingCart className="h-4 w-4" /> : <LayoutDashboard className="h-4 w-4" />}
          <span>{primaryLabel}</span>
        </Link>

        <div className="flex items-center gap-2 rounded-full border border-[#10B981]/20 bg-[#0E0F12] px-2.5 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] sm:px-3">
          {isOnline ? (
            <>
              <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
              <span className="hidden text-xs font-mono text-[#E2E8F0] sm:inline">Online</span>
              <Cloud className="ml-1 h-3.5 w-3.5 text-[#10B981]" />
            </>
          ) : (
            <>
              <div className="w-2 h-2 rounded-full bg-[#F4511E] shadow-[0_0_8px_rgba(244,81,30,0.6)]" />
              <span className="hidden text-xs font-mono text-[#F4511E] sm:inline">Offline</span>
              <CloudOff className="ml-1 h-3.5 w-3.5 text-[#F4511E]" />
            </>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/dashboard/settings"
            title="Store Settings"
            className="flex min-w-0 cursor-pointer items-center gap-2.5 rounded-lg border border-amber-500/30 bg-[#1a1e27] px-3 py-1.5 shadow-sm transition-colors hover:border-amber-500/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          >
            <span aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-amber-500/40 bg-amber-500/20 text-xs font-bold text-amber-300">
              {staffInitials}
            </span>
            <span className="max-w-[88px] truncate text-sm font-medium text-white sm:max-w-[140px]">{staffName}</span>
          </Link>
          <button
            type="button"
            onClick={() => setIsLogoutOpen(true)}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-300 transition-colors hover:bg-red-500/20 hover:text-red-200"
            title="Log Out"
            aria-label="Log Out"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Log Out</span>
          </button>
        </div>
      </div>
      <Dialog open={isLogoutOpen} onOpenChange={setIsLogoutOpen}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-sm gap-6 rounded-2xl border border-white/10 bg-[#14161B] p-6 text-white shadow-2xl [&>button]:hidden">
          <DialogTitle className="text-center text-base font-bold leading-snug text-white">
            Are you sure you want to log out?
          </DialogTitle>
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setIsLogoutOpen(false)}
              className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-neutral-300 transition-colors hover:bg-white/10"
            >
              Stay Signed In
            </button>
            <button
              type="button"
              onClick={() => void confirmSignOut()}
              disabled={isSigningOut}
              className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-500 disabled:cursor-wait disabled:opacity-70"
            >
              Yes, Log Out
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
}
