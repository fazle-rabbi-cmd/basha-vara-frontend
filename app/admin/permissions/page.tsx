'use client';

import { PageLayout } from '@/components/layout/page-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ShieldCheck, Search, Save, RefreshCw, Check, X, Plus, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/shared/toast';
import { apiClient, clearCache } from '@/lib/api-client';
import { useState, useEffect } from 'react';
import { AdminRoute } from '@/features/auth/protected-route';
import { useAuth } from '@/features/auth/auth-context';

interface Permission {
  id: string;
  name: string;
  description: string;
}

interface Role {
  id: string;
  name: string;
  displayName: string;
  description: string;
  permissions: Permission[];
}

export default function AdminPermissionsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [roles, setRoles] = useState<Role[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [localPermissions, setLocalPermissions] = useState<Set<string>>(new Set());

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCreatePermissionDialogOpen, setIsCreatePermissionDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [deletingRole, setDeletingRole] = useState<Role | null>(null);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDisplayName, setNewRoleDisplayName] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');
  const [newRolePermissions, setNewRolePermissions] = useState<string[]>([]);
  const [newPermissionName, setNewPermissionName] = useState('');
  const [newPermissionDescription, setNewPermissionDescription] = useState('');
  const [newPermissionCategory, setNewPermissionCategory] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCreatingPermission, setIsCreatingPermission] = useState(false);

  const isSuperAdmin = user?.roles?.includes('super_admin');

  const loadData = async () => {
    setIsLoading(true);
    clearCache();
    try {
      const [rolesData, permissionsData] = await Promise.all([
        apiClient.admin.getRoles(),
        apiClient.admin.getPermissions(),
      ]);
      setRoles(rolesData);
      setAllPermissions(permissionsData);
      if (rolesData.length > 0) {
        setSelectedRole(rolesData[0].id);
        setLocalPermissions(new Set(rolesData[0].permissions.map((p: Permission) => p.id)));
      }
    } catch (error) {
      showToast('error', 'Failed to load permissions data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedRole) {
      const role = roles.find((r) => r.id === selectedRole);
      if (role) {
        setLocalPermissions(new Set(role.permissions.map((p: Permission) => p.id)));
      }
    }
  }, [selectedRole, roles]);

  const togglePermission = (permissionId: string) => {
    const selectedRoleData = roles.find((r) => r.id === selectedRole);
    if (selectedRoleData?.name === 'SUPER_ADMIN') {
      showToast('error', 'Cannot modify super admin permissions');
      return;
    }

    setLocalPermissions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(permissionId)) {
        newSet.delete(permissionId);
      } else {
        newSet.add(permissionId);
      }
      return newSet;
    });
  };

  const handleSave = async () => {
    if (!selectedRole) return;
    setIsSaving(true);
    try {
      await apiClient.admin.updateRolePermissions(selectedRole, Array.from(localPermissions));
      showToast('success', 'Permissions updated successfully');
      await loadData();
    } catch (error) {
      showToast('error', 'Failed to update permissions');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreatePermission = async () => {
    if (!newPermissionName) {
      showToast('error', 'Permission name is required');
      return;
    }

    setIsCreatingPermission(true);
    try {
      await apiClient.admin.createPermission(newPermissionName, newPermissionDescription, newPermissionCategory);
      showToast('success', 'Permission created successfully');
      setIsCreatePermissionDialogOpen(false);
      setNewPermissionName('');
      setNewPermissionDescription('');
      setNewPermissionCategory('');
      await loadData();
    } catch (error: any) {
      showToast('error', error.message || 'Failed to create permission');
    } finally {
      setIsCreatingPermission(false);
    }
  };

  const handleCreateRole = async () => {
    if (!newRoleName || !newRoleDisplayName) {
      showToast('error', 'Name and display name are required');
      return;
    }

    setIsCreating(true);
    try {
      await apiClient.admin.createRole(newRoleName, newRoleDisplayName, newRoleDescription, newRolePermissions);
      showToast('success', 'Role created successfully');
      setIsCreateDialogOpen(false);
      setNewRoleName('');
      setNewRoleDisplayName('');
      setNewRoleDescription('');
      setNewRolePermissions([]);
      await loadData();
    } catch (error: any) {
      showToast('error', error.message || 'Failed to create role');
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!editingRole) return;

    setIsUpdating(true);
    try {
      await apiClient.admin.updateRole(editingRole.id, newRoleDisplayName, newRoleDescription);
      showToast('success', 'Role updated successfully');
      setIsEditDialogOpen(false);
      setEditingRole(null);
      setNewRoleDisplayName('');
      setNewRoleDescription('');
      await loadData();
    } catch (error: any) {
      showToast('error', error.message || 'Failed to update role');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteRole = async () => {
    if (!deletingRole) return;

    setIsDeleting(true);
    try {
      await apiClient.admin.deleteRole(deletingRole.id);
      showToast('success', 'Role deleted successfully');
      setIsDeleteDialogOpen(false);
      setDeletingRole(null);
      if (selectedRole === deletingRole.id) {
        setSelectedRole(null);
      }
      await loadData();
    } catch (error: any) {
      showToast('error', error.message || 'Failed to delete role');
    } finally {
      setIsDeleting(false);
    }
  };

  const openEditDialog = (role: Role) => {
    setEditingRole(role);
    setNewRoleDisplayName(role.displayName);
    setNewRoleDescription(role.description || '');
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (role: Role) => {
    setDeletingRole(role);
    setIsDeleteDialogOpen(true);
  };

  const filteredPermissions = allPermissions.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getPermissionCount = (roleName: string) => {
    const role = roles.find((r) => r.name === roleName);
    return role?.permissions.length || 0;
  };

  if (isLoading) {
    return (
      <PageLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <Skeleton variant="text" className="h-9 w-64 mb-2" />
            <Skeleton variant="text" className="h-5 w-80" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <Skeleton variant="text" className="h-4 w-28 mb-3" />
                <Skeleton variant="text" className="h-8 w-20" />
              </CardContent>
            </Card>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <AdminRoute>
      <PageLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-border">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Role & Permission Management
                </span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Access Control Configuration
              </h1>
              <p className="text-muted-foreground mt-1 text-sm md:text-base">
                Manage system roles and their associated permissions for fine-grained access control.
              </p>
            </div>
            <div className="flex items-center gap-3">
              {isSuperAdmin && (
                <>
                  <Button size="sm" variant="outline" onClick={() => setIsCreatePermissionDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-1.5" />
                    New Permission
                  </Button>
                  <Button size="sm" onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-1.5" />
                    Create Role
                  </Button>
                </>
              )}
              <Button variant="outline" size="sm" onClick={loadData} className="hidden sm:flex">
                <RefreshCw className="h-4 w-4 mr-1.5" />
                Refresh
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Role Selection */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Select Role</CardTitle>
                  <CardDescription>Choose a role to manage its permissions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {roles.map((role) => {
                    const isSuperAdminRole = role.name === 'SUPER_ADMIN';
                    return (
                      <div
                        key={role.id}
                        className={`p-4 rounded-lg border transition-all ${
                          selectedRole === role.id
                            ? 'bg-primary/10 border-primary text-primary'
                            : 'bg-muted/50 border-border hover:bg-muted/80'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => setSelectedRole(role.id)}
                            className="flex-1 text-left"
                          >
                            <div className="font-semibold">{role.name}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {role.description || 'No description'}
                            </div>
                          </button>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{getPermissionCount(role.name)} permissions</Badge>
                            {isSuperAdmin && (
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => { e.stopPropagation(); openEditDialog(role); }}
                                  className="h-7 w-7 p-0"
                                  disabled={isSuperAdminRole}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => { e.stopPropagation(); openDeleteDialog(role); }}
                                  className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                  disabled={isSuperAdminRole}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>

            {/* Permission Management */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {selectedRole ? roles.find((r) => r.id === selectedRole)?.name : 'Select a Role'} Permissions
                      </CardTitle>
                      <CardDescription>
                        {selectedRole
                          ? `Manage permissions for ${roles.find((r) => r.id === selectedRole)?.name}`
                          : 'Select a role to view and manage its permissions'}
                      </CardDescription>
                    </div>
                    {selectedRole && (
                      <Button
                        onClick={handleSave}
                        disabled={isSaving || roles.find((r) => r.id === selectedRole)?.name === 'SUPER_ADMIN'}
                        size="sm"
                      >
                        <Save className="h-4 w-4 mr-1.5" />
                        {isSaving ? 'Saving...' : 'Save Changes'}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search permissions..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {selectedRole ? (
                    <div className="space-y-2 max-h-[600px] overflow-y-auto">
                      {filteredPermissions.map((permission) => (
                        <div
                          key={permission.id}
                          className="flex items-start gap-3 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                        >
                          <button
                            onClick={() => togglePermission(permission.id)}
                            className={`mt-0.5 p-1 rounded-full border transition-colors ${
                              localPermissions.has(permission.id)
                                ? 'bg-primary border-primary text-primary-foreground'
                                : 'bg-background border-border hover:border-primary/50'
                            }`}
                          >
                            {localPermissions.has(permission.id) ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <X className="h-4 w-4 text-muted-foreground" />
                            )}
                          </button>
                          <div className="flex-1">
                            <div className="font-medium text-sm">{permission.name}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {permission.description || 'No description'}
                            </div>
                          </div>
                        </div>
                      ))}
                      {filteredPermissions.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          No permissions found matching your search.
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <ShieldCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Select a role from the left to manage its permissions</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Create Role Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Role</DialogTitle>
              <DialogDescription>Create a custom role with specific permissions</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Role Name</label>
                <Input
                  placeholder="e.g., CONTENT_MODERATOR"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value.toUpperCase())}
                  className="uppercase"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Display Name</label>
                <Input
                  placeholder="e.g., Content Moderator"
                  value={newRoleDisplayName || ''}
                  onChange={(e) => setNewRoleDisplayName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Description</label>
                <Input
                  placeholder="Role description"
                  value={newRoleDescription || ''}
                  onChange={(e) => setNewRoleDescription(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Initial Permissions (Optional)</label>
                <div className="max-h-40 overflow-y-auto border rounded-md p-2 space-y-1">
                  {allPermissions.map((perm) => (
                    <label key={perm.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newRolePermissions.includes(perm.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewRolePermissions([...newRolePermissions, perm.id]);
                          } else {
                            setNewRolePermissions(newRolePermissions.filter((id) => id !== perm.id));
                          }
                        }}
                      />
                      <span>{perm.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateRole} disabled={isCreating}>
                {isCreating ? 'Creating...' : 'Create Role'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Role Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Role</DialogTitle>
              <DialogDescription>Update role display name and description</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Role Name</label>
                <Input value={editingRole?.name || ''} disabled className="bg-muted" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Display Name</label>
                <Input
                  placeholder="Display name"
                  value={newRoleDisplayName || ''}
                  onChange={(e) => setNewRoleDisplayName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Description</label>
                <Input
                  placeholder="Role description"
                  value={newRoleDescription || ''}
                  onChange={(e) => setNewRoleDescription(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateRole} disabled={isUpdating}>
                {isUpdating ? 'Updating...' : 'Update Role'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Role Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Role</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete the role "{deletingRole?.name}"? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-destructive">Warning</p>
                <p className="text-muted-foreground mt-1">
                  You cannot delete a role that is currently assigned to users. Ensure the role is not in use before deleting.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteRole} disabled={isDeleting}>
                {isDeleting ? 'Deleting...' : 'Delete Role'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create Permission Dialog */}
        <Dialog open={isCreatePermissionDialogOpen} onOpenChange={setIsCreatePermissionDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Permission</DialogTitle>
              <DialogDescription>Create a custom permission for fine-grained access control</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Permission Name</label>
                <Input
                  placeholder="e.g., PROPERTY_PUBLISH, USER_EXPORT, AUDIT_VIEW"
                  value={newPermissionName}
                  onChange={(e) => setNewPermissionName(e.target.value.toUpperCase())}
                  className="uppercase"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Description</label>
                <Input
                  placeholder="Describe what this permission allows"
                  value={newPermissionDescription}
                  onChange={(e) => setNewPermissionDescription(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Category (Optional)</label>
                <Input
                  placeholder="e.g., properties, users, admin"
                  value={newPermissionCategory}
                  onChange={(e) => setNewPermissionCategory(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreatePermissionDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreatePermission} disabled={isCreatingPermission}>
                {isCreatingPermission ? 'Creating...' : 'Create Permission'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageLayout>
    </AdminRoute>
  );
}
