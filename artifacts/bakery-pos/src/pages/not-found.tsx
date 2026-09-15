import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';

export default function NotFound() {
  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center bg-[#0E0F12] text-white">
      <div className="relative rounded-2xl p-[1px] bg-gradient-to-br from-[#FFD54F] via-[#FF6D00] to-transparent shadow-[0_4px_20px_-2px_rgba(255,109,0,0.15),0_0_0_1px_rgba(255,140,0,0.25)] w-full max-w-md mx-4">
        <Card className="w-full h-full border-0 bg-[#14161B] rounded-[15px] shadow-none">
          <CardContent className="pt-6">
            <div className="flex mb-4 gap-3 items-center">
              <AlertCircle className="h-8 w-8 stroke-[url(#flame-grad)]" />
              <h1 className="text-2xl font-bold text-white tracking-tight">
                404 Not Found
              </h1>
            </div>
            <p className="mt-4 text-sm text-[#E2E8F0] mb-6">
              The page you're looking for doesn't exist or has been moved.
            </p>
            <Link href="/" className="w-full flex items-center justify-center h-12 bg-gradient-to-r from-[#FFB300] via-[#FF6D00] to-[#F4511E] hover:from-[#FFD54F] hover:via-[#FF8A00] hover:to-[#E64A19] rounded-xl font-bold text-white transition-all shadow-[0_0_20px_rgba(255,109,0,0.4)] active:scale-95">
              Return to POS
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
