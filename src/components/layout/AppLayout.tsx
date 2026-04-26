import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import {
  CalendarDays, History, BarChart3, Shield, LogOut, Menu, X,
  Sparkles, Users, FlaskConical, BookHeart, Zap, MessageCircle,
  UserCircle, Recycle, MessagesSquare, Smartphone, ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useUnreadMessageCount } from '@/hooks/useMessages';
import { NotificationBell } from '@/components/layout/NotificationBell';
import { MarqueeBanner } from '@/components/layout/MarqueeBanner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface AppLayoutProps {
  children: ReactNode;
}

// 主要功能列（露出於主導覽）
const navItems = [
  { path: '/today', label: '今日填寫', icon: CalendarDays },
  { path: '/history', label: '歷史紀錄', icon: History },
  { path: '/stats', label: '我的數據', icon: BarChart3 },
  { path: '/community', label: '平台動態', icon: Users },
  { path: '/forum', label: '論壇', icon: MessagesSquare },
  { path: '/guanxin', label: '觀心書專區', icon: BookHeart },
  { path: '/declutter', label: '斷捨離', icon: Recycle },
];

// 收進「個人」下拉選單
const personalItems = [
  { path: '/profile', label: '個人檔案', icon: UserCircle },
  { path: '/wallet', label: '能量錢包', icon: Zap },
  { path: '/match', label: '每日一抽', icon: Sparkles },
  { path: '/messages', label: '訊息', icon: MessageCircle },
  { path: '/install', label: '安裝 App', icon: Smartphone },
];

const adminNavItems = [
  { path: '/simulation', label: '數據模擬', icon: FlaskConical },
];

export function AppLayout({ children }: AppLayoutProps) {
  const { user, isAdmin, signOut } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const unread = useUnreadMessageCount();

  const handleSignOut = async () => {
    await signOut();
  };

  const isPersonalActive = personalItems.some(p => location.pathname === p.path);

  return (
    <div className="min-h-screen bg-gradient-morning">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        {/* Site-wide marquee */}
        <MarqueeBanner />

        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link to="/today" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <span className="font-serif text-lg font-semibold text-foreground">
                修行日誌
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map(item => (
                <Link key={item.path} to={item.path}>
                  <Button
                    variant={location.pathname === item.path ? 'secondary' : 'ghost'}
                    size="sm"
                    className={cn(
                      'gap-2 relative',
                      location.pathname === item.path && 'bg-secondary'
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              ))}

              {/* 個人下拉選單 */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant={isPersonalActive ? 'secondary' : 'ghost'}
                    size="sm"
                    className="gap-2 relative"
                  >
                    <UserCircle className="h-4 w-4" />
                    個人
                    {unread > 0 && (
                      <Badge className="h-4 min-w-4 px-1 text-[10px] ml-0.5">{unread}</Badge>
                    )}
                    <ChevronDown className="h-3 w-3 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-background">
                  {personalItems.map(item => (
                    <DropdownMenuItem key={item.path} asChild>
                      <Link to={item.path} className="gap-2 cursor-pointer">
                        <item.icon className="h-4 w-4" />
                        <span className="flex-1">{item.label}</span>
                        {item.path === '/messages' && unread > 0 && (
                          <Badge className="h-4 min-w-4 px-1 text-[10px]">{unread}</Badge>
                        )}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {isAdmin && (
                <>
                  {adminNavItems.map(item => (
                    <Link key={item.path} to={item.path}>
                      <Button
                        variant={location.pathname === item.path ? 'secondary' : 'ghost'}
                        size="sm"
                        className={cn(
                          'gap-2',
                          location.pathname === item.path && 'bg-secondary'
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                      </Button>
                    </Link>
                  ))}
                  <Link to="/admin">
                    <Button
                      variant={location.pathname === '/admin' ? 'secondary' : 'ghost'}
                      size="sm"
                      className="gap-2"
                    >
                      <Shield className="h-4 w-4" />
                      管理後台
                    </Button>
                  </Link>
                </>
              )}
            </nav>

            {/* User Actions */}
            <div className="flex items-center gap-2">
              <NotificationBell />
              <span className="hidden sm:inline text-sm text-muted-foreground">
                {user?.email}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">登出</span>
              </Button>

              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border/50 bg-background">
            <nav className="container mx-auto px-4 py-3 space-y-1">
              {navItems.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Button
                    variant={location.pathname === item.path ? 'secondary' : 'ghost'}
                    className="w-full justify-start gap-2 relative"
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              ))}

              <div className="pt-2 mt-2 border-t border-border/50">
                <div className="px-3 py-1 text-xs text-muted-foreground">個人</div>
                {personalItems.map(item => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button
                      variant={location.pathname === item.path ? 'secondary' : 'ghost'}
                      className="w-full justify-start gap-2 relative"
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                      {item.path === '/messages' && unread > 0 && (
                        <Badge className="h-4 min-w-4 px-1 text-[10px] ml-auto">{unread}</Badge>
                      )}
                    </Button>
                  </Link>
                ))}
              </div>

              {isAdmin && (
                <>
                  {adminNavItems.map(item => (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Button
                        variant={location.pathname === item.path ? 'secondary' : 'ghost'}
                        className="w-full justify-start gap-2"
                      >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                      </Button>
                    </Link>
                  ))}
                  <Link to="/admin" onClick={() => setMobileMenuOpen(false)}>
                    <Button
                      variant={location.pathname === '/admin' ? 'secondary' : 'ghost'}
                      className="w-full justify-start gap-2"
                    >
                      <Shield className="h-4 w-4" />
                      管理後台
                    </Button>
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 md:py-8">
        {children}
      </main>
    </div>
  );
}
