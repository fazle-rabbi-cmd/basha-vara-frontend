'use client';

import { PageLayout } from '@/components/layout/page-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
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
  Plus,
  X,
  AlertTriangle,
  Copy,
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/shared/toast';
import { apiClient, clearCache } from '@/lib/api-client';
import { useState, useEffect, useMemo } from 'react';
import { User, UserRole, UserStatus, Role } from '@/types';
import { AdminRoute } from '@/features/auth/protected-route';
import { useAuth } from '@/features/auth/auth-context';
import { usePullToRefresh } from '@/hooks/use-pull-to-refresh';
import { PullToRefreshIndicator } from '@/components/shared/pull-to-refresh-indicator';

export default function AdminUsersManagementPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editingRoleUserId, setEditingRoleUserId] = useState<string | null>(null);

  const [isAddRoleDialogOpen, setIsAddRoleDialogOpen] = useState(false);
  const [isRemoveRoleDialogOpen, setIsRemoveRoleDialogOpen] = useState(false);
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRoleToRemove, setSelectedRoleToRemove] = useState<string | null>(null);
  const [isAddingRole, setIsAddingRole] = useState(false);
  const [isRemovingRole, setIsRemovingRole] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserRole, setNewUserRole] = useState('tenant');

  const isSuperAdmin = user?.roles?.includes('super_admin');
  const isAdmin = user?.roles?.includes('admin') || isSuperAdmin;

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      clearCache();
      const data = await apiClient.admin.getUsers();
      setUsers(data);
    } catch (error) {
      showToast('error', 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const data = await apiClient.admin.getRoles();
      setRoles(data);
    } catch (error) {
      showToast('error', 'Failed to load roles');
    }
  };

  const { isPulling, pullDistance, isRefreshing } = usePullToRefresh({
    onRefresh: fetchUsers,
    threshold: 80,
  });

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.phone && u.phone.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesRole =
        roleFilter === 'all' ? true : u.roles?.map((r: string) => r.toLowerCase()).includes(roleFilter);

      const userStatus = u.status || 'ACTIVE';
      const matchesStatus =
        statusFilter === 'all' ? true : userStatus === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter, roles]);

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

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      await apiClient.admin.updateUserRole(userId, newRole as string);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)),
      );
      showToast('success', `User role updated to ${newRole}.`);
      setEditingRoleUserId(null);
    } catch {
      showToast('error', 'Failed to update user role.');
    }
  };

  const handleAddRole = async (userId: string, role: string) => {
    if (!selectedUser) return;

    setIsAddingRole(true);
    try {
      await apiClient.admin.updateUserRole(userId, role);
      showToast('success', `Role ${role} added to user successfully`);
      setIsAddRoleDialogOpen(false);
      setSelectedUser(null);
      await fetchUsers();
    } catch (error: any) {
      showToast('error', error.message || 'Failed to add role');
    } finally {
      setIsAddingRole(false);
    }
  };

  const handleRemoveRole = async () => {
    if (!selectedUser || !selectedRoleToRemove) return;

    setIsRemovingRole(true);
    try {
      await apiClient.admin.removeUserRole(selectedUser.id, selectedRoleToRemove);
      showToast('success', 'Role removed from user successfully');
      setIsRemoveRoleDialogOpen(false);
      setSelectedUser(null);
      setSelectedRoleToRemove(null);
      await fetchUsers();
    } catch (error: any) {
      showToast('error', error.message || 'Failed to remove role');
    } finally {
      setIsRemovingRole(false);
    }
  };

  const openAddRoleDialog = (user: User) => {
    setSelectedUser(user);
    setIsAddRoleDialogOpen(true);
  };

  const openRemoveRoleDialog = (user: User, roleId: string) => {
    setSelectedUser(user);
    setSelectedRoleToRemove(roleId);
    setIsRemoveRoleDialogOpen(true);
  };

  const handleCreateUser = async () => {
    if (!newUserEmail || !newUserName) {
      showToast('error', 'Email and name are required');
      return;
    }

    setIsCreatingUser(true);
    try {
      const result = await apiClient.admin.createUser(newUserEmail, newUserName, newUserPhone, newUserRole);
      setGeneratedPassword(result.password);
      setIsCreateUserDialogOpen(false);
      setIsPasswordDialogOpen(true);
      setNewUserEmail('');
      setNewUserName('');
      setNewUserPhone('');
      setNewUserRole('tenant');
      await fetchUsers();
      showToast('success', 'User created successfully');
    } catch (error: any) {
      showToast('error', error.message || 'Failed to create user');
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser) return;

    setIsResettingPassword(true);
    try {
      const result = await apiClient.admin.resetUserPassword(selectedUser.id);
      setGeneratedPassword(result.password);
      setIsResetPasswordDialogOpen(false);
      setIsPasswordDialogOpen(true);
      showToast('success', 'Password reset successfully');
    } catch (error: any) {
      showToast('error', error.message || 'Failed to reset password');
    } finally {
      setIsResettingPassword(false);
    }
  };

  const openResetPasswordDialog = (user: User) => {
    setSelectedUser(user);
    setIsResetPasswordDialogOpen(true);
  };

  const closePasswordDialog = () => {
    setIsPasswordDialogOpen(false);
    setGeneratedPassword('');
  };

  const getRoleBadgeVariant = (role: UserRole): 'error' | 'default' | 'secondary' | 'outline' => {
    switch (role) {
      case 'super_admin':
        return 'error';
      case 'admin':
        return 'error';
      case 'moderator':
        return 'default';
      case 'landlord':
        return 'default';
      case 'tenant':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <AdminRoute>
      <PullToRefreshIndicator
        pullDistance={pullDistance}
        isPulling={isPulling}
        isRefreshing={isRefreshing}
        threshold={80}
      />
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
            {isAdmin && (
              <Button size="sm" onClick={() => setIsCreateUserDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-1.5" />
                Create User
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={fetchUsers} disabled={isLoading} className="hidden sm:flex">
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
                  {roles.map((role) => (
                    <option key={role.id} value={role.name.toLowerCase()}>
                      {role.displayName || role.name}s
                    </option>
                  ))}
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
                  <th className="p-4 text-right pr-6">Actions</th>
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
                          <div className="flex flex-wrap gap-1.5">
                            {u.roles && u.roles.length > 0 ? (
                              u.roles.map((role) => {
                                const isSystemRole = ['admin', 'super_admin', 'moderator', 'landlord', 'tenant'].includes(role);
                                const hasMultipleSystemRoles = u.roles!.filter((r: string) => ['admin', 'super_admin', 'moderator', 'landlord', 'tenant'].includes(r)).length > 1;
                                const canRemove = isAdmin && (
                                  isSuperAdmin ? isSystemRole && hasMultipleSystemRoles : (role === 'tenant' || role === 'landlord') && hasMultipleSystemRoles
                                );

                                return (
                                  <div key={role} className="flex items-center gap-1">
                                    <Badge variant={getRoleBadgeVariant(role as UserRole)} className="uppercase text-xs font-semibold">
                                      {role}
                                    </Badge>
                                    {canRemove && (
                                      <button
                                        onClick={() => openRemoveRoleDialog(u, role)}
                                        className="text-muted-foreground hover:text-destructive transition-colors"
                                        title={`Remove ${role} role`}
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    )}
                                  </div>
                                );
                              })
                            ) : (
                              <Badge variant="outline" className="text-xs">No roles</Badge>
                            )}
                          </div>
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
                          <div className="flex items-center justify-end gap-2">
                            {isAdmin && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openAddRoleDialog(u)}
                              >
                                <Plus className="h-3.5 w-3.5 mr-1" />
                                Add Role
                              </Button>
                            )}
                            {isAdmin && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openResetPasswordDialog(u)}
                              >
                                Reset Password
                              </Button>
                            )}
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
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Add Role Dialog */}
        <Dialog open={isAddRoleDialogOpen} onOpenChange={setIsAddRoleDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Role to User</DialogTitle>
              <DialogDescription>
                Assign an additional role to {selectedUser?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Select Role</label>
                <select
                  id="role-select"
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  defaultValue=""
                >
                  <option value="" disabled>Choose a role...</option>
                  {roles
                    .filter((role) => {
                      if (isSuperAdmin) {
                        return true;
                      }
                      return role.name !== 'ADMIN' && role.name !== 'SUPER_ADMIN';
                    })
                    .map((role) => (
                      <option key={role.id} value={role.name.toLowerCase()}>
                        {role.displayName || role.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddRoleDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  const select = document.getElementById('role-select') as HTMLSelectElement;
                  if (select?.value && selectedUser) {
                    handleAddRole(selectedUser.id, select.value);
                  }
                }}
                disabled={isAddingRole}
              >
                {isAddingRole ? 'Adding...' : 'Add Role'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Remove Role Dialog */}
        <Dialog open={isRemoveRoleDialogOpen} onOpenChange={setIsRemoveRoleDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Remove Role</DialogTitle>
              <DialogDescription>
                Are you sure you want to remove the "{selectedRoleToRemove}" role from {selectedUser?.name}?
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-destructive">Warning</p>
                <p className="text-muted-foreground mt-1">
                  You cannot remove the last system role from a user. Ensure the user will have at least one system role after removal.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsRemoveRoleDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleRemoveRole} disabled={isRemovingRole}>
                {isRemovingRole ? 'Removing...' : 'Remove Role'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create User Dialog */}
        <Dialog open={isCreateUserDialogOpen} onOpenChange={setIsCreateUserDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>Create a new user account with auto-generated password</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Email</label>
                <Input
                  type="email"
                  placeholder="user@example.com"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Full Name</label>
                <Input
                  placeholder="John Doe"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Phone (Optional)</label>
                <Input
                  placeholder="+880 1XXX-XXXXXX"
                  value={newUserPhone}
                  onChange={(e) => setNewUserPhone(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Role</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {roles
                    .filter((role) => {
                      if (isSuperAdmin) {
                        return true;
                      }
                      return role.name !== 'ADMIN' && role.name !== 'SUPER_ADMIN';
                    })
                    .map((role) => (
                      <option key={role.id} value={role.name.toLowerCase()}>
                        {role.displayName || role.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateUserDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateUser} disabled={isCreatingUser}>
                {isCreatingUser ? 'Creating...' : 'Create User'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reset Password Confirmation Dialog */}
        <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reset Password</DialogTitle>
              <DialogDescription>
                Are you sure you want to reset the password for {selectedUser?.name}?
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-destructive">Warning</p>
                <p className="text-muted-foreground mt-1">
                  This will generate a new password for the user. The old password will no longer work.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsResetPasswordDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleResetPassword} disabled={isResettingPassword}>
                {isResettingPassword ? 'Resetting...' : 'Reset Password'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Generated Password Dialog */}
        <Dialog open={isPasswordDialogOpen} onOpenChange={closePasswordDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Password Generated</DialogTitle>
              <DialogDescription>
                Save this password securely. It will not be shown again.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Generated Password:</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-lg font-mono font-bold text-primary bg-background px-3 py-2 rounded border">
                    {generatedPassword}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedPassword);
                      showToast('success', 'Password copied to clipboard');
                    }}
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </Button>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-amber-600">Important</p>
                  <p className="text-muted-foreground mt-1">
                    This password will only be shown once. Make sure to save it securely and share it with the user manually.
                  </p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={closePasswordDialog}>
                I have saved the password
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageLayout>
    </AdminRoute>
  );
}
