import React, { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { useLocation } from 'wouter';
import { Eye, EyeOff, Lock, User, AlertCircle, ServerCrash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function SignIn() {
  const { user, isConfigured } = useAuth();
  const [, setLocation] = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already authenticated, redirect to dashboard
  if (user && isConfigured) {
    setLocation('/dashboard');
    return null;
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;

    setIsLoading(true);
    setError(null);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      setLocation('/dashboard');
    } catch (err) {
      if (err instanceof FirebaseError) {
        switch (err.code) {
          case 'auth/invalid-credential':
          case 'auth/user-not-found':
          case 'auth/wrong-password':
            setError('Incorrect email or password. Please try again.');
            break;
          case 'auth/too-many-requests':
            setError('Too many failed attempts. Please try again later.');
            break;
          case 'auth/user-disabled':
            setError('This account has been disabled. Contact an administrator.');
            break;
          case 'auth/network-request-failed':
            setError('Network error. Please check your connection and try again.');
            break;
          case 'auth/invalid-email':
            setError('Please enter a valid email address.');
            break;
          default:
            setError(`Authentication failed: ${err.message}`);
        }
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isConfigured) {
    return (
      <div className="min-h-[100dvh] w-full flex items-center justify-center p-4 bg-[#0E0F12] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-destructive/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="relative rounded-2xl p-[1px] bg-gradient-to-br from-destructive via-destructive/50 to-transparent shadow-[0_4px_20px_-2px_rgba(239,68,68,0.15),0_0_0_1px_rgba(239,68,68,0.25)] w-full max-w-md animate-in slide-in-from-bottom-4 fade-in duration-500 z-10">
          <Card className="w-full h-full border-0 bg-[#14161B] rounded-[15px] shadow-none relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-destructive/50 to-destructive" />
            <CardHeader>
              <div className="w-12 h-12 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center justify-center mb-4 text-destructive">
                <ServerCrash className="w-6 h-6" />
              </div>
              <CardTitle className="text-xl text-white">Configuration Required</CardTitle>
              <CardDescription className="text-[#E2E8F0] leading-relaxed">
                Bakery POS cannot start because Firebase is not configured.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive" className="bg-destructive/5 border-destructive/20 text-destructive-foreground">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Missing Environment Variables</AlertTitle>
                <AlertDescription className="mt-2 text-sm opacity-90 leading-relaxed font-mono">
                  Please set the following in your environment:
                  <ul className="list-disc pl-4 mt-2 space-y-1 opacity-70">
                    <li>VITE_FIREBASE_API_KEY</li>
                    <li>VITE_FIREBASE_AUTH_DOMAIN</li>
                    <li>VITE_FIREBASE_PROJECT_ID</li>
                    <li>...and other standard Firebase keys.</li>
                  </ul>
                </AlertDescription>
              </Alert>
              <Button disabled className="w-full bg-[#2A2D35] text-[#94A3B8] border-transparent rounded-xl h-11">
                System Offline
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center p-4 bg-[#0E0F12] relative overflow-hidden">
      {/* Restrained luminous edge effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] max-w-[600px] aspect-square bg-[#FF6D00]/10 rounded-full blur-[120px] pointer-events-none opacity-50" />
      
      <div className="relative rounded-2xl p-[1px] bg-gradient-to-br from-[#FFD54F] via-[#FF6D00] to-[#14161B] shadow-[0_4px_20px_-2px_rgba(255,109,0,0.15),0_0_0_1px_rgba(255,140,0,0.25)] w-full max-w-sm z-10 animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out">
        <Card className="w-full h-full border-0 bg-[#14161B] rounded-[15px] shadow-none relative overflow-hidden">
          <CardHeader className="space-y-4 pb-6 pt-8">
            <div className="flex justify-center mb-2">
              <div className="w-14 h-14 rounded-2xl bg-[#0E0F12] flex items-center justify-center relative overflow-hidden shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                <div className="absolute inset-0 bg-gradient-to-br from-[#FF6D00]/10 to-transparent opacity-50" />
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#FFB300] via-[#FF6D00] to-[#F4511E] shadow-[0_0_15px_rgba(255,109,0,0.5)]" />
              </div>
            </div>
            <div className="text-center space-y-1.5">
              <CardTitle className="text-2xl font-bold tracking-tight text-white">Bakery POS</CardTitle>
              <CardDescription className="text-[#E2E8F0]">
                Sign in to your register session
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSignIn} className="space-y-5">
              {error && (
                <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 py-2.5 animate-in fade-in slide-in-from-top-2">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <AlertDescription className="text-xs ml-2 text-destructive-foreground/90">{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-bold text-[#E2E8F0] uppercase tracking-wider">Email Address</Label>
                  <div className="relative group">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8] group-focus-within:stroke-[url(#flame-grad)] transition-all" />
                    <Input
                      id="email"
                      type="email"
                      autoComplete="username"
                      placeholder="baker@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="pl-9 bg-[#0E0F12] border-[#FF6D00]/20 focus-visible:bg-[#0E0F12] focus-visible:ring-1 focus-visible:ring-[#FFD54F] h-12 text-white placeholder:text-[#94A3B8] transition-all rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-xs font-bold text-[#E2E8F0] uppercase tracking-wider">Password</Label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8] group-focus-within:stroke-[url(#flame-grad)] transition-all" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="pl-9 pr-10 bg-[#0E0F12] border-[#FF6D00]/20 focus-visible:bg-[#0E0F12] focus-visible:ring-1 focus-visible:ring-[#FFD54F] h-12 text-white font-mono placeholder:font-sans placeholder:text-[#94A3B8] transition-all rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 group text-[#94A3B8] transition-all focus:outline-none rounded p-1"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4 group-hover:stroke-[url(#flame-grad)] transition-all" />
                      ) : (
                        <Eye className="w-4 h-4 group-hover:stroke-[url(#flame-grad)] transition-all" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading || !email || !password}
                className="w-full h-14 mt-2 bg-gradient-to-r from-[#FFB300] via-[#FF6D00] to-[#F4511E] hover:from-[#FFD54F] hover:via-[#FF8A00] hover:to-[#E64A19] text-white font-bold text-lg tracking-wide transition-all active:scale-[0.98] shadow-[0_0_20px_rgba(255,109,0,0.4),0_8px_16px_rgba(0,0,0,0.4)] hover:shadow-[0_0_30px_rgba(255,109,0,0.6),0_10px_20px_rgba(0,0,0,0.5)] disabled:opacity-60 disabled:active:scale-100 disabled:shadow-[0_0_20px_rgba(255,109,0,0.2)] border-none rounded-xl"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Authenticating...</span>
                  </div>
                ) : (
                  'Access Register'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
