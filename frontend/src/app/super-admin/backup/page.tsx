'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Database,
  Download,
  Upload,
  Clock,
  HardDrive,
  CheckCircle2,
  AlertCircle,
  Plus,
  RotateCcw,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BackupRecord {
  id: string;
  name: string;
  date: string;
  size: string;
  type: string;
  status: string;
  duration: string;
}

const initialBackups: BackupRecord[] = [
  { id: 'B001', name: 'daily_auto_20240328', date: '2024-03-28 02:00 AM', size: '2.4 GB', type: 'Auto', status: 'Completed', duration: '12 min' },
  { id: 'B002', name: 'daily_auto_20240327', date: '2024-03-27 02:00 AM', size: '2.3 GB', type: 'Auto', status: 'Completed', duration: '11 min' },
  { id: 'B003', name: 'manual_pre_migration', date: '2024-03-26 14:30 PM', size: '2.3 GB', type: 'Manual', status: 'Completed', duration: '14 min' },
  { id: 'B004', name: 'daily_auto_20240326', date: '2024-03-26 02:00 AM', size: '2.3 GB', type: 'Auto', status: 'Completed', duration: '10 min' },
  { id: 'B005', name: 'daily_auto_20240325', date: '2024-03-25 02:00 AM', size: '2.2 GB', type: 'Auto', status: 'Failed', duration: '3 min' },
  { id: 'B006', name: 'manual_pre_update', date: '2024-03-24 09:15 AM', size: '2.2 GB', type: 'Manual', status: 'Completed', duration: '13 min' },
];

export default function BackupPage() {
  const [backups, setBackups] = useState<BackupRecord[]>(initialBackups);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<BackupRecord | null>(null);
  const [backupName, setBackupName] = useState('');
  const [schedule, setSchedule] = useState('daily');
  const [creating, setCreating] = useState(false);

  const totalSize = '14.2 GB';
  const maxStorage = '50 GB';
  const usagePercent = 28.4;

  const handleCreate = () => {
    setCreating(true);
    setTimeout(() => {
      const newBackup: BackupRecord = {
        id: `B${String(backups.length + 1).padStart(3, '0')}`,
        name: backupName || `manual_${Date.now()}`,
        date: new Date().toLocaleString(),
        size: '2.4 GB',
        type: 'Manual',
        status: 'Completed',
        duration: '15 min',
      };
      setBackups([newBackup, ...backups]);
      setCreating(false);
      setCreateDialogOpen(false);
      setBackupName('');
    }, 2000);
  };

  const handleRestore = () => {
    setRestoreDialogOpen(false);
    setSelectedBackup(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-sa-text">Backup & Restore</h1>
          <p className="text-sm text-sa-text-muted mt-0.5">Manage database backups and recovery</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700 gap-2 h-9">
          <Plus className="h-4 w-4" /> Create Backup
        </Button>
      </div>

      {/* Storage Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="bg-sa-card border-sa-border">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-sa-text-muted uppercase tracking-wider">Total Backups</p>
                <p className="text-2xl font-bold text-sa-text mt-1">{backups.length}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-cyan-500/10"><Database className="h-5 w-5 text-cyan-500" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-sa-card border-sa-border">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-sa-text-muted uppercase tracking-wider">Storage Used</p>
                <p className="text-2xl font-bold text-sa-text mt-1">{totalSize}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-purple-500/10"><HardDrive className="h-5 w-5 text-purple-500" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-sa-card border-sa-border">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-sa-text-muted uppercase tracking-wider">Last Backup</p>
                <p className="text-2xl font-bold text-sa-text mt-1">2h ago</p>
              </div>
              <div className="p-2.5 rounded-xl bg-green-500/10"><CheckCircle2 className="h-5 w-5 text-green-500" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-sa-card border-sa-border">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-sa-text-muted uppercase tracking-wider">Schedule</p>
                <p className="text-2xl font-bold text-sa-text mt-1 capitalize">{schedule}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-orange-500/10"><Calendar className="h-5 w-5 text-orange-500" /></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Storage Bar */}
      <Card className="bg-sa-card border-sa-border">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-sa-text-secondary">Storage Usage</span>
            <span className="text-sm text-sa-text-muted">{totalSize} / {maxStorage}</span>
          </div>
          <div className="w-full bg-sa-card-solid rounded-full h-2">
            <div className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all" style={{ width: `${usagePercent}%` }} />
          </div>
          <p className="text-xs text-sa-text-muted mt-1">{usagePercent}% used - {((50 - 14.2)).toFixed(1)} GB available</p>
        </CardContent>
      </Card>

      {/* Schedule Settings */}
      <Card className="bg-sa-card border-sa-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-sa-text-secondary flex items-center gap-2">
            <Clock className="h-4 w-4 text-orange-500" />
            Backup Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Select value={schedule} onValueChange={setSchedule}>
              <SelectTrigger className="w-[200px] bg-sa-input border-sa-border text-sa-text h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-sa-card-solid border-sa-border">
                <SelectItem value="hourly">Every Hour</SelectItem>
                <SelectItem value="daily">Daily (2:00 AM)</SelectItem>
                <SelectItem value="weekly">Weekly (Sunday 2:00 AM)</SelectItem>
                <SelectItem value="monthly">Monthly (1st 2:00 AM)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-sa-text-muted">Automated backups run at the scheduled time</p>
          </div>
        </CardContent>
      </Card>

      {/* Backup List */}
      <Card className="bg-sa-card border-sa-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-sa-text-secondary">Backup History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-sa-border hover:bg-transparent">
                  {['Name', 'Date', 'Size', 'Type', 'Duration', 'Status', 'Actions'].map((h) => (
                    <TableHead key={h} className="text-sa-text-muted font-medium bg-sa-header-bg text-xs uppercase tracking-wider">{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {backups.map((backup) => (
                  <TableRow key={backup.id} className="border-sa-border hover:bg-sa-row-hover">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Database className="h-4 w-4 text-sa-text-muted" />
                        <span className="text-sm text-sa-text font-mono">{backup.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-sa-text-secondary">{backup.date}</TableCell>
                    <TableCell className="text-sm text-sa-text-secondary">{backup.size}</TableCell>
                    <TableCell><Badge variant={backup.type === 'Auto' ? 'info' : 'secondary'} className="text-[10px]">{backup.type}</Badge></TableCell>
                    <TableCell className="text-sm text-sa-text-muted">{backup.duration}</TableCell>
                    <TableCell><Badge variant={backup.status === 'Completed' ? 'success' : 'destructive'} className="text-[10px]">{backup.status}</Badge></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-sa-text-muted hover:text-sa-text hover:bg-sa-card-hover" title="Download">
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-sa-text-muted hover:text-yellow-400 hover:bg-sa-card-hover" title="Restore" onClick={() => { setSelectedBackup(backup); setRestoreDialogOpen(true); }}>
                          <RotateCcw className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create Backup Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="bg-sa-card-solid border-sa-border backdrop-blur-xl text-sa-text max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sa-text">Create Backup</DialogTitle>
            <DialogDescription className="text-sa-text-muted">Start a manual database backup</DialogDescription>
          </DialogHeader>
          <div className="mt-2">
            <label className="text-xs text-sa-text-muted mb-1 block">Backup Name (optional)</label>
            <Input value={backupName} onChange={(e) => setBackupName(e.target.value)} placeholder="e.g. pre_migration" className="bg-sa-input border-sa-border text-sa-text h-9 text-sm font-mono" />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateDialogOpen(false)} className="text-sa-text-secondary hover:text-sa-text hover:bg-sa-card-hover">Cancel</Button>
            <Button onClick={handleCreate} disabled={creating} className="bg-blue-600 hover:bg-blue-700 gap-2">
              {creating ? (<><div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" /> Creating...</>) : 'Create Backup'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restore Confirmation Dialog */}
      <Dialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <DialogContent className="bg-sa-card-solid border-sa-border backdrop-blur-xl text-sa-text max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sa-text flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              Restore Backup
            </DialogTitle>
            <DialogDescription className="text-sa-text-muted">
              Are you sure you want to restore from &quot;{selectedBackup?.name}&quot;? This will replace all current data and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRestoreDialogOpen(false)} className="text-sa-text-secondary hover:text-sa-text hover:bg-sa-card-hover">Cancel</Button>
            <Button onClick={handleRestore} className="bg-yellow-600 hover:bg-yellow-700">Restore</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
