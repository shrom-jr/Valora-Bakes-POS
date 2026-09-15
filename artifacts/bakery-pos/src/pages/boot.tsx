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
    <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center bg-[#111215] text-white relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#FF8A00]/10 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="z-10 flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-700 ease-out">
        <div className="w-16 h-16 rounded-2xl bg-[#1C1E24] border border-[#FF8A00]/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_8px_32px_rgba(0,0,0,0.5)] flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#FF8A00]/10 to-transparent opacity-50" />
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#FFB300] via-[#FF8A00] to-[#FF5400] relative animate-pulse shadow-[0_0_15px_rgba(255,138,0,0.6)]" />
        </div>
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-xl font-semibold tracking-tight text-white">Bakery POS</h1>
          <div className="flex items-center gap-2 text-[#CBD5E1] text-sm font-mono">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Initializing system...</span>
          </div>
        </div>
      </div>
    </div>
  );
}
