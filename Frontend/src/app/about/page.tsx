'use client';

import { Briefcase, Target, Users, Heart, Shield, Zap } from 'lucide-react';

export default function AboutPage() {
  const values = [
    { icon: Target, title: 'Миссия', text: 'Помогаем молодым специалистам найти работу мечты, а компаниям — лучших сотрудников.' },
    { icon: Users, title: 'Сообщество', text: 'Объединяем тысячи студентов и работодателей Таджикистана на одной платформе.' },
    { icon: Shield, title: 'Доверие', text: 'Каждая компания проходит верификацию, чтобы вы были уверены в качестве вакансий.' },
    { icon: Zap, title: 'Инновации', text: 'Используем ИИ для рекомендаций вакансий и генерации резюме.' },
  ];

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="text-center mb-16">
        <div className="w-16 h-16 rounded-2xl bg-accent-primary flex items-center justify-center mx-auto mb-6">
          <Briefcase size={28} className="text-white" />
        </div>
        <h1 className="font-heading font-bold text-3xl md:text-4xl mb-4">О CareerHub</h1>
        <p className="text-lg text-text-muted max-w-2xl mx-auto">
          Мы — платформа для поиска работы и стажировок в Таджикистане. Наша цель — соединить талантливых студентов с лучшими компаниями.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
        {values.map((v) => (
          <div key={v.title} className="card-minimal p-8">
            <div className="w-12 h-12 rounded-xl bg-accent-primary/10 flex items-center justify-center mb-4">
              <v.icon size={22} className="text-accent-primary" />
            </div>
            <h3 className="font-heading font-semibold text-lg mb-2">{v.title}</h3>
            <p className="text-text-muted text-sm leading-relaxed">{v.text}</p>
          </div>
        ))}
      </div>

      <div className="card-minimal p-8 text-center">
        <h2 className="font-heading font-semibold text-2xl mb-4">Наша команда</h2>
        <p className="text-text-muted max-w-xl mx-auto mb-8">
          Мы группа энтузиастов, которые верят, что каждый студент заслуживает хорошую работу. CareerHub создан студентами, для студентов.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {['Давлат', 'Али', 'Фируза', 'Рустам'].map((name) => (
            <div key={name} className="p-4 rounded-xl bg-surface-hover border border-border-default">
              <div className="w-14 h-14 rounded-full bg-accent-primary/20 flex items-center justify-center mx-auto mb-3">
                <span className="text-lg font-bold text-accent-primary">{name[0]}</span>
              </div>
              <p className="font-medium text-sm">{name}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
