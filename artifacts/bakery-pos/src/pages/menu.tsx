import React from 'react';
import { AppShell } from '@/components/layout/app-shell';
import UnifiedMenuWorkspace from '@/components/menu/unified-menu-workspace';

export default function MenuPage() {
  return (
    <AppShell>
      <div className="flex-1 overflow-hidden relative bg-[#0E0F12]">
        <UnifiedMenuWorkspace />
      </div>
    </AppShell>
  );
}