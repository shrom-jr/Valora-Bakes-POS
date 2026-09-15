import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { ShoppingBag, Search, Tag, FileText, Clock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Dashboard() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <AppShell>
      <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden bg-[#0E0F12]">
        
        {/* Main Register Area (Empty State) */}
        <div className="flex-1 flex flex-col h-full border-r border-[#FF6D00]/10 relative overflow-hidden z-10">
          {/* Subtle background texture */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,109,0,0.03)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
          
          <div className="p-4 border-b border-[#FF6D00]/10 flex gap-2 overflow-x-auto no-scrollbar touch-pan-x shrink-0">
            <button className="relative group shrink-0 rounded-xl h-12 active:scale-95 transition-all p-[1px] bg-gradient-to-br from-[#FF6D00]/50 to-[#F4511E]/30 hover:from-[#FFD54F] hover:via-[#FF6D00] hover:to-[#F4511E] shadow-[0_2px_10px_rgba(255,109,0,0.1)] hover:shadow-[0_4px_15px_rgba(255,109,0,0.2)]">
              <div className="flex items-center justify-center w-full h-full bg-[#14161B] rounded-xl px-5 transition-colors group-hover:bg-[#1A1D24]">
                <Search className="w-4 h-4 mr-2 stroke-[url(#flame-grad)]" />
                <span className="text-[#E2E8F0] font-medium tracking-wide">Find Item</span>
              </div>
            </button>
            
            <div className="h-12 w-px bg-[#FF6D00]/20 mx-1 shrink-0" />
            
            <button disabled className="relative shrink-0 rounded-xl h-12 p-[1px] bg-[#2A2D35] opacity-50 cursor-not-allowed">
              <div className="flex items-center justify-center w-full h-full bg-[#14161B] rounded-xl px-5">
                <Tag className="w-4 h-4 mr-2 text-[#94A3B8]" />
                <span className="text-[#94A3B8] font-medium tracking-wide">Categories</span>
              </div>
            </button>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in-95 duration-500 z-10">
            <div className="relative rounded-2xl p-[1px] bg-gradient-to-br from-[#FFD54F] via-[#FF6D00] to-transparent shadow-[0_4px_20px_-2px_rgba(255,109,0,0.15),0_0_0_1px_rgba(255,140,0,0.25)] mb-6">
              <div className="w-20 h-20 rounded-2xl bg-[#14161B] flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#FF6D00]/5 to-transparent opacity-50 rounded-2xl" />
                <ShoppingBag className="w-8 h-8 stroke-[url(#flame-grad)] opacity-90" />
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-white tracking-tight mb-2">Register is Ready</h2>
            <p className="text-[#E2E8F0] max-w-md mx-auto leading-relaxed mb-8">
              The catalog module is currently in Phase 2 development. 
              Once activated, your bakery items, modifiers, and categories will sync here automatically.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-md mx-auto">
              {[
                { icon: Tag, label: 'Catalog Sync', status: 'Pending Phase 2' },
                { icon: FileText, label: 'Order History', status: 'Available' }
              ].map((item, i) => (
                <div key={i} className="relative rounded-2xl p-[1px] bg-gradient-to-br from-[#FF6D00]/30 to-transparent hover:from-[#FFD54F]/50 transition-colors">
                  <div className="bg-[#14161B] p-4 flex flex-col items-center text-center rounded-[15px] h-full shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
                    <item.icon className="w-5 h-5 stroke-[url(#flame-grad)] opacity-80 mb-3" />
                    <div className="text-sm font-bold text-white mb-1">{item.label}</div>
                    <div className="text-xs text-[#94A3B8] font-mono uppercase tracking-wider">{item.status}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Current Order Sidebar */}
        <div className="w-full md:w-[380px] h-full flex flex-col shrink-0 relative shadow-[-8px_0_32px_rgba(0,0,0,0.5)] z-20 bg-[#14161B]">
          <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-gradient-to-b from-[#FFD54F] via-[#FF6D00] to-transparent shadow-[0_0_15px_rgba(255,109,0,0.4)]" />
          
          <div className="h-14 border-b border-[#FF6D00]/10 flex items-center justify-between px-4 bg-[#14161B] shrink-0">
            <span className="font-bold text-white tracking-wide">Current Order</span>
            <div className="flex items-center gap-1.5 text-[#E2E8F0] text-sm font-mono">
              <Clock className="w-3.5 h-3.5 stroke-[url(#flame-grad)]" />
              {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center border-b border-[#FF6D00]/10 bg-[#0E0F12]">
            <div className="relative rounded-full p-[1px] bg-gradient-to-br from-[#FF6D00]/50 to-transparent shadow-[0_2px_10px_rgba(255,109,0,0.1)] mb-4">
              <div className="w-12 h-12 rounded-full bg-[#14161B] flex items-center justify-center">
                <FileText className="w-5 h-5 stroke-[url(#flame-grad)] opacity-80" />
              </div>
            </div>
            <p className="text-sm text-[#E2E8F0]">Add items to begin an order</p>
          </div>

          <div className="p-4 bg-[#14161B] shrink-0 space-y-4 relative z-10">
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-[#E2E8F0] font-mono">
                <span className="font-sans">Subtotal</span>
                <span>NPR 0.00</span>
              </div>
              <div className="flex justify-between text-sm text-[#E2E8F0] font-mono">
                <span className="font-sans">Tax (0%)</span>
                <span>NPR 0.00</span>
              </div>
              <div className="h-px w-full bg-gradient-to-r from-[#FF6D00]/40 to-transparent my-3" />
              <div className="flex justify-between items-end pb-2">
                <span className="text-sm font-bold text-[#E2E8F0] uppercase tracking-wider">Total</span>
                <span className="text-4xl font-bold text-white font-mono tracking-tight drop-shadow-[0_2px_8px_rgba(255,255,255,0.2)]">NPR 0.00</span>
              </div>
            </div>

            <Button 
              disabled 
              className="w-full h-14 text-lg font-bold tracking-wide bg-gradient-to-r from-[#FFB300] via-[#FF6D00] to-[#F4511E] text-white border-transparent opacity-60 rounded-xl shadow-[0_0_20px_rgba(255,109,0,0.4),0_8px_16px_rgba(0,0,0,0.4)] disabled:opacity-60 transition-all hover:scale-[0.98] hover:shadow-[0_0_25px_rgba(255,109,0,0.6),0_10px_20px_rgba(0,0,0,0.5)] active:scale-95"
            >
              Charge <span className="font-mono ml-2">NPR 0.00</span>
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
        
      </div>
    </AppShell>
  );
}
