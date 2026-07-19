import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LogOut, Menu, PanelLeftClose, PanelLeftOpen, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Dropdown } from '@/components/ui/Dropdown';
import { ThemeToggle } from '@/features/theme/ThemeToggle';
import { LanguageSwitch } from '@/features/theme/LanguageSwitch';
import { useSidebarStore } from '@/features/theme/useSidebarStore';
import { useAuthStore } from '@/features/auth/useAuthStore';

function useBreadcrumbs() {
  const { t } = useTranslation();
  const location = useLocation();
  const parts = location.pathname.split('/').filter(Boolean);

  const labels: Record<string, string> = {
    dashboard: t('nav.overview'),
    products: t('nav.products'),
    new: t('nav.addProduct'),
    settings: t('nav.settings'),
    edit: t('products.editProduct'),
  };

  return parts.map((part, index) => {
    const path = '/' + parts.slice(0, index + 1).join('/');
    const label = labels[part] ?? (Number.isFinite(Number(part)) ? `#${part}` : part);
    return { path, label };
  });
}

export function Navbar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const crumbs = useBreadcrumbs();
  const collapsed = useSidebarStore((s) => s.collapsed);
  const toggleCollapsed = useSidebarStore((s) => s.toggleCollapsed);
  const setMobileOpen = useSidebarStore((s) => s.setMobileOpen);
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-surface/80 px-4 backdrop-blur-md transition-colors duration-300 sm:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="size-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="hidden lg:inline-flex"
        onClick={toggleCollapsed}
        aria-label="Toggle sidebar"
      >
        {collapsed ? (
          <PanelLeftOpen className="size-4 rtl:scale-x-[-1]" />
        ) : (
          <PanelLeftClose className="size-4 rtl:scale-x-[-1]" />
        )}
      </Button>

      <nav className="hidden min-w-0 flex-1 items-center gap-2 text-sm sm:flex">
        {crumbs.map((crumb, index) => (
          <div key={crumb.path} className="flex min-w-0 items-center gap-2">
            {index > 0 ? (
              <span className="text-muted-foreground rtl:inline-block rtl:scale-x-[-1]">/</span>
            ) : null}
            {index === crumbs.length - 1 ? (
              <span className="truncate font-medium text-foreground">{crumb.label}</span>
            ) : (
              <Link
                to={crumb.path}
                className="truncate text-muted-foreground transition-colors hover:text-foreground"
              >
                {crumb.label}
              </Link>
            )}
          </div>
        ))}
      </nav>

      <div className="ms-auto flex items-center gap-1">
        <LanguageSwitch />
        <ThemeToggle />
        <Dropdown
          trigger={
            <Button variant="ghost" className="ms-1 gap-2 px-2">
              <span className="flex size-8 items-center justify-center rounded-full bg-accent text-accent-foreground">
                <User className="size-4" />
              </span>
              <span className="hidden max-w-36 truncate text-sm md:inline">
                {user?.email ?? 'Admin'}
              </span>
            </Button>
          }
          items={[
            {
              label: t('nav.settings'),
              onClick: () => navigate('/dashboard/settings'),
              icon: <User className="size-4" />,
            },
            {
              label: t('common.logout'),
              onClick: () => void handleLogout(),
              danger: true,
              icon: <LogOut className="size-4" />,
            },
          ]}
        />
      </div>
    </header>
  );
}
