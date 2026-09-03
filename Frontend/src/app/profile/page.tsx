'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, User, Building2 } from 'lucide-react';

export default function ProfileRedirectPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      if (user.role === 'employer') {
        router.push('/profile/employer');
      } else {
        router.push('/profile/student');
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-accent-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          {user?.role === 'employer' ? (
            <Building2 size={24} className="text-accent-primary" />
          ) : (
            <User size={24} className="text-accent-primary" />
          )}
          <span className="font-heading text-heading-lg text-text-primary">
            Перенаправление...
          </span>
        </div>
        <Loader2 size={24} className="animate-spin text-accent-primary mx-auto" />
      </div>
    </div>
  );
}