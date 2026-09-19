import React from 'react';
import { AppShell } from '@/components/layout/app-shell';
import DashboardShell from '@/components/layout/dashboard-shell';
import InventoryWorkspace from '@/components/inventory/inventory-workspace';

export default function InventoryPage() {
  return (
    <AppShell>
      <DashboardShell>
        <InventoryWorkspace />
      </DashboardShell>
    </AppShell>
  );
}