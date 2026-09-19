import React from 'react';
import { Ban, CheckCircle2, Clock3, FileText, Loader2, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface TodayBill {
  saleId: string;
  orderNumber: number;
  createdAt: number;
  itemsSummary: string;
  paymentMethod: 'cash' | 'qr';
  total: number;
  status: 'COMPLETED' | 'VOIDED' | string;
}

interface TodayBillsTableProps {
  bills: TodayBill[];
  onVoid: (sale: TodayBill) => void;
  voidingSaleId: string | null;
}

const formatNpr = (amount: number) => `NPR ${amount.toFixed(2)}`;

function formatTime(timestamp: number) {
  const date = new Date(timestamp < 1_000_000_000_000 ? timestamp * 1000 : timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function TodayBillsTable({ bills, onVoid, voidingSaleId }: TodayBillsTableProps) {
  if (bills.length === 0) {
    return (
      <div className="flex min-h-[240px] flex-col items-center justify-center rounded-xl border border-dashed border-[#FF6D00]/20 bg-[#0E0F12]/70 px-6 py-10 text-center">
        <FileText className="h-8 w-8 text-[#64748B]" />
        <h3 className="mt-3 text-sm font-bold text-white">No bills settled today</h3>
        <p className="mt-1 max-w-sm text-xs leading-5 text-[#64748B]">
          Completed counter sales will appear here in reverse chronological order.
        </p>
      </div>
    );
  }

  return (
    <div className="dashboard-scrollbar overflow-x-auto rounded-xl border border-[#2A2D35] bg-[#0E0F12] [touch-action:pan-x]">
      <table className="w-full min-w-[760px] border-collapse text-left">
        <caption className="sr-only">Today&apos;s bills</caption>
        <thead>
          <tr className="border-b border-[#FF6D00]/15 bg-[#14161B] text-[10px] font-bold uppercase tracking-[0.14em] text-[#64748B]">
            <th scope="col" className="px-4 py-3">Bill #</th>
            <th scope="col" className="px-4 py-3">Time</th>
            <th scope="col" className="px-4 py-3">Items Summary</th>
            <th scope="col" className="px-4 py-3">Tender Mode</th>
            <th scope="col" className="px-4 py-3 text-right">Total NPR</th>
            <th scope="col" className="px-4 py-3">Status</th>
            <th scope="col" className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#2A2D35]">
          {bills.map((sale) => {
            const voided = sale.status === 'VOIDED';
            const voiding = voidingSaleId === sale.saleId;
            return (
              <tr key={sale.saleId} className={`text-sm ${voided ? 'bg-[#0E0F12]/60 text-[#64748B]' : 'text-[#E2E8F0]'}`}>
                <th scope="row" className="whitespace-nowrap px-4 py-3 font-mono text-xs font-bold text-white">
                  #{sale.orderNumber}
                </th>
                <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-[#94A3B8]">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock3 className="h-3.5 w-3.5 text-[#64748B]" />
                    {formatTime(sale.createdAt)}
                  </span>
                </td>
                <td className="max-w-[230px] px-4 py-3">
                  <span className={`block truncate ${voided ? 'line-through' : 'font-semibold text-white'}`} title={sale.itemsSummary}>
                    {sale.itemsSummary}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#CBD5E1]">
                    {sale.paymentMethod === 'cash' ? <CheckCircle2 className="h-3.5 w-3.5 text-[#6EE7B7]" /> : <QrCode className="h-3.5 w-3.5 text-[#FFD54F]" />}
                    {sale.paymentMethod === 'cash' ? 'Cash' : 'QR Standee'}
                  </span>
                </td>
                <td className={`whitespace-nowrap px-4 py-3 text-right font-mono text-sm font-bold ${voided ? 'text-[#64748B] line-through' : 'text-white'}`}>
                  {formatNpr(sale.total)}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] ${
                    voided
                      ? 'border-[#64748B]/30 bg-[#64748B]/10 text-[#94A3B8]'
                      : 'border-[#10B981]/25 bg-[#10B981]/10 text-[#6EE7B7]'
                  }`}>
                    {voided ? <Ban className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
                    {voided ? 'Voided' : sale.status || 'Completed'}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  {!voided && (
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={voiding}
                      onClick={() => onVoid(sale)}
                      className="h-9 rounded-lg px-2 text-xs font-bold text-[#FF8A65] hover:bg-[#F4511E]/10 hover:text-[#FFB39D]"
                      aria-label={`Void bill ${sale.orderNumber}`}
                    >
                      {voiding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Ban className="h-3.5 w-3.5" />}
                      {voiding ? 'Voiding…' : 'Void Bill'}
                    </Button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}