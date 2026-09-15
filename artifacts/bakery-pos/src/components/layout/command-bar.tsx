import React, { useState, useEffect } from 'react';
import { LogOut, Cloud, CloudOff, Store, ChevronRight, Menu as MenuIcon, ShoppingCart } from 'lucide-react';
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

  return (
    <header className="h-14 w-full bg-[#14161B] border-b border-[#FF6D00]/20 flex items-center justify-between px-4 sticky top-0 z-50 select-none shadow-[0_4px_20px_-2px_rgba(255,109,0,0.15)]">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg relative p-[1px] bg-gradient-to-br from-[#FFD54F] to-[#F4511E] shadow-[0_0_10px_rgba(255,109,0,0.2)]">
          <div className="w-full h-full bg-[#14161B] rounded-[7px] flex items-center justify-center">
            <Store className="w-4 h-4 stroke-[url(#flame-grad)]" />
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-sm">
          <span className="font-bold text-white tracking-wide">Bakery POS</span>
          <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8]" />
          
          <div className="flex items-center gap-1 bg-[#0E0F12] p-1 rounded-lg border border-[#FF6D00]/20">
            <Link href="/dashboard" className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors ${location === '/dashboard' ? 'bg-[#14161B] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]' : 'text-[#94A3B8] hover:text-[#E2E8F0]'}`}>
              <ShoppingCart className={`w-3.5 h-3.5 ${location === '/dashboard' ? 'stroke-[url(#flame-grad)]' : ''}`} />
              Register
            </Link>
            <Link href="/menu" className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors ${location === '/menu' ? 'bg-[#14161B] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]' : 'text-[#94A3B8] hover:text-[#E2E8F0]'}`}>
              <MenuIcon className={`w-3.5 h-3.5 ${location === '/menu' ? 'stroke-[url(#flame-grad)]' : ''}`} />
              Menu & Prices
            </Link>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0E0F12] border border-[#FF6D00]/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
          {isOnline ? (
            <>
              <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
              <span className="text-xs font-mono text-[#E2E8F0]">Connected</span>
              <Cloud className="w-3.5 h-3.5 text-[#10B981] ml-1" />
            </>
          ) : (
            <>
              <div className="w-2 h-2 rounded-full bg-[#F4511E] shadow-[0_0_8px_rgba(244,81,30,0.6)]" />
              <span className="text-xs font-mono text-[#F4511E]">Offline Mode</span>
              <CloudOff className="w-3.5 h-3.5 text-[#F4511E] ml-1" />
            </>
          )}
        </div>

        <div className="h-4 w-px bg-[#FF6D00]/20 hidden sm:block" />
        
        <div className="flex items-center gap-3">
          <div className="text-xs text-right hidden sm:block">
            <div className="text-white font-bold">{user?.email?.split('@')[0]}</div>
            <div className="text-[#94A3B8]">Shift Active</div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={signOut}
            className="group text-[#94A3B8] hover:bg-[#1A1D24] active:scale-95 transition-all rounded-xl"
            title="End Shift & Sign Out"
          >
            <LogOut className="w-4 h-4 transition-all group-hover:stroke-[url(#flame-grad)]" />
          </Button>
        </div>
      </div>
    </header>
  );
}
