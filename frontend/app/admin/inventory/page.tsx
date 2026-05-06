'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Package, AlertTriangle, TrendingDown, TrendingUp, Warehouse, Search,
  ArrowUpDown, History, RefreshCw, ChevronDown, ChevronUp, BoxIcon,
  ArrowDown, ArrowUp, RotateCcw, ShoppingCart, ClipboardCheck, Minus, Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import api from '@/lib/api';
import { useSiteSettings, formatPrice } from '@/lib/useSiteSettings';
import { toast } from 'sonner';

interface InventorySummary {
  overview: {
    totalProducts: number;
    outOfStock: number;
    lowStock: number;
    totalUnits: number;
    totalReserved: number;
    totalValue: number;
  };
  recentMovements: StockMovement[];
  movementStats: { _id: string; count: number; totalQuantity: number }[];
}

interface StockMovement {
  _id: string;
  product: { _id: string; name: string; thumbnail: string; sku: string };
  type: string;
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  performedBy?: { name: string };
  createdAt: string;
}

interface LowStockProduct {
  _id: string;
  name: string;
  thumbnail: string;
  sku: string;
  stock: number;
  reservedStock: number;
  lowStockThreshold: number;
  price: number;
  category?: { name: string };
  soldCount: number;
}

const movementTypeConfig: Record<string, { label: string; color: string; icon: typeof ArrowDown }> = {
  sale: { label: 'Sale', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: ArrowDown },
  restock: { label: 'Restock', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: ArrowUp },
  adjustment: { label: 'Adjustment', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: ArrowUpDown },
  return: { label: 'Return', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: RotateCcw },
  reservation: { label: 'Reserved', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', icon: ShoppingCart },
  release: { label: 'Released', color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400', icon: ClipboardCheck },
  correction: { label: 'Correction', color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400', icon: RefreshCw },
  initial: { label: 'Initial', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400', icon: BoxIcon },
};

export default function InventoryPage() {
  const { currency } = useSiteSettings();
  const [summary, setSummary] = useState<InventorySummary | null>(null);
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [movementsLoading, setMovementsLoading] = useState(false);
  const [movementFilter, setMovementFilter] = useState('');
  const [movementPage, setMovementPage] = useState(1);
  const [movementTotal, setMovementTotal] = useState(0);

  // Adjust stock dialog
  const [adjustDialog, setAdjustDialog] = useState(false);
  const [adjustProduct, setAdjustProduct] = useState<LowStockProduct | null>(null);
  const [adjustMode, setAdjustMode] = useState<'add' | 'set'>('add');
  const [adjustQuantity, setAdjustQuantity] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustSubmitting, setAdjustSubmitting] = useState(false);

  // History dialog
  const [historyDialog, setHistoryDialog] = useState(false);
  const [historyProduct, setHistoryProduct] = useState<{ _id: string; name: string } | null>(null);
  const [productHistory, setProductHistory] = useState<StockMovement[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await api.get('/admin/inventory/summary');
      setSummary(res.data.data);
    } catch {
      toast.error('Failed to load inventory summary');
    }
  }, []);

  const fetchLowStock = useCallback(async () => {
    try {
      const res = await api.get('/admin/inventory/low-stock?limit=50');
      setLowStockProducts(res.data.data);
    } catch {}
  }, []);

  const fetchMovements = useCallback(async (page = 1, type = '') => {
    setMovementsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (type) params.set('type', type);
      const res = await api.get(`/admin/inventory/movements?${params}`);
      setMovements(res.data.data);
      setMovementTotal(res.data.pagination.total);
    } catch {}
    setMovementsLoading(false);
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchSummary(), fetchLowStock(), fetchMovements()]);
      setLoading(false);
    };
    load();
  }, [fetchSummary, fetchLowStock, fetchMovements]);

  const handleAdjust = async () => {
    if (!adjustProduct || !adjustQuantity) return;
    setAdjustSubmitting(true);
    try {
      if (adjustMode === 'set') {
        await api.put(`/admin/inventory/${adjustProduct._id}/set`, {
          stock: parseInt(adjustQuantity),
          reason: adjustReason || 'Manual stock correction',
        });
      } else {
        await api.put(`/admin/inventory/${adjustProduct._id}/adjust`, {
          quantity: parseInt(adjustQuantity),
          type: parseInt(adjustQuantity) > 0 ? 'restock' : 'adjustment',
          reason: adjustReason || (parseInt(adjustQuantity) > 0 ? 'Restocked' : 'Stock adjusted'),
        });
      }
      toast.success('Stock updated successfully');
      setAdjustDialog(false);
      setAdjustQuantity('');
      setAdjustReason('');
      await Promise.all([fetchSummary(), fetchLowStock(), fetchMovements(movementPage, movementFilter)]);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update stock');
    }
    setAdjustSubmitting(false);
  };

  const openHistory = async (product: { _id: string; name: string }) => {
    setHistoryProduct(product);
    setHistoryDialog(true);
    setHistoryLoading(true);
    try {
      const res = await api.get(`/admin/inventory/${product._id}/history?limit=30`);
      setProductHistory(res.data.data);
    } catch {
      toast.error('Failed to load history');
    }
    setHistoryLoading(false);
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  const ov = summary?.overview;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Inventory Management</h1>
          <p className="text-sm text-gray-500 mt-1">Track stock levels, movements, and alerts</p>
        </div>
        <Button
          variant="outline"
          onClick={() => Promise.all([fetchSummary(), fetchLowStock(), fetchMovements(movementPage, movementFilter)])}
        >
          <RefreshCw className="w-4 h-4 mr-2" /> Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-violet-100 dark:bg-violet-900/30 rounded-xl">
                <Warehouse className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Products</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{ov?.totalProducts || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Units</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{(ov?.totalUnits || 0).toLocaleString()}</p>
                {(ov?.totalReserved || 0) > 0 && (
                  <p className="text-xs text-amber-600">{ov?.totalReserved} reserved</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-red-100 dark:bg-red-900/30 rounded-xl">
                <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Out of Stock</p>
                <p className="text-xl font-bold text-red-600">{ov?.outOfStock || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Low Stock</p>
                <p className="text-xl font-bold text-amber-600">{ov?.lowStock || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-green-100 dark:bg-green-900/30 rounded-xl">
                <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Stock Value</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {formatPrice(ov?.totalValue || 0, currency)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="alerts" className="space-y-4">
        <TabsList className="bg-white dark:bg-gray-800 border">
          <TabsTrigger value="alerts" className="gap-2">
            <AlertTriangle className="w-3.5 h-3.5" /> Alerts ({(ov?.outOfStock || 0) + (ov?.lowStock || 0)})
          </TabsTrigger>
          <TabsTrigger value="movements" className="gap-2">
            <History className="w-3.5 h-3.5" /> Stock Movements
          </TabsTrigger>
        </TabsList>

        {/* Low Stock / Out of Stock Alerts */}
        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Products Needing Attention</CardTitle>
            </CardHeader>
            <CardContent>
              {lowStockProducts.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">All products are well stocked!</p>
                  <p className="text-sm">No low stock or out of stock items.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-gray-700">
                        <th className="text-left px-3 py-2.5 text-xs font-medium text-gray-500 uppercase">Product</th>
                        <th className="text-left px-3 py-2.5 text-xs font-medium text-gray-500 uppercase">SKU</th>
                        <th className="text-center px-3 py-2.5 text-xs font-medium text-gray-500 uppercase">Stock</th>
                        <th className="text-center px-3 py-2.5 text-xs font-medium text-gray-500 uppercase">Reserved</th>
                        <th className="text-center px-3 py-2.5 text-xs font-medium text-gray-500 uppercase">Available</th>
                        <th className="text-center px-3 py-2.5 text-xs font-medium text-gray-500 uppercase">Threshold</th>
                        <th className="text-center px-3 py-2.5 text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="text-center px-3 py-2.5 text-xs font-medium text-gray-500 uppercase">Sold</th>
                        <th className="text-right px-3 py-2.5 text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                      {lowStockProducts.map((p) => {
                        const available = Math.max(0, p.stock - p.reservedStock);
                        const isOut = p.stock === 0;
                        return (
                          <tr key={p._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                            <td className="px-3 py-3">
                              <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                                  {p.thumbnail ? (
                                    <img src={p.thumbnail} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <Package className="w-4 h-4 text-gray-400" />
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <p className="font-medium text-sm text-gray-900 dark:text-white line-clamp-1">{p.name}</p>
                                  <p className="text-xs text-gray-500">{p.category?.name || 'Uncategorized'}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-3 text-xs text-gray-500 font-mono">{p.sku || '—'}</td>
                            <td className="px-3 py-3 text-center">
                              <span className={`text-sm font-bold ${isOut ? 'text-red-600' : 'text-amber-600'}`}>
                                {p.stock}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-center text-sm text-gray-500">{p.reservedStock}</td>
                            <td className="px-3 py-3 text-center text-sm font-medium">{available}</td>
                            <td className="px-3 py-3 text-center text-sm text-gray-500">{p.lowStockThreshold}</td>
                            <td className="px-3 py-3 text-center">
                              <Badge className={`text-xs border-0 ${isOut ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                                {isOut ? 'Out of Stock' : 'Low Stock'}
                              </Badge>
                            </td>
                            <td className="px-3 py-3 text-center text-sm text-gray-500">{p.soldCount}</td>
                            <td className="px-3 py-3">
                              <div className="flex items-center gap-1 justify-end">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs gap-1"
                                  onClick={() => {
                                    setAdjustProduct(p);
                                    setAdjustMode('add');
                                    setAdjustQuantity('');
                                    setAdjustReason('');
                                    setAdjustDialog(true);
                                  }}
                                >
                                  <Plus className="w-3 h-3" /> Restock
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-xs gap-1"
                                  onClick={() => openHistory(p)}
                                >
                                  <History className="w-3 h-3" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stock Movements */}
        <TabsContent value="movements">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Stock Movement History</CardTitle>
                <Select
                  value={movementFilter || 'all'}
                  onValueChange={(v) => {
                    const filter = v === 'all' ? '' : v;
                    setMovementFilter(filter);
                    setMovementPage(1);
                    fetchMovements(1, filter);
                  }}
                >
                  <SelectTrigger className="w-40 h-8 text-xs">
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    <SelectItem value="sale">Sales</SelectItem>
                    <SelectItem value="restock">Restocks</SelectItem>
                    <SelectItem value="adjustment">Adjustments</SelectItem>
                    <SelectItem value="return">Returns</SelectItem>
                    <SelectItem value="reservation">Reservations</SelectItem>
                    <SelectItem value="release">Releases</SelectItem>
                    <SelectItem value="correction">Corrections</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {movementsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
                </div>
              ) : movements.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No stock movements yet</p>
                  <p className="text-sm">Movements will appear here as stock changes occur.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    {movements.map((m) => {
                      const config = movementTypeConfig[m.type] || movementTypeConfig.adjustment;
                      const Icon = config.icon;
                      return (
                        <div
                          key={m._id}
                          className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                          <div className={`p-2 rounded-lg ${config.color}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {m.product?.name || 'Unknown Product'}
                              </p>
                              <Badge variant="outline" className="text-xs shrink-0">{config.label}</Badge>
                            </div>
                            <p className="text-xs text-gray-500 truncate">
                              {m.reason || '—'} {m.performedBy ? `by ${m.performedBy.name}` : ''}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className={`text-sm font-bold ${m.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {m.quantity > 0 ? '+' : ''}{m.quantity}
                            </p>
                            <p className="text-xs text-gray-400">
                              {m.previousStock} → {m.newStock}
                            </p>
                          </div>
                          <p className="text-xs text-gray-400 shrink-0 w-24 text-right">{formatDate(m.createdAt)}</p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Pagination */}
                  {movementTotal > 20 && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                      <p className="text-xs text-gray-500">{movementTotal} total movements</p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={movementPage === 1}
                          onClick={() => {
                            const p = movementPage - 1;
                            setMovementPage(p);
                            fetchMovements(p, movementFilter);
                          }}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={movementPage * 20 >= movementTotal}
                          onClick={() => {
                            const p = movementPage + 1;
                            setMovementPage(p);
                            fetchMovements(p, movementFilter);
                          }}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Adjust Stock Dialog */}
      <Dialog open={adjustDialog} onOpenChange={setAdjustDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {adjustMode === 'set' ? 'Set Stock Level' : 'Adjust Stock'} — {adjustProduct?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {adjustProduct && (
              <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
                  {adjustProduct.thumbnail ? (
                    <img src={adjustProduct.thumbnail} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-5 h-5 text-gray-400" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">Current Stock: <span className="text-violet-600">{adjustProduct.stock}</span></p>
                  <p className="text-xs text-gray-500">Reserved: {adjustProduct.reservedStock} | Available: {Math.max(0, adjustProduct.stock - adjustProduct.reservedStock)}</p>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant={adjustMode === 'add' ? 'default' : 'outline'}
                size="sm"
                onClick={() => { setAdjustMode('add'); setAdjustQuantity(''); }}
                className={adjustMode === 'add' ? 'bg-violet-600 hover:bg-violet-700' : ''}
              >
                <Plus className="w-3 h-3 mr-1" /> Add/Remove
              </Button>
              <Button
                variant={adjustMode === 'set' ? 'default' : 'outline'}
                size="sm"
                onClick={() => { setAdjustMode('set'); setAdjustQuantity(''); }}
                className={adjustMode === 'set' ? 'bg-violet-600 hover:bg-violet-700' : ''}
              >
                Set Exact
              </Button>
            </div>

            <div>
              <Label className="text-sm">
                {adjustMode === 'set' ? 'New Stock Level' : 'Quantity (positive to add, negative to remove)'}
              </Label>
              <Input
                type="number"
                value={adjustQuantity}
                onChange={(e) => setAdjustQuantity(e.target.value)}
                placeholder={adjustMode === 'set' ? 'e.g. 50' : 'e.g. 20 or -5'}
                className="mt-1"
              />
              {adjustMode === 'add' && adjustQuantity && adjustProduct && (
                <p className="text-xs text-gray-500 mt-1">
                  New stock will be: <span className="font-medium">{adjustProduct.stock + parseInt(adjustQuantity || '0')}</span>
                </p>
              )}
            </div>

            <div>
              <Label className="text-sm">Reason (optional)</Label>
              <Textarea
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                placeholder="e.g. Received new shipment, Inventory count correction..."
                className="mt-1"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustDialog(false)}>Cancel</Button>
            <Button
              onClick={handleAdjust}
              disabled={!adjustQuantity || adjustSubmitting}
              className="bg-violet-600 hover:bg-violet-700"
            >
              {adjustSubmitting ? 'Updating...' : 'Update Stock'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Product History Dialog */}
      <Dialog open={historyDialog} onOpenChange={setHistoryDialog}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Stock History — {historyProduct?.name}</DialogTitle>
          </DialogHeader>
          {historyLoading ? (
            <div className="space-y-3 py-4">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : productHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <History className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No stock movements recorded for this product.</p>
            </div>
          ) : (
            <div className="space-y-2 py-2">
              {productHistory.map((m) => {
                const config = movementTypeConfig[m.type] || movementTypeConfig.adjustment;
                const Icon = config.icon;
                return (
                  <div key={m._id} className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <div className={`p-1.5 rounded-md ${config.color}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{config.label}</Badge>
                        <span className={`text-sm font-bold ${m.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {m.quantity > 0 ? '+' : ''}{m.quantity}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate">{m.reason || '—'}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-gray-400">{m.previousStock} → {m.newStock}</p>
                      <p className="text-xs text-gray-400">{formatDate(m.createdAt)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
