'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error('Super Admin error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--sa-sidebar)' }}>
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-sa-text">Something went wrong</h1>
          <p className="text-sm text-sa-text-muted">
            An error occurred while loading this page. The sidebar and navigation remain intact.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={() => reset()}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/super-admin')}
            className="gap-2"
          >
            <Home className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <div className="mt-6 p-4 rounded-lg border border-sa-border bg-sa-card text-left">
            <p className="text-xs font-mono text-sa-text-dim mb-2">{error.message}</p>
            {error.digest && (
              <p className="text-[10px] font-mono text-sa-text-dim">Error ID: {error.digest}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
