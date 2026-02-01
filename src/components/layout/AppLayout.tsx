import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { 
  CalendarDays, 
  History, 
  BarChart3, 
  Shield, 
  LogOut, 
  Menu, 
  X,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: ReactNode;
}

import { FlaskConical } from 'lucide-react';

const navItems = [
  { path: '/today', label: '今日填寫', icon: CalendarDays },
  { path: '/history', label: '歷史紀錄', icon: History },
  { path: '/stats', label: '我的數據', icon: BarChart3 },
];

const adminNavItems = [
  { path: '/simulation', label: '數據模擬', icon: FlaskConical },
];

export function AppLayout({ children }: AppLayoutProps) {
  const { user, isAdmin, signOut } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-gradient-morning">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
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
                      'gap-2',
                      location.pathname === item.path && 'bg-secondary'
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              ))}
              
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
                    className="w-full justify-start gap-2"
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              ))}
              
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
