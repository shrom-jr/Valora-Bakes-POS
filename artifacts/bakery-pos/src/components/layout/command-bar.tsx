import React, { useState, useEffect } from 'react';
import { LogOut, Cloud, CloudOff, Store, LayoutDashboard, ShoppingCart } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { useLocation, Link } from 'wouter';

export default function CommandBar() {
  const { signOut, user } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
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

  return (
    <header className="h-14 w-full bg-[#14161B] border-b border-[#FF6D00]/20 flex items-center justify-between px-4 sticky top-0 z-50 select-none shadow-[0_4px_20px_-2px_rgba(255,109,0,0.15)]">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg relative p-[1px] bg-gradient-to-br from-[#FFD54F] to-[#F4511E] shadow-[0_0_10px_rgba(255,109,0,0.2)]">
          <div className="w-full h-full bg-[#14161B] rounded-[7px] flex items-center justify-center">
            <Store className="w-4 h-4 stroke-[url(#flame-grad)]" />
          </div>
        </div>
        
        <span className="font-bold text-white tracking-wide">Bakery POS</span>
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

        <div className="flex items-center gap-2 rounded-full border border-[#FF6D00]/20 bg-[#0E0F12] py-1 pl-2 pr-1 sm:gap-3 sm:pl-3">
          <span className="max-w-[88px] truncate text-xs font-semibold text-[#E2E8F0] sm:max-w-[140px]">{user?.email?.split('@')[0] || 'Staff'}</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={signOut}
            className="group h-8 w-8 rounded-full text-[#94A3B8] transition-all hover:bg-[#1A1D24] active:scale-95"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4 transition-all group-hover:stroke-[url(#flame-grad)]" />
          </Button>
        </div>
      </div>
    </header>
  );
}
