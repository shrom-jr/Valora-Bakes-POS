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
      <div className="min-h-[100dvh] w-full bg-[#0E0F12] flex flex-col items-center justify-center">
        {/* Shimmer skeleton for boot */}
        <div className="w-full h-14 bg-[#14161B] border-b border-[#FF6D00]/20 animate-pulse absolute top-0 left-0" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-[100dvh] w-full bg-[#0E0F12] flex flex-col text-white selection:bg-[#FF6D00]/30">
      <CommandBar />
      <main className="flex min-h-0 flex-1 w-full flex-col relative z-0">
        {children}
      </main>
    </div>
  );
}
