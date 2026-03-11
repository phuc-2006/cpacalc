import { GraduationCap, Moon, Sun, ClipboardList } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import UserMenu from '@/components/UserMenu';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useTheme } from 'next-themes';

const Header = () => {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-bg">
            <GraduationCap className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">GPA Calculator</h1>
            <p className="text-xs text-muted-foreground">Tính điểm GPA & CPA</p>
          </div>
          <nav className="hidden sm:flex items-center gap-1 ml-6">
            <Link to="/" className="px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted">
              Tính điểm
            </Link>
            <Link to="/planner" className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted">
              <ClipboardList className="h-3.5 w-3.5" />
              Kế hoạch
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-9 w-9"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
          {user ? (
            <UserMenu />
          ) : (
            <Link to="/auth">
              <Button variant="gradient" size="sm">
                Đăng nhập
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
