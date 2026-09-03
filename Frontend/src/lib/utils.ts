export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'только что';
  if (diffMins < 60) return `${diffMins} мин. назад`;
  if (diffHours < 24) return `${diffHours} ч. назад`;
  if (diffDays < 7) return `${diffDays} дн. назад`;

  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatSalary(min: number | null, max: number | null): string {
  if (!min && !max) return 'Зарплата не указана';
  if (min && max) return `${min.toLocaleString('ru-RU')} – ${max.toLocaleString('ru-RU')} ₽`;
  if (min) return `от ${min.toLocaleString('ru-RU')} ₽`;
  return `до ${max!.toLocaleString('ru-RU')} ₽`;
}

export function formatSchedule(schedule: string): string {
  const map: Record<string, string> = {
    flexible: 'Гибкий',
    part_time: '2-4 часа',
    full_time: 'Полная занятость',
  };
  return map[schedule] || schedule;
}

export function formatWorkFormat(format: string): string {
  const map: Record<string, string> = {
    online: 'Онлайн',
    offline: 'Офлайн',
    hybrid: 'Гибрид',
  };
  return map[format] || format;
}

export function formatResumeStyle(style: string): string {
  const map: Record<string, string> = {
    classic: 'Классический',
    modern: 'Современный',
    minimal: 'Минималистичный',
    creative: 'Креативный',
  };
  return map[style] || style;
}

export function formatStatus(status: string): string {
  const map: Record<string, string> = {
    sent: 'Отправлено',
    viewed: 'Просмотрено',
    interview: 'Собеседование',
    accepted: 'Принято',
    rejected: 'Отклонено',
  };
  return map[status] || status;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function clsx(...args: any[]): string {
  const result: string[] = [];
  for (const arg of args) {
    if (!arg) continue;
    if (typeof arg === 'string') {
      result.push(arg);
    } else if (typeof arg === 'object' && !Array.isArray(arg)) {
      for (const [key, value] of Object.entries(arg)) {
        if (value) result.push(key);
      }
    }
  }
  return result.join(' ');
}

const MEDIA_URL = process.env.NEXT_PUBLIC_MEDIA_URL || 'http://localhost:8000/media';

export function mediaUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  if (path.startsWith('http')) return path;
  return `${MEDIA_URL}${path.startsWith('/') ? '' : '/'}${path}`;
}

let toastContainer: HTMLDivElement | null = null;

export function showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
  if (typeof window === 'undefined') return;

  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.style.cssText = 'position:fixed;top:80px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:8px;';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  const colors = {
    success: 'border-success/30 bg-success/10 text-success',
    error: 'border-error/30 bg-error/10 text-error',
    info: 'border-accent/30 bg-accent/10 text-accent',
  };
  toast.className = `px-4 py-3 rounded-btn text-sm font-medium border backdrop-blur-sm animate-fade-in ${colors[type]}`;
  toast.textContent = message;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

export function getErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const err = error as { response?: { status?: number; data?: unknown } };

    if (err.response?.status) {
      const status = err.response.status;
      if (status === 401) return 'Необходима авторизация';
      if (status === 403) return 'Нет доступа';
      if (status === 404) return 'Не найдено';
      if (status >= 500) return 'Ошибка сервера. Попробуйте позже.';
    }

    const data = err.response?.data;
    if (data && typeof data === 'object' && !(data instanceof Blob)) {
      const obj = data as Record<string, unknown>;
      if ('detail' in obj) return String(obj.detail);
      if ('non_field_errors' in obj) return String(Array.isArray(obj.non_field_errors) ? obj.non_field_errors[0] : obj.non_field_errors);
      const firstKey = Object.keys(obj)[0];
      if (firstKey) {
        const val = obj[firstKey];
        return Array.isArray(val) ? String(val[0]) : String(val);
      }
    }
  }
  return 'Произошла ошибка. Попробуйте ещё раз.';
}
