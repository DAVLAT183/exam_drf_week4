'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, User, Phone, Briefcase, GraduationCap, Building2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { clsx, getErrorMessage } from '@/lib/utils';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [role, setRole] = useState<'student' | 'employer'>('student');
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    phone: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register({ ...form, role });
      router.push(role === 'student' ? '/profile/student' : '/profile/employer');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="card p-8">
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-lg bg-accent-primary flex items-center justify-center mx-auto mb-4">
              <Briefcase size={24} className="text-text-on-accent" />
            </div>
            <h1 className="font-heading font-semibold text-2xl mb-2">Регистрация</h1>
            <p className="text-sm text-text-muted">Создайте аккаунт и начните поиск</p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              type="button"
              onClick={() => setRole('student')}
              className={clsx(
                'p-4 rounded-lg border text-center transition-all duration-150',
                role === 'student'
                  ? 'border-accent-primary bg-accent-primary/10'
                  : 'border-border-default hover:border-border-hover'
              )}
            >
              <GraduationCap size={24} className={clsx('mx-auto mb-2', role === 'student' ? 'text-accent-primary' : 'text-text-muted')} />
              <div className={clsx('text-sm font-medium', role === 'student' ? 'text-text-primary' : 'text-text-muted')}>Студент</div>
            </button>
            <button
              type="button"
              onClick={() => setRole('employer')}
              className={clsx(
                'p-4 rounded-lg border text-center transition-all duration-150',
                role === 'employer'
                  ? 'border-accent-primary bg-accent-primary/10'
                  : 'border-border-default hover:border-border-hover'
              )}
            >
              <Building2 size={24} className={clsx('mx-auto mb-2', role === 'employer' ? 'text-accent-primary' : 'text-text-muted')} />
              <div className={clsx('text-sm font-medium', role === 'employer' ? 'text-text-primary' : 'text-text-muted')}>Работодатель</div>
            </button>
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
              value={form.username}
              onChange={(e) => update('username', e.target.value)}
              icon={<User size={16} />}
              required
            />

            <Input
              label="Email"
              type="email"
              placeholder="email@example.com"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              icon={<Mail size={16} />}
              required
            />

            <Input
              label="Пароль"
              type="password"
              placeholder="Минимум 6 символов"
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
              icon={<Lock size={16} />}
              required
              minLength={6}
            />

            <Input
              label="Телефон"
              placeholder="+7 (900) 123-45-67"
              value={form.phone}
              onChange={(e) => update('phone', e.target.value)}
              icon={<Phone size={16} />}
            />

            <Button type="submit" loading={loading} className="w-full mt-2">
              Зарегистрироваться
            </Button>
          </form>

          <p className="text-center text-sm text-text-muted mt-6">
            Уже есть аккаунт?{' '}
            <Link href="/auth/login" className="text-accent-primary hover:text-accent-primary-hover transition-colors font-medium">
              Войти
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}