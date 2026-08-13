'use client';

import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/features/auth/AuthContext';
import { useSAThemeStore } from '@/store/useSAThemeStore';
import axios from 'axios';

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSAThemeStore((state) => state.theme);

  useEffect(() => {
    const root = document.documentElement;
    if (theme) {
      root.setAttribute('data-sa-theme', theme);
    } else {
      // Default to dark theme if not set
      root.setAttribute('data-sa-theme', 'dark');
    }
  }, [theme]);

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 10 * 60 * 1000, // 10 minutes
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
            retry: (failureCount, error) => {
              // Don't retry on 401, 403, 404 errors
              const status = axios.isAxiosError(error) ? error.response?.status : undefined;
              if (status === 401 || status === 403 || status === 404) return false;
              // Retry up to 2 times for other errors
              return failureCount < 2;
            },
          },
          mutations: {
            retry: (failureCount, error) => {
              // Don't retry on 401, 403, 404 errors
              const status = axios.isAxiosError(error) ? error.response?.status : undefined;
              if (status === 401 || status === 403 || status === 404) return false;
              // Retry once for other errors
              return failureCount < 1;
            },
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>{children}</AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
