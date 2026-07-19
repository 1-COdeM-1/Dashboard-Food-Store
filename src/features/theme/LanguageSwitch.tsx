import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Dropdown } from '@/components/ui/Dropdown';
import { applyDocumentDirection } from '@/i18n';

export function LanguageSwitch() {
  const { t, i18n } = useTranslation();

  const changeLanguage = async (lng: 'en' | 'ar') => {
    await i18n.changeLanguage(lng);
    applyDocumentDirection(lng);
  };

  return (
    <Dropdown
      trigger={
        <Button variant="ghost" size="icon" aria-label={t('common.language')}>
          <Languages className="size-4" />
        </Button>
      }
      items={[
        {
          label: t('common.english'),
          onClick: () => void changeLanguage('en'),
        },
        {
          label: t('common.arabic'),
          onClick: () => void changeLanguage('ar'),
        },
      ]}
    />
  );
}
