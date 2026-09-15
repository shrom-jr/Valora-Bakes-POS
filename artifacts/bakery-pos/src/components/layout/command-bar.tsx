import React, { useState, useEffect } from 'react';
import { LogOut, Cloud, CloudOff, Store, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';

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
    <header className="h-14 w-full bg-[#1C1E24] border-b border-[#FF8A00]/20 flex items-center justify-between px-4 sticky top-0 z-50 select-none shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FFB300]/20 to-[#FF5400]/20 border border-[#FF8A00]/40 flex items-center justify-center text-[#FF8A00] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
          <Store className="w-4 h-4" />
        </div>
        
        <div className="flex items-center gap-2 text-sm">
          <span className="font-semibold text-white tracking-wide">Bakery POS</span>
          <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8]" />
          <span className={location === '/dashboard' ? 'text-white' : 'text-[#94A3B8]'}>
            Register
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#111215] border border-[#FF8A00]/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
          {isOnline ? (
            <>
              <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
              <span className="text-xs font-mono text-[#CBD5E1]">Connected</span>
              <Cloud className="w-3.5 h-3.5 text-[#10B981] ml-1" />
            </>
          ) : (
            <>
              <div className="w-2 h-2 rounded-full bg-[#EF4444] shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
              <span className="text-xs font-mono text-[#EF4444]">Offline Mode</span>
              <CloudOff className="w-3.5 h-3.5 text-[#EF4444] ml-1" />
            </>
          )}
        </div>

        <div className="h-4 w-px bg-[#FF8A00]/20 hidden sm:block" />
        
        <div className="flex items-center gap-3">
          <div className="text-xs text-right hidden sm:block">
            <div className="text-white font-medium">{user?.email?.split('@')[0]}</div>
            <div className="text-[#94A3B8]">Shift Active</div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={signOut}
            className="text-[#94A3B8] hover:text-white hover:bg-[#21232B] active:scale-95 transition-all rounded-xl"
            title="End Shift & Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
