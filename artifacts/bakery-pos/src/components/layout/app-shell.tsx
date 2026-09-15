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
      <div className="min-h-[100dvh] w-full bg-background flex flex-col items-center justify-center">
        {/* Shimmer skeleton for boot */}
        <div className="w-full h-14 bg-card border-b border-border animate-pulse absolute top-0 left-0" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-[100dvh] w-full bg-background flex flex-col overflow-hidden overscroll-none text-foreground selection:bg-primary/30">
      <CommandBar />
      <main className="flex-1 w-full flex flex-col overflow-hidden relative z-0">
        {children}
      </main>
    </div>
  );
}
