import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#111215] text-white">
      <Card className="w-full max-w-md mx-4 bg-[#1C1E24] border-[#FF8A00]/20 shadow-[0_8px_32px_rgba(0,0,0,0.5)] rounded-2xl">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-3 items-center">
            <AlertCircle className="h-8 w-8 text-[#FF5400]" />
            <h1 className="text-2xl font-bold text-white tracking-tight">
              404 Not Found
            </h1>
          </div>
          <p className="mt-4 text-sm text-[#CBD5E1] mb-6">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <Link href="/" className="w-full flex items-center justify-center h-11 bg-[#21232B] hover:bg-[#2A2D38] border border-[#FF8A00]/20 rounded-xl font-medium transition-colors text-white">
            Return to POS
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
