import React, { useState } from 'react';
import { Boxes, LayoutDashboard, Menu as MenuIcon, UtensilsCrossed, X } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';

const navigation = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/menu', label: 'Menu Management', icon: UtensilsCrossed },
  { href: '/dashboard/inventory', label: 'Inventory', icon: Boxes },
];

function NavigationLinks({ onNavigate }: { onNavigate?: () => void }) {
  const [location] = useLocation();

  return (
    <nav aria-label="Management navigation" className="space-y-2">
      {navigation.map(({ href, label, icon: Icon }) => {
        const active = href === '/dashboard'
          ? location === '/dashboard'
          : location.startsWith(href);

        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={`flex min-h-12 items-center gap-3 rounded-xl px-4 text-sm font-semibold transition ${
              active
                ? 'bg-gradient-to-r from-[#FFB300]/25 via-[#FF6D00]/20 to-[#F4511E]/15 text-white shadow-[inset_3px_0_0_#FFB300,0_0_18px_rgba(255,109,0,0.12)]'
                : 'text-[#94A3B8] hover:bg-[#14161B] hover:text-white'
            }`}
          >
            <Icon className={`h-5 w-5 shrink-0 ${active ? 'text-[#FFD54F]' : 'text-[#64748B]'}`} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] min-h-0 flex-1 overflow-hidden bg-[#0E0F12]">
      <aside className="hidden w-64 shrink-0 border-r border-[#FF6D00]/25 bg-[#0E0F12] md:flex md:flex-col">
        <div className="border-b border-[#FF6D00]/15 px-5 py-6">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#94A3B8]">
            <Boxes className="h-4 w-4 text-[#FFB300]" />
            Management Portal
          </div>
          <p className="mt-2 text-xs leading-5 text-[#64748B]">Catalog, inventory, and daily control.</p>
        </div>
        <div className="flex-1 px-3 py-5">
          <NavigationLinks />
        </div>
        <div className="border-t border-[#FF6D00]/15 px-5 py-4 text-[11px] font-mono text-[#64748B]">
          FIREBASE LIVE SYSTEM
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="flex min-h-14 shrink-0 items-center justify-between border-b border-[#FF6D00]/15 bg-[#14161B] px-4 md:hidden">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#FFB300]">Management Portal</p>
            <p className="mt-1 text-sm font-semibold text-white">Back-office workspace</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Open management navigation"
            onClick={() => setMobileOpen(true)}
            className="h-12 w-12 rounded-xl text-[#FFD54F] hover:bg-[#FF6D00]/10"
          >
            <MenuIcon className="h-5 w-5" />
          </Button>
        </div>
        <div className="dashboard-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-y-contain pb-16">{children}</div>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-[70] md:hidden">
          <button
            type="button"
            aria-label="Close management navigation"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-black/65"
          />
          <aside className="relative flex h-full w-[min(86vw,320px)] flex-col border-r border-[#FF6D00]/30 bg-[#0E0F12] shadow-[12px_0_35px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-between border-b border-[#FF6D00]/15 px-5 py-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#FFB300]">Management Portal</p>
                <p className="mt-1 text-sm font-semibold text-white">Back-office workspace</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Close management navigation"
                onClick={() => setMobileOpen(false)}
                className="h-12 w-12 rounded-xl text-[#94A3B8] hover:bg-[#FF6D00]/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="px-3 py-5">
              <NavigationLinks onNavigate={() => setMobileOpen(false)} />
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}