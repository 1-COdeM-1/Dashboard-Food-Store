import { Moon, Sun } from 'lucide-react';
import { useThemeStore } from '@/features/theme/useThemeStore';
import { Button } from '@/components/ui/Button';
import { useTranslation } from 'react-i18next';

export function ThemeToggle() {
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const { t } = useTranslation();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label={t('common.theme')}
      className="relative overflow-hidden"
    >
      <Sun
        className={`size-4 transition-all duration-300 ${
          theme === 'dark' ? 'scale-0 rotate-90 opacity-0' : 'scale-100 rotate-0 opacity-100'
        }`}
      />
      <Moon
        className={`absolute size-4 transition-all duration-300 ${
          theme === 'dark' ? 'scale-100 rotate-0 opacity-100' : 'scale-0 -rotate-90 opacity-0'
        }`}
      />
    </Button>
  );
}
