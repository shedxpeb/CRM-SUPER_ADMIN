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
  FileText,
  Search,
  Download,
  Eye,
  Shield,
  LogIn,
  LogOut,
  UserPlus,
  Settings,
  Edit,
  Trash2,
  Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  resource: string;
  details: string;
  ip: string;
  status: string;
}

const auditLogs: AuditLog[] = [
  { id: 'AL001', timestamp: '2024-03-28 14:32:15', user: 'admin@pebcrm.com', action: 'Login', resource: 'Auth', details: 'Super admin logged in successfully', ip: '192.168.1.100', status: 'Success' },
  { id: 'AL002', timestamp: '2024-03-28 14:25:08', user: 'john@abc.com', action: 'Update', resource: 'Company', details: 'Updated company settings for ABC Construction', ip: '10.0.0.45', status: 'Success' },
  { id: 'AL003', timestamp: '2024-03-28 13:58:42', user: 'sarah@xyz.com', action: 'Create', resource: 'Project', details: 'Created new project "Warehouse Expansion"', ip: '10.0.0.62', status: 'Success' },
  { id: 'AL004', timestamp: '2024-03-28 13:45:11', user: 'unknown@external.com', action: 'Login', resource: 'Auth', details: 'Failed login attempt - invalid credentials', ip: '203.45.67.89', status: 'Failed' },
  { id: 'AL005', timestamp: '2024-03-28 13:30:00', user: 'admin@pebcrm.com', action: 'Suspend', resource: 'User', details: 'Suspended user tom@jkl.com', ip: '192.168.1.100', status: 'Success' },
  { id: 'AL006', timestamp: '2024-03-28 12:15:33', user: 'mike@def.com', action: 'Create', resource: 'Quotation', details: 'Created quotation #Q-2024-089', ip: '10.0.0.78', status: 'Success' },
  { id: 'AL007', timestamp: '2024-03-28 11:45:20', user: 'admin@pebcrm.com', action: 'Update', resource: 'Plan', details: 'Updated Professional plan pricing from $39 to $49', ip: '192.168.1.100', status: 'Success' },
  { id: 'AL008', timestamp: '2024-03-28 10:30:05', user: 'emma@ghi.com', action: 'Delete', resource: 'Lead', details: 'Deleted 3 inactive leads', ip: '10.0.0.91', status: 'Success' },
  { id: 'AL009', timestamp: '2024-03-28 09:15:48', user: 'system', action: 'Backup', resource: 'System', details: 'Automated daily backup completed', ip: 'localhost', status: 'Success' },
  { id: 'AL010', timestamp: '2024-03-28 08:00:00', user: 'system', action: 'Health Check', resource: 'System', details: 'All services operational', ip: 'localhost', status: 'Success' },
  { id: 'AL011', timestamp: '2024-03-27 23:45:12', user: 'lisa@mno.com', action: 'Export', resource: 'Data', details: 'Exported project report (PDF)', ip: '10.0.0.55', status: 'Success' },
  { id: 'AL012', timestamp: '2024-03-27 22:30:00', user: 'unknown@external.com', action: 'Login', resource: 'Auth', details: 'Failed login attempt - account locked', ip: '185.92.40.11', status: 'Blocked' },
];

const getActionIcon = (action: string) => {
  switch (action) {
    case 'Login': return LogIn;
    case 'Logout': return LogOut;
    case 'Create': return UserPlus;
    case 'Update': return Edit;
    case 'Delete': return Trash2;
    case 'Suspend': return Shield;
    case 'Backup': return FileText;
    default: return Settings;
  }
};

export default function AuditLogsPage() {
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const filtered = auditLogs.filter((log) => {
    const matchSearch = log.user.toLowerCase().includes(search.toLowerCase()) ||
      log.details.toLowerCase().includes(search.toLowerCase()) ||
      log.resource.toLowerCase().includes(search.toLowerCase());
    const matchAction = filterAction === 'all' || log.action === filterAction;
    const matchStatus = filterStatus === 'all' || log.status === filterStatus;
    return matchSearch && matchAction && matchStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-sa-text">Audit Logs</h1>
          <p className="text-sm text-sa-text-muted mt-0.5">Track all system activities and security events</p>
        </div>
        <Button className="bg-sa-card-solid hover:bg-sa-card-hover text-sa-text-secondary gap-2 h-9 border border-sa-border-solid">
          <Download className="h-4 w-4" /> Export Logs
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="bg-sa-card border-sa-border">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-sa-text-muted uppercase tracking-wider">Total Events</p>
                <p className="text-2xl font-bold text-sa-text mt-1">{auditLogs.length}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-blue-500/10"><FileText className="h-5 w-5 text-blue-500" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-sa-card border-sa-border">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-sa-text-muted uppercase tracking-wider">Success</p>
                <p className="text-2xl font-bold text-green-400 mt-1">{auditLogs.filter((l) => l.status === 'Success').length}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-green-500/10"><Shield className="h-5 w-5 text-green-500" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-sa-card border-sa-border">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-sa-text-muted uppercase tracking-wider">Failed</p>
                <p className="text-2xl font-bold text-red-400 mt-1">{auditLogs.filter((l) => l.status === 'Failed').length}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-red-500/10"><Shield className="h-5 w-5 text-red-500" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-sa-card border-sa-border">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-sa-text-muted uppercase tracking-wider">Blocked</p>
                <p className="text-2xl font-bold text-yellow-400 mt-1">{auditLogs.filter((l) => l.status === 'Blocked').length}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-yellow-500/10"><Shield className="h-5 w-5 text-yellow-500" /></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-sa-card border-sa-border">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sa-text-muted" />
              <Input placeholder="Search logs..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-sa-input border-sa-border text-sa-text placeholder:text-sa-text-muted h-9" />
            </div>
            <Select value={filterAction} onValueChange={setFilterAction}>
              <SelectTrigger className="w-[130px] bg-sa-input border-sa-border text-sa-text h-9 text-sm"><SelectValue placeholder="Action" /></SelectTrigger>
              <SelectContent className="bg-sa-card-solid border-sa-border">
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="Login">Login</SelectItem>
                <SelectItem value="Create">Create</SelectItem>
                <SelectItem value="Update">Update</SelectItem>
                <SelectItem value="Delete">Delete</SelectItem>
                <SelectItem value="Suspend">Suspend</SelectItem>
                <SelectItem value="Backup">Backup</SelectItem>
                <SelectItem value="Export">Export</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[120px] bg-sa-input border-sa-border text-sa-text h-9 text-sm"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent className="bg-sa-card-solid border-sa-border">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Success">Success</SelectItem>
                <SelectItem value="Failed">Failed</SelectItem>
                <SelectItem value="Blocked">Blocked</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-xs text-sa-text-muted">{filtered.length} entries</span>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card className="bg-sa-card border-sa-border">
        <CardContent className="p-0">
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-sa-border hover:bg-transparent">
                  {['Timestamp', 'User', 'Action', 'Resource', 'Details', 'IP', 'Status', ''].map((h) => (
                    <TableHead key={h} className="text-sa-text-muted font-medium bg-sa-header-bg text-xs uppercase tracking-wider">{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((log) => {
                  const ActionIcon = getActionIcon(log.action);
                  return (
                    <TableRow key={log.id} className="border-sa-border hover:bg-sa-row-hover">
                      <TableCell className="text-xs text-sa-text-muted font-mono whitespace-nowrap">{log.timestamp}</TableCell>
                      <TableCell className="text-sm text-sa-text-secondary">{log.user}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <ActionIcon className="h-3.5 w-3.5 text-sa-text-muted" />
                          <span className="text-sm text-sa-text-secondary">{log.action}</span>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="secondary" className="text-[10px]">{log.resource}</Badge></TableCell>
                      <TableCell className="text-sm text-sa-text-secondary max-w-[250px] truncate">{log.details}</TableCell>
                      <TableCell className="text-xs text-sa-text-muted font-mono">{log.ip}</TableCell>
                      <TableCell>
                        <Badge variant={log.status === 'Success' ? 'success' : log.status === 'Failed' ? 'destructive' : 'warning'} className="text-[10px]">
                          {log.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-sa-text-muted hover:text-sa-text hover:bg-sa-card-hover" onClick={() => { setSelectedLog(log); setDetailDialogOpen(true); }}>
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="bg-sa-card-solid border-sa-border backdrop-blur-xl text-sa-text max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sa-text">Log Detail</DialogTitle>
            <DialogDescription className="text-sa-text-muted">{selectedLog?.id}</DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-3 mt-2">
              {[
                ['Timestamp', selectedLog.timestamp],
                ['User', selectedLog.user],
                ['Action', selectedLog.action],
                ['Resource', selectedLog.resource],
                ['Details', selectedLog.details],
                ['IP Address', selectedLog.ip],
                ['Status', selectedLog.status],
              ].map(([label, value]) => (
                <div key={label} className="flex items-start justify-between py-1.5 border-b border-sa-border">
                  <span className="text-sm text-sa-text-muted">{label}</span>
                  <span className={cn('text-sm text-right max-w-[60%]', label === 'Status' ? '' : 'text-sa-text-secondary')}>
                    {label === 'Status' ? (
                      <Badge variant={value === 'Success' ? 'success' : value === 'Failed' ? 'destructive' : 'warning'} className="text-[10px]">{value}</Badge>
                    ) : value}
                  </span>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
