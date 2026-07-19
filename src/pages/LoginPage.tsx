import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Navigate, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { loginSchema, type LoginFormValues } from '@/lib/schemas';
import { useAuthStore } from '@/features/auth/useAuthStore';
import { useToast } from '@/features/toast/useToast';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/features/theme/ThemeToggle';
import { LanguageSwitch } from '@/features/theme/LanguageSwitch';

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const session = useAuthStore((s) => s.session);
  const signIn = useAuthStore((s) => s.signIn);
  const loading = useAuthStore((s) => s.loading);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  if (session) {
    return <Navigate to="/dashboard" replace />;
  }

  const onSubmit = async (values: LoginFormValues) => {
    const { error } = await signIn(values.email, values.password);
    if (error) {
      toast.error(t('toast.error'), t('auth.invalidCredentials'));
      return;
    }
    navigate('/dashboard');
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--accent)_0%,_transparent_55%),radial-gradient(ellipse_at_bottom_right,_color-mix(in_srgb,var(--primary)_18%,transparent)_0%,_transparent_45%)]" />
      <div className="absolute end-4 top-4 z-10 flex gap-1">
        <LanguageSwitch />
        <ThemeToggle />
      </div>

      <div className="relative mx-auto grid min-h-screen max-w-6xl lg:grid-cols-2">
        <div className="hidden flex-col justify-between p-10 lg:flex xl:p-14">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-primary text-sm font-bold text-primary-foreground shadow-md">
              SA
            </div>
            <span className="text-lg font-semibold tracking-tight">{t('common.appName')}</span>
          </div>
          <div className="max-w-md space-y-4">
            <h1 className="text-4xl font-semibold tracking-tight text-foreground xl:text-5xl">
              {t('auth.brandTitle')}
            </h1>
            <p className="text-base leading-relaxed text-muted-foreground">
              {t('auth.brandSubtitle')}
            </p>
          </div>
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Store Admin</p>
        </div>

        <div className="flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md animate-[slide-up_220ms_ease-out] rounded-2xl border border-border bg-surface/90 p-6 shadow-xl backdrop-blur-sm sm:p-8">
            <div className="mb-8 lg:hidden">
              <div className="mb-4 flex size-11 items-center justify-center rounded-2xl bg-primary text-sm font-bold text-primary-foreground">
                SA
              </div>
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              {t('auth.welcome')}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{t('auth.subtitle')}</p>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
              <Input
                label={t('auth.email')}
                type="email"
                autoComplete="email"
                error={errors.email?.message ? t('validation.email') : undefined}
                {...register('email')}
              />
              <div className="relative">
                <Input
                  label={t('auth.password')}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  error={errors.password?.message ? t('validation.minPassword') : undefined}
                  className="pe-11"
                  {...register('password')}
                />
                <button
                  type="button"
                  className="absolute end-3 top-[34px] text-muted-foreground transition-colors hover:text-foreground"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              <Button type="submit" className="mt-2 w-full" loading={loading}>
                {loading ? t('auth.signingIn') : t('auth.signIn')}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
