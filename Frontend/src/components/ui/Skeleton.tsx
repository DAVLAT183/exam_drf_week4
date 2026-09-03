import { clsx } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  count?: number;
}

export default function Skeleton({ className, count = 1 }: SkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={clsx(
            'bg-white/5 rounded-card animate-shimmer',
            'bg-[length:200%_100%] bg-gradient-to-r from-white/5 via-white/10 to-white/5',
            className
          )}
        />
      ))}
    </>
  );
}
