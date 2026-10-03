import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getFeesDashboard,
  getStudentFeesList,
  getFeeStructures,
  recordFeePayment,
  upsertFeeStructure,
  assignFeeStructure,
  getPaymentReports,
} from '../../features/fees/api/fees.api';
import { getStudents } from '../../features/student/api/student.api';
import { ReceiptModal } from '../../features/fees/components/ReceiptModal';
import { showToast } from '../../utils/toast';
import {
  IndianRupee,
  TrendingUp,
  FileText,
  Layers,
  Search,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Printer,
  CreditCard,
  UserCheck,
  RefreshCw,
  Loader2,
  Sparkles,
  UserPlus,
  Percent,
  Receipt,
  BarChart3,
  FileSpreadsheet
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import type { StudentFee, FeeStructure, PaymentReportItem } from '../../features/fees/types';

export const FeesManagementPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'add' | 'collect' | 'records' | 'reports' | 'overview'>('add');

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('ALL');

  // --- Payment Reports Filter States ---
  const [reportFromDate, setReportFromDate] = useState<string>('');
  const [reportToDate, setReportToDate] = useState<string>('');
  const [reportPaymentMode, setReportPaymentMode] = useState<string>('ALL');
  const [reportSearch, setReportSearch] = useState<string>('');

  // Modals & Receipts
  const [receiptPaymentId, setReceiptPaymentId] = useState<number | null>(null);
  const [selectedFeeForCollect, setSelectedFeeForCollect] = useState<StudentFee | null>(null);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Partial<FeeStructure> | null>(null);

  // --- TAB 1: Direct Manual Student Fee Entry State ---
  const [manualStudentId, setManualStudentId] = useState<string>('');
  const [manualFeeTitle, setManualFeeTitle] = useState<string>('');
  const [manualTotalFee, setManualTotalFee] = useState<string>('');
  const [manualDiscount, setManualDiscount] = useState<string>('0');
  const [manualInitialPaid, setManualInitialPaid] = useState<string>('0');
  const [manualPaymentMode, setManualPaymentMode] = useState<string>('CASH');
  const [manualDueDate, setManualDueDate] = useState<string>('');
  const [manualMonths, setManualMonths] = useState<string>('1');
  const [manualRemarks, setManualRemarks] = useState<string>('');

  // --- TAB 2: Collect Due Payment Form State ---
  const [collectAmount, setCollectAmount] = useState<string>('');
  const [collectPaymentMode, setCollectPaymentMode] = useState<string>('CASH');
  const [collectTxnRef, setCollectTxnRef] = useState<string>('');
  const [collectRemarks, setCollectRemarks] = useState<string>('');

  // --- TAB 4: Fee Plan Master State ---
  const [planName, setPlanName] = useState('');
  const [planAmount, setPlanAmount] = useState('');
  const [planFrequency, setPlanFrequency] = useState('Monthly');
  const [planDesc, setPlanDesc] = useState('');

  // --- QUERIES ---
  const { data: dashboard, isLoading: loadingDash, refetch: refetchDash } = useQuery({
    queryKey: ['feesDashboard'],
    queryFn: getFeesDashboard,
  });

  const { data: studentFees = [], isLoading: loadingFees } = useQuery({
    queryKey: ['studentFeesList', searchQuery, statusFilter, selectedStudentId],
    queryFn: () => getStudentFeesList({
      search: searchQuery,
      status: statusFilter,
      student_id: selectedStudentId !== 'ALL' ? Number(selectedStudentId) : undefined,
    }),
  });

  const { data: feePlans = [] } = useQuery({
    queryKey: ['feeStructures'],
    queryFn: getFeeStructures,
  });

  const { data: students = [] } = useQuery({
    queryKey: ['studentsList'],
    queryFn: getStudents,
  });

  const { data: paymentReportData, isLoading: loadingReports, refetch: refetchReports } = useQuery({
    queryKey: ['paymentReports', reportFromDate, reportToDate, reportPaymentMode, selectedStudentId, reportSearch],
    queryFn: () => getPaymentReports({
      from_date: reportFromDate || undefined,
      to_date: reportToDate || undefined,
      payment_mode: reportPaymentMode,
      student_id: selectedStudentId !== 'ALL' ? Number(selectedStudentId) : undefined,
      search: reportSearch || undefined,
    }),
    enabled: activeTab === 'reports',
  });

  const handleExportCSV = () => {
    if (!paymentReportData?.payments || paymentReportData.payments.length === 0) {
      showToast.error("No payment transactions found for current filter.");
      return;
    }
    const headers = ["Receipt No", "Date", "Student Name", "Student Email", "Fee Title", "Payment Mode", "Transaction Ref", "Collected By", "Amount Paid"];
    const rows = paymentReportData.payments.map((p: PaymentReportItem) => [
      `"${p.receipt_no}"`,
      `"${new Date(p.payment_date).toLocaleString()}"`,
      `"${p.student_name}"`,
      `"${p.student_email}"`,
      `"${p.fee_title}"`,
      `"${p.payment_mode}"`,
      `"${p.transaction_ref || ''}"`,
      `"${p.collected_by_name}"`,
      `"${p.amount_paid}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r: string[]) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Payment_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast.success("Payment report exported to CSV successfully!");
  };

  // --- MUTATIONS ---
  const recordPaymentMutation = useMutation({
    mutationFn: recordFeePayment,
    onSuccess: (res) => {
      if (res.isSuccess) {
        showToast.success(res.message || 'Payment recorded successfully!');
        queryClient.invalidateQueries({ queryKey: ['feesDashboard'] });
        queryClient.invalidateQueries({ queryKey: ['studentFeesList'] });
        const newPaymentId = res.data?.payment_id;
        if (newPaymentId) setReceiptPaymentId(newPaymentId);
        // Reset Collect form
        setSelectedFeeForCollect(null);
        setCollectAmount('');
        setCollectTxnRef('');
        setCollectRemarks('');
      } else {
        showToast.error(res.message || 'Failed to record payment');
      }
    },
    onError: (err) => showToast.apiErrorShow(err),
  });

  const addManualFeeMutation = useMutation({
    mutationFn: assignFeeStructure,
    onSuccess: (res) => {
      if (res.isSuccess) {
        showToast.success(res.message || 'Student fee entry created!');
        queryClient.invalidateQueries({ queryKey: ['studentFeesList'] });
        queryClient.invalidateQueries({ queryKey: ['feesDashboard'] });
        
        // If initial payment was made and receipt generated, pop up receipt
        const newPaymentId = res.data?.payment_id;
        if (newPaymentId) {
          setReceiptPaymentId(newPaymentId);
        }

        // Reset Manual Form
        setManualStudentId('');
        setManualFeeTitle('');
        setManualTotalFee('');
        setManualDiscount('0');
        setManualInitialPaid('0');
        setManualRemarks('');
      } else {
        showToast.error(res.message || 'Failed to create fee entry');
      }
    },
    onError: (err) => showToast.apiErrorShow(err),
  });

  const upsertPlanMutation = useMutation({
    mutationFn: upsertFeeStructure,
    onSuccess: (res) => {
      if (res.isSuccess) {
        showToast.success('Fee plan saved!');
        queryClient.invalidateQueries({ queryKey: ['feeStructures'] });
        setIsPlanModalOpen(false);
        setEditingPlan(null);
        setPlanName('');
        setPlanAmount('');
        setPlanDesc('');
      } else showToast.error(res.message || 'Save failed');
    },
    onError: (err) => showToast.apiErrorShow(err),
  });

  // --- HANDLERS ---
  const handleManualFeeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualStudentId) {
      showToast.error('Please select a student.');
      return;
    }
    const total = parseFloat(manualTotalFee);
    if (isNaN(total) || total <= 0) {
      showToast.error('Total fee amount must be greater than 0 (no free courses).');
      return;
    }

    const discount = parseFloat(manualDiscount) || 0;
    const initialPaid = parseFloat(manualInitialPaid) || 0;
    const net = total - discount;

    if (discount > total) {
      showToast.error('Discount cannot exceed total fee amount.');
      return;
    }
    if (initialPaid > net) {
      showToast.error(`Initial payment (₹${initialPaid}) cannot exceed net payable fee (₹${net}).`);
      return;
    }

    addManualFeeMutation.mutate({
      student_id: Number(manualStudentId),
      fee_title: manualFeeTitle.trim() || 'Course Fee',
      total_amount: total,
      discount_amount: discount,
      initial_paid_amount: initialPaid,
      payment_mode: manualPaymentMode,
      due_date: manualDueDate || undefined,
      remarks: manualRemarks,
      number_of_months: parseInt(manualMonths) || 1,
    });
  };

  const handleRecordPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFeeForCollect) {
      showToast.error('Please select a student fee record.');
      return;
    }
    const amt = parseFloat(collectAmount);
    if (isNaN(amt) || amt <= 0) {
      showToast.error('Enter a valid payment amount.');
      return;
    }

    recordPaymentMutation.mutate({
      student_fee_id: selectedFeeForCollect.student_fee_id,
      amount_paid: amt,
      payment_mode: collectPaymentMode,
      transaction_ref: collectTxnRef,
      remarks: collectRemarks,
    });
  };

  const handleSelectForCollect = (fee: StudentFee) => {
    setSelectedStudentId(String(fee.student_id));
    setSelectedFeeForCollect(fee);
    setCollectAmount(String(fee.due_amount));
    setActiveTab('collect');
  };

  // Live Manual Fee Calculation
  const totalVal = parseFloat(manualTotalFee) || 0;
  const discVal = parseFloat(manualDiscount) || 0;
  const netVal = Math.max(0, totalVal - discVal);
  const paidVal = parseFloat(manualInitialPaid) || 0;
  const remainingDueVal = Math.max(0, netVal - paidVal);

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto animate-in fade-in duration-700">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-8 md:p-12 text-white shadow-2xl">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <IndianRupee size={180} />
        </div>
        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[10px] font-bold uppercase tracking-widest text-emerald-400">
              <Sparkles size={14} /> Teacher & Admin Portal
            </div>
            <Button
              onClick={() => setActiveTab('add')}
              className="rounded-full h-10 px-5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs gap-2 shadow-lg"
            >
              <Plus size={16} /> New Student Fee Entry
            </Button>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white flex items-center gap-3">
            Fees Management
          </h1>
          <p className="text-slate-300 text-lg max-w-2xl font-medium leading-relaxed">
            Enter student fees manually, allow teacher discounts, collect initial or due payments, and issue official receipts.
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b pb-4">
        {[
          { id: 'add', label: 'Add Fee Entry', icon: <Plus size={18} /> },
          { id: 'collect', label: 'Collect Dues', icon: <IndianRupee size={18} /> },
          { id: 'records', label: 'Student Fee Records', icon: <FileText size={18} /> },
          { id: 'reports', label: 'Payment Reports', icon: <BarChart3 size={18} /> },
          { id: 'overview', label: 'Analytics Overview', icon: <TrendingUp size={18} /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`
              flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all duration-300
              ${activeTab === tab.id
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105'
                : 'bg-card text-muted-foreground hover:bg-accent hover:text-foreground border border-border'
              }
            `}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: ADD MANUAL FEE ENTRY (PRIMARY TEACHER WORKFLOW) */}
      {activeTab === 'add' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in duration-500">
          <div className="lg:col-span-8">
            <Card className="rounded-[2.5rem] border border-border shadow-xl overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500" />
              <CardHeader className="p-8 pb-4">
                <CardTitle className="text-2xl font-black flex items-center gap-2">
                  <UserPlus className="text-primary" /> Create Student Fee Entry
                </CardTitle>
                <CardDescription>
                  Enter fee details manually. Teachers can specify total fee, allow custom discounts, and record initial payments.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8 pt-4">
                <form onSubmit={handleManualFeeSubmit} className="space-y-6">
                  {/* Select Student */}
                  <div className="space-y-2">
                    <Label className="font-bold text-sm">Select Student *</Label>
                    <select
                      value={manualStudentId}
                      onChange={(e) => setManualStudentId(e.target.value)}
                      className="w-full h-14 rounded-2xl border border-input bg-background px-4 font-bold text-base"
                      required
                    >
                      <option value="">-- Search / Select Student --</option>
                      {students.map((st) => (
                        <option key={st.id} value={st.id}>
                          {st.name} ({st.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Course / Fee Title & Pre-defined Plans */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-bold text-sm">Course / Fee Title *</Label>
                      <Input
                        value={manualFeeTitle}
                        onChange={(e) => setManualFeeTitle(e.target.value)}
                        placeholder="e.g. NEET UG Batch 2026, Physics Masterclass..."
                        className="h-12 rounded-2xl font-semibold"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="font-bold text-sm">Or Choose Fee Plan Template (Optional)</Label>
                      <select
                        onChange={(e) => {
                          const planId = Number(e.target.value);
                          const plan = feePlans.find(p => p.id === planId);
                          if (plan) {
                            setManualFeeTitle(plan.name);
                            setManualTotalFee(String(plan.amount));
                          }
                        }}
                        className="w-full h-12 rounded-2xl border border-input bg-background px-4 font-medium text-sm text-muted-foreground"
                      >
                        <option value="">-- Select Template --</option>
                        {feePlans.map(p => (
                          <option key={p.id} value={p.id}>{p.name} (₹{p.amount?.toLocaleString()})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Total Fee & Teacher Discount */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-bold text-sm flex items-center justify-between">
                        <span>Total Course Fee (₹) *</span>
                        <span className="text-xs text-muted-foreground font-normal">No free courses allowed</span>
                      </Label>
                      <Input
                        type="number"
                        min="1"
                        step="0.01"
                        value={manualTotalFee}
                        onChange={(e) => setManualTotalFee(e.target.value)}
                        placeholder="e.g. 10000"
                        className="h-14 text-xl font-bold rounded-2xl"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="font-bold text-sm flex items-center gap-1">
                        <Percent size={14} className="text-indigo-500" /> Teacher Discount Allowed (₹)
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={manualDiscount}
                        onChange={(e) => setManualDiscount(e.target.value)}
                        placeholder="0"
                        className="h-14 text-xl font-bold rounded-2xl border-indigo-200 dark:border-indigo-900"
                      />
                    </div>
                  </div>

                  {/* Initial Payment, Mode & Installment Duration */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="space-y-2 sm:col-span-1">
                      <Label className="font-bold text-sm">Initial Paid Now (₹)</Label>
                      <Input
                        type="number"
                        min="0"
                        max={netVal}
                        step="0.01"
                        value={manualInitialPaid}
                        onChange={(e) => setManualInitialPaid(e.target.value)}
                        placeholder="0"
                        className="h-12 rounded-2xl font-bold text-emerald-600"
                      />
                    </div>

                    <div className="space-y-2 sm:col-span-1">
                      <Label className="font-bold text-sm">Payment Mode</Label>
                      <select
                        value={manualPaymentMode}
                        onChange={(e) => setManualPaymentMode(e.target.value)}
                        className="w-full h-12 rounded-2xl border border-input bg-background px-4 font-bold text-sm"
                      >
                        <option value="CASH">Cash</option>
                        <option value="UPI">UPI / GPay / PhonePe</option>
                        <option value="BANK_TRANSFER">Bank Transfer / NEFT</option>
                        <option value="CARD">Debit / Credit Card</option>
                        <option value="CHEQUE">Cheque</option>
                      </select>
                    </div>

                    <div className="space-y-2 sm:col-span-1">
                      <Label className="font-bold text-sm">Start Due Date</Label>
                      <Input
                        type="date"
                        value={manualDueDate}
                        onChange={(e) => setManualDueDate(e.target.value)}
                        className="h-12 rounded-2xl font-bold"
                      />
                    </div>

                    <div className="space-y-2 sm:col-span-1">
                      <Label className="font-bold text-sm text-indigo-500">Duration (Months)</Label>
                      <select
                        value={manualMonths}
                        onChange={(e) => setManualMonths(e.target.value)}
                        className="w-full h-12 rounded-2xl border border-indigo-200 dark:border-indigo-900 bg-background px-4 font-bold text-sm text-indigo-600 dark:text-indigo-400"
                      >
                        <option value="1">1 Month (Single Entry)</option>
                        <option value="3">3 Months (Quarterly)</option>
                        <option value="6">6 Months (Semi-Annual)</option>
                        <option value="12">12 Months (1 Year)</option>
                        <option value="24">24 Months (2 Years)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-bold text-sm">Remarks / Reason for Discount (Optional)</Label>
                    <Input
                      value={manualRemarks}
                      onChange={(e) => setManualRemarks(e.target.value)}
                      placeholder="e.g. Merit discount allowed by teacher..."
                      className="h-12 rounded-2xl"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={addManualFeeMutation.isPending}
                    className="w-full h-14 rounded-2xl font-black text-lg shadow-xl shadow-primary/20"
                  >
                    {addManualFeeMutation.isPending ? 'Saving Entry...' : 'Save Student Fee Entry'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Live Computation Card */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="rounded-[2.5rem] border border-border shadow-xl p-6 bg-gradient-to-br from-card to-accent/20">
              <CardHeader className="p-0 pb-4 border-b">
                <CardTitle className="text-xl font-black flex items-center gap-2">
                  <Receipt className="text-primary" /> Live Computation
                </CardTitle>
                <CardDescription>Summary of calculated fee breakdown.</CardDescription>
              </CardHeader>
              <CardContent className="p-0 pt-4 space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground font-semibold">Total Fee:</span>
                  <span className="font-black text-base">₹{totalVal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-indigo-500 font-semibold">Teacher Discount:</span>
                  <span className="font-black text-indigo-500">-₹{discVal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-base pt-2 border-t font-black">
                  <span>Net Payable Fee:</span>
                  <span className="text-primary text-lg">₹{netVal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-emerald-600 font-semibold">Paid Now:</span>
                  <span className="font-black text-emerald-600">₹{paidVal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-base pt-2 border-t font-black">
                  <span>Remaining Dues:</span>
                  <span className={remainingDueVal > 0 ? "text-rose-500 text-xl" : "text-emerald-600 text-xl"}>
                    ₹{remainingDueVal.toLocaleString()}
                  </span>
                </div>
                {paidVal > 0 && (
                  <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-600 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 size={16} /> Official receipt will automatically pop up upon saving.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Fee Plan Template Manage Button */}
            <Card className="rounded-[2.5rem] border border-border p-6 text-center space-y-3">
              <Layers className="mx-auto text-primary opacity-60" size={32} />
              <h4 className="font-bold text-slate-800 dark:text-zinc-100">Fee Plan Templates</h4>
              <p className="text-xs text-muted-foreground">Pre-define reusable course fee plans (e.g. Monthly Tuition ₹2,000).</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPlanModalOpen(true)}
                className="rounded-xl font-bold w-full gap-2 border-primary/20 text-primary"
              >
                <Plus size={16} /> Manage Fee Templates
              </Button>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: COLLECT DUES */}
      {activeTab === 'collect' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in duration-500">
          {/* Left Column: Select Student Dues */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="rounded-[2.5rem] border border-border shadow-xl overflow-hidden">
              <CardHeader className="p-6 pb-4 border-b space-y-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-black flex items-center gap-2">
                    <UserCheck className="text-primary" /> Step 1: Select Student Dues
                  </CardTitle>
                </div>
                <CardDescription>Select a student to view their specific dues or pick from the list.</CardDescription>
                
                {/* Student Filter Selector */}
                <div className="space-y-1 pt-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Select Student Filter</Label>
                    {selectedStudentId !== 'ALL' && (
                      <button
                        onClick={() => {
                          setSelectedStudentId('ALL');
                          setSelectedFeeForCollect(null);
                        }}
                        className="text-xs text-primary font-bold hover:underline"
                      >
                        Show All Students
                      </button>
                    )}
                  </div>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedStudentId(val);
                      setSelectedFeeForCollect(null);
                      setCollectAmount('');
                    }}
                    className="w-full h-11 rounded-xl border border-input bg-background px-3 font-bold text-sm"
                  >
                    <option value="ALL">-- All Students (View All Pending Dues) --</option>
                    {students.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name} ({st.email})
                      </option>
                    ))}
                  </select>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
                {studentFees.filter(f => f.due_amount > 0).map((fee) => (
                  <div
                    key={fee.student_fee_id}
                    onClick={() => {
                      setSelectedFeeForCollect(fee);
                      setCollectAmount(String(fee.due_amount));
                    }}
                    className={`
                      p-4 rounded-2xl border cursor-pointer transition-all duration-200
                      ${selectedFeeForCollect?.student_fee_id === fee.student_fee_id
                        ? 'border-primary bg-primary/5 shadow-md ring-2 ring-primary/20'
                        : 'border-border hover:bg-accent/50'
                      }
                    `}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-zinc-50">{fee.student_name}</p>
                        <p className="text-xs text-muted-foreground">{fee.fee_structure_name}</p>
                      </div>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${fee.status === 'OVERDUE' ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-500'}`}>
                        {fee.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs pt-2 border-t border-border/50">
                      <span className="text-muted-foreground">Due Date: {new Date(fee.due_date).toLocaleDateString()}</span>
                      <span className="font-black text-rose-500 text-sm">Due: ₹{fee.due_amount?.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
                {studentFees.filter(f => f.due_amount > 0).length === 0 && (
                  <div className="p-8 text-center text-muted-foreground text-sm">
                    {selectedStudentId !== 'ALL'
                      ? `No pending fee dues found for selected student.`
                      : 'No pending fee dues found.'
                    }
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Collect Form */}
          <div className="lg:col-span-7">
            <Card className="rounded-[2.5rem] border border-border shadow-xl overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-emerald-500 to-indigo-600" />
              <CardHeader className="p-8 pb-4">
                <CardTitle className="text-2xl font-black flex items-center gap-2">
                  <IndianRupee className="text-emerald-500" /> Step 2: Record Payment Details
                </CardTitle>
                <CardDescription>
                  {selectedFeeForCollect
                    ? `Collecting dues for ${selectedFeeForCollect.student_name} (${selectedFeeForCollect.fee_structure_name})`
                    : 'Select a student record from the left panel to begin.'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8 pt-4">
                {selectedFeeForCollect ? (
                  <form onSubmit={handleRecordPaymentSubmit} className="space-y-6">
                    {/* Live Balance Summary */}
                    <div className="grid grid-cols-3 gap-4 bg-muted/40 p-4 rounded-2xl border">
                      <div>
                        <p className="text-[10px] font-black uppercase text-muted-foreground">Net Fee</p>
                        <p className="text-lg font-black text-slate-800 dark:text-zinc-100">₹{selectedFeeForCollect.net_amount?.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase text-muted-foreground">Paid So Far</p>
                        <p className="text-lg font-black text-emerald-600">₹{selectedFeeForCollect.paid_amount?.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase text-muted-foreground">Current Due</p>
                        <p className="text-lg font-black text-rose-500">₹{selectedFeeForCollect.due_amount?.toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="font-bold text-sm">Paying Amount (₹)</Label>
                      <Input
                        type="number"
                        min="1"
                        max={selectedFeeForCollect.due_amount}
                        value={collectAmount}
                        onChange={(e) => setCollectAmount(e.target.value)}
                        placeholder="Enter amount being paid..."
                        className="h-14 text-xl font-bold rounded-2xl"
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Remaining due after this payment: <strong className="text-primary">₹{Math.max(0, selectedFeeForCollect.due_amount - (parseFloat(collectAmount) || 0)).toLocaleString()}</strong>
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="font-bold text-sm">Payment Mode</Label>
                        <select
                          value={collectPaymentMode}
                          onChange={(e) => setCollectPaymentMode(e.target.value)}
                          className="w-full h-12 rounded-2xl border border-input bg-background px-4 font-bold text-sm"
                        >
                          <option value="CASH">Cash</option>
                          <option value="UPI">UPI / GPay / PhonePe</option>
                          <option value="BANK_TRANSFER">Bank Transfer / NEFT</option>
                          <option value="CARD">Debit / Credit Card</option>
                          <option value="CHEQUE">Cheque</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label className="font-bold text-sm">Reference / Txn ID (Optional)</Label>
                        <Input
                          value={collectTxnRef}
                          onChange={(e) => setCollectTxnRef(e.target.value)}
                          placeholder="e.g. UPI-987654321..."
                          className="h-12 rounded-2xl"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="font-bold text-sm">Notes / Remarks (Optional)</Label>
                      <Input
                        value={collectRemarks}
                        onChange={(e) => setCollectRemarks(e.target.value)}
                        placeholder="e.g. Installment payment..."
                        className="h-12 rounded-2xl"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={recordPaymentMutation.isPending}
                      className="w-full h-14 rounded-2xl font-black text-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl shadow-emerald-600/20"
                    >
                      {recordPaymentMutation.isPending ? 'Processing...' : 'Process Payment & Issue Receipt'}
                    </Button>
                  </form>
                ) : (
                  <div className="py-12 text-center text-muted-foreground flex flex-col items-center">
                    <IndianRupee size={48} className="opacity-20 mb-3" />
                    <p className="font-bold">No Student Fee Selected</p>
                    <p className="text-xs text-muted-foreground mt-1">Select a student record from the left list to record a fee payment.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 3: STUDENT FEE RECORDS */}
      {activeTab === 'records' && (
        <Card className="rounded-[2.5rem] border border-border shadow-xl overflow-hidden animate-in fade-in duration-500">
          <CardHeader className="p-8 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b">
            <div>
              <CardTitle className="text-2xl font-black flex items-center gap-2">
                <FileText className="text-primary" /> Student Fee Statements
              </CardTitle>
              <CardDescription>View, filter, and track all student fee balances and status.</CardDescription>
            </div>
            {/* Filter Bar */}
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              {/* Student Filter Dropdown */}
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="h-10 rounded-xl border border-input bg-background px-3 font-bold text-xs max-w-[220px] truncate"
              >
                <option value="ALL">All Students</option>
                {students.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name} ({st.email})
                  </option>
                ))}
              </select>

              <div className="relative flex-1 sm:w-56">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search student name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-10 rounded-xl"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 rounded-xl border border-input bg-background px-3 font-bold text-xs"
              >
                <option value="ALL">All Status</option>
                <option value="PAID">PAID</option>
                <option value="PARTIAL">PARTIAL</option>
                <option value="PENDING">PENDING</option>
                <option value="OVERDUE">OVERDUE</option>
              </select>
            </div>
          </CardHeader>
          {selectedStudentId !== 'ALL' && (
            <div className="bg-primary/5 px-8 py-2 border-b flex items-center justify-between text-xs">
              <span className="font-bold text-primary">
                Filtered Student: {students.find(s => String(s.id) === selectedStudentId)?.name || 'Selected Student'}
              </span>
              <button onClick={() => setSelectedStudentId('ALL')} className="font-bold text-muted-foreground hover:text-foreground">
                Clear Student Filter
              </button>
            </div>
          )}
          <CardContent className="p-0">
            {loadingFees ? (
              <div className="p-12 text-center text-muted-foreground flex flex-col items-center">
                <Loader2 size={32} className="animate-spin text-primary mb-2" /> Loading fee statements...
              </div>
            ) : studentFees.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-muted/50 text-xs font-bold uppercase tracking-wider text-muted-foreground border-b">
                    <tr>
                      <th className="p-4 pl-6">Student</th>
                      <th className="p-4">Course / Fee Title</th>
                      <th className="p-4">Total Fee</th>
                      <th className="p-4">Discount</th>
                      <th className="p-4">Net Payable</th>
                      <th className="p-4">Paid</th>
                      <th className="p-4">Due</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 pr-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y font-medium">
                    {studentFees.map((fee) => (
                      <tr key={fee.student_fee_id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-4 pl-6">
                          <p className="font-bold text-slate-900 dark:text-zinc-50">{fee.student_name}</p>
                          <p className="text-xs text-muted-foreground">{fee.student_email}</p>
                        </td>
                        <td className="p-4 font-semibold">{fee.fee_structure_name}</td>
                        <td className="p-4">₹{fee.total_amount?.toLocaleString()}</td>
                        <td className="p-4 text-indigo-500 font-bold">₹{fee.discount_amount?.toLocaleString()}</td>
                        <td className="p-4 font-bold">₹{fee.net_amount?.toLocaleString()}</td>
                        <td className="p-4 text-emerald-600 font-bold">₹{fee.paid_amount?.toLocaleString()}</td>
                        <td className="p-4 text-rose-500 font-bold">₹{fee.due_amount?.toLocaleString()}</td>
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            fee.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-600' :
                            fee.status === 'PARTIAL' ? 'bg-indigo-500/10 text-indigo-600' :
                            fee.status === 'OVERDUE' ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-500'
                          }`}>
                            {fee.status}
                          </span>
                        </td>
                        <td className="p-4 pr-6 text-right">
                          {fee.due_amount > 0 && (
                            <Button
                              size="sm"
                              onClick={() => handleSelectForCollect(fee)}
                              className="rounded-xl font-bold h-8 text-xs bg-emerald-600 hover:bg-emerald-500 text-white"
                            >
                              Collect Dues
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center text-muted-foreground">No student fee records match your search query.</div>
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB 4: PAYMENT REPORTS */}
      {activeTab === 'reports' && (
        <div className="space-y-8 animate-in fade-in duration-500">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="rounded-[2rem] border-0 shadow-xl bg-gradient-to-br from-emerald-600 to-teal-800 text-white overflow-hidden">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                    <IndianRupee size={24} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-2 py-1 rounded-full">Total</span>
                </div>
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-100 mb-1">Total Period Collected</p>
                <p className="text-3xl font-black">
                  {loadingReports ? <Loader2 className="animate-spin" size={24} /> : `₹${paymentReportData?.total_amount?.toLocaleString() ?? 0}`}
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-[2rem] border-0 shadow-xl bg-gradient-to-br from-indigo-600 to-purple-800 text-white overflow-hidden">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                    <FileText size={24} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-2 py-1 rounded-full">Transactions</span>
                </div>
                <p className="text-xs font-bold uppercase tracking-wider text-indigo-100 mb-1">Total Payments Count</p>
                <p className="text-3xl font-black">
                  {loadingReports ? <Loader2 className="animate-spin" size={24} /> : `${paymentReportData?.total_count ?? 0}`}
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-[2rem] border-0 shadow-xl bg-gradient-to-br from-amber-500 to-orange-700 text-white overflow-hidden">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                    <CreditCard size={24} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-2 py-1 rounded-full">Cash</span>
                </div>
                <p className="text-xs font-bold uppercase tracking-wider text-amber-100 mb-1">Cash Collections</p>
                <p className="text-3xl font-black">
                  {loadingReports ? <Loader2 className="animate-spin" size={24} /> : `₹${paymentReportData?.cash_amount?.toLocaleString() ?? 0}`}
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-[2rem] border-0 shadow-xl bg-gradient-to-br from-blue-600 to-cyan-800 text-white overflow-hidden">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                    <Sparkles size={24} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-2 py-1 rounded-full">Digital</span>
                </div>
                <p className="text-xs font-bold uppercase tracking-wider text-blue-100 mb-1">Digital / Online Collections</p>
                <p className="text-3xl font-black">
                  {loadingReports ? <Loader2 className="animate-spin" size={24} /> : `₹${paymentReportData?.digital_amount?.toLocaleString() ?? 0}`}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filter Bar & Export Actions */}
          <Card className="rounded-[2.5rem] border border-border shadow-xl p-6">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-zinc-50 flex items-center gap-2">
                    <BarChart3 className="text-primary" /> Payment Reports Filter
                  </h3>
                  <p className="text-xs text-muted-foreground">Filter payment history by dates, mode, student, or receipt number.</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => window.print()} className="rounded-xl font-bold gap-1.5">
                    <Printer size={16} /> Print Report
                  </Button>
                  <Button size="sm" onClick={handleExportCSV} className="rounded-xl font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white">
                    <FileSpreadsheet size={16} /> Export CSV
                  </Button>
                </div>
              </div>

              {/* Date Presets & Custom Pickers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-muted-foreground uppercase">From Date</Label>
                  <Input
                    type="date"
                    value={reportFromDate}
                    onChange={(e) => setReportFromDate(e.target.value)}
                    className="h-10 rounded-xl font-medium text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-muted-foreground uppercase">To Date</Label>
                  <Input
                    type="date"
                    value={reportToDate}
                    onChange={(e) => setReportToDate(e.target.value)}
                    className="h-10 rounded-xl font-medium text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-muted-foreground uppercase">Payment Mode</Label>
                  <select
                    value={reportPaymentMode}
                    onChange={(e) => setReportPaymentMode(e.target.value)}
                    className="w-full h-10 rounded-xl border border-input bg-background px-3 font-bold text-xs"
                  >
                    <option value="ALL">All Modes</option>
                    <option value="CASH">Cash</option>
                    <option value="UPI">UPI / GPay / PhonePe</option>
                    <option value="BANK_TRANSFER">Bank Transfer / NEFT</option>
                    <option value="CARD">Debit / Credit Card</option>
                    <option value="CHEQUE">Cheque</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-muted-foreground uppercase">Student Filter</Label>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="w-full h-10 rounded-xl border border-input bg-background px-3 font-bold text-xs truncate"
                  >
                    <option value="ALL">All Students</option>
                    {students.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name} ({st.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-muted-foreground uppercase">Search</Label>
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Receipt / Name / Ref..."
                      value={reportSearch}
                      onChange={(e) => setReportSearch(e.target.value)}
                      className="pl-8 h-10 rounded-xl text-xs font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Quick Date Presets Bar */}
              <div className="flex flex-wrap items-center gap-2 pt-2 text-xs">
                <span className="font-bold text-muted-foreground">Quick Presets:</span>
                <button
                  onClick={() => {
                    const today = new Date().toISOString().slice(0, 10);
                    setReportFromDate(today);
                    setReportToDate(today);
                  }}
                  className="px-3 py-1 rounded-lg bg-muted hover:bg-accent font-bold"
                >
                  Today
                </button>
                <button
                  onClick={() => {
                    const curr = new Date();
                    const first = new Date(curr.setDate(curr.getDate() - curr.getDay())).toISOString().slice(0, 10);
                    const last = new Date().toISOString().slice(0, 10);
                    setReportFromDate(first);
                    setReportToDate(last);
                  }}
                  className="px-3 py-1 rounded-lg bg-muted hover:bg-accent font-bold"
                >
                  This Week
                </button>
                <button
                  onClick={() => {
                    const date = new Date();
                    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().slice(0, 10);
                    const lastDay = new Date().toISOString().slice(0, 10);
                    setReportFromDate(firstDay);
                    setReportToDate(lastDay);
                  }}
                  className="px-3 py-1 rounded-lg bg-muted hover:bg-accent font-bold"
                >
                  This Month
                </button>
                <button
                  onClick={() => {
                    setReportFromDate('');
                    setReportToDate('');
                    setReportPaymentMode('ALL');
                    setSelectedStudentId('ALL');
                    setReportSearch('');
                  }}
                  className="px-3 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 font-bold"
                >
                  Reset All Filters
                </button>
              </div>
            </div>
          </Card>

          {/* Payment Transactions Report Datatable */}
          <Card className="rounded-[2.5rem] border border-border shadow-xl overflow-hidden">
            <CardHeader className="p-6 pb-4 border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-black">Filtered Payment Transactions</CardTitle>
                <CardDescription>
                  Showing {paymentReportData?.payments?.length ?? 0} transaction record(s).
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => refetchReports()} className="rounded-xl font-bold gap-1 text-xs">
                <RefreshCw size={14} /> Refresh
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {loadingReports ? (
                <div className="p-12 text-center text-muted-foreground flex flex-col items-center">
                  <Loader2 size={32} className="animate-spin text-primary mb-2" /> Loading payment reports...
                </div>
              ) : paymentReportData?.payments && paymentReportData.payments.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-muted/50 text-xs font-bold uppercase tracking-wider text-muted-foreground border-b">
                      <tr>
                        <th className="p-4 pl-6">Receipt #</th>
                        <th className="p-4">Date & Time</th>
                        <th className="p-4">Student</th>
                        <th className="p-4">Course / Fee Title</th>
                        <th className="p-4">Mode</th>
                        <th className="p-4">Txn Ref</th>
                        <th className="p-4">Collected By</th>
                        <th className="p-4">Amount</th>
                        <th className="p-4 pr-6 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y font-medium">
                      {paymentReportData.payments.map((pmt: PaymentReportItem) => (
                        <tr key={pmt.payment_id} className="hover:bg-muted/30 transition-colors">
                          <td className="p-4 pl-6 font-mono font-bold text-primary">{pmt.receipt_no}</td>
                          <td className="p-4 text-xs text-muted-foreground">{new Date(pmt.payment_date).toLocaleString()}</td>
                          <td className="p-4">
                            <p className="font-bold text-slate-900 dark:text-zinc-50">{pmt.student_name}</p>
                            <p className="text-xs text-muted-foreground">{pmt.student_email}</p>
                          </td>
                          <td className="p-4 font-semibold">{pmt.fee_title}</td>
                          <td className="p-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              pmt.payment_mode === 'CASH' ? 'bg-emerald-500/10 text-emerald-600' :
                              pmt.payment_mode === 'UPI' ? 'bg-purple-500/10 text-purple-600' :
                              pmt.payment_mode === 'CARD' ? 'bg-blue-500/10 text-blue-600' : 'bg-indigo-500/10 text-indigo-600'
                            }`}>
                              {pmt.payment_mode}
                            </span>
                          </td>
                          <td className="p-4 font-mono text-xs text-muted-foreground">{pmt.transaction_ref || '-'}</td>
                          <td className="p-4 text-xs font-semibold">{pmt.collected_by_name}</td>
                          <td className="p-4 font-black text-emerald-600 text-base">₹{pmt.amount_paid?.toLocaleString()}</td>
                          <td className="p-4 pr-6 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setReceiptPaymentId(pmt.payment_id)}
                              className="rounded-xl font-bold h-8 text-xs text-primary hover:bg-primary/10"
                            >
                              <Printer size={15} /> Receipt
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-12 text-center text-muted-foreground">
                  No payment transactions found matching the selected filter criteria.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 4: ANALYTICS OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-8 animate-in fade-in duration-500">
          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="rounded-[2rem] border-0 shadow-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white overflow-hidden">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                    <CheckCircle2 size={24} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-2 py-1 rounded-full">Collected</span>
                </div>
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-100 mb-1">Total Fees Collected</p>
                <p className="text-3xl font-black">
                  {loadingDash ? <Loader2 className="animate-spin" size={24} /> : `₹${dashboard?.total_collected?.toLocaleString() ?? 0}`}
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-[2rem] border-0 shadow-xl bg-gradient-to-br from-rose-500 to-red-700 text-white overflow-hidden">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                    <AlertTriangle size={24} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-2 py-1 rounded-full">Outstanding</span>
                </div>
                <p className="text-xs font-bold uppercase tracking-wider text-rose-100 mb-1">Total Dues Pending</p>
                <p className="text-3xl font-black">
                  {loadingDash ? <Loader2 className="animate-spin" size={24} /> : `₹${dashboard?.total_due?.toLocaleString() ?? 0}`}
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-[2rem] border-0 shadow-xl bg-gradient-to-br from-indigo-600 to-violet-800 text-white overflow-hidden">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                    <TrendingUp size={24} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-2 py-1 rounded-full">Rate</span>
                </div>
                <p className="text-xs font-bold uppercase tracking-wider text-indigo-100 mb-1">Collection Efficiency</p>
                <p className="text-3xl font-black">
                  {loadingDash ? <Loader2 className="animate-spin" size={24} /> : `${dashboard?.collection_rate ?? 0}%`}
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-[2rem] border-0 shadow-xl bg-gradient-to-br from-amber-500 to-orange-700 text-white overflow-hidden">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                    <Clock size={24} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-2 py-1 rounded-full">Overdue</span>
                </div>
                <p className="text-xs font-bold uppercase tracking-wider text-amber-100 mb-1">Overdue Accounts</p>
                <p className="text-3xl font-black">
                  {loadingDash ? <Loader2 className="animate-spin" size={24} /> : dashboard?.overdue_count ?? 0}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Payments Feed */}
          <Card className="rounded-[2.5rem] border border-border shadow-xl overflow-hidden">
            <CardHeader className="p-8 pb-4 flex flex-row items-center justify-between border-b">
              <div>
                <CardTitle className="text-2xl font-black flex items-center gap-2">
                  <CreditCard className="text-primary" /> Recent Fee Payments
                </CardTitle>
                <CardDescription>Real-time payment transactions recorded by staff.</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => refetchDash()} className="rounded-xl font-bold gap-2">
                <RefreshCw size={14} /> Refresh
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {loadingDash ? (
                <div className="p-12 text-center text-muted-foreground flex flex-col items-center">
                  <Loader2 size={32} className="animate-spin text-primary mb-2" />
                  Fetching recent transactions...
                </div>
              ) : dashboard?.recent_payments && dashboard.recent_payments.length > 0 ? (
                <div className="divide-y">
                  {dashboard.recent_payments.map((pmt) => (
                    <div key={pmt.payment_id} className="p-6 flex flex-wrap items-center justify-between gap-4 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-black">
                          <CheckCircle2 size={24} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-zinc-50 text-base">{pmt.student_name}</p>
                          <p className="text-xs text-muted-foreground">{pmt.fee_structure_name} • {pmt.student_email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-lg font-black text-emerald-600">+₹{pmt.amount_paid?.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground capitalize">{pmt.payment_mode} • {new Date(pmt.payment_date).toLocaleDateString()}</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setReceiptPaymentId(pmt.payment_id)} className="rounded-xl font-bold gap-1 text-primary hover:bg-primary/10">
                          <Printer size={16} /> Receipt
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center text-muted-foreground">No recent fee payments recorded yet.</div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal: Create/Edit Fee Plan Template */}
      <Dialog open={isPlanModalOpen} onOpenChange={setIsPlanModalOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-[2rem] border-0 shadow-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">
              {editingPlan ? 'Edit Fee Plan Template' : 'Create Fee Plan Template'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            const amt = parseFloat(planAmount);
            if (!planName.trim() || isNaN(amt) || amt <= 0) {
              showToast.error('Please enter a valid plan name and fee amount.');
              return;
            }
            upsertPlanMutation.mutate({
              id: editingPlan?.id,
              name: planName,
              amount: amt,
              frequency: planFrequency,
              description: planDesc,
            });
          }} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label className="font-bold text-sm">Plan Name</Label>
              <Input
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                placeholder="e.g. Monthly Tuition Fee"
                className="h-12 rounded-xl font-bold"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="font-bold text-sm">Default Amount (₹)</Label>
              <Input
                type="number"
                min="1"
                value={planAmount}
                onChange={(e) => setPlanAmount(e.target.value)}
                placeholder="e.g. 2500"
                className="h-12 rounded-xl font-bold"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="font-bold text-sm">Billing Frequency</Label>
              <select
                value={planFrequency}
                onChange={(e) => setPlanFrequency(e.target.value)}
                className="w-full h-12 rounded-xl border border-input bg-background px-4 font-bold text-sm"
              >
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly</option>
                <option value="One-Time">One-Time</option>
                <option value="Yearly">Yearly</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label className="font-bold text-sm">Description (Optional)</Label>
              <Input
                value={planDesc}
                onChange={(e) => setPlanDesc(e.target.value)}
                placeholder="e.g. Standard monthly tuition fee template"
                className="h-12 rounded-xl"
              />
            </div>

            <DialogFooter className="gap-2 pt-4">
              <Button type="button" variant="ghost" className="rounded-xl font-bold" onClick={() => setIsPlanModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={upsertPlanMutation.isPending} className="rounded-xl font-black px-6">
                {upsertPlanMutation.isPending ? 'Saving...' : 'Save Plan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Printable Receipt Modal */}
      <ReceiptModal
        paymentId={receiptPaymentId}
        onClose={() => setReceiptPaymentId(null)}
      />
    </div>
  );
};

export default FeesManagementPage;
