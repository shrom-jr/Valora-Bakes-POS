import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { ShoppingBag, Search, ScanLine, Tag, FileText, Settings, Clock, ArrowRight } from 'lucide-react';
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
      <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden">
        
        {/* Main Register Area (Empty State) */}
        <div className="flex-1 flex flex-col h-full bg-background border-r border-border/50 relative overflow-hidden">
          {/* Subtle background texture */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
          
          <div className="p-4 border-b border-border/50 flex gap-2 overflow-x-auto no-scrollbar touch-pan-x shrink-0">
            <Button variant="outline" className="shrink-0 bg-card border-border/60 hover:bg-card hover:border-primary/50 text-white rounded-xl h-12 px-5 active:scale-95 transition-all">
              <Search className="w-4 h-4 mr-2 text-muted-foreground" />
              Find Item
            </Button>
            <Button variant="outline" className="shrink-0 bg-card border-border/60 hover:bg-card hover:border-primary/50 text-white rounded-xl h-12 px-5 active:scale-95 transition-all">
              <ScanLine className="w-4 h-4 mr-2 text-muted-foreground" />
              Scan Barcode
            </Button>
            <div className="h-12 w-px bg-border/50 mx-1 shrink-0" />
            <Button variant="ghost" disabled className="shrink-0 rounded-xl h-12 px-5 opacity-50">
              <Tag className="w-4 h-4 mr-2" />
              Categories
            </Button>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in-95 duration-500 z-10">
            <div className="w-20 h-20 rounded-2xl bg-card border border-border/50 shadow-2xl flex items-center justify-center mb-6 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-50 rounded-2xl" />
              <ShoppingBag className="w-8 h-8 text-muted-foreground opacity-50" />
            </div>
            
            <h2 className="text-2xl font-semibold text-white tracking-tight mb-2">Register is Ready</h2>
            <p className="text-muted-foreground max-w-md mx-auto leading-relaxed mb-8">
              The catalog module is currently in Phase 2 development. 
              Once activated, your bakery items, modifiers, and categories will sync here automatically.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-2xl">
              {[
                { icon: Tag, label: 'Catalog Sync', status: 'Pending Phase 2' },
                { icon: FileText, label: 'Order History', status: 'Available' },
                { icon: Settings, label: 'Hardware Setup', status: 'Available' }
              ].map((item, i) => (
                <Card key={i} className="bg-card/30 border-border/40 p-4 flex flex-col items-center text-center hover:bg-card/50 transition-colors cursor-default">
                  <item.icon className="w-5 h-5 text-muted-foreground mb-3" />
                  <div className="text-sm font-medium text-white mb-1">{item.label}</div>
                  <div className="text-xs text-muted-foreground/70 font-mono uppercase tracking-wider">{item.status}</div>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Current Order Sidebar */}
        <div className="w-full md:w-[380px] h-full flex flex-col bg-card/20 shrink-0">
          <div className="h-14 border-b border-border/50 flex items-center justify-between px-4 bg-card/40 shrink-0">
            <span className="font-semibold text-white tracking-wide">Current Order</span>
            <div className="flex items-center gap-1.5 text-muted-foreground text-sm font-mono">
              <Clock className="w-3.5 h-3.5" />
              {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center border-b border-border/50">
            <div className="w-12 h-12 rounded-full bg-background border border-border/50 flex items-center justify-center mb-4">
              <FileText className="w-5 h-5 text-muted-foreground opacity-40" />
            </div>
            <p className="text-sm text-muted-foreground">Add items to begin an order</p>
          </div>

          <div className="p-4 bg-card/40 shrink-0 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground font-mono">
                <span>Subtotal</span>
                <span>₹0.00</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground font-mono">
                <span>Tax (0%)</span>
                <span>₹0.00</span>
              </div>
              <div className="h-px w-full bg-border/60 my-2" />
              <div className="flex justify-between items-end">
                <span className="text-sm font-medium text-white uppercase tracking-wider">Total</span>
                <span className="text-3xl font-bold text-white font-mono tracking-tight">₹0.00</span>
              </div>
            </div>

            <Button 
              disabled 
              className="w-full h-14 text-base font-semibold tracking-wide bg-primary/20 text-primary-foreground border-transparent opacity-50"
            >
              Charge <span className="font-mono ml-1">₹0.00</span>
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
        
      </div>
    </AppShell>
  );
}
