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
      <div className="min-h-[100dvh] w-full flex items-center justify-center p-4 bg-background relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-destructive/10 rounded-full blur-[100px] pointer-events-none" />
        
        <Card className="w-full max-w-md border-border/50 bg-card/50 backdrop-blur-xl shadow-2xl relative overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-500">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-destructive/50 to-destructive" />
          <CardHeader>
            <div className="w-12 h-12 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center justify-center mb-4 text-destructive">
              <ServerCrash className="w-6 h-6" />
            </div>
            <CardTitle className="text-xl">Configuration Required</CardTitle>
            <CardDescription className="text-muted-foreground leading-relaxed">
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
            <Button disabled className="w-full bg-muted text-muted-foreground border-transparent">
              System Offline
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center p-4 bg-background relative overflow-hidden">
      {/* Restrained luminous edge effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] max-w-[600px] aspect-square bg-primary/10 rounded-full blur-[120px] pointer-events-none opacity-50" />
      
      <Card className="w-full max-w-sm border-border/40 bg-card/40 backdrop-blur-2xl shadow-2xl relative overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out z-10">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        
        <CardHeader className="space-y-4 pb-6 pt-8">
          <div className="flex justify-center mb-2">
            <div className="w-14 h-14 rounded-2xl bg-card border border-border shadow-lg flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent opacity-50" />
              <div className="w-6 h-6 rounded-md bg-primary shadow-[0_0_15px_rgba(245,166,35,0.4)]" />
            </div>
          </div>
          <div className="text-center space-y-1.5">
            <CardTitle className="text-2xl font-semibold tracking-tight text-white">Bakery POS</CardTitle>
            <CardDescription className="text-muted-foreground">
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
                <Label htmlFor="email" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email Address</Label>
                <div className="relative group">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="baker@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-9 bg-background/50 border-border/50 focus-visible:bg-background focus-visible:ring-1 focus-visible:ring-primary h-11 text-white placeholder:text-muted-foreground/50 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Password</Label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-9 pr-10 bg-background/50 border-border/50 focus-visible:bg-background focus-visible:ring-1 focus-visible:ring-primary h-11 text-white font-mono placeholder:font-sans placeholder:text-muted-foreground/50 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors focus:outline-none rounded"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading || !email || !password}
              className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold tracking-wide transition-all active:scale-[0.98] shadow-[0_0_20px_rgba(245,166,35,0.2)] hover:shadow-[0_0_25px_rgba(245,166,35,0.3)] disabled:opacity-50 disabled:active:scale-100 disabled:shadow-none"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
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
  );
}
