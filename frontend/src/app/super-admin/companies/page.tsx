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
  Building2,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  MoreHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Company {
  id: string;
  name: string;
  owner: string;
  email: string;
  plan: string;
  status: string;
  users: number;
  created: string;
  phone: string;
}

const initialCompanies: Company[] = [
  { id: 'C001', name: 'ABC Construction', owner: 'John Smith', email: 'john@abc.com', plan: 'Professional', status: 'Active', users: 12, created: '2024-01-15', phone: '+1-555-0101' },
  { id: 'C002', name: 'XYZ Industries', owner: 'Sarah Lee', email: 'sarah@xyz.com', plan: 'Enterprise', status: 'Active', users: 45, created: '2023-11-20', phone: '+1-555-0102' },
  { id: 'C003', name: 'DEF Builders', owner: 'Mike Johnson', email: 'mike@def.com', plan: 'Starter', status: 'Trial', users: 3, created: '2024-03-01', phone: '+1-555-0103' },
  { id: 'C004', name: 'GHI Structures', owner: 'Emma Wilson', email: 'emma@ghi.com', plan: 'Professional', status: 'Active', users: 18, created: '2023-08-10', phone: '+1-555-0104' },
  { id: 'C005', name: 'JKL Engineering', owner: 'Tom Brown', email: 'tom@jkl.com', plan: 'Free', status: 'Suspended', users: 1, created: '2024-02-28', phone: '+1-555-0105' },
  { id: 'C006', name: 'MNO Steel Works', owner: 'Lisa Davis', email: 'lisa@mno.com', plan: 'Enterprise', status: 'Active', users: 52, created: '2023-05-12', phone: '+1-555-0106' },
  { id: 'C007', name: 'PQR Fabrication', owner: 'Chris Martin', email: 'chris@pqr.com', plan: 'Professional', status: 'Active', users: 22, created: '2023-09-05', phone: '+1-555-0107' },
  { id: 'C008', name: 'STU Metal Corp', owner: 'Angela White', email: 'angela@stu.com', plan: 'Starter', status: 'Active', users: 5, created: '2024-01-22', phone: '+1-555-0108' },
];

const emptyCompany: Omit<Company, 'id'> = {
  name: '', owner: '', email: '', plan: 'Starter', status: 'Active', users: 0, created: new Date().toISOString().split('T')[0], phone: '',
};

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>(initialCompanies);
  const [search, setSearch] = useState('');
  const [filterPlan, setFilterPlan] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [viewingCompany, setViewingCompany] = useState<Company | null>(null);
  const [deletingCompany, setDeletingCompany] = useState<Company | null>(null);
  const [formData, setFormData] = useState<Omit<Company, 'id'>>(emptyCompany);

  const filtered = companies.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.owner.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase());
    const matchPlan = filterPlan === 'all' || c.plan === filterPlan;
    const matchStatus = filterStatus === 'all' || c.status === filterStatus;
    return matchSearch && matchPlan && matchStatus;
  });

  const openAdd = () => {
    setEditingCompany(null);
    setFormData(emptyCompany);
    setDialogOpen(true);
  };

  const openEdit = (company: Company) => {
    setEditingCompany(company);
    setFormData({ name: company.name, owner: company.owner, email: company.email, plan: company.plan, status: company.status, users: company.users, created: company.created, phone: company.phone });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (editingCompany) {
      setCompanies(companies.map((c) => c.id === editingCompany.id ? { ...c, ...formData } : c));
    } else {
      const newId = `C${String(companies.length + 1).padStart(3, '0')}`;
      setCompanies([...companies, { id: newId, ...formData }]);
    }
    setDialogOpen(false);
  };

  const handleDelete = () => {
    if (deletingCompany) {
      setCompanies(companies.filter((c) => c.id !== deletingCompany.id));
    }
    setDeleteDialogOpen(false);
    setDeletingCompany(null);
  };

  const toggleStatus = (company: Company) => {
    const newStatus = company.status === 'Active' ? 'Suspended' : 'Active';
    setCompanies(companies.map((c) => c.id === company.id ? { ...c, status: newStatus } : c));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-sa-text">Company Management</h1>
          <p className="text-sm text-sa-text-muted mt-0.5">Manage all registered companies and their access</p>
        </div>
        <Button onClick={openAdd} className="bg-blue-600 hover:bg-blue-700 gap-2 h-9">
          <Plus className="h-4 w-4" /> Add Company
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-sa-card border-sa-border">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sa-text-muted" />
              <Input
                placeholder="Search companies..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-sa-input border-sa-border text-sa-text placeholder:text-sa-text-muted h-9"
              />
            </div>
            <Select value={filterPlan} onValueChange={setFilterPlan}>
              <SelectTrigger className="w-[140px] bg-sa-input border-sa-border text-sa-text h-9 text-sm">
                <SelectValue placeholder="Plan" />
              </SelectTrigger>
              <SelectContent className="bg-sa-card-solid border-sa-border">
                <SelectItem value="all">All Plans</SelectItem>
                <SelectItem value="Free">Free</SelectItem>
                <SelectItem value="Starter">Starter</SelectItem>
                <SelectItem value="Professional">Professional</SelectItem>
                <SelectItem value="Enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[140px] bg-sa-input border-sa-border text-sa-text h-9 text-sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-sa-card-solid border-sa-border">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Trial">Trial</SelectItem>
                <SelectItem value="Suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-xs text-sa-text-muted">{filtered.length} companies</span>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-sa-card border-sa-border">
        <CardContent className="p-0">
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-sa-border hover:bg-transparent">
                  {['Company', 'Owner', 'Plan', 'Status', 'Users', 'Created', 'Actions'].map((h) => (
                    <TableHead key={h} className="text-sa-text-muted font-medium bg-sa-header-bg text-xs uppercase tracking-wider">{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow className="border-sa-border">
                    <TableCell colSpan={7} className="text-center text-sa-text-muted py-8">No companies found</TableCell>
                  </TableRow>
                ) : (
                  filtered.map((company) => (
                    <TableRow key={company.id} className="border-sa-border hover:bg-sa-row-hover">
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
                            <Building2 className="h-4 w-4 text-blue-500" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-sa-text">{company.name}</p>
                            <p className="text-[11px] text-sa-text-muted">{company.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-sa-text-secondary">{company.owner}</TableCell>
                      <TableCell>
                        <Badge variant={company.plan === 'Enterprise' ? 'info' : company.plan === 'Professional' ? 'success' : 'secondary'} className="text-[10px]">
                          {company.plan}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={company.status === 'Active' ? 'success' : company.status === 'Trial' ? 'warning' : 'destructive'}
                          className="text-[10px] cursor-pointer"
                          onClick={() => toggleStatus(company)}
                        >
                          {company.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-sa-text-secondary">{company.users}</TableCell>
                      <TableCell className="text-sm text-sa-text-muted">{company.created}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-sa-text-muted hover:text-sa-text hover:bg-sa-card-hover" onClick={() => { setViewingCompany(company); setViewDialogOpen(true); }}>
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-sa-text-muted hover:text-sa-text hover:bg-sa-card-hover" onClick={() => openEdit(company)}>
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-sa-text-muted hover:text-red-400 hover:bg-sa-card-hover" onClick={() => { setDeletingCompany(company); setDeleteDialogOpen(true); }}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-sa-card-solid border-sa-border backdrop-blur-xl text-sa-text max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sa-text">{editingCompany ? 'Edit Company' : 'Add Company'}</DialogTitle>
            <DialogDescription className="text-sa-text-muted">
              {editingCompany ? 'Update company information' : 'Register a new company'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {[
              { label: 'Company Name', key: 'name', type: 'text' },
              { label: 'Owner Name', key: 'owner', type: 'text' },
              { label: 'Email', key: 'email', type: 'email' },
              { label: 'Phone', key: 'phone', type: 'text' },
            ].map((field) => (
              <div key={field.key}>
                <label className="text-xs text-sa-text-muted mb-1 block">{field.label}</label>
                <Input
                  type={field.type}
                  value={(formData as any)[field.key]}
                  onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                  className="bg-sa-input border-sa-border text-sa-text h-9 text-sm"
                />
              </div>
            ))}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-sa-text-muted mb-1 block">Plan</label>
                <Select value={formData.plan} onValueChange={(v) => setFormData({ ...formData, plan: v })}>
                  <SelectTrigger className="bg-sa-input border-sa-border text-sa-text h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-sa-card-solid border-sa-border">
                    <SelectItem value="Free">Free</SelectItem>
                    <SelectItem value="Starter">Starter</SelectItem>
                    <SelectItem value="Professional">Professional</SelectItem>
                    <SelectItem value="Enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-sa-text-muted mb-1 block">Status</label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger className="bg-sa-input border-sa-border text-sa-text h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-sa-card-solid border-sa-border">
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Trial">Trial</SelectItem>
                    <SelectItem value="Suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)} className="text-sa-text-secondary hover:text-sa-text hover:bg-sa-card-hover">Cancel</Button>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="bg-sa-card-solid border-sa-border backdrop-blur-xl text-sa-text max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sa-text">{viewingCompany?.name}</DialogTitle>
            <DialogDescription className="text-sa-text-muted">Company details</DialogDescription>
          </DialogHeader>
          {viewingCompany && (
            <div className="space-y-3 mt-2">
              {[
                ['ID', viewingCompany.id],
                ['Owner', viewingCompany.owner],
                ['Email', viewingCompany.email],
                ['Phone', viewingCompany.phone],
                ['Plan', viewingCompany.plan],
                ['Status', viewingCompany.status],
                ['Users', String(viewingCompany.users)],
                ['Created', viewingCompany.created],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between py-1.5 border-b border-sa-border">
                  <span className="text-sm text-sa-text-muted">{label}</span>
                  <span className="text-sm text-sa-text-secondary">{value}</span>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-sa-card-solid border-sa-border backdrop-blur-xl text-sa-text max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sa-text">Delete Company</DialogTitle>
            <DialogDescription className="text-sa-text-muted">
              Are you sure you want to delete &quot;{deletingCompany?.name}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteDialogOpen(false)} className="text-sa-text-secondary hover:text-sa-text hover:bg-sa-card-hover">Cancel</Button>
            <Button onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
