'use client';

import { Calendar, Clock, Tag, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const posts = [
  {
    id: 1,
    title: 'Как составить резюме без опыта работы',
    excerpt: 'Пошаговое руководство для студентов, которые только начинают свой путь в карьере.',
    category: 'Советы',
    date: '2026-08-25',
    readTime: '5 мин',
  },
  {
    id: 2,
    title: 'Топ-10 навыков, которые ищут работодатели в 2026 году',
    excerpt: 'Разбираем самые востребованные Hard и Soft Skills на рынке труда.',
    category: 'Тренды',
    date: '2026-08-20',
    readTime: '7 мин',
  },
  {
    id: 3,
    title: 'Как пройти собеседование в IT-компанию',
    excerpt: 'Подготовка к техническому и поведенческому интервью: советы от рекрутеров.',
    category: 'Карьера',
    date: '2026-08-15',
    readTime: '8 мин',
  },
  {
    id: 4,
    title: 'Удалённая работа: плюсы и минусы для студентов',
    excerpt: 'Стоит ли устраиваться на удалёнку во время учёбы? Разбираем все аспекты.',
    category: 'Формат работы',
    date: '2026-08-10',
    readTime: '4 мин',
  },
  {
    id: 5,
    title: 'Как ИИ помогает в поиске работы',
    excerpt: 'Обзор инструментов на основе искусственного интеллекта для карьерного роста.',
    category: 'Технологии',
    date: '2026-08-05',
    readTime: '6 мин',
  },
  {
    id: 6,
    title: 'Стажировка в Таджикистане: где найти и как устроиться',
    excerpt: 'Полный гид по стажировкам для студентов из Таджикистана.',
    category: 'Стажировки',
    date: '2026-08-01',
    readTime: '5 мин',
  },
];

export default function BlogPage() {
  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="mb-10">
        <h1 className="font-heading font-bold text-3xl md:text-4xl mb-3">Блог</h1>
        <p className="text-text-muted text-lg">Полезные статьи о карьере, собеседованиях и поиске работы</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => (
          <article key={post.id} className="card-minimal overflow-hidden hover:border-accent-primary/30 transition-colors group">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="px-2.5 py-1 rounded-lg bg-accent-primary/10 text-accent-primary text-xs font-medium">
                  {post.category}
                </span>
                <span className="flex items-center gap-1 text-xs text-text-muted">
                  <Clock size={12} />
                  {post.readTime}
                </span>
              </div>
              <h2 className="font-heading font-semibold text-base mb-2 group-hover:text-accent-primary transition-colors">
                {post.title}
              </h2>
              <p className="text-sm text-text-muted leading-relaxed mb-4">{post.excerpt}</p>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-xs text-text-muted">
                  <Calendar size={12} />
                  {new Date(post.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
                <ArrowRight size={16} className="text-accent-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
