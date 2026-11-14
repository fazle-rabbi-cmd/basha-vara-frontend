'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { DollarSign, Calendar, TrendingUp, AlertCircle, Plus, Edit, Trash2 } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/components/shared/toast';
import { useAuth } from '@/features/auth/auth-context';

interface RentLedgerDashboardProps {
  onSuccess?: () => void;
}

export function RentLedgerDashboard({ onSuccess }: RentLedgerDashboardProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [summary, setSummary] = useState<any>(null);
  const [rentPayments, setRentPayments] = useState<any[]>([]);
  const [utilityCharges, setUtilityCharges] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'rent' | 'utilities'>('rent');

  // Dialog states
  const [rentPaymentDialogOpen, setRentPaymentDialogOpen] = useState(false);
  const [utilityChargeDialogOpen, setUtilityChargeDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [selectedCharge, setSelectedCharge] = useState<any>(null);

  // Form states
  const [rentPaymentForm, setRentPaymentForm] = useState({
    propertyId: '',
    tenantId: '',
    amount: '',
    paymentDate: '',
    dueDate: '',
    paymentMethod: '',
    notes: '',
  });

  const [utilityChargeForm, setUtilityChargeForm] = useState({
    propertyId: '',
    tenantId: '',
    chargeType: 'ELECTRICITY',
    amount: '',
    billingMonth: '',
    dueDate: '',
    paymentMethod: '',
    notes: '',
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [summaryData, payments, charges] = await Promise.all([
        apiClient.rentLedger.getSummary(),
        apiClient.rentLedger.getRentPayments(),
        apiClient.rentLedger.getUtilityCharges(),
      ]);
      setSummary(summaryData);
      setRentPayments(payments);
      setUtilityCharges(charges);
    } catch (error) {
      showToast('error', 'Failed to load ledger data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user?.id]);

  const handleCreateRentPayment = async () => {
    try {
      await apiClient.rentLedger.createRentPayment({
        propertyId: rentPaymentForm.propertyId,
        tenantId: rentPaymentForm.tenantId,
        amount: Number(rentPaymentForm.amount),
        paymentDate: new Date(rentPaymentForm.paymentDate),
        dueDate: new Date(rentPaymentForm.dueDate),
        paymentMethod: rentPaymentForm.paymentMethod || undefined,
        notes: rentPaymentForm.notes || undefined,
      });
      showToast('success', 'Rent payment created successfully');
      setRentPaymentDialogOpen(false);
      setRentPaymentForm({ propertyId: '', tenantId: '', amount: '', paymentDate: '', dueDate: '', paymentMethod: '', notes: '' });
      loadData();
      onSuccess?.();
    } catch (error: any) {
      showToast('error', error.message || 'Failed to create rent payment');
    }
  };

  const handleCreateUtilityCharge = async () => {
    try {
      await apiClient.rentLedger.createUtilityCharge({
        propertyId: utilityChargeForm.propertyId,
        tenantId: utilityChargeForm.tenantId,
        chargeType: utilityChargeForm.chargeType,
        amount: Number(utilityChargeForm.amount),
        billingMonth: utilityChargeForm.billingMonth,
        dueDate: new Date(utilityChargeForm.dueDate),
        paymentMethod: utilityChargeForm.paymentMethod || undefined,
        notes: utilityChargeForm.notes || undefined,
      });
      showToast('success', 'Utility charge created successfully');
      setUtilityChargeDialogOpen(false);
      setUtilityChargeForm({ propertyId: '', tenantId: '', chargeType: 'ELECTRICITY', amount: '', billingMonth: '', dueDate: '', paymentMethod: '', notes: '' });
      loadData();
      onSuccess?.();
    } catch (error: any) {
      showToast('error', error.message || 'Failed to create utility charge');
    }
  };

  const handleUpdateStatus = async (type: 'rent' | 'utility', id: string, status: string) => {
    try {
      if (type === 'rent') {
        await apiClient.rentLedger.updateRentPayment(id, { status });
      } else {
        await apiClient.rentLedger.updateUtilityCharge(id, { status });
      }
      showToast('success', 'Status updated successfully');
      loadData();
      onSuccess?.();
    } catch (error: any) {
      showToast('error', error.message || 'Failed to update status');
    }
  };

  const handleDelete = async (type: 'rent' | 'utility', id: string) => {
    try {
      if (type === 'rent') {
        await apiClient.rentLedger.deleteRentPayment(id);
      } else {
        await apiClient.rentLedger.deleteUtilityCharge(id);
      }
      showToast('success', 'Deleted successfully');
      loadData();
      onSuccess?.();
    } catch (error: any) {
      showToast('error', error.message || 'Failed to delete');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <Badge variant="default">Paid</Badge>;
      case 'PENDING':
        return <Badge variant="secondary">Pending</Badge>;
      case 'OVERDUE':
        return <Badge variant="destructive">Overdue</Badge>;
      case 'CANCELLED':
        return <Badge variant="outline">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Collected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <DollarSign className="h-4 w-4 mr-2 text-green-600" />
              <span className="text-2xl font-bold">{summary?.totalCollected?.toFixed(2) || '0.00'}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">৳</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 mr-2 text-yellow-600" />
              <span className="text-2xl font-bold">{summary?.totalPending?.toFixed(2) || '0.00'}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">৳</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Rent Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-blue-600" />
              <span className="text-2xl font-bold">{summary?.rentPayments?.total || 0}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total records</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Utility Charges</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <TrendingUp className="h-4 w-4 mr-2 text-purple-600" />
              <span className="text-2xl font-bold">{summary?.utilityCharges?.total || 0}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total records</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <Button
          variant={activeTab === 'rent' ? 'default' : 'outline'}
          onClick={() => setActiveTab('rent')}
        >
          Rent Payments
        </Button>
        <Button
          variant={activeTab === 'utilities' ? 'default' : 'outline'}
          onClick={() => setActiveTab('utilities')}
        >
          Utility Charges
        </Button>
      </div>

      {/* Rent Payments Tab */}
      {activeTab === 'rent' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Rent Payments</h3>
            <Button onClick={() => setRentPaymentDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Payment
            </Button>
          </div>

          <div className="space-y-2">
            {rentPayments.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">No rent payments recorded yet</p>
                </CardContent>
              </Card>
            ) : (
              rentPayments.map((payment) => (
                <Card key={payment.id}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{payment.property?.title || 'Property'}</span>
                          {getStatusBadge(payment.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Tenant: {payment.tenant?.fullName || 'Unknown'} | Amount: {payment.amount} ৳
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Due: {new Date(payment.dueDate).toLocaleDateString()} | Payment: {new Date(payment.paymentDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {payment.status === 'PENDING' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateStatus('rent', payment.id, 'PAID')}
                          >
                            Mark Paid
                          </Button>
                        )}
                        {payment.status === 'PENDING' && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete('rent', payment.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* Utility Charges Tab */}
      {activeTab === 'utilities' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Utility Charges</h3>
            <Button onClick={() => setUtilityChargeDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Charge
            </Button>
          </div>

          <div className="space-y-2">
            {utilityCharges.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">No utility charges recorded yet</p>
                </CardContent>
              </Card>
            ) : (
              utilityCharges.map((charge) => (
                <Card key={charge.id}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{charge.property?.title || 'Property'}</span>
                          <Badge variant="outline">{charge.chargeType}</Badge>
                          {getStatusBadge(charge.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Tenant: {charge.tenant?.fullName || 'Unknown'} | Amount: {charge.amount} ৳
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Month: {charge.billingMonth} | Due: {new Date(charge.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {charge.status === 'PENDING' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateStatus('utility', charge.id, 'PAID')}
                          >
                            Mark Paid
                          </Button>
                        )}
                        {charge.status === 'PENDING' && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete('utility', charge.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* Rent Payment Dialog */}
      <Dialog open={rentPaymentDialogOpen} onOpenChange={setRentPaymentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Rent Payment</DialogTitle>
            <DialogDescription>Record a new rent payment</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="propertyId">Property ID</Label>
              <Input
                id="propertyId"
                value={rentPaymentForm.propertyId}
                onChange={(e) => setRentPaymentForm({ ...rentPaymentForm, propertyId: e.target.value })}
                placeholder="Enter property ID"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tenantId">Tenant ID</Label>
              <Input
                id="tenantId"
                value={rentPaymentForm.tenantId}
                onChange={(e) => setRentPaymentForm({ ...rentPaymentForm, tenantId: e.target.value })}
                placeholder="Enter tenant ID"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (৳)</Label>
              <Input
                id="amount"
                type="number"
                value={rentPaymentForm.amount}
                onChange={(e) => setRentPaymentForm({ ...rentPaymentForm, amount: e.target.value })}
                placeholder="Enter amount"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="paymentDate">Payment Date</Label>
                <Input
                  id="paymentDate"
                  type="date"
                  value={rentPaymentForm.paymentDate}
                  onChange={(e) => setRentPaymentForm({ ...rentPaymentForm, paymentDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={rentPaymentForm.dueDate}
                  onChange={(e) => setRentPaymentForm({ ...rentPaymentForm, dueDate: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Input
                id="paymentMethod"
                value={rentPaymentForm.paymentMethod}
                onChange={(e) => setRentPaymentForm({ ...rentPaymentForm, paymentMethod: e.target.value })}
                placeholder="e.g., Cash, Bank Transfer"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                value={rentPaymentForm.notes}
                onChange={(e) => setRentPaymentForm({ ...rentPaymentForm, notes: e.target.value })}
                placeholder="Optional notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRentPaymentDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateRentPayment}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Utility Charge Dialog */}
      <Dialog open={utilityChargeDialogOpen} onOpenChange={setUtilityChargeDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Utility Charge</DialogTitle>
            <DialogDescription>Record a new utility charge</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="propertyId">Property ID</Label>
              <Input
                id="propertyId"
                value={utilityChargeForm.propertyId}
                onChange={(e) => setUtilityChargeForm({ ...utilityChargeForm, propertyId: e.target.value })}
                placeholder="Enter property ID"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tenantId">Tenant ID</Label>
              <Input
                id="tenantId"
                value={utilityChargeForm.tenantId}
                onChange={(e) => setUtilityChargeForm({ ...utilityChargeForm, tenantId: e.target.value })}
                placeholder="Enter tenant ID"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="chargeType">Charge Type</Label>
              <Select
                value={utilityChargeForm.chargeType}
                onChange={(e) => setUtilityChargeForm({ ...utilityChargeForm, chargeType: e.target.value })}
              >
                <option value="ELECTRICITY">Electricity</option>
                <option value="GAS">Gas</option>
                <option value="WATER">Water</option>
                <option value="INTERNET">Internet</option>
                <option value="OTHER">Other</option>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (৳)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={utilityChargeForm.amount}
                  onChange={(e) => setUtilityChargeForm({ ...utilityChargeForm, amount: e.target.value })}
                  placeholder="Enter amount"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="billingMonth">Billing Month</Label>
                <Input
                  id="billingMonth"
                  type="month"
                  value={utilityChargeForm.billingMonth}
                  onChange={(e) => setUtilityChargeForm({ ...utilityChargeForm, billingMonth: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={utilityChargeForm.dueDate}
                onChange={(e) => setUtilityChargeForm({ ...utilityChargeForm, dueDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Input
                id="paymentMethod"
                value={utilityChargeForm.paymentMethod}
                onChange={(e) => setUtilityChargeForm({ ...utilityChargeForm, paymentMethod: e.target.value })}
                placeholder="e.g., Cash, Bank Transfer"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                value={utilityChargeForm.notes}
                onChange={(e) => setUtilityChargeForm({ ...utilityChargeForm, notes: e.target.value })}
                placeholder="Optional notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUtilityChargeDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateUtilityCharge}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
