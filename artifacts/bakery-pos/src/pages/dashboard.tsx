import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { ShoppingBag, Search, Tag, FileText, Clock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function Dashboard() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <AppShell>
      <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden bg-[#111215]">
        
        {/* Main Register Area (Empty State) */}
        <div className="flex-1 flex flex-col h-full border-r border-[#FF8A00]/20 relative overflow-hidden">
          {/* Subtle background texture */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,138,0,0.03)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
          
          <div className="p-4 border-b border-[#FF8A00]/20 flex gap-2 overflow-x-auto no-scrollbar touch-pan-x shrink-0">
            <Button variant="outline" className="shrink-0 bg-[#1C1E24] border-[#FF8A00]/20 hover:bg-[#21232B] hover:border-[#FF8A00]/50 text-white rounded-xl h-12 px-5 active:scale-95 transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
              <Search className="w-4 h-4 mr-2 text-[#94A3B8]" />
              Find Item
            </Button>
            <div className="h-12 w-px bg-[#FF8A00]/20 mx-1 shrink-0" />
            <Button variant="ghost" disabled className="shrink-0 rounded-xl h-12 px-5 opacity-50 text-[#CBD5E1]">
              <Tag className="w-4 h-4 mr-2" />
              Categories
            </Button>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in-95 duration-500 z-10">
            <div className="w-20 h-20 rounded-2xl bg-[#1C1E24] border border-[#FF8A00]/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_8px_32px_rgba(0,0,0,0.4)] flex items-center justify-center mb-6 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[#FF8A00]/10 to-transparent opacity-50 rounded-2xl" />
              <ShoppingBag className="w-8 h-8 text-[#94A3B8] opacity-70" />
            </div>
            
            <h2 className="text-2xl font-semibold text-white tracking-tight mb-2">Register is Ready</h2>
            <p className="text-[#CBD5E1] max-w-md mx-auto leading-relaxed mb-8">
              The catalog module is currently in Phase 2 development. 
              Once activated, your bakery items, modifiers, and categories will sync here automatically.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-md mx-auto">
              {[
                { icon: Tag, label: 'Catalog Sync', status: 'Pending Phase 2' },
                { icon: FileText, label: 'Order History', status: 'Available' }
              ].map((item, i) => (
                <Card key={i} className="bg-[#1C1E24]/60 border-[#FF8A00]/10 p-4 flex flex-col items-center text-center hover:bg-[#1C1E24] transition-colors cursor-default rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
                  <item.icon className="w-5 h-5 text-[#94A3B8] mb-3" />
                  <div className="text-sm font-medium text-white mb-1">{item.label}</div>
                  <div className="text-xs text-[#94A3B8] font-mono uppercase tracking-wider">{item.status}</div>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Current Order Sidebar */}
        <div className="w-full md:w-[380px] h-full flex flex-col bg-[#16171B] shrink-0 border-l border-[#FF8A00]/10 relative shadow-[-8px_0_32px_rgba(0,0,0,0.5)]">
          <div className="h-14 border-b border-[#FF8A00]/20 flex items-center justify-between px-4 bg-[#1C1E24]/80 shrink-0">
            <span className="font-semibold text-white tracking-wide">Current Order</span>
            <div className="flex items-center gap-1.5 text-[#CBD5E1] text-sm font-mono">
              <Clock className="w-3.5 h-3.5" />
              {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center border-b border-[#FF8A00]/20">
            <div className="w-12 h-12 rounded-full bg-[#111215] border border-[#FF8A00]/20 flex items-center justify-center mb-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
              <FileText className="w-5 h-5 text-[#94A3B8] opacity-60" />
            </div>
            <p className="text-sm text-[#CBD5E1]">Add items to begin an order</p>
          </div>

          <div className="p-4 bg-[#1C1E24]/80 shrink-0 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-[#CBD5E1] font-mono">
                <span className="font-sans">Subtotal</span>
                <span>NPR 0.00</span>
              </div>
              <div className="flex justify-between text-sm text-[#CBD5E1] font-mono">
                <span className="font-sans">Tax (0%)</span>
                <span>NPR 0.00</span>
              </div>
              <div className="h-px w-full bg-[#FF8A00]/20 my-2" />
              <div className="flex justify-between items-end">
                <span className="text-sm font-medium text-white uppercase tracking-wider">Total</span>
                <span className="text-3xl font-bold text-white font-mono tracking-tight">NPR 0.00</span>
              </div>
            </div>

            <Button 
              disabled 
              className="w-full h-14 text-base font-semibold tracking-wide bg-[#21232B] text-[#94A3B8] border-transparent opacity-50 rounded-xl"
            >
              Charge <span className="font-mono ml-1">NPR 0.00</span>
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
        
      </div>
    </AppShell>
  );
}
