'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, Briefcase, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function LoginPage() {
  const { login, user } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailVerified, setEmailVerified] = useState<boolean | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      checkVerification();
    }
  }, [user]);

  const checkVerification = async () => {
    try {
      const res = await api.get('/auth/check-verification/');
      setEmailVerified(res.data.is_verified);
    } catch {
      setEmailVerified(null);
    }
  };

  const resendVerification = async () => {
    setResendLoading(true);
    try {
      await api.post('/auth/send-verification/', { email: user?.email });
      setResendSuccess(true);
    } catch {
      setError('Ошибка отправки письма');
    } finally {
      setResendLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      router.push('/jobs');
    } catch {
      setError('Неверное имя пользователя или пароль');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12">
      <div className="w-full max-w-md">
        <div className="card p-8">
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-lg bg-accent-primary flex items-center justify-center mx-auto mb-4">
              <Briefcase size={24} className="text-text-on-accent" />
            </div>
            <h1 className="font-heading font-semibold text-2xl mb-2">Вход в аккаунт</h1>
            <p className="text-sm text-text-muted">Войдите, чтобы продолжить поиск работы</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                {error}
              </div>
            )}

            <Input
              label="Имя пользователя"
              placeholder="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              icon={<Mail size={16} />}
              required
            />

            <Input
              label="Пароль"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock size={16} />}
              required
            />

            <Button type="submit" loading={loading} className="w-full mt-2">
              Войти
            </Button>
          </form>

          <p className="text-center text-sm text-text-muted mt-6">
            Нет аккаунта?{' '}
            <Link href="/auth/register" className="text-accent-primary hover:text-accent-primary-hover transition-colors font-medium">
              Зарегистрироваться
            </Link>
          </p>

          {user && emailVerified === false && (
            <div className="mt-4 p-4 card border border-yellow-500/30 bg-yellow-500/5">
              <div className="flex items-start gap-3">
                <AlertCircle size={20} className="text-yellow-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-yellow-400 font-medium">Email не верифицирован</p>
                  <p className="text-xs text-text-muted mt-1">
                    Проверьте почту {user.email} или запросите новое письмо
                  </p>
                  {resendSuccess ? (
                    <div className="flex items-center gap-2 mt-2">
                      <CheckCircle size={14} className="text-accent-primary" />
                      <span className="text-xs text-accent-primary">Письмо отправлено!</span>
                    </div>
                  ) : (
                    <Button
                      onClick={resendVerification}
                      loading={resendLoading}
                      variant="secondary"
                      size="sm"
                      className="mt-2"
                    >
                      Отправить повторно
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}