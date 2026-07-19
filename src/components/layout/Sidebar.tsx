import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  Package,
  PlusCircle,
  Settings,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebarStore } from '@/features/theme/useSidebarStore';
import { Button } from '@/components/ui/Button';

const links = [
  { to: '/dashboard', labelKey: 'nav.overview', icon: LayoutDashboard, end: true },
  { to: '/dashboard/products', labelKey: 'nav.products', icon: Package },
  { to: '/dashboard/products/new', labelKey: 'nav.addProduct', icon: PlusCircle },
  { to: '/dashboard/settings', labelKey: 'nav.settings', icon: Settings },
];

export function Sidebar() {
  const { t } = useTranslation();
  const collapsed = useSidebarStore((s) => s.collapsed);
  const mobileOpen = useSidebarStore((s) => s.mobileOpen);
  const setMobileOpen = useSidebarStore((s) => s.setMobileOpen);

  const content = (
    <aside
      className={cn(
        'flex h-full flex-col border-e border-border bg-surface transition-all duration-300',
        collapsed ? 'w-[72px]' : 'w-64',
      )}
    >
      <div className="flex h-16 items-center justify-between gap-2 border-b border-border px-4">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-sm">
            SA
          </div>
          {!collapsed ? (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{t('common.appName')}</p>
              <p className="truncate text-xs text-muted-foreground">{t('nav.dashboard')}</p>
            </div>
          ) : null}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
        >
          <X className="size-4" />
        </Button>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              cn(
                'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-accent text-accent-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                collapsed && 'justify-center px-2',
              )
            }
            title={t(link.labelKey)}
          >
            <link.icon className="size-4 shrink-0" />
            {!collapsed ? <span className="truncate">{t(link.labelKey)}</span> : null}
          </NavLink>
        ))}
      </nav>
    </aside>
  );

  return (
    <>
      <div className="hidden h-full lg:block">{content}</div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            aria-label="Close overlay"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 start-0 w-64 animate-[slide-in-start_220ms_ease-out] shadow-xl">
            {content}
          </div>
        </div>
      ) : null}
    </>
  );
}
