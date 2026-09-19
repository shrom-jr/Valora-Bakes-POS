import React, { useEffect, useRef } from 'react';
import { AlertCircle, ArrowRight, Banknote, CheckCircle2, CreditCard, QrCode, ReceiptText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type PaymentMethod = 'cash' | 'qr';

interface TenderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  total: number;
  cashReceived: number;
  onCashReceivedChange: (value: number) => void;
  paymentMethod: PaymentMethod;
  onPaymentMethodChange: (method: PaymentMethod) => void;
  referenceId: string;
  onReferenceIdChange: (value: string) => void;
  onExactCash: () => void;
  onCompleteCash: () => void;
  onConfirmQr: () => void;
  processing: boolean;
  errorMessage?: string;
}

const formatNpr = (amount: number) => `NPR ${amount.toFixed(2)}`;

export default function TenderModal({
  open,
  onOpenChange,
  total,
  cashReceived,
  onCashReceivedChange,
  paymentMethod,
  onPaymentMethodChange,
  referenceId,
  onReferenceIdChange,
  onExactCash,
  onCompleteCash,
  onConfirmQr,
  processing,
  errorMessage,
}: TenderModalProps) {
  const cashInputRef = useRef<HTMLInputElement>(null);
  const canCompleteCash = total >= 0 && cashReceived >= total && !processing;
  const changeDue = Math.max(0, cashReceived - total);
  const remaining = Math.max(0, total - cashReceived);

  useEffect(() => {
    if (open && paymentMethod === 'cash') {
      const focusTimer = window.setTimeout(() => cashInputRef.current?.focus(), 80);
      return () => window.clearTimeout(focusTimer);
    }
    return undefined;
  }, [open, paymentMethod]);

  const handleTabChange = (value: string) => {
    if (value === 'cash' || value === 'qr') {
      onPaymentMethodChange(value);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-1.5rem)] max-w-xl border-[#FF6D00]/25 bg-[#14161B] p-4 text-white shadow-[0_24px_80px_rgba(0,0,0,0.65)] sm:p-6">
        <DialogHeader className="pr-8">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-white">
            <ReceiptText className="h-5 w-5 text-[#FFD54F]" />
            Counter tender
          </DialogTitle>
          <DialogDescription className="text-[#94A3B8]">Confirm the payment method before completing this sale.</DialogDescription>
        </DialogHeader>

        <Tabs value={paymentMethod} onValueChange={handleTabChange} className="mt-1">
          <TabsList className="grid h-auto w-full grid-cols-2 gap-1 rounded-xl border border-[#2A2D35] bg-[#0E0F12] p-1">
            <TabsTrigger
              value="cash"
              disabled={processing}
              className="min-h-12 gap-2 rounded-lg px-3 text-xs font-bold text-[#94A3B8] data-[state=active]:bg-[#FFB300]/15 data-[state=active]:text-[#FFD54F] data-[state=active]:shadow-[inset_0_0_0_1px_rgba(255,179,0,0.28)]"
            >
              <Banknote className="h-4 w-4" />
              Cash Tender
            </TabsTrigger>
            <TabsTrigger
              value="qr"
              disabled={processing}
              className="min-h-12 gap-2 rounded-lg px-3 text-xs font-bold text-[#94A3B8] data-[state=active]:bg-[#FF6D00]/15 data-[state=active]:text-[#FFD54F] data-[state=active]:shadow-[inset_0_0_0_1px_rgba(255,109,0,0.28)]"
            >
              <QrCode className="h-4 w-4" />
              QR Standee
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cash" className="mt-4 space-y-4">
            <div className="rounded-xl border border-[#FF6D00]/20 bg-[#0E0F12] p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#94A3B8]">Total due</p>
              <p className="mt-2 font-mono text-3xl font-bold tracking-tight text-white">{formatNpr(total)}</p>
            </div>

            <div className="space-y-2">
              <label htmlFor="cash-received" className="text-sm font-bold text-[#E2E8F0]">Cash Received (NPR)</label>
              <div className="flex gap-2">
                <Input
                  ref={cashInputRef}
                  id="cash-received"
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  value={cashReceived > 0 ? cashReceived : ''}
                  onChange={(event) => onCashReceivedChange(Number(event.target.value) || 0)}
                  disabled={processing}
                  placeholder="0.00"
                  className="h-12 min-w-0 flex-1 border-[#2A2D35] bg-[#0E0F12] font-mono text-lg text-white focus-visible:ring-[#FF6D00]"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={onExactCash}
                  disabled={processing}
                  className="h-12 shrink-0 border-[#FFB300]/35 bg-[#FFB300]/10 px-3 text-xs font-bold text-[#FFD54F] hover:bg-[#FFB300]/20 hover:text-white"
                >
                  Exact Cash
                </Button>
              </div>
            </div>

            <div className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 ${
              cashReceived >= total
                ? 'border-[#10B981]/25 bg-[#10B981]/10'
                : 'border-[#FFB300]/25 bg-[#FFB300]/10'
            }`}>
              <div className="flex items-center gap-2">
                {cashReceived >= total ? <CheckCircle2 className="h-4 w-4 text-[#6EE7B7]" /> : <AlertCircle className="h-4 w-4 text-[#FFD54F]" />}
                <span className={`text-sm font-bold ${cashReceived >= total ? 'text-[#6EE7B7]' : 'text-[#FFD54F]'}`}>
                  {cashReceived >= total ? 'Change Due' : 'Remaining'}
                </span>
              </div>
              <span className={`font-mono text-lg font-bold ${cashReceived >= total ? 'text-[#6EE7B7]' : 'text-[#FFD54F]'}`}>
                {formatNpr(cashReceived >= total ? changeDue : remaining)}
              </span>
            </div>

            <Button
              type="button"
              disabled={!canCompleteCash}
              onClick={onCompleteCash}
              className="h-14 w-full border-none bg-gradient-to-r from-[#FFB300] via-[#FF6D00] to-[#F4511E] text-base font-bold text-white shadow-[0_0_22px_rgba(255,109,0,0.22)] hover:brightness-110"
            >
              {processing ? 'Processing sale…' : 'Complete Cash Sale'}
              {!processing && <ArrowRight className="h-5 w-5" />}
            </Button>
          </TabsContent>

          <TabsContent value="qr" className="mt-4 space-y-4">
            <div className="rounded-xl border border-[#FF6D00]/20 bg-[#0E0F12] p-5 text-center">
              <QrCode className="mx-auto h-10 w-10 text-[#FFD54F]" />
              <p className="mt-3 text-sm font-semibold leading-6 text-[#E2E8F0]">
                Customer pays via physical counter QR standee:
              </p>
              <p className="mt-1 font-mono text-2xl font-bold text-white">{formatNpr(total)}</p>
            </div>

            <div className="space-y-2">
              <label htmlFor="qr-reference" className="text-sm font-bold text-[#E2E8F0]">Ref / Transaction ID <span className="font-normal text-[#64748B]">(Optional)</span></label>
              <Input
                id="qr-reference"
                type="text"
                value={referenceId}
                onChange={(event) => onReferenceIdChange(event.target.value)}
                disabled={processing}
                placeholder="Enter payment reference"
                className="h-12 border-[#2A2D35] bg-[#0E0F12] text-white focus-visible:ring-[#FF6D00]"
              />
            </div>

            <Button
              type="button"
              disabled={processing || total < 0}
              onClick={onConfirmQr}
              className="h-14 w-full border-none bg-gradient-to-r from-[#FFB300] via-[#FF6D00] to-[#F4511E] text-base font-bold text-white shadow-[0_0_22px_rgba(255,109,0,0.22)] hover:brightness-110"
            >
              {processing ? 'Processing sale…' : 'Confirm Payment Received'}
              {!processing && <CreditCard className="h-5 w-5" />}
            </Button>
          </TabsContent>
        </Tabs>

        {errorMessage && (
          <p role="alert" className="flex items-start gap-2 rounded-lg border border-[#F4511E]/25 bg-[#F4511E]/10 px-3 py-2 text-xs font-semibold leading-5 text-[#FFB39D]">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}