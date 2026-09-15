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
    <header className="h-14 w-full bg-card/80 backdrop-blur-md border-b border-border/60 flex items-center justify-between px-4 sticky top-0 z-50 select-none">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
          <Store className="w-4 h-4" />
        </div>
        
        <div className="flex items-center gap-2 text-sm">
          <span className="font-semibold text-white tracking-wide">LUMIÈRE</span>
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
          <span className={location === '/dashboard' ? 'text-white' : 'text-muted-foreground'}>
            Register
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/50 border border-border/50">
          {isOnline ? (
            <>
              <div className="w-2 h-2 rounded-full bg-success animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <span className="text-xs font-mono text-muted-foreground">Connected</span>
              <Cloud className="w-3.5 h-3.5 text-success ml-1" />
            </>
          ) : (
            <>
              <div className="w-2 h-2 rounded-full bg-destructive shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
              <span className="text-xs font-mono text-destructive">Offline Mode</span>
              <CloudOff className="w-3.5 h-3.5 text-destructive ml-1" />
            </>
          )}
        </div>

        <div className="h-4 w-px bg-border hidden sm:block" />
        
        <div className="flex items-center gap-3">
          <div className="text-xs text-right hidden sm:block">
            <div className="text-white font-medium">{user?.email?.split('@')[0]}</div>
            <div className="text-muted-foreground">Shift Active</div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={signOut}
            className="text-muted-foreground hover:text-white hover:bg-background/80 active:scale-95 transition-all"
            title="End Shift & Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
