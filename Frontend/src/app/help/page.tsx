'use client';

import { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Search, MessageSquare, Mail } from 'lucide-react';

const faq = [
  { q: 'Как создать аккаунт?', a: 'Перейдите на страницу регистрации, укажите email, имя пользователя и пароль. Выберите роль — студент или работодатель.' },
  { q: 'Как откликнуться на вакансию?', a: 'Найдите интересующую вакансию, нажмите "Откликнуться" и выберите резюме. Вы также можете написать сопроводительное письмо.' },
  { q: 'Как создать резюме?', a: 'Перейдите в профиль студента, нажмите "Создать резюме". Можно заполнить вручную или воспользоваться ИИ-генерацией.' },
  { q: 'Как разместить вакансию?', a: 'Зарегистрируйтесь как работодатель, перейдите в "Создать вакансию" и заполните все поля.' },
  { q: 'Как работает ИИ-рекомендации?', a: 'Наш ИИ анализирует ваш профиль и резюме, после чего подбирает наиболее подходящие вакансии.' },
  { q: 'Как построить маршрут до работы?', a: 'Укажите место проживания в настройках профиля. На странице вакансии с координатами появится кнопка "Построить маршрут".' },
  { q: 'Безопасны ли мои данные?', a: 'Да. Мы используем шифрование данных и не передаём информацию третьим лицам.' },
  { q: 'Как связаться с поддержкой?', a: 'Напишите нам на hello@careerhub.example или через форму на странице Контакты.' },
];

export default function HelpPage() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  const filtered = faq.filter((f) => {
    const q = search.toLowerCase();
    return f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q);
  });

  return (
    <div className="max-w-[800px] mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="text-center mb-10">
        <div className="w-14 h-14 rounded-2xl bg-accent-primary/10 flex items-center justify-center mx-auto mb-4">
          <HelpCircle size={26} className="text-accent-primary" />
        </div>
        <h1 className="font-heading font-bold text-3xl mb-3">Помощь</h1>
        <p className="text-text-muted">Ответы на частые вопросы</p>
      </div>

      <div className="relative mb-8">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск по вопросам..."
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface-card border border-border-default text-sm text-text-primary placeholder:text-text-subtle focus:outline-none focus:border-accent-primary"
        />
      </div>

      <div className="space-y-3 mb-12">
        {filtered.map((item, i) => (
          <div key={i} className="card-minimal overflow-hidden">
            <button
              onClick={() => setOpenIdx(openIdx === i ? null : i)}
              className="w-full flex items-center justify-between p-4 text-left"
            >
              <span className="font-medium text-sm pr-4">{item.q}</span>
              {openIdx === i ? <ChevronUp size={16} className="text-text-muted flex-shrink-0" /> : <ChevronDown size={16} className="text-text-muted flex-shrink-0" />}
            </button>
            {openIdx === i && (
              <div className="px-4 pb-4 text-sm text-text-muted leading-relaxed border-t border-border-default pt-3">
                {item.a}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="card-minimal p-6 text-center">
        <p className="text-sm text-text-muted mb-3">Не нашли ответ?</p>
        <a href="/contact" className="text-sm text-accent-primary hover:underline font-medium">Свяжитесь с нами</a>
      </div>
    </div>
  );
}
