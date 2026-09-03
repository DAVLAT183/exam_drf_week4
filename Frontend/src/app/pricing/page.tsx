'use client';

import { Check, Sparkles, Zap, Crown } from 'lucide-react';
import Link from 'next/link';

const plans = [
  {
    name: 'Бесплатный',
    price: '0',
    period: 'навсегда',
    icon: Zap,
    description: 'Для начинающих',
    features: ['Размещение 3 вакансий', 'Базовый поиск кандидатов', 'Чат с кандидатами', 'Email уведомления'],
    cta: 'Начать бесплатно',
    href: '/auth/register',
    popular: false,
  },
  {
    name: 'Профессиональный',
    price: '299',
    period: 'сомони/мес',
    icon: Sparkles,
    description: 'Для растущих компаний',
    features: ['Безлимит вакансий', 'Расширенный поиск', 'Приоритет в выдаче', 'Аналитика просмотров', 'Выделение вакансии', 'Приоритетная поддержка'],
    cta: 'Попробовать бесплатно',
    href: '/auth/register',
    popular: true,
  },
  {
    name: 'Корпоративный',
    price: '999',
    period: 'сомони/мес',
    icon: Crown,
    description: 'Для крупных компаний',
    features: ['Всё из Профессионального', 'API доступ', 'Персональный менеджер', 'Кастомный брендинг', 'Интеграция с HR-системами', 'SLA 99.9%'],
    cta: 'Связаться с нами',
    href: '/contact',
    popular: false,
  },
];

export default function PricingPage() {
  return (
    <div className="max-w-[1280px] mx-auto px-6 py-12">
      <div className="text-center mb-12">
        <h1 className="font-heading font-bold text-3xl md:text-4xl mb-3">Тарифы</h1>
        <p className="text-text-muted text-lg max-w-xl mx-auto">
          Выберите подходящий план для вашей компании. Все планы включают 14-дневный пробный период.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`card-minimal p-8 relative ${
              plan.popular ? 'border-accent-primary shadow-[0_0_30px_rgba(16,185,129,0.15)]' : ''
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-accent-primary text-white text-xs font-bold">
                Популярный
              </div>
            )}
            <div className="w-12 h-12 rounded-xl bg-accent-primary/10 flex items-center justify-center mb-4">
              <plan.icon size={22} className="text-accent-primary" />
            </div>
            <h3 className="font-heading font-semibold text-lg">{plan.name}</h3>
            <p className="text-sm text-text-muted mb-4">{plan.description}</p>
            <div className="mb-6">
              <span className="text-3xl font-bold">{plan.price}</span>
              <span className="text-sm text-text-muted ml-1">{plan.period}</span>
            </div>
            <ul className="space-y-3 mb-8">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-text-secondary">
                  <Check size={16} className="text-accent-primary mt-0.5 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Link href={plan.href}>
              <button
                className={`w-full py-3 rounded-xl text-sm font-semibold transition-colors ${
                  plan.popular
                    ? 'bg-accent-primary text-white hover:bg-accent-primary-hover'
                    : 'bg-surface-hover text-text-primary border border-border-default hover:border-accent-primary'
                }`}
              >
                {plan.cta}
              </button>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
