'use client';

import Link from 'next/link';
import { Briefcase, Building2, Twitter, Linkedin, Github, Mail } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const { user } = useAuth();

  const footerLinks = {
    product: [
      { label: 'Вакансии', href: '/jobs' },
      { label: 'Компании', href: '/companies' },
      { label: 'Стажировки', href: '/jobs?category=internship' },
      { label: 'Удаленная работа', href: '/jobs?work_format=remote' },
    ],
    company: [
      { label: 'О нас', href: '/about' },
      { label: 'Блог', href: '/blog' },
      { label: 'Карьера', href: '/jobs?company=careerhub' },
    ],
    forEmployers: [
      { label: 'Разместить вакансию', href: '/employer/create-job' },
      { label: 'Поиск кандидатов', href: '/employer/search' },
      { label: 'Тарифы', href: '/pricing' },
    ],
    support: [
      { label: 'Помощь', href: '/help' },
      { label: 'Контакты', href: '/contact' },
      { label: 'Политика конфиденциальности', href: '/privacy' },
      { label: 'Условия использования', href: '/terms' },
    ],
  };

  const socialLinks = [
    { icon: Twitter, href: 'https://twitter.com', label: 'Twitter' },
    { icon: Linkedin, href: 'https://linkedin.com', label: 'LinkedIn' },
    { icon: Github, href: 'https://github.com', label: 'GitHub' },
    { icon: Mail, href: 'mailto:hello@careerhub.example', label: 'Email' },
  ];

  return (
    <footer className="border-t border-border-default bg-bg-secondary mt-auto">
      <div className="max-w-[1440px] mx-auto px-6 py-12 lg:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 lg:gap-12 mb-12">
          <div className="col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-4" aria-label="CareerHub - главная">
              <div className="w-9 h-9 rounded-lg bg-accent-primary flex items-center justify-center">
                <Briefcase className="text-text-on-accent" size={18} />
              </div>
              <span className="font-heading text-heading-md text-text-primary tracking-tight font-semibold">
                CareerHub
              </span>
            </Link>
            <p className="font-body text-body-sm text-text-muted mb-6 max-w-xs">
              Премиальная платформа для поиска работы и стажировок. Соединяем таланты с лучшими компаниями.
            </p>
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-icon p-2 text-text-muted hover:text-text-primary"
                  aria-label={social.label}
                >
                  <social.icon size={18} />
                </a>
              ))}
            </div>
          </div>

          <nav aria-label="Продукт">
            <h3 className="section-title mb-4">Продукт</h3>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="font-body text-body-sm text-text-muted hover:text-text-primary transition-colors duration-150"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Компания">
            <h3 className="section-title mb-4">Компания</h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="font-body text-body-sm text-text-muted hover:text-text-primary transition-colors duration-150"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {user?.role === 'employer' && (
            <nav aria-label="Работодателям">
              <h3 className="section-title mb-4">Работодателям</h3>
              <ul className="space-y-3">
                {footerLinks.forEmployers.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="font-body text-body-sm text-text-muted hover:text-text-primary transition-colors duration-150"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          <nav aria-label="Поддержка">
            <h3 className="section-title mb-4">Поддержка</h3>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="font-body text-body-sm text-text-muted hover:text-text-primary transition-colors duration-150"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="pt-8 border-t border-border-default">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="font-body text-caption text-text-subtle">
              © {currentYear} CareerHub. Все права защищены.
            </p>
            <div className="flex items-center gap-6">
              <Link
                href="/privacy"
                className="font-body text-caption text-text-subtle hover:text-text-primary transition-colors duration-150"
              >
                Политика конфиденциальности
              </Link>
              <Link
                href="/terms"
                className="font-body text-caption text-text-subtle hover:text-text-primary transition-colors duration-150"
              >
                Условия использования
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}