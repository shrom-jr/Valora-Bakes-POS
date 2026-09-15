import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/auth-context';
import CommandBar from './command-bar';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!loading && !user && mounted) {
      setLocation('/sign-in');
    }
  }, [user, loading, setLocation, mounted]);

  if (loading || !mounted) {
    return (
      <div className="min-h-[100dvh] w-full bg-[#111215] flex flex-col items-center justify-center">
        {/* Shimmer skeleton for boot */}
        <div className="w-full h-14 bg-[#1C1E24] border-b border-[#FF8A00]/20 animate-pulse absolute top-0 left-0" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-[100dvh] w-full bg-[#111215] flex flex-col overflow-hidden overscroll-none text-white selection:bg-[#FF8A00]/30">
      <CommandBar />
      <main className="flex-1 w-full flex flex-col overflow-hidden relative z-0">
        {children}
      </main>
    </div>
  );
}
