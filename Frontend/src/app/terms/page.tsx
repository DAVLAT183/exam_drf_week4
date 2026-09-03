'use client';

import { FileText } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="max-w-[800px] mx-auto px-6 py-12">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-accent-primary/10 flex items-center justify-center">
          <FileText size={22} className="text-accent-primary" />
        </div>
        <div>
          <h1 className="font-heading font-bold text-2xl">Условия использования</h1>
          <p className="text-xs text-text-muted">Последнее обновление: 1 сентября 2026 г.</p>
        </div>
      </div>

      <div className="prose prose-invert max-w-none space-y-6 text-sm text-text-secondary leading-relaxed">
        <section>
          <h2 className="font-heading font-semibold text-lg text-text-primary mb-3">1. Принятие условий</h2>
          <p>Используя платформу CareerHub, вы соглашаетесь с данными условиями. Если вы не согласны с какими-либо пунктами, пожалуйста, не используйте платформу.</p>
        </section>

        <section>
          <h2 className="font-heading font-semibold text-lg text-text-primary mb-3">2. Регистрация</h2>
          <p>Для использования платформы необходимо зарегистрироваться. Вы несёте ответственность за конфиденциальность своего аккаунта и достоверность предоставляемой информации.</p>
        </section>

        <section>
          <h2 className="font-heading font-semibold text-lg text-text-primary mb-3">3. Правила поведения</h2>
          <p>Запрещается: размещение мошеннических вакансий, спам, использование платформы не по назначению, нарушение прав других пользователей.</p>
        </section>

        <section>
          <h2 className="font-heading font-semibold text-lg text-text-primary mb-3">4. Интеллектуальная собственность</h2>
          <p>Весь контент платформы (тексты, логотипы, дизайн) является собственностью CareerHub. Копирование и распространение без разрешения запрещено.</p>
        </section>

        <section>
          <h2 className="font-heading font-semibold text-lg text-text-primary mb-3">5. Ограничение ответственности</h2>
          <p>CareerHub не несёт ответственности за качество предложений о работе, действия работодателей и студентов. Платформа является посредником.</p>
        </section>

        <section>
          <h2 className="font-heading font-semibold text-lg text-text-primary mb-3">6. Изменения</h2>
          <p>Мы оставляем за собой право изменять данные условия. Продолжая использование платформы после изменений, вы chấpоряете новые условия.</p>
        </section>

        <section>
          <h2 className="font-heading font-semibold text-lg text-text-primary mb-3">7. Контакты</h2>
          <p>По вопросам условий использования: hello@careerhub.example</p>
        </section>
      </div>
    </div>
  );
}
