import React from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CategoriesTab from '@/components/menu/categories-tab';
import ItemsTab from '@/components/menu/items-tab';
import ShelfTab from '@/components/menu/shelf-tab';

export default function MenuPage() {
  return (
    <AppShell>
      <div className="flex-1 overflow-y-auto bg-[#0E0F12] p-6 relative">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Menu & Prices</h1>
              <p className="text-[#E2E8F0]">Manage your catalog, pricing tiers, and shelf inventory.</p>
            </div>
          </div>
          
          <Tabs defaultValue="items" className="w-full">
            <TabsList className="bg-[#14161B] border border-[#FF6D00]/20 p-1 rounded-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] w-full sm:w-auto h-auto">
              <TabsTrigger value="categories" className="data-[state=active]:bg-[#2A2D35] data-[state=active]:text-white text-[#94A3B8] rounded-lg py-2 px-6">Categories</TabsTrigger>
              <TabsTrigger value="items" className="data-[state=active]:bg-[#2A2D35] data-[state=active]:text-white text-[#94A3B8] rounded-lg py-2 px-6">Menu Items</TabsTrigger>
              <TabsTrigger value="shelf" className="data-[state=active]:bg-[#2A2D35] data-[state=active]:text-white text-[#94A3B8] rounded-lg py-2 px-6">Shelf Loading</TabsTrigger>
            </TabsList>
            
            <div className="mt-6 relative rounded-2xl p-[1px] bg-gradient-to-br from-[#FFD54F]/50 via-[#FF6D00]/20 to-transparent shadow-[0_4px_20px_-2px_rgba(255,109,0,0.1),0_0_0_1px_rgba(255,140,0,0.15)] bg-[#14161B]">
              <div className="bg-[#14161B] rounded-[15px] p-6 min-h-[400px]">
                <TabsContent value="categories" className="mt-0">
                  <CategoriesTab />
                </TabsContent>
                <TabsContent value="items" className="mt-0">
                  <ItemsTab />
                </TabsContent>
                <TabsContent value="shelf" className="mt-0">
                  <ShelfTab />
                </TabsContent>
              </div>
            </div>
          </Tabs>
        </div>
      </div>
    </AppShell>
  );
}