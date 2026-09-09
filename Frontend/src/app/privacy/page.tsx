'use client';

import { Shield } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="max-w-[800px] mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-accent-primary/10 flex items-center justify-center">
          <Shield size={22} className="text-accent-primary" />
        </div>
        <div>
          <h1 className="font-heading font-bold text-2xl">Политика конфиденциальности</h1>
          <p className="text-xs text-text-muted">Последнее обновление: 1 сентября 2026 г.</p>
        </div>
      </div>

      <div className="prose prose-invert max-w-none space-y-6 text-sm text-text-secondary leading-relaxed">
        <section>
          <h2 className="font-heading font-semibold text-lg text-text-primary mb-3">1. Сбор информации</h2>
          <p>Мы собираем информацию, которую вы предоставляете при регистрации: имя пользователя, email, роль (студент/работодатель), телефон и место проживания. Также автоматически收集 IP-адрес и данные об использовании платформы.</p>
        </section>

        <section>
          <h2 className="font-heading font-semibold text-lg text-text-primary mb-3">2. Использование информации</h2>
          <p>Собранная информация используется для: предоставления услуг платформы, персонализации рекомендаций вакансий, связи с вами по вопросам поддержки, улучшения качества сервиса.</p>
        </section>

        <section>
          <h2 className="font-heading font-semibold text-lg text-text-primary mb-3">3. Хранение данных</h2>
          <p>Ваши данные хранятся на защищённых серверах и шифруются. Мы не передаём личную информацию третьим лицам без вашего согласия, за исключением случаев, предусмотренных законодательством Республики Таджикистан.</p>
        </section>

        <section>
          <h2 className="font-heading font-semibold text-lg text-text-primary mb-3">4. Cookies</h2>
          <p>Мы используем cookies для обеспечения работоспособности сайта и аналитики. Вы можете отключить cookies в настройках браузера.</p>
        </section>

        <section>
          <h2 className="font-heading font-semibold text-lg text-text-primary mb-3">5. Ваши права</h2>
          <p>Вы имеете право: запросить доступ к вашим данным, исправить или удалить их, отозвать согласие на обработку. Для этого свяжитесь с нами через страницу Контакты.</p>
        </section>

        <section>
          <h2 className="font-heading font-semibold text-lg text-text-primary mb-3">6. Контакты</h2>
          <p>По вопросам конфиденциальности обращайтесь: hello@careerhub.example</p>
        </section>
      </div>
    </div>
  );
}
