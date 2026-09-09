'use client';

import { useState } from 'react';
import { Mail, MapPin, Phone, Send, MessageSquare } from 'lucide-react';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';
import { showToast } from '@/lib/utils';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.message) {
      showToast('Заполните обязательные поля', 'error');
      return;
    }
    setSending(true);
    await new Promise((r) => setTimeout(r, 1000));
    showToast('Сообщение отправлено!', 'success');
    setForm({ name: '', email: '', subject: '', message: '' });
    setSending(false);
  };

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="text-center mb-12">
        <h1 className="font-heading font-bold text-3xl md:text-4xl mb-3">Контакты</h1>
        <p className="text-text-muted text-lg">Свяжитесь с нами любым удобным способом</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        <div className="space-y-4">
          <div className="card-minimal p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent-primary/10 flex items-center justify-center">
                <Mail size={18} className="text-accent-primary" />
              </div>
              <div>
                <p className="text-xs text-text-muted">Email</p>
                <p className="text-sm font-medium">hello@careerhub.example</p>
              </div>
            </div>
          </div>
          <div className="card-minimal p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent-primary/10 flex items-center justify-center">
                <Phone size={18} className="text-accent-primary" />
              </div>
              <div>
                <p className="text-xs text-text-muted">Телефон</p>
                <p className="text-sm font-medium">+992 (900) 123-456</p>
              </div>
            </div>
          </div>
          <div className="card-minimal p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent-primary/10 flex items-center justify-center">
                <MapPin size={18} className="text-accent-primary" />
              </div>
              <div>
                <p className="text-xs text-text-muted">Адрес</p>
                <p className="text-sm font-medium">г. Душанбе, ул. Рудаки 45</p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="card-minimal p-6">
            <div className="flex items-center gap-2 mb-6">
              <MessageSquare size={18} className="text-accent-primary" />
              <h2 className="font-heading font-semibold text-lg">Напишите нам</h2>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Имя"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Ваше имя"
                />
                <Input
                  label="Email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="email@example.com"
                />
              </div>
              <Input
                label="Тема"
                value={form.subject}
                onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                placeholder="Тема сообщения"
              />
              <Textarea
                label="Сообщение"
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                placeholder="Расскажите подробнее..."
              />
              <Button onClick={handleSubmit} loading={sending} className="w-full sm:w-auto">
                <Send size={16} className="mr-2" />
                Отправить
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
