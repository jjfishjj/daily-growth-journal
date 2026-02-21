import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { lovable } from '@/integrations/lovable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Sparkles, Mail, Lock, User, Loader2, Chrome, CheckCircle2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { z } from 'zod';

const emailSchema = z.string().email('請輸入有效的電子郵件');
const passwordSchema = z.string().min(6, '密碼至少需要 6 個字元');
const nameSchema = z.string().min(1, '請輸入您的名稱');

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirmPassword?: string; name?: string }>({});
  
  const { signIn, signUp, signInWithGoogle, resetPasswordForEmail, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/today');
    }
  }, [user, navigate]);

  const validateForm = () => {
    const newErrors: typeof errors = {};

    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }

    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      newErrors.password = passwordResult.error.errors[0].message;
    }

    if (!isLogin) {
      const nameResult = nameSchema.safeParse(name);
      if (!nameResult.success) {
        newErrors.name = nameResult.error.errors[0].message;
      }

      // 確認密碼驗證
      if (password !== confirmPassword) {
        newErrors.confirmPassword = '兩次輸入的密碼不一致';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast.error('登入失敗', { description: '電子郵件或密碼錯誤' });
          } else if (error.message.includes('Email not confirmed')) {
            toast.error('登入失敗', { description: '請先驗證您的電子郵件' });
          } else {
            toast.error('登入失敗', { description: error.message });
          }
          return;
        }
        toast.success('歡迎回來！', { description: '開始記錄今天的修行吧' });
        navigate('/today');
      } else {
        const { error } = await signUp(email, password, name);
        if (error) {
          if (error.message.includes('already registered')) {
            toast.error('註冊失敗', { description: '此電子郵件已被註冊' });
          } else {
            toast.error('註冊失敗', { description: error.message });
          }
          return;
        }
        // 顯示驗證郵件提示
        setSignupSuccess(true);
        toast.success('註冊成功！', { 
          description: '請檢查您的電子郵件以完成驗證' 
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      setErrors({ email: emailResult.error.errors[0].message });
      return;
    }

    setLoading(true);
    try {
      const { error } = await resetPasswordForEmail(email);
      if (error) {
        toast.error('發送失敗', { description: error.message });
        return;
      }
      setResetEmailSent(true);
      toast.success('重設密碼郵件已發送！', { 
        description: '請檢查您的電子郵件信箱' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await lovable.auth.signInWithOAuth('google', {
        redirect_uri: window.location.origin,
      });
      if (error) throw error;
    } catch (err: any) {
      const error = err as Error;
      let errorDescription = '請稍後再試';
      
      if (error.message?.includes('popup_closed')) {
        errorDescription = '登入視窗已關閉，請重新嘗試';
      } else if (error.message?.includes('access_denied')) {
        errorDescription = '您拒絕了授權請求，請允許存取以完成登入';
      } else if (error.message?.includes('network')) {
        errorDescription = '網路連線問題，請檢查您的網路連線後重試';
      } else if (error.message?.includes('timeout')) {
        errorDescription = '連線逾時，請稍後再試';
      } else if (error.message?.includes('invalid_client')) {
        errorDescription = 'Google 登入設定有問題，請聯繫管理員';
      } else if (error.message?.includes('server_error')) {
        errorDescription = 'Google 伺服器暫時無法使用，請使用電子郵件登入或稍後再試';
      }
      
      toast.error('Google 登入失敗', { 
        description: errorDescription,
        action: {
          label: '使用郵件登入',
          onClick: () => setShowForgotPassword(false)
        }
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  // 註冊成功畫面 - 顯示驗證郵件提示
  if (signupSuccess) {
    return (
      <div className="min-h-screen bg-gradient-morning flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-card-zen border-border/50 animate-slide-up">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold mb-2">註冊成功！</h2>
            <p className="text-muted-foreground mb-4">
              我們已發送驗證郵件至<br />
              <span className="font-medium text-foreground">{email}</span>
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              請點擊郵件中的連結來完成驗證後登入。<br />
              如果沒收到郵件，請檢查垃圾郵件資料夾。
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSignupSuccess(false);
                setIsLogin(true);
                setPassword('');
                setConfirmPassword('');
              }}
              className="w-full"
            >
              返回登入頁面
            </Button>
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
            修行日誌
          </h1>
          <p className="text-muted-foreground mt-2">
            每日修行與自我成長習慣追蹤
          </p>
        </div>

        {/* Auth Card */}
        <Card className="shadow-card-zen border-border/50 animate-slide-up">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl">
              {showForgotPassword 
                ? '忘記密碼' 
                : isLogin 
                  ? '登入帳號' 
                  : '建立帳號'}
            </CardTitle>
            <CardDescription>
              {showForgotPassword
                ? '輸入您的電子郵件，我們會發送重設密碼連結'
                : isLogin 
                  ? '登入以記錄您的每日修行' 
                  : '開始您的自我成長之旅'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {showForgotPassword ? (
              // Forgot Password Form
              resetEmailSent ? (
                <div className="text-center py-4">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-medium mb-2">郵件已發送！</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    請檢查 <span className="font-medium">{email}</span> 的收件匣，<br />
                    點擊郵件中的連結重設密碼
                  </p>
                  <p className="text-xs text-muted-foreground mb-4">
                    沒收到郵件？請檢查垃圾郵件資料夾
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setResetEmailSent(false);
                    }}
                    className="w-full"
                  >
                    返回登入
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-2">
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder="電子郵件"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    {errors.email && (
                      <p className="text-sm text-destructive">{errors.email}</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loading}
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    發送重設密碼郵件
                  </Button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotPassword(false);
                        setErrors({});
                      }}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      返回登入
                    </button>
                  </div>
                </form>
              )
            ) : (
              // Login/Signup Form
              <>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {!isLogin && (
                    <div className="space-y-2">
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="text"
                          placeholder="您的名稱"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      {errors.name && (
                        <p className="text-sm text-destructive">{errors.name}</p>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder="電子郵件"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    {errors.email && (
                      <p className="text-sm text-destructive">{errors.email}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="password"
                        placeholder="密碼（至少 6 個字元）"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    {errors.password && (
                      <p className="text-sm text-destructive">{errors.password}</p>
                    )}
                  </div>

                  {/* 確認密碼欄位 - 僅註冊時顯示 */}
                  {!isLogin && (
                    <div className="space-y-2">
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="password"
                          placeholder="確認密碼"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      {errors.confirmPassword && (
                        <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                      )}
                    </div>
                  )}

                  {isLogin && (
                    <div className="text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setShowForgotPassword(true);
                          setErrors({});
                        }}
                        className="text-sm text-primary hover:underline"
                      >
                        忘記密碼？
                      </button>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loading || googleLoading}
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isLogin ? '登入' : '註冊'}
                  </Button>
                </form>

                <div className="relative my-6">
                  <Separator />
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                    或
                  </span>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleGoogleSignIn}
                  disabled={loading || googleLoading}
                >
                  {googleLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Chrome className="mr-2 h-4 w-4" />
                  )}
                  使用 Google 帳號{isLogin ? '登入' : '註冊'}
                </Button>

                <div className="mt-6 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(!isLogin);
                      setErrors({});
                      setConfirmPassword('');
                    }}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {isLogin ? '還沒有帳號？立即註冊' : '已有帳號？立即登入'}
                  </button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          每天 1-2 分鐘，養成修行好習慣
        </p>
      </div>
    </div>
  );
}
