'use client';

import { PageLayout } from '@/components/layout/page-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users,
  Search,
  Filter,
  ShieldCheck,
  UserCheck,
  Ban,
  Mail,
  Phone,
  Calendar,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/shared/toast';
import { apiClient } from '@/lib/api-client';
import { mockUsers } from '@/mocks/data';
import { useState, useEffect, useMemo } from 'react';
import { User, UserRole, UserStatus } from '@/types';

export default function AdminUsersManagementPage() {
  const { showToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.admin.getUsers();
      setUsers(data);
    } catch {
      setUsers(mockUsers);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.phone && u.phone.includes(searchQuery));

      const matchesRole =
        roleFilter === 'all' ? true : u.role === roleFilter;

      const userStatus = u.status || 'ACTIVE';
      const matchesStatus =
        statusFilter === 'all' ? true : userStatus === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  const handleToggleStatus = async (targetUser: User) => {
    const currentStatus = targetUser.status || 'ACTIVE';
    const newStatus: UserStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';

    try {
      await apiClient.admin.updateUserStatus(targetUser.id, newStatus as any);
      setUsers((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, status: newStatus } : u)),
      );

      if (newStatus === 'SUSPENDED') {
        showToast('error', `User account for ${targetUser.name} has been suspended.`);
      } else {
        showToast('success', `User account for ${targetUser.name} has been activated.`);
      }
    } catch {
      showToast('error', 'Failed to update user status.');
    }
  };

  const getRoleBadgeVariant = (role: UserRole): 'error' | 'default' | 'secondary' | 'outline' => {
    switch (role) {
      case 'admin':
        return 'error';
      case 'landlord':
        return 'default';
      case 'tenant':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Link href="/admin/dashboard" className="hover:text-primary transition-colors">
                Admin Console
              </Link>
              <span>/</span>
              <span className="text-foreground font-medium">User Directory</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              User Directory & Permissions
            </h1>
            <p className="text-muted-foreground mt-1 text-sm md:text-base">
              Manage accounts, enforce role-based access, and oversee account suspension states.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={fetchUsers} disabled={isLoading}>
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Badge variant="outline" className="px-3 py-1 text-sm">
              Total Users: {users.length}
            </Badge>
          </div>
        </div>

        {/* Filter Bar */}
        <Card className="mb-8 border-border/70 shadow-sm">
          <CardContent className="p-4 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or phone number..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="all">All Roles</option>
                  <option value="tenant">Tenants</option>
                  <option value="landlord">Landlords</option>
                  <option value="admin">Administrators</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-muted-foreground shrink-0" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="all">All Account Statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="SUSPENDED">Suspended</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Accounts Table */}
        <Card className="overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground font-medium text-xs uppercase tracking-wider">
                <tr>
                  <th className="p-4 pl-6">User / Contact</th>
                  <th className="p-4">Assigned Role</th>
                  <th className="p-4">Account Status</th>
                  <th className="p-4">Member Since</th>
                  <th className="p-4 text-right pr-6">Administrative Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  [1, 2, 3].map((i) => (
                    <tr key={i}>
                      <td className="p-4 pl-6"><Skeleton className="h-5 w-40" /></td>
                      <td className="p-4"><Skeleton className="h-5 w-20" /></td>
                      <td className="p-4"><Skeleton className="h-5 w-16" /></td>
                      <td className="p-4"><Skeleton className="h-5 w-24" /></td>
                      <td className="p-4 text-right pr-6"><Skeleton className="h-8 w-24 ml-auto" /></td>
                    </tr>
                  ))
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      No users match the criteria.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const status = u.status || 'ACTIVE';
                    const isSuspended = status === 'SUSPENDED';

                    return (
                      <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-4 pl-6">
                          <div className="font-semibold text-foreground">{u.name}</div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {u.email}
                            </span>
                            {u.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {u.phone}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge variant={getRoleBadgeVariant(u.role)} className="uppercase text-xs font-semibold">
                            {u.role || 'tenant'}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <Badge variant={isSuspended ? 'error' : 'success'}>
                            {status}
                          </Badge>
                        </td>
                        <td className="p-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(u.createdAt).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="p-4 text-right pr-6">
                          <Button
                            variant={isSuspended ? 'outline' : 'destructive'}
                            size="sm"
                            onClick={() => handleToggleStatus(u)}
                            className={!isSuspended ? '' : 'text-emerald-600 border-emerald-500/40 hover:bg-emerald-50 dark:hover:bg-emerald-950'}
                          >
                            {isSuspended ? (
                              <>
                                <UserCheck className="h-3.5 w-3.5 mr-1" />
                                Activate
                              </>
                            ) : (
                              <>
                                <Ban className="h-3.5 w-3.5 mr-1" />
                                Suspend
                              </>
                            )}
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </PageLayout>
  );
}
