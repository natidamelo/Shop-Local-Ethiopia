'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { CalendarClock, CheckCircle2, Clock, DollarSign, Store, XCircle, Image as ImageIcon } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { rewriteAssetUrl } from '@/lib/rewriteAssetUrl';

type VendorStatus = 'pending' | 'approved' | 'rejected';

interface VendorApplication {
  _id: string;
  vendorType: 'enterprise' | 'individual';
  tableType: 'full' | 'half';
  displayName: string;
  salesPersonName?: string;
  productType: string;
  productShortDescription: string;
  hasPreviousBazarExperience: boolean;
  previousBazarDetails?: string;
  email: string;
  phone: string;
  photoLinks: string[];
  videoLink?: string;
  socialLinks?: string;
  agreeToRules: boolean;
  needElectricity: boolean;
  status: VendorStatus;
  paymentStatus: 'pending' | 'paid' | 'not_required';
  adminNotes?: string;
  createdAt: string;
  approvedAt?: string;
  rejectedAt?: string;
}

const formatLocalDateForInput = (dateString: string | null | undefined): string => {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '';
  const pad = (num: number) => String(num).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function AdminVendorApplicationsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<VendorApplication[]>([]);
  const [stats, setStats] = useState<{ pending: number; approved: number; rejected: number; total: number } | null>(
    null
  );
  const [statusFilter, setStatusFilter] = useState<'all' | VendorStatus>('pending');
  const [selected, setSelected] = useState<VendorApplication | null>(null);
  const [updating, setUpdating] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid' | 'not_required'>('pending');

  // Registration window settings
  const [regIsOpen, setRegIsOpen] = useState(false);
  const [regScheduledOpenAt, setRegScheduledOpenAt] = useState('');
  const [regScheduledCloseAt, setRegScheduledCloseAt] = useState('');
  const [regClosedMessage, setRegClosedMessage] = useState('Vendor registration is currently closed. Please check back later.');
  const [regSaving, setRegSaving] = useState(false);
  const [regLoading, setRegLoading] = useState(true);

  // Bazar poster (public page)
  const [bazarPosterUrl, setBazarPosterUrl] = useState('');
  const [posterSaving, setPosterSaving] = useState(false);

  // Table pricing settings
  const [fullTablePrice, setFullTablePrice] = useState('');
  const [halfTablePrice, setHalfTablePrice] = useState('');
  const [priceCurrency, setPriceCurrency] = useState('ETB');
  const [priceNote, setPriceNote] = useState('');
  const [priceSaving, setPriceSaving] = useState(false);

  const fetchRegistrationSettings = async () => {
    setRegLoading(true);
    try {
      const res = await api.get('/admin/settings');
      const br = res.data.data?.bazarRegistration || {};
      setRegIsOpen(br.isOpen ?? false);
      setRegScheduledOpenAt(formatLocalDateForInput(br.scheduledOpenAt));
      setRegScheduledCloseAt(formatLocalDateForInput(br.scheduledCloseAt));
      setRegClosedMessage(br.closedMessage || 'Vendor registration is currently closed. Please check back later.');
      const tp = res.data.data?.bazarTablePricing || {};
      setFullTablePrice(tp.fullTablePrice !== undefined ? String(tp.fullTablePrice) : '');
      setHalfTablePrice(tp.halfTablePrice !== undefined ? String(tp.halfTablePrice) : '');
      setPriceCurrency(tp.currency || 'ETB');
      setPriceNote(tp.priceNote || '');
      setBazarPosterUrl(res.data.data?.bazarPosterUrl || '');
    } catch {
      // silently ignore
    } finally {
      setRegLoading(false);
    }
  };

  const handlePosterUpload = async (files: FileList | null) => {
    if (!files || !files[0]) return;
    const file = files[0];
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (PNG, JPG, WebP, etc.)');
      return;
    }

    setPosterSaving(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const up = await api.post('/upload/image', fd);
      const url: string | undefined = up?.data?.data?.url;
      if (!url) {
        toast.error('Upload failed, no URL returned');
        return;
      }

      setBazarPosterUrl(url);
      await api.put('/admin/settings', {
        bazarPosterUrl: url,
      });
      toast.success('Bazar poster uploaded and saved');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to upload poster');
    } finally {
      setPosterSaving(false);
    }
  };

  const saveRegistrationSettings = async () => {
    setRegSaving(true);
    try {
      await api.put('/admin/settings', {
        bazarRegistration: {
          isOpen: regIsOpen,
          scheduledOpenAt: regScheduledOpenAt ? new Date(regScheduledOpenAt).toISOString() : null,
          scheduledCloseAt: regScheduledCloseAt ? new Date(regScheduledCloseAt).toISOString() : null,
          closedMessage: regClosedMessage,
        },
      });
      toast.success('Registration window settings saved');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save settings');
    } finally {
      setRegSaving(false);
    }
  };

  const saveTablePricing = async () => {
    setPriceSaving(true);
    try {
      await api.put('/admin/settings', {
        bazarTablePricing: {
          fullTablePrice: parseFloat(fullTablePrice) || 0,
          halfTablePrice: parseFloat(halfTablePrice) || 0,
          currency: priceCurrency.trim() || 'ETB',
          priceNote,
        },
      });
      toast.success('Table pricing saved');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save pricing');
    } finally {
      setPriceSaving(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [appsRes, statsRes] = await Promise.all([
        api.get('/vendor-applications/admin', {
          params: statusFilter === 'all' ? {} : { status: statusFilter },
        }),
        api.get('/vendor-applications/admin/stats'),
      ]);
      setApplications(appsRes.data.data);
      setStats(statsRes.data.data);
      if (selected) {
        const updated = appsRes.data.data.find((a: VendorApplication) => a._id === selected._id);
        if (updated) {
          setSelected(updated);
          setAdminNotes(updated.adminNotes || '');
          setPaymentStatus(updated.paymentStatus || 'pending');
        }
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to load vendor applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchRegistrationSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const handleStatusUpdate = async (status: VendorStatus) => {
    if (!selected) return;
    setUpdating(true);
    try {
      await api.put(`/vendor-applications/admin/${selected._id}`, {
        status,
        paymentStatus,
        adminNotes,
      });
      toast.success(`Application marked as ${status}`);
      await fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update application');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status: VendorStatus) => {
    if (status === 'approved') return <Badge className="bg-emerald-100 text-emerald-700">Approved</Badge>;
    if (status === 'rejected') return <Badge className="bg-red-100 text-red-700">Rejected</Badge>;
    return <Badge className="bg-amber-100 text-amber-800">Pending</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Store className="w-6 h-6 text-amber-600" />
            Bazar Vendor Applications
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Review, approve, or reject vendor registrations for your bazar and track status for reporting.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 flex flex-col gap-1">
          <span className="text-xs text-gray-500">Total applications</span>
          <span className="text-xl font-bold text-gray-900 dark:text-white">{stats?.total ?? 0}</span>
        </Card>
        <Card className="p-4 flex flex-col gap-1">
          <span className="text-xs text-gray-500">Pending review</span>
          <span className="text-xl font-bold text-amber-700">{stats?.pending ?? 0}</span>
        </Card>
        <Card className="p-4 flex flex-col gap-1">
          <span className="text-xs text-gray-500">Approved</span>
          <span className="text-xl font-bold text-emerald-700">{stats?.approved ?? 0}</span>
        </Card>
        <Card className="p-4 flex flex-col gap-1">
          <span className="text-xs text-gray-500">Rejected</span>
          <span className="text-xl font-bold text-red-600">{stats?.rejected ?? 0}</span>
        </Card>
      </div>

      {/* Table Pricing */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-amber-600" />
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Bazar Table Pricing</h2>
        </div>
        <p className="text-xs text-gray-500 -mt-2">
          Set the participation fee for each table type. Vendors will see these prices on the registration form and in their dashboard after approval.
        </p>

        {regLoading ? (
          <p className="text-xs text-gray-400">Loading settings…</p>
        ) : (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-3 gap-4">
              {/* Full table price */}
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500">Full table price</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium pointer-events-none">
                    {priceCurrency || 'ETB'}
                  </span>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={fullTablePrice}
                    onChange={(e) => setFullTablePrice(e.target.value)}
                    className="h-9 text-sm pl-12"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Half table price */}
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500">Half table price</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium pointer-events-none">
                    {priceCurrency || 'ETB'}
                  </span>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={halfTablePrice}
                    onChange={(e) => setHalfTablePrice(e.target.value)}
                    className="h-9 text-sm pl-12"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Currency */}
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500">Currency</Label>
                <Input
                  value={priceCurrency}
                  onChange={(e) => setPriceCurrency(e.target.value.toUpperCase())}
                  className="h-9 text-sm"
                  placeholder="ETB"
                  maxLength={6}
                />
              </div>
            </div>

            {/* Price note */}
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">Additional pricing note (optional)</Label>
              <Input
                value={priceNote}
                onChange={(e) => setPriceNote(e.target.value)}
                className="h-9 text-sm"
                placeholder="e.g. Price includes electricity. Payment due within 48 hours of approval."
              />
              <p className="text-[10px] text-gray-400">This note appears alongside the price on the vendor registration form and dashboard.</p>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex gap-4 text-xs text-gray-500">
                {parseFloat(fullTablePrice) > 0 && (
                  <span>Full table: <span className="font-semibold text-gray-800 dark:text-gray-100">{priceCurrency} {parseFloat(fullTablePrice).toLocaleString()}</span></span>
                )}
                {parseFloat(halfTablePrice) > 0 && (
                  <span>Half table: <span className="font-semibold text-gray-800 dark:text-gray-100">{priceCurrency} {parseFloat(halfTablePrice).toLocaleString()}</span></span>
                )}
              </div>
              <Button
                size="sm"
                className="h-8 text-xs bg-amber-600 hover:bg-amber-700 text-white"
                disabled={priceSaving}
                onClick={saveTablePricing}
              >
                {priceSaving ? 'Saving…' : 'Save pricing'}
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Bazar poster (public vendor form) */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-amber-600" />
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Bazar poster (vendor form)</h2>
        </div>
        <p className="text-xs text-gray-500 -mt-2">
          Optional poster image shown on the left side of the public &quot;Join our bazar as a vendor&quot; page. If you don&apos;t upload anything, no poster is shown.
        </p>

        {regLoading ? (
          <p className="text-xs text-gray-400">Loading settings…</p>
        ) : (
          <div className="grid md:grid-cols-[2fr,3fr] gap-4 items-start">
            <div className="space-y-2">
              <Label className="text-xs text-gray-500">Upload poster image</Label>
              <div className="flex items-center gap-2">
                <input
                  id="bazar-poster-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handlePosterUpload(e.target.files)}
                />
                <Button
                  type="button"
                  size="sm"
                  className="h-8 text-xs bg-amber-600 hover:bg-amber-700 text-white"
                  disabled={posterSaving}
                  onClick={() => document.getElementById('bazar-poster-upload')?.click()}
                >
                  {posterSaving ? 'Uploading…' : 'Upload poster'}
                </Button>
                {bazarPosterUrl && (
                  <span className="text-[10px] text-gray-400 truncate max-w-[180px]" title={bazarPosterUrl}>
                    Saved URL: {bazarPosterUrl}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-gray-400">
                Use a horizontal image for best results. The uploaded file is stored and its URL is used on the vendor application page.
              </p>
            </div>
            <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-2 flex items-center justify-center">
              {bazarPosterUrl ? (
                <img
                  src={rewriteAssetUrl(bazarPosterUrl)}
                  alt="Bazar poster preview"
                  className="max-h-40 w-full object-contain rounded-lg"
                />
              ) : (
                <p className="text-[11px] text-gray-400 text-center px-4">
                  Poster preview will appear here after you paste a valid image URL.
                </p>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Registration Window Control */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-600" />
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Vendor Registration Window</h2>
        </div>
        <p className="text-xs text-gray-500 -mt-2">
          Control when vendors can submit applications. Use the toggle for instant on/off, or set a scheduled date-time window for automatic open and close.
        </p>

        {regLoading ? (
          <p className="text-xs text-gray-400">Loading settings…</p>
        ) : (
          <div className="space-y-4">
            {/* Manual toggle */}
            {(() => {
              const hasSchedule = !!(regScheduledOpenAt || regScheduledCloseAt);
              const now = new Date();
              const openAt = regScheduledOpenAt ? new Date(regScheduledOpenAt) : null;
              const closeAt = regScheduledCloseAt ? new Date(regScheduledCloseAt) : null;
              const inWindow = hasSchedule
                ? (!openAt || now >= openAt) && (!closeAt || now <= closeAt)
                : false;
              const isCurrentlyOpen = hasSchedule ? inWindow : regIsOpen;

              return (
                <div className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-3 bg-gray-50 dark:bg-gray-800/50">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Registration is currently{' '}
                      <span className={isCurrentlyOpen ? 'text-emerald-600 font-semibold' : 'text-red-500 font-semibold'}>
                        {isCurrentlyOpen ? 'OPEN' : 'CLOSED'}
                      </span>
                      {hasSchedule && (
                        <span className="text-xs text-gray-400 font-normal ml-2">
                          (determined by schedule)
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {isCurrentlyOpen
                        ? 'Vendors can submit applications right now.'
                        : 'The registration form is hidden from vendors.'}
                    </p>
                  </div>
                  <Switch
                    checked={regIsOpen}
                    onCheckedChange={setRegIsOpen}
                    className="data-[state=checked]:bg-emerald-600"
                  />
                </div>
              );
            })()}

            {/* Scheduled window */}
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500 flex items-center gap-1">
                  <CalendarClock className="w-3.5 h-3.5" />
                  Scheduled open date &amp; time
                </Label>
                <Input
                  type="datetime-local"
                  value={regScheduledOpenAt}
                  onChange={(e) => setRegScheduledOpenAt(e.target.value)}
                  className="h-8 text-xs"
                />
                <p className="text-[10px] text-gray-400">Leave blank to ignore schedule for opening.</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500 flex items-center gap-1">
                  <CalendarClock className="w-3.5 h-3.5" />
                  Scheduled close date &amp; time
                </Label>
                <Input
                  type="datetime-local"
                  value={regScheduledCloseAt}
                  onChange={(e) => setRegScheduledCloseAt(e.target.value)}
                  className="h-8 text-xs"
                />
                <p className="text-[10px] text-gray-400">Leave blank to ignore schedule for closing.</p>
              </div>
            </div>

            {/* Closed message */}
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">Message shown to vendors when registration is closed</Label>
              <Input
                value={regClosedMessage}
                onChange={(e) => setRegClosedMessage(e.target.value)}
                className="h-8 text-xs"
                placeholder="Vendor registration is currently closed…"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <p className="text-[10px] text-gray-400">
                If a schedule is set, the open/close status is automatically determined by the current time.
              </p>
              <Button
                size="sm"
                className="h-8 text-xs bg-amber-600 hover:bg-amber-700 text-white"
                disabled={regSaving}
                onClick={saveRegistrationSettings}
              >
                {regSaving ? 'Saving…' : 'Save settings'}
              </Button>
            </div>
          </div>
        )}
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Table */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Label className="text-xs text-gray-500">Filter by status</Label>
              <Select
                value={statusFilter}
                onValueChange={(v: 'all' | VendorStatus) => {
                  setStatusFilter(v);
                }}
              >
                <SelectTrigger className="h-8 w-32 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="border rounded-xl bg-white dark:bg-gray-900 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">Vendor</TableHead>
                  <TableHead>Product type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!loading && applications.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-xs text-gray-500 py-6">
                      No applications found for this filter.
                    </TableCell>
                  </TableRow>
                )}
                {applications.map((app) => (
                  <TableRow
                    key={app._id}
                    className={`cursor-pointer ${
                      selected?._id === app._id ? 'bg-amber-50/70 dark:bg-amber-900/10' : ''
                    }`}
                    onClick={() => {
                      setSelected(app);
                      setAdminNotes(app.adminNotes || '');
                      setPaymentStatus(app.paymentStatus || 'pending');
                    }}
                  >
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {app.displayName}
                        </span>
                        <span className="text-[11px] text-gray-500">
                          {app.vendorType === 'enterprise' ? 'Enterprise' : 'Individual'} • {app.email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-gray-700 dark:text-gray-300">
                      {app.productType}
                    </TableCell>
                    <TableCell>{getStatusBadge(app.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelected(app);
                          setAdminNotes(app.adminNotes || '');
                          setPaymentStatus(app.paymentStatus || 'pending');
                        }}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Detail / approval panel */}
        <div className="space-y-3">
          <Card className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Application details</h2>
                <p className="text-xs text-gray-500">
                  Select a vendor on the left to review and approve or reject.
                </p>
              </div>
            </div>

            {selected ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {selected.displayName}
                      </span>
                      <Badge variant="outline" className="text-[10px]">
                        {selected.vendorType === 'enterprise' ? 'Enterprise' : 'Individual'}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500">
                      {selected.email} • {selected.phone}
                    </p>
                    {selected.salesPersonName && (
                      <p className="text-[11px] text-gray-500">
                        Sales person: <span className="font-medium text-gray-800 dark:text-gray-100">{selected.salesPersonName}</span>
                      </p>
                    )}
                  </div>
                  <div className="text-right text-xs text-gray-500">
                    <div className="flex items-center gap-1 justify-end">
                      <CalendarClock className="w-3.5 h-3.5" />
                      <span>Submitted</span>
                    </div>
                    <p suppressHydrationWarning>
                      {new Date(selected.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-gray-500">Product / service</Label>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {selected.productType}
                  </p>
                  <p
                    className="text-xs text-gray-600 dark:text-gray-300 border rounded-md p-2 bg-gray-50 dark:bg-gray-800/80 max-h-32 overflow-y-auto"
                    dangerouslySetInnerHTML={{ __html: selected.productShortDescription }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 text-[11px]">
                  <div className="space-y-1">
                    <span className="text-gray-500">Previous bazar</span>
                    <p className="font-medium text-gray-800 dark:text-gray-100">
                      {selected.hasPreviousBazarExperience ? 'Yes' : 'No'}
                    </p>
                    {selected.previousBazarDetails && (
                      <p className="text-gray-500">{selected.previousBazarDetails}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <span className="text-gray-500">Booth needs</span>
                    <p className="font-medium text-gray-800 dark:text-gray-100">
                      Table: {selected.tableType === 'half' ? 'Half table' : 'Full table'}
                    </p>
                    <p className="font-medium text-gray-800 dark:text-gray-100">
                      Electricity: {selected.needElectricity ? 'Yes' : 'No'}
                    </p>
                    <p className="text-gray-500">Agreed to rules: {selected.agreeToRules ? 'Yes' : 'No'}</p>
                  </div>
                </div>

                {selected.photoLinks?.length > 0 && (
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Photo links</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {selected.photoLinks.map((link, i) => (
                        <a
                          key={i}
                          href={rewriteAssetUrl(link)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-amber-700 hover:underline"
                        >
                          Photo {i + 1}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {(selected.videoLink || selected.socialLinks) && (
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Media / social</Label>
                    {selected.videoLink && (
                      <a
                        href={rewriteAssetUrl(selected.videoLink)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-[11px] text-amber-700 hover:underline"
                      >
                        Promo video
                      </a>
                    )}
                    {selected.socialLinks && (
                      <p className="text-[11px] text-gray-700 dark:text-gray-200 break-words">
                        {selected.socialLinks}
                      </p>
                    )}
                  </div>
                )}

                <div className="space-y-2 pt-1 border-t border-gray-100 dark:border-gray-800">
                  <Label className="text-xs text-gray-500">Admin notes (visible only to admins)</Label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={3}
                    className="w-full text-xs rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1.5"
                    placeholder="Add any notes about this vendor, e.g. booth size, payment arrangement, special conditions."
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-gray-500">Payment status for this vendor</Label>
                  <Select
                    value={paymentStatus}
                    onValueChange={(v: 'pending' | 'paid' | 'not_required') => setPaymentStatus(v)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending (awaiting payment)</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="not_required">Not required</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="text-[11px] text-gray-500">
                    Current status:{' '}
                    <span className="font-semibold text-gray-800 dark:text-gray-100 capitalize">
                      {selected.status}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs border-red-200 text-red-600 hover:bg-red-50"
                      disabled={updating}
                      onClick={() => handleStatusUpdate('rejected')}
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1" />
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                      disabled={updating}
                      onClick={() => handleStatusUpdate('approved')}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                      Approve &amp; update
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-10 text-center text-xs text-gray-500">
                Select an application from the table to see full details and approve or reject.
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

