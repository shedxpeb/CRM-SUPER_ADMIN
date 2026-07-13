'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Settings,
  Mail,
  Shield,
  Key,
  ToggleLeft,
  ToggleRight,
  Save,
  Globe,
  Lock,
  Zap,
  Building2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ToggleProps {
  enabled: boolean;
  onToggle: () => void;
}

function Toggle({ enabled, onToggle }: ToggleProps) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
        enabled ? 'bg-blue-600' : 'bg-gray-700'
      )}
    >
      <span
        className={cn(
          'inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform',
          enabled ? 'translate-x-[18px]' : 'translate-x-[3px]'
        )}
      />
    </button>
  );
}

export default function SettingsPage() {
  // General
  const [appName, setAppName] = useState('PEB CRM');
  const [supportEmail, setSupportEmail] = useState('support@pebcrm.com');
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  // Email
  const [smtpHost, setSmtpHost] = useState('smtp.example.com');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpUser, setSmtpUser] = useState('noreply@pebcrm.com');
  const [smtpTLS, setSmtpTLS] = useState(true);

  // Security
  const [minPasswordLength, setMinPasswordLength] = useState('8');
  const [requireUppercase, setRequireUppercase] = useState(true);
  const [requireNumbers, setRequireNumbers] = useState(true);
  const [requireSpecial, setRequireSpecial] = useState(false);
  const [twoFactor, setTwoFactor] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState('30');

  // API
  const [rateLimiting, setRateLimiting] = useState(true);
  const [rateLimitPerMin, setRateLimitPerMin] = useState('100');
  const [apiKey, setApiKey] = useState('pk_live_xxxxxxxxxxxxxxxxxxxx');

  // Feature Flags
  const [features, setFeatures] = useState<Record<string, boolean>>({
    leads: true,
    projects: true,
    inventory: true,
    automation: true,
    design: true,
    boq: true,
    documents: true,
    backup: true,
    dashboard: true,
  });

  const toggleFeature = (key: string) => {
    setFeatures({ ...features, [key]: !features[key] });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-sa-text">Global Settings</h1>
          <p className="text-sm text-sa-text-muted mt-0.5">Configure system-wide settings and feature flags</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 gap-2 h-9">
          <Save className="h-4 w-4" /> Save All
        </Button>
      </div>

      {/* General */}
      <Card className="bg-sa-card border-sa-border">
        <CardHeader className="pb-4">
          <CardTitle className="text-sm font-medium text-sa-text-secondary flex items-center gap-2">
            <Globe className="h-4 w-4 text-blue-500" />
            General
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-sa-text-muted mb-1 block">Application Name</label>
              <Input value={appName} onChange={(e) => setAppName(e.target.value)} className="bg-sa-input border-sa-border text-sa-text h-9 text-sm" />
            </div>
            <div>
              <label className="text-xs text-sa-text-muted mb-1 block">Support Email</label>
              <Input value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} type="email" className="bg-sa-input border-sa-border text-sa-text h-9 text-sm" />
            </div>
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm text-sa-text-secondary">Maintenance Mode</p>
              <p className="text-xs text-sa-text-muted">Temporarily disable access for non-admin users</p>
            </div>
            <Toggle enabled={maintenanceMode} onToggle={() => setMaintenanceMode(!maintenanceMode)} />
          </div>
          {maintenanceMode && (
            <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-3">
              <p className="text-xs text-yellow-500 flex items-center gap-2">
                <Settings className="h-3.5 w-3.5" />
                Maintenance mode is active. Only super admins can access the system.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Email / SMTP */}
      <Card className="bg-sa-card border-sa-border">
        <CardHeader className="pb-4">
          <CardTitle className="text-sm font-medium text-sa-text-secondary flex items-center gap-2">
            <Mail className="h-4 w-4 text-green-500" />
            Email Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-sa-text-muted mb-1 block">SMTP Host</label>
              <Input value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} className="bg-sa-input border-sa-border text-sa-text h-9 text-sm" />
            </div>
            <div>
              <label className="text-xs text-sa-text-muted mb-1 block">SMTP Port</label>
              <Input value={smtpPort} onChange={(e) => setSmtpPort(e.target.value)} className="bg-sa-input border-sa-border text-sa-text h-9 text-sm" />
            </div>
            <div>
              <label className="text-xs text-sa-text-muted mb-1 block">SMTP Username</label>
              <Input value={smtpUser} onChange={(e) => setSmtpUser(e.target.value)} className="bg-sa-input border-sa-border text-sa-text h-9 text-sm" />
            </div>
            <div>
              <label className="text-xs text-sa-text-muted mb-1 block">SMTP Password</label>
              <Input type="password" value="••••••••" disabled className="bg-sa-input border-sa-border text-sa-text h-9 text-sm" />
            </div>
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm text-sa-text-secondary">Use TLS</p>
              <p className="text-xs text-sa-text-muted">Encrypt email connections with TLS</p>
            </div>
            <Toggle enabled={smtpTLS} onToggle={() => setSmtpTLS(!smtpTLS)} />
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card className="bg-sa-card border-sa-border">
        <CardHeader className="pb-4">
          <CardTitle className="text-sm font-medium text-sa-text-secondary flex items-center gap-2">
            <Lock className="h-4 w-4 text-red-500" />
            Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-sa-text-muted mb-1 block">Minimum Password Length</label>
              <Select value={minPasswordLength} onValueChange={setMinPasswordLength}>
                <SelectTrigger className="bg-sa-input border-sa-border text-sa-text h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-sa-card-solid border-sa-border">
                  <SelectItem value="6">6 characters</SelectItem>
                  <SelectItem value="8">8 characters</SelectItem>
                  <SelectItem value="10">10 characters</SelectItem>
                  <SelectItem value="12">12 characters</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-sa-text-muted mb-1 block">Session Timeout (minutes)</label>
              <Select value={sessionTimeout} onValueChange={setSessionTimeout}>
                <SelectTrigger className="bg-sa-input border-sa-border text-sa-text h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-sa-card-solid border-sa-border">
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Require Uppercase Letters', desc: 'Passwords must contain at least one uppercase letter', enabled: requireUppercase, onToggle: () => setRequireUppercase(!requireUppercase) },
              { label: 'Require Numbers', desc: 'Passwords must contain at least one number', enabled: requireNumbers, onToggle: () => setRequireNumbers(!requireNumbers) },
              { label: 'Require Special Characters', desc: 'Passwords must contain at least one special character', enabled: requireSpecial, onToggle: () => setRequireSpecial(!requireSpecial) },
              { label: 'Enforce Two-Factor Authentication', desc: 'Require 2FA for all users', enabled: twoFactor, onToggle: () => setTwoFactor(!twoFactor) },
            ].map((item, index) => (
              <div key={`${item.label}-${index}`} className="flex items-center justify-between py-2 border-b border-sa-border">
                <div>
                  <p className="text-sm text-sa-text-secondary">{item.label}</p>
                  <p className="text-xs text-sa-text-muted">{item.desc}</p>
                </div>
                <Toggle enabled={item.enabled} onToggle={item.onToggle} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* API */}
      <Card className="bg-sa-card border-sa-border">
        <CardHeader className="pb-4">
          <CardTitle className="text-sm font-medium text-sa-text-secondary flex items-center gap-2">
            <Key className="h-4 w-4 text-purple-500" />
            API Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm text-sa-text-secondary">Rate Limiting</p>
              <p className="text-xs text-sa-text-muted">Limit API requests per minute</p>
            </div>
            <Toggle enabled={rateLimiting} onToggle={() => setRateLimiting(!rateLimiting)} />
          </div>
          {rateLimiting && (
            <div>
              <label className="text-xs text-sa-text-muted mb-1 block">Requests per Minute</label>
              <Input value={rateLimitPerMin} onChange={(e) => setRateLimitPerMin(e.target.value)} className="bg-sa-input border-sa-border text-sa-text h-9 text-sm w-[120px]" />
            </div>
          )}
          <div>
            <label className="text-xs text-sa-text-muted mb-1 block">Master API Key</label>
            <div className="flex items-center gap-2">
              <Input value={apiKey} readOnly className="bg-sa-input border-sa-border text-sa-text h-9 text-sm font-mono flex-1" />
              <Button variant="ghost" size="sm" className="text-sa-text-secondary hover:text-sa-text hover:bg-sa-card-hover h-9">Regenerate</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feature Flags */}
      <Card className="bg-sa-card border-sa-border">
        <CardHeader className="pb-4">
          <CardTitle className="text-sm font-medium text-sa-text-secondary flex items-center gap-2">
            <Zap className="h-4 w-4 text-yellow-500" />
            Feature Flags
          </CardTitle>
          <CardDescription className="text-xs text-sa-text-muted">Enable or disable modules for all tenants</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(features).map(([key, enabled]) => {
              const iconMap: Record<string, string> = {
                leads: 'Users', projects: 'FolderKanban', inventory: 'Package',
                automation: 'Zap', design: 'Calculator', boq: 'FileStack',
                documents: 'FileText', backup: 'DatabaseBackup', dashboard: 'LayoutDashboard',
              };
              return (
                <div
                  key={key}
                  onClick={() => toggleFeature(key)}
                  className={cn(
                    'p-4 rounded-lg border transition-all cursor-pointer',
                    enabled ? 'bg-blue-500/5 border-blue-500/20 hover:border-blue-500/40' : 'bg-sa-input border-sa-border hover:border-sa-border-solid'
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={cn('text-sm capitalize font-medium', enabled ? 'text-blue-400' : 'text-sa-text-muted')}>{key}</span>
                    <Toggle enabled={enabled} onToggle={() => toggleFeature(key)} />
                  </div>
                  <p className="text-[11px] text-sa-text-muted">{enabled ? 'Module enabled for all tenants' : 'Module disabled'}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
