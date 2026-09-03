import { clsx } from '@/lib/utils';

type BadgeVariant =
  | 'salary' | 'no-experience' | 'flexible' | 'online' | 'offline' | 'hybrid'
  | 'status-sent' | 'status-viewed' | 'status-interview' | 'status-accepted' | 'status-rejected'
  | 'default';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  'salary': 'bg-accent/12 text-accent',
  'no-experience': 'bg-success/12 text-success',
  'flexible': 'bg-warning/12 text-warning',
  'online': 'bg-accent-cyan/12 text-accent-cyan',
  'offline': 'bg-muted/12 text-muted',
  'hybrid': 'bg-accent/12 text-accent-cyan',
  'status-sent': 'bg-info/12 text-info',
  'status-viewed': 'bg-muted/12 text-muted',
  'status-interview': 'bg-warning/12 text-warning',
  'status-accepted': 'bg-success/12 text-success',
  'status-rejected': 'bg-error/12 text-error',
  'default': 'bg-surface-card/80 text-muted',
};

export default function Badge({ variant = 'default', children, className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider',
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
