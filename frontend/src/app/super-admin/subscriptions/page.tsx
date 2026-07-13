'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  CreditCard,
  Edit,
  TrendingUp,
  Users,
  Building2,
  DollarSign,
  Check,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Plan {
  id: string;
  name: string;
  price: string;
  period: string;
  features: string[];
  limits: { users: string; projects: string; storage: string };
  companies: number;
  color: string;
}

interface Subscription {
  id: string;
  company: string;
  plan: string;
  status: string;
  mrr: string;
  startDate: string;
  nextBilling: string;
  users: number;
}

const plans: Plan[] = [
  { id: 'free', name: 'Free', price: '$0', period: 'forever', features: ['1 User', '2 Projects', 'Basic Reports'], limits: { users: '1', projects: '2', storage: '100 MB' }, companies: 41, color: 'gray' },
  { id: 'starter', name: 'Starter', price: '$19', period: '/month', features: ['5 Users', '10 Projects', 'Standard Reports', 'Email Support'], limits: { users: '5', projects: '10', storage: '1 GB' }, companies: 65, color: 'blue' },
  { id: 'professional', name: 'Professional', price: '$49', period: '/month', features: ['25 Users', 'Unlimited Projects', 'Advanced Reports', 'Priority Support', 'API Access'], limits: { users: '25', projects: 'Unlimited', storage: '10 GB' }, companies: 42, color: 'purple' },
  { id: 'enterprise', name: 'Enterprise', price: '$149', period: '/month', features: ['Unlimited Users', 'Unlimited Projects', 'Custom Reports', '24/7 Support', 'API Access', 'SSO', 'Dedicated Manager'], limits: { users: 'Unlimited', projects: 'Unlimited', storage: '100 GB' }, companies: 8, color: 'emerald' },
];

const subscriptions: Subscription[] = [
  { id: 'S001', company: 'XYZ Industries', plan: 'Enterprise', status: 'Active', mrr: '$2,500', startDate: '2023-06-01', nextBilling: '2024-04-01', users: 45 },
  { id: 'S002', company: 'MNO Steel Works', plan: 'Enterprise', status: 'Active', mrr: '$2,500', startDate: '2023-05-12', nextBilling: '2024-04-05', users: 52 },
  { id: 'S003', company: 'ABC Construction', plan: 'Professional', status: 'Active', mrr: '$800', startDate: '2024-01-15', nextBilling: '2024-04-10', users: 12 },
  { id: 'S004', company: 'GHI Structures', plan: 'Professional', status: 'Overdue', mrr: '$800', startDate: '2023-08-10', nextBilling: '2024-03-15', users: 18 },
  { id: 'S005', company: 'PQR Fabrication', plan: 'Professional', status: 'Active', mrr: '$800', startDate: '2023-09-05', nextBilling: '2024-04-05', users: 22 },
  { id: 'S006', company: 'DEF Builders', plan: 'Starter', status: 'Trial', mrr: '$200', startDate: '2024-03-01', nextBilling: '2024-04-15', users: 3 },
  { id: 'S007', company: 'STU Metal Corp', plan: 'Starter', status: 'Active', mrr: '$200', startDate: '2024-01-22', nextBilling: '2024-04-22', users: 5 },
  { id: 'S008', company: 'JKL Engineering', plan: 'Free', status: 'Suspended', mrr: '$0', startDate: '2024-02-28', nextBilling: '-', users: 1 },
];

export default function SubscriptionsPage() {
  const [editPlanOpen, setEditPlanOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [planForm, setPlanForm] = useState({ price: '', users: '', projects: '', storage: '' });
  const [filterPlan, setFilterPlan] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const openEditPlan = (plan: Plan) => {
    setEditingPlan(plan);
    setPlanForm({ price: plan.price.replace('$', ''), users: plan.limits.users, projects: plan.limits.projects, storage: plan.limits.storage });
    setEditPlanOpen(true);
  };

  const filtered = subscriptions.filter((s) => {
    const matchPlan = filterPlan === 'all' || s.plan === filterPlan;
    const matchStatus = filterStatus === 'all' || s.status === filterStatus;
    return matchPlan && matchStatus;
  });

  const totalMRR = subscriptions.reduce((sum, s) => sum + parseInt(s.mrr.replace(/[$,]/g, '') || '0'), 0);
  const activeCount = subscriptions.filter((s) => s.status === 'Active').length;
  const trialCount = subscriptions.filter((s) => s.status === 'Trial').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-sa-text">Subscriptions</h1>
        <p className="text-sm text-sa-text-muted mt-0.5">Manage plans, billing, and subscription status</p>
      </div>

      {/* Revenue Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-sa-card border-sa-border">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-sa-text-muted uppercase tracking-wider">Total MRR</p>
                <p className="text-2xl font-bold text-sa-text mt-1">${totalMRR.toLocaleString()}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-purple-500/10"><DollarSign className="h-5 w-5 text-purple-500" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-sa-card border-sa-border">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-sa-text-muted uppercase tracking-wider">Active Subscriptions</p>
                <p className="text-2xl font-bold text-sa-text mt-1">{activeCount}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-green-500/10"><Check className="h-5 w-5 text-green-500" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-sa-card border-sa-border">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-sa-text-muted uppercase tracking-wider">Trials</p>
                <p className="text-2xl font-bold text-sa-text mt-1">{trialCount}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-yellow-500/10"><Users className="h-5 w-5 text-yellow-500" /></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Plans */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {plans.map((plan) => {
          const colorMap: Record<string, string> = { gray: 'border-sa-border-solid', blue: 'border-blue-500/30', purple: 'border-purple-500/30', emerald: 'border-emerald-500/30' };
          const iconColorMap: Record<string, string> = { gray: 'text-sa-text-muted', blue: 'text-blue-500', purple: 'text-purple-500', emerald: 'text-emerald-500' };
          const bgMap: Record<string, string> = { gray: 'bg-gray-500/10', blue: 'bg-blue-500/10', purple: 'bg-purple-500/10', emerald: 'bg-emerald-500/10' };
          return (
            <Card key={plan.id} className={cn('bg-sa-card-solid', colorMap[plan.color], 'relative overflow-hidden')}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-sa-text">{plan.name}</h3>
                  <div className={cn('p-2 rounded-lg', bgMap[plan.color])}>
                    <CreditCard className={cn('h-4 w-4', iconColorMap[plan.color])} />
                  </div>
                </div>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-sa-text">{plan.price}</span>
                  <span className="text-sm text-sa-text-muted">{plan.period}</span>
                </div>
                <div className="space-y-2 mb-4">
                  {plan.features.map((f) => (
                    <div key={f} className="flex items-center gap-2">
                      <Check className={cn('h-3.5 w-3.5', iconColorMap[plan.color])} />
                      <span className="text-xs text-sa-text-secondary">{f}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-3 border-t border-sa-border flex items-center justify-between">
                  <span className="text-xs text-sa-text-muted">{plan.companies} companies</span>
                  <Button variant="ghost" size="sm" className="text-sa-text-muted hover:text-sa-text hover:bg-sa-card-hover h-7 text-xs gap-1" onClick={() => openEditPlan(plan)}>
                    <Edit className="h-3 w-3" /> Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Subscription List */}
      <Card className="bg-sa-card border-sa-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-sa-text-secondary">Company Subscriptions</CardTitle>
            <div className="flex items-center gap-2">
              <Select value={filterPlan} onValueChange={setFilterPlan}>
                <SelectTrigger className="w-[120px] bg-sa-input border-sa-border text-sa-text h-8 text-xs"><SelectValue placeholder="Plan" /></SelectTrigger>
                <SelectContent className="bg-sa-card-solid border-sa-border">
                  <SelectItem value="all">All Plans</SelectItem>
                  <SelectItem value="Free">Free</SelectItem>
                  <SelectItem value="Starter">Starter</SelectItem>
                  <SelectItem value="Professional">Professional</SelectItem>
                  <SelectItem value="Enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[120px] bg-sa-input border-sa-border text-sa-text h-8 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent className="bg-sa-card-solid border-sa-border">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Trial">Trial</SelectItem>
                  <SelectItem value="Overdue">Overdue</SelectItem>
                  <SelectItem value="Suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-sa-border hover:bg-transparent">
                  {['Company', 'Plan', 'MRR', 'Users', 'Status', 'Next Billing'].map((h) => (
                    <TableHead key={h} className="text-sa-text-muted font-medium bg-sa-header-bg text-xs uppercase tracking-wider">{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((sub) => (
                  <TableRow key={sub.id} className="border-sa-border hover:bg-sa-row-hover">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-sa-text-muted" />
                        <span className="text-sm text-sa-text">{sub.company}</span>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant={sub.plan === 'Enterprise' ? 'info' : sub.plan === 'Professional' ? 'success' : 'secondary'} className="text-[10px]">{sub.plan}</Badge></TableCell>
                    <TableCell className="text-sm text-sa-text-secondary">{sub.mrr}</TableCell>
                    <TableCell className="text-sm text-sa-text-secondary">{sub.users}</TableCell>
                    <TableCell><Badge variant={sub.status === 'Active' ? 'success' : sub.status === 'Trial' ? 'warning' : 'destructive'} className="text-[10px]">{sub.status}</Badge></TableCell>
                    <TableCell className="text-sm text-sa-text-muted">{sub.nextBilling}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Plan Dialog */}
      <Dialog open={editPlanOpen} onOpenChange={setEditPlanOpen}>
        <DialogContent className="bg-sa-card-solid border-sa-border backdrop-blur-xl text-sa-text max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sa-text">Edit {editingPlan?.name} Plan</DialogTitle>
            <DialogDescription className="text-sa-text-muted">Update pricing and limits</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-xs text-sa-text-muted mb-1 block">Price ($/month)</label>
              <Input value={planForm.price} onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })} className="bg-sa-input border-sa-border text-sa-text h-9 text-sm" />
            </div>
            <div>
              <label className="text-xs text-sa-text-muted mb-1 block">User Limit</label>
              <Input value={planForm.users} onChange={(e) => setPlanForm({ ...planForm, users: e.target.value })} className="bg-sa-input border-sa-border text-sa-text h-9 text-sm" />
            </div>
            <div>
              <label className="text-xs text-sa-text-muted mb-1 block">Project Limit</label>
              <Input value={planForm.projects} onChange={(e) => setPlanForm({ ...planForm, projects: e.target.value })} className="bg-sa-input border-sa-border text-sa-text h-9 text-sm" />
            </div>
            <div>
              <label className="text-xs text-sa-text-muted mb-1 block">Storage</label>
              <Input value={planForm.storage} onChange={(e) => setPlanForm({ ...planForm, storage: e.target.value })} className="bg-sa-input border-sa-border text-sa-text h-9 text-sm" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditPlanOpen(false)} className="text-sa-text-secondary hover:text-sa-text hover:bg-sa-card-hover">Cancel</Button>
            <Button onClick={() => setEditPlanOpen(false)} className="bg-blue-600 hover:bg-blue-700">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
