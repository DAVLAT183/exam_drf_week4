import { clsx } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export default function Card({ children, className, hover = false, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'relative p-5',
        'bg-[var(--color-surface-card)] border border-[var(--color-border-default)]',
        'rounded-[var(--radius-lg)] shadow-[var(--shadow-sm)]',
        'transition-all duration-200',
        hover && [
          'hover:border-[var(--color-border-hover)] hover:shadow-[var(--shadow-md)]',
          'hover:-translate-y-0.5',
          'cursor-pointer',
        ],
        className
      )}
    >
      {children}
    </div>
  );
}
