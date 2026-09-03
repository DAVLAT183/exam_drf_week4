'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';
import api from '@/lib/api';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    if (token) {
      verifyToken(token);
    } else {
      setStatus('error');
      setMessage('Токен верификации не найден');
    }
  }, [token]);

  const verifyToken = async (t: string) => {
    try {
      const res = await api.get(`/auth/verify-email/?token=${t}`);
      setStatus('success');
      setMessage(res.data.detail);
    } catch (err: any) {
      setStatus('error');
      setMessage(err.response?.data?.detail || 'Ошибка верификации');
    }
  };

  const resendVerification = async () => {
    if (!email) return;
    setResendLoading(true);
    try {
      await api.post('/auth/send-verification/', { email });
      setResendSuccess(true);
    } catch (err: any) {
      setMessage(err.response?.data?.detail || 'Ошибка отправки');
    } finally {
      setResendLoading(false);
    }
  };

  if (token) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-6">
        <Card className="max-w-md w-full text-center">
          {status === 'loading' && (
            <>
              <Loader2 size={48} className="text-accent mx-auto mb-4 animate-spin" />
              <h2 className="font-heading font-bold text-xl mb-2">Верификация...</h2>
              <p className="text-muted text-sm">Проверяем ваш email</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
              <h2 className="font-heading font-bold text-xl mb-2">Email верифицирован!</h2>
              <p className="text-muted text-sm mb-6">{message}</p>
              <Link href="/auth/login">
                <Button>Войти в аккаунт</Button>
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle size={48} className="text-error mx-auto mb-4" />
              <h2 className="font-heading font-bold text-xl mb-2">Ошибка верификации</h2>
              <p className="text-muted text-sm mb-6">{message}</p>
              <Link href="/auth/register">
                <Button variant="secondary">Зарегистрироваться заново</Button>
              </Link>
            </>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <Card className="max-w-md w-full text-center">
        <Mail size={48} className="text-accent mx-auto mb-4" />
        <h2 className="font-heading font-bold text-xl mb-2">Верификация email</h2>
        <p className="text-muted text-sm mb-6">
          Введите email для повторной отправки письма
        </p>

        {resendSuccess ? (
          <div className="p-4 glass rounded-lg">
            <CheckCircle size={24} className="text-green-500 mx-auto mb-2" />
            <p className="text-sm text-soft">Письмо отправлено! Проверьте почту.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-muted focus:outline-none focus:border-accent/50"
            />
            <Button
              onClick={resendVerification}
              loading={resendLoading}
              disabled={!email}
              className="w-full"
            >
              Отправить письмо
            </Button>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-white/[0.04]">
          <Link href="/auth/login" className="text-sm text-muted hover:text-white transition-colors">
            Вернуться к входу
          </Link>
        </div>
      </Card>
    </div>
  );
}
