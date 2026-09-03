'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ChevronDown, Briefcase, Building2, User, LogOut, Plus, Heart, Clock, MessageSquare, Settings, Bell } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import Avatar from '@/components/ui/Avatar';
import { clsx } from '@/lib/utils';
import api from '@/lib/api';

const navLinks = [
  { href: '/jobs', label: 'Вакансии', icon: Briefcase },
  { href: '/companies', label: 'Компании', icon: Building2 },
  { href: '/chat', label: 'Чат', icon: MessageSquare },
];

const userLinks = (role: string) => [
  { href: role === 'employer' ? '/profile/employer' : '/profile/student', label: 'Мой профиль', icon: User },
  { href: '/chat', label: 'Чат', icon: MessageSquare },
  { href: '/favorites', label: 'Избранное', icon: Heart },
  { href: '/applications', label: 'Мои отклики', icon: Clock },
  { href: '/notifications', label: 'Уведомления', icon: Bell },
  { href: '/settings', label: 'Настройки', icon: Settings },
];

export default function Navbar() {
  const { user, logout, loading } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    api.get('/notifications/unread_count/').then((res) => {
      setUnreadCount(res.data.unread_count);
    }).catch(() => {});
  }, [user]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');
  const currentUserLinks = user ? userLinks(user.role) : [];

  return (
    <nav className="fixed top-0 left-0 right-0 z-[200] h-16 border-b border-border-default bg-bg-primary/80 backdrop-blur-md">
      <div className="max-w-[1440px] mx-auto h-full px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group" aria-label="CareerHub">
          <div className="w-9 h-9 rounded-lg bg-accent-primary flex items-center justify-center">
            <Briefcase className="text-text-on-accent" size={18} />
          </div>
          <span className="font-heading text-heading-md text-text-primary tracking-tight font-semibold">CareerHub</span>
        </Link>

        <div className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={clsx(
                'flex items-center gap-2 px-4 py-2 rounded-lg font-body text-label text-text-muted transition-all duration-150',
                isActive(link.href)
                  ? 'text-text-primary bg-surface-hover border border-border-hover'
                  : 'hover:text-text-primary hover:bg-surface-hover'
              )}
            >
              <link.icon size={16} className={clsx('transition-colors', isActive(link.href) && 'text-accent-primary')} />
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden lg:flex items-center gap-2">
          {loading ? (
            <div className="w-20 h-10 rounded-lg bg-surface-hover animate-pulse" />
          ) : user ? (
            <>
              <Link
                href="/notifications"
                className={clsx(
                  'relative p-2 rounded-lg transition-all duration-150',
                  pathname === '/notifications'
                    ? 'text-accent-primary bg-surface-hover'
                    : 'text-text-muted hover:text-text-primary hover:bg-surface-hover'
                )}
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-accent-primary text-[10px] font-bold text-text-on-accent flex items-center justify-center">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>

              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-surface-hover transition-all duration-150"
                >
                  <Avatar src={user.avatar} alt={user.username} size="sm" />
                  <span className="font-body text-body-sm text-text-secondary hidden sm:block">{user.username}</span>
                  <ChevronDown size={14} className={clsx('text-text-muted transition-transform duration-150', profileOpen && 'rotate-180')} />
                </button>
                {profileOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 card overflow-hidden animate-fade-in shadow-lg" role="menu">
                    <div className="px-4 py-3 border-b border-border-default bg-surface-hover">
                      <span className="font-body text-label text-text-muted">{user.role === 'employer' ? 'Работодатель' : 'Соискатель'}</span>
                    </div>
                    {currentUserLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="flex items-center gap-2.5 px-4 py-2.5 font-body text-body-sm text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors duration-150"
                        role="menuitem"
                        onClick={() => setProfileOpen(false)}
                      >
                        <link.icon size={16} className="text-text-muted" />
                        {link.label}
                      </Link>
                    ))}
                    <hr className="border-border-default my-2" />
                    <button
                      onClick={() => { setProfileOpen(false); logout(); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 font-body text-body-sm text-error hover:bg-surface-hover transition-colors duration-150 text-left"
                      role="menuitem"
                    >
                      <LogOut size={16} />
                      Выйти
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/auth/login" className="btn-ghost text-body-sm">Войти</Link>
              <Link href="/auth/register" className="btn-primary text-body-sm">
                <Plus size={16} />
                Регистрация
              </Link>
            </div>
          )}
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="lg:hidden btn-icon"
          aria-label={mobileOpen ? 'Закрыть меню' : 'Открыть меню'}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="lg:hidden border-t border-border-default bg-bg-primary animate-slide-down animate-fade-in">
          <div className="px-6 py-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={clsx(
                  'flex items-center gap-3 px-4 py-3 rounded-lg font-body text-body-md transition-colors duration-150',
                  isActive(link.href)
                    ? 'text-text-primary bg-surface-hover border border-border-hover'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                )}
              >
                <link.icon size={20} className={clsx('transition-colors', isActive(link.href) && 'text-accent-primary')} />
                {link.label}
              </Link>
            ))}
            <hr className="border-border-default my-3" />
            {user ? (
              <>
                <Link
                  href="/notifications"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg font-body text-body-md text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors duration-150"
                >
                  <Bell size={20} className="text-text-muted" />
                  Уведомления
                  {unreadCount > 0 && (
                    <span className="ml-auto w-5 h-5 rounded-full bg-accent-primary text-[10px] font-bold text-text-on-accent flex items-center justify-center">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Link>
                {currentUserLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg font-body text-body-md text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors duration-150"
                  >
                    <link.icon size={20} className="text-text-muted" />
                    {link.label}
                  </Link>
                ))}
                <hr className="border-border-default my-3" />
                <button
                  onClick={() => { setMobileOpen(false); logout(); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-body text-body-md text-error hover:bg-surface-hover transition-colors duration-150 text-left"
                >
                  <LogOut size={20} />
                  Выйти
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2 pt-2">
                <Link href="/auth/login" onClick={() => setMobileOpen(false)} className="btn-secondary text-body-md justify-center">Войти</Link>
                <Link href="/auth/register" onClick={() => setMobileOpen(false)} className="btn-primary text-body-md justify-center">
                  <Plus size={18} />
                  Регистрация
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
