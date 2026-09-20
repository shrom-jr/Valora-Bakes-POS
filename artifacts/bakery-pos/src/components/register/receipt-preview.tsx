import React from 'react';
import { ReceiptWidth, StoreProfile, SalePaymentMethod } from '@/lib/rtdb';

export interface ReceiptItem {
  name: string;
  tierLabel: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface ReceiptPayload {
  orderNumber: number;
  createdAt: number;
  cashierName: string;
  items: ReceiptItem[];
  subtotal: number;
  discountAmount: number;
  total: number;
  paymentMethod: SalePaymentMethod;
  cashReceived: number | null;
  changeDue: number;
}

interface ReceiptPreviewProps {
  receipt: ReceiptPayload;
  profile: StoreProfile;
  width: ReceiptWidth;
}

const formatNpr = (amount: number) => `NPR ${amount.toFixed(2)}`;

function receiptDate(timestamp: number) {
  return new Date(timestamp).toLocaleString([], {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ReceiptPreview({ receipt, profile, width }: ReceiptPreviewProps) {
  const compact = width === '58mm';
  return (
    <div
      className={`thermal-receipt-print thermal-receipt-${width} mx-auto w-full max-w-[360px] rounded-lg bg-white p-4 text-black shadow-inner ${compact ? 'text-[11px]' : 'text-xs'}`}
      data-width={width}
      aria-label={`Receipt preview for bill ${receipt.orderNumber}`}
    >
      <header className="text-center">
        <img src="/logo.png?v=2" alt="Logo" className="brand-logo-illuminated mx-auto mb-2 h-16 w-16 object-contain print:filter-grayscale thermal-receipt-logo" />
        <h3 className={`${compact ? 'text-base' : 'text-lg'} font-bold tracking-tight`}>{profile.bakeryName}</h3>
        {profile.branchAddress && <p className="mt-1 whitespace-pre-wrap">{profile.branchAddress}</p>}
        {profile.phone && <p>{profile.phone}</p>}
        {profile.panVat && <p>PAN / VAT: {profile.panVat}</p>}
      </header>

      <div className="my-3 border-y border-dashed border-black py-2 font-mono">
        <div className="flex justify-between gap-3"><span>Bill #{receipt.orderNumber}</span><span>{receiptDate(receipt.createdAt)}</span></div>
        <div className="mt-1">Cashier: {receipt.cashierName}</div>
      </div>

      <div className="font-mono">
        <div
          className="grid gap-1 border-b border-black pb-1 font-bold"
          style={{ gridTemplateColumns: compact ? '2ch minmax(12ch, 1fr) 8ch' : '3ch minmax(20ch, 1fr) 8ch 9ch' }}
        >
          <span>Qty</span>
          <span>Item{!compact && ' & Weight'}</span>
          {!compact && <span className="text-right">Rate</span>}
          <span className="text-right">Total</span>
        </div>
        <div className="divide-y divide-dotted divide-black/35">
          {receipt.items.map((item, index) => (
            <div
              key={`${item.name}-${item.tierLabel}-${index}`}
              className="grid gap-1 py-1"
              style={{ gridTemplateColumns: compact ? '2ch minmax(12ch, 1fr) 8ch' : '3ch minmax(20ch, 1fr) 8ch 9ch' }}
            >
              <span>{item.quantity}</span>
              <span className="min-w-0 break-words">{item.name}{item.tierLabel ? ` · ${item.tierLabel}` : ''}</span>
              {!compact && <span className="text-right">{item.unitPrice.toFixed(2)}</span>}
              <span className="text-right">{item.lineTotal.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 border-t border-black pt-2 font-mono">
        <div className="flex justify-between gap-3"><span>Subtotal</span><span>{formatNpr(receipt.subtotal)}</span></div>
        {receipt.discountAmount > 0 && <div className="mt-1 flex justify-between gap-3"><span>Discount</span><span>- {formatNpr(receipt.discountAmount)}</span></div>}
        <div className="mt-2 flex justify-between gap-3 text-sm font-bold"><span>Grand Total</span><span>{formatNpr(receipt.total)}</span></div>
        <div className="mt-2 flex justify-between gap-3"><span>Tender</span><span>{receipt.paymentMethod === 'cash' ? 'Cash' : 'QR Standee'}</span></div>
        {receipt.paymentMethod === 'cash' && (
          <>
            <div className="mt-1 flex justify-between gap-3"><span>Tendered</span><span>{formatNpr(receipt.cashReceived || 0)}</span></div>
            <div className="mt-1 flex justify-between gap-3"><span>Change</span><span>{formatNpr(receipt.changeDue)}</span></div>
          </>
        )}
      </div>

      <footer className="mt-4 border-t border-dashed border-black pt-3 text-center">
        {profile.greeting && <p className="font-semibold">{profile.greeting}</p>}
        {profile.footer && <p className="mt-1">{profile.footer}</p>}
        <p className="mt-2 text-[10px]">Software by Valora POS</p>
      </footer>
    </div>
  );
}