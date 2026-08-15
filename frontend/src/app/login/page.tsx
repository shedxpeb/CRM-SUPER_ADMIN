'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login(email, password);
      if (!res.success) {
        setError(res.error || 'Login failed');
        setLoading(false);
        return;
      }
      router.push('/super-admin');
    } catch (err: any) {
      setError(err.message || 'Connection failed. Is the server running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--sa-sidebar)' }}>
      <div className="w-full max-w-sm p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-sa-accent-bold to-sa-accent shadow-lg shadow-sa-accent/30 mb-4">
            <Shield className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--sa-text)' }}>Super Admin</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--sa-text-muted)' }}>PEB Platform Console</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg text-sm" style={{ background: 'rgba(241,91,80,0.12)', color: 'var(--sa-danger)', border: '1px solid rgba(241,91,80,0.28)' }}>
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--sa-text-muted)' }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@pebplatform.com"
              required
              className="w-full h-10 px-3 rounded-lg text-sm outline-none transition-all duration-200"
              style={{
                background: 'var(--sa-input)',
                border: '1px solid var(--sa-border)',
                color: 'var(--sa-text)',
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--sa-accent)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--sa-border)'}
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--sa-text-muted)' }}>Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="w-full h-10 px-3 pr-10 rounded-lg text-sm outline-none transition-all duration-200"
                style={{
                  background: 'var(--sa-input)',
                  border: '1px solid var(--sa-border)',
                  color: 'var(--sa-text)',
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--sa-accent)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--sa-border)'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--sa-text-muted)' }}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50"
            style={{
              background: 'var(--sa-accent)',
              color: 'white',
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}