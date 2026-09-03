import { clsx, mediaUrl } from '@/lib/utils';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg',
};

export default function Avatar({ src, alt = '', size = 'md', className }: AvatarProps) {
  const initials = alt
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const resolvedSrc = mediaUrl(src);

  if (resolvedSrc) {
    return (
      <img
        src={resolvedSrc}
        alt={alt}
        className={clsx('rounded-full object-cover border border-[var(--color-border-default)]', sizeMap[size], className)}
      />
    );
  }

  return (
    <div
      className={clsx(
        'rounded-full flex items-center justify-center font-semibold',
        'bg-accent-primary text-white',
        sizeMap[size],
        className
      )}
    >
      {initials || '?'}
    </div>
  );
}
