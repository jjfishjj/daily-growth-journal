import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Sparkles, Lock, Loader2, CheckCircle2 } from 'lucide-react';
import { z } from 'zod';

const passwordSchema = z.string().min(6, '密碼至少需要 6 個字元');

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [validSession, setValidSession] = useState(false);
  const [checking, setChecking] = useState(true);
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Check if we have a valid session from the reset link
  useEffect(() => {
    const checkSession = async () => {
      console.log('Checking reset password session...');
      console.log('URL:', window.location.href);
      console.log('Hash:', window.location.hash);
      
      // If there's an error in URL params, show it
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');
      
      if (error) {
        toast.error('重設密碼失敗', { 
          description: errorDescription || '連結已過期或無效，請重新申請' 
        });
        navigate('/auth');
        return;
      }

      // Check if we're in recovery mode (set by auth state change)
      const recoveryMode = sessionStorage.getItem('password_recovery_mode');
      if (recoveryMode === 'true') {
        console.log('Recovery mode detected from session storage');
        // Clear the flag
        sessionStorage.removeItem('password_recovery_mode');
        
        // Check for existing session (should be set by Supabase auth callback)
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          console.log('Valid session found in recovery mode');
          setValidSession(true);
          setChecking(false);
          return;
        }
      }

      // Check for hash fragment with access_token (Supabase recovery token)
      const hash = window.location.hash;
      if (hash && hash.includes('access_token')) {
        console.log('Found access_token in hash');
        // Parse the hash to extract the token and set the session
        const params = new URLSearchParams(hash.substring(1));
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        const type = params.get('type');
        
        console.log('Token type:', type);
        
        if (accessToken && refreshToken) {
          // Set the session with the recovery tokens
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          
          if (sessionError) {
            console.error('Session error:', sessionError);
            toast.error('重設密碼失敗', { 
              description: '連結已過期或無效，請重新申請' 
            });
            navigate('/auth');
            return;
          }
          
          console.log('Session set successfully');
          // Clear the hash from URL for cleaner appearance
          window.history.replaceState(null, '', window.location.pathname);
          setValidSession(true);
          setChecking(false);
          return;
        }
      }

      // Check for existing session
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Existing session:', !!session);
      
      // If we have a session, allow password reset
      if (session) {
        setValidSession(true);
        setChecking(false);
        return;
      }
      
      // Wait a bit for auth state to settle (Supabase might still be processing)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check again after delay
      const { data: { session: delayedSession } } = await supabase.auth.getSession();
      if (delayedSession) {
        setValidSession(true);
        setChecking(false);
        return;
      }
      
      // No valid session found
      console.log('No valid session found');
      toast.error('請先點擊郵件中的重設密碼連結');
      navigate('/auth');
    };

    checkSession();
  }, [searchParams, navigate]);

  const validateForm = () => {
    const newErrors: typeof errors = {};

    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      newErrors.password = passwordResult.error.errors[0].message;
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = '兩次輸入的密碼不一致';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ 
        password: password 
      });

      if (error) {
        toast.error('密碼更新失敗', { description: error.message });
        return;
      }

      setSuccess(true);
      toast.success('密碼已更新！', { description: '您現在可以使用新密碼登入' });
      
      // Redirect to auth page after 2 seconds
      setTimeout(() => {
        navigate('/auth');
      }, 2000);
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while checking session
  if (checking) {
    return (
      <div className="min-h-screen bg-gradient-morning flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-card-zen border-border/50 animate-slide-up">
          <CardContent className="pt-8 pb-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <h2 className="text-xl font-semibold mb-2">驗證中...</h2>
            <p className="text-muted-foreground">正在驗證您的重設密碼連結</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-morning flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-card-zen border-border/50 animate-slide-up">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold mb-2">密碼已更新！</h2>
            <p className="text-muted-foreground">正在為您導向登入頁面...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-morning flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
            <Sparkles className="h-8 w-8 text-primary animate-pulse-soft" />
          </div>
          <h1 className="font-serif text-3xl font-semibold text-foreground">
            重設密碼
          </h1>
          <p className="text-muted-foreground mt-2">
            請輸入您的新密碼
          </p>
        </div>

        {/* Reset Password Card */}
        <Card className="shadow-card-zen border-border/50 animate-slide-up">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl">設定新密碼</CardTitle>
            <CardDescription>
              密碼至少需要 6 個字元
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="新密碼"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="確認新密碼"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                更新密碼
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => navigate('/auth')}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                返回登入頁面
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
