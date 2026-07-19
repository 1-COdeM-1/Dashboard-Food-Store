import { useTranslation } from 'react-i18next';
import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { useThemeStore } from '@/features/theme/useThemeStore';
import { useAuthStore } from '@/features/auth/useAuthStore';
import { applyDocumentDirection } from '@/i18n';

export function SettingsPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);

  const changeLanguage = async (lng: 'en' | 'ar') => {
    await i18n.changeLanguage(lng);
    applyDocumentDirection(lng);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t('settings.title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('settings.subtitle')}</p>
      </div>

      <Card>
        <CardHeader title={t('settings.appearance')} description={t('settings.appearanceDesc')} />
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">{t('common.theme')}</p>
            <p className="text-sm text-muted-foreground">
              {theme === 'dark' ? t('common.dark') : t('common.light')}
            </p>
          </div>
          <Switch
            checked={theme === 'dark'}
            onChange={(checked) => setTheme(checked ? 'dark' : 'light')}
            label={t('common.dark')}
          />
        </div>
      </Card>

      <Card>
        <CardHeader title={t('common.language')} description={t('settings.languageDesc')} />
        <div className="flex flex-wrap gap-2">
          <Button
            variant={i18n.language.startsWith('en') ? 'primary' : 'outline'}
            onClick={() => void changeLanguage('en')}
          >
            {t('common.english')}
          </Button>
          <Button
            variant={i18n.language.startsWith('ar') ? 'primary' : 'outline'}
            onClick={() => void changeLanguage('ar')}
          >
            {t('common.arabic')}
          </Button>
        </div>
      </Card>

      <Card>
        <CardHeader title={t('settings.account')} />
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">{t('settings.email')}</p>
            <p className="mt-1 font-medium" dir="ltr">
              {user?.email ?? '—'}
            </p>
          </div>
          <Button
            variant="danger"
            onClick={async () => {
              await signOut();
              navigate('/login');
            }}
          >
            <LogOut className="size-4" />
            {t('common.logout')}
          </Button>
        </div>
      </Card>
    </div>
  );
}
