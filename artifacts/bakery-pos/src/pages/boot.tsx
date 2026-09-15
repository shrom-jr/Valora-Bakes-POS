import React from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useLocation } from 'wouter';
import { useEffect } from 'react';

export default function Boot() {
  const { user, loading, isConfigured } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading) {
      if (!isConfigured) {
        // Will be handled by the sign-in page, which shows the config message
        setLocation('/sign-in');
      } else if (user) {
        setLocation('/dashboard');
      } else {
        setLocation('/sign-in');
      }
    }
  }, [user, loading, isConfigured, setLocation]);

  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center bg-[#0E0F12] text-white relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#FF6D00]/10 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="z-10 flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-700 ease-out">
        <div className="relative rounded-2xl p-[1px] bg-gradient-to-br from-[#FFD54F] via-[#FF6D00] to-transparent shadow-[0_4px_20px_-2px_rgba(255,109,0,0.15),0_0_0_1px_rgba(255,140,0,0.25)]">
          <div className="w-16 h-16 rounded-2xl bg-[#14161B] flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#FF6D00]/10 to-transparent opacity-50" />
            <div className="w-8 h-8 rounded-xl bg-gradient-to-r from-[#FFB300] via-[#FF6D00] to-[#F4511E] relative animate-pulse shadow-[0_0_20px_rgba(255,109,0,0.4)]" />
          </div>
        </div>
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-xl font-bold tracking-tight text-white">Bakery POS</h1>
          <div className="flex items-center gap-2 text-[#E2E8F0] text-sm font-mono">
            <Loader2 className="w-3.5 h-3.5 animate-spin stroke-[url(#flame-grad)]" />
            <span>Initializing system...</span>
          </div>
        </div>
      </div>
    </div>
  );
}
