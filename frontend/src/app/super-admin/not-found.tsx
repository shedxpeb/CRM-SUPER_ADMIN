'use client';

import { useRouter } from 'next/navigation';
import { Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--sa-sidebar)' }}>
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-sa-border flex items-center justify-center">
            <span className="text-3xl font-bold text-sa-text-muted">404</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-sa-text">Page Not Found</h1>
          <p className="text-sm text-sa-text-muted">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={() => router.back()}
            variant="outline"
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
          <Button
            onClick={() => router.push('/super-admin')}
            className="gap-2"
          >
            <Home className="h-4 w-4" />
            Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
