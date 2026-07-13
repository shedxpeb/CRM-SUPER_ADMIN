'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || data.error || 'Login failed');
        setLoading(false);
        return;
      }

      if (data.data?.accessToken) {
        localStorage.setItem('sa_access_token', data.data.accessToken);
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
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-red-500 to-red-700 shadow-lg shadow-red-900/30 mb-4">
            <Shield className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--sa-text)' }}>Super Admin</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--sa-text-muted)' }}>PEB CRM Platform Console</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg text-sm" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--sa-text-muted)' }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@pebcrm.com"
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