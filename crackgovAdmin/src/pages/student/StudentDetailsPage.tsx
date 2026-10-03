import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  getStudentCompleteDetails,
  toggleStudentCategory,
  resetUserDevice,
} from '../../features/student/api/student.api';
import { ReceiptModal } from '../../features/fees/components/ReceiptModal';
import StudentDetailsForm from '../../features/student/components/StudentDetailsForm';
import { showToast } from '../../utils/toast';
import {
  ArrowLeft,
  User,
  Mail,
  Calendar,
  IndianRupee,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Smartphone,
  BookOpen,
  Plus,
  RefreshCw,
  Layers,
  Loader2,
  Trophy,
  LayoutGrid,
  Phone
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import type { StudentFee, PaymentReportItem } from '../../features/fees/types';

export const StudentDetailsPage: React.FC = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const id = Number(userId);

  const [activeTab, setActiveTab] = useState<'fees' | 'payments' | 'categories' | 'tests' | 'profile'>('fees');
  const [receiptPaymentId, setReceiptPaymentId] = useState<number | null>(null);

  // Fetch Complete Student Details via SpStudentDetails Mode 1
  const { data: fullData, isLoading, isError, refetch } = useQuery({
    queryKey: ['studentCompleteDetails', id],
    queryFn: () => getStudentCompleteDetails(id),
    enabled: !!id,
  });

  // Mutations
  const toggleCategoryMutation = useMutation({
    mutationFn: toggleStudentCategory,
    onSuccess: (res) => {
      if (res.isSuccess) {
        showToast.success(res.message || 'Category access updated!');
        refetch();
      } else {
        showToast.error(res.message || 'Failed to update category access.');
      }
    },
  });

  const resetDeviceMutation = useMutation({
    mutationFn: resetUserDevice,
    onSuccess: (res) => {
      if (res.isSuccess) {
        showToast.success(res.message || 'Student device limit reset successfully!');
        refetch();
      } else {
        showToast.error(res.message || 'Failed to reset device limit.');
      }
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 size={40} className="animate-spin text-primary mb-3" />
        <p className="font-bold text-muted-foreground">Loading complete student profile & records...</p>
      </div>
    );
  }

  if (isError || !fullData || !fullData.student_profile) {
    return (
      <div className="p-8 text-center max-w-lg mx-auto space-y-4">
        <AlertTriangle size={48} className="text-rose-500 mx-auto opacity-80" />
        <h2 className="text-2xl font-black">Student Record Not Found</h2>
        <p className="text-muted-foreground text-sm">Could not retrieve details from database for Student ID #{id}.</p>
        <Button onClick={() => navigate('/student')} variant="outline" className="rounded-xl font-bold">
          <ArrowLeft className="mr-2" size={16} /> Back to Student Management
        </Button>
      </div>
    );
  }

  const profile = fullData.student_profile;
  const assignedCategories = fullData.assigned_categories || [];
  const assignedDisplayViews = fullData.assigned_display_views || [];
  const practiceTests = fullData.practice_tests || [];
  const feeSummary = fullData.fee_summary || { total_assigned_net: 0, total_paid: 0, total_due: 0, account_status: 'PENDING' };
  const feeSchedule = fullData.fee_schedule || [];
  const paymentHistory = fullData.payment_history || [];

  const isOverdue = feeSummary.account_status === 'OVERDUE';
  const isPaid = feeSummary.account_status === 'PAID';

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto animate-in fade-in duration-700">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/student')}
          className="rounded-full font-bold text-xs gap-2 hover:bg-accent"
        >
          <ArrowLeft size={16} /> Back to Student Management
        </Button>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => resetDeviceMutation.mutate(id)}
            disabled={resetDeviceMutation.isPending}
            className="rounded-xl font-bold text-xs gap-1.5"
          >
            <Smartphone size={14} /> Reset Device Limit
          </Button>
          <Button
            size="sm"
            onClick={() => navigate('/fees')}
            className="rounded-xl font-bold text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20"
          >
            <IndianRupee size={14} /> Manage / Collect Fees
          </Button>
        </div>
      </div>

      {/* Student Header Card */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-8 md:p-12 text-white shadow-2xl">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <User size={160} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="h-20 w-20 md:h-24 md:w-24 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-3xl md:text-4xl font-black text-white shadow-xl ring-4 ring-white/10">
              {profile.name ? profile.name.charAt(0).toUpperCase() : 'S'}
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/10 border border-white/20 text-indigo-300">
                  Student ID #{profile.id}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  isPaid ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                  isOverdue ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  {feeSummary.account_status}
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white">
                {profile.name}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-xs text-indigo-200/80 font-medium pt-1">
                <span className="flex items-center gap-1.5">
                  <Mail size={14} className="text-indigo-400" /> {profile.email}
                </span>
                {profile.phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone size={14} className="text-indigo-400" /> {profile.phone}
                  </span>
                )}
                {profile.father_name && (
                  <span className="flex items-center gap-1.5">
                    <User size={14} className="text-indigo-400" /> Father: {profile.father_name}
                  </span>
                )}
                {profile.created_at && (
                  <span className="flex items-center gap-1.5">
                    <Calendar size={14} className="text-indigo-400" /> Joined {new Date(profile.created_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="rounded-[2rem] border-0 shadow-xl bg-gradient-to-br from-indigo-600 to-purple-800 text-white overflow-hidden">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                <Layers size={22} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-2 py-1 rounded-full">Net Fee</span>
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-indigo-100 mb-1">Total Assigned Net Fee</p>
            <p className="text-3xl font-black">₹{feeSummary.total_assigned_net?.toLocaleString() ?? 0}</p>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-0 shadow-xl bg-gradient-to-br from-emerald-600 to-teal-800 text-white overflow-hidden">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                <CheckCircle2 size={22} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-2 py-1 rounded-full">Collected</span>
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-100 mb-1">Total Fees Paid</p>
            <p className="text-3xl font-black">₹{feeSummary.total_paid?.toLocaleString() ?? 0}</p>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-0 shadow-xl bg-gradient-to-br from-rose-600 to-red-800 text-white overflow-hidden">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                <AlertTriangle size={22} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-2 py-1 rounded-full">Outstanding</span>
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-rose-100 mb-1">Pending Fee Dues</p>
            <p className="text-3xl font-black">₹{feeSummary.total_due?.toLocaleString() ?? 0}</p>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-0 shadow-xl bg-gradient-to-br from-slate-900 to-slate-800 text-white overflow-hidden">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                <Trophy size={22} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-2 py-1 rounded-full">MCQ Practice</span>
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">Practice Tests Taken</p>
            <p className="text-3xl font-black">{practiceTests.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b pb-4">
        {[
          { id: 'fees', label: 'Fee Schedule & Dues', icon: <IndianRupee size={18} /> },
          { id: 'payments', label: 'Payment Receipts', icon: <FileText size={18} /> },
          { id: 'categories', label: `Assigned Courses (${assignedCategories.length})`, icon: <BookOpen size={18} /> },
          { id: 'tests', label: `Practice MCQ Tests (${practiceTests.length})`, icon: <Trophy size={18} /> },
          { id: 'profile', label: 'Edit Profile Details', icon: <User size={18} /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`
              flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm transition-all duration-200
              ${activeTab === tab.id
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105'
                : 'bg-card hover:bg-accent text-muted-foreground hover:text-foreground'
              }
            `}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: FEE SCHEDULE & DUES */}
      {activeTab === 'fees' && (
        <Card className="rounded-[2.5rem] border border-border shadow-xl overflow-hidden animate-in fade-in duration-500">
          <CardHeader className="p-8 pb-4 border-b flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-black flex items-center gap-2">
                <IndianRupee className="text-primary" /> Assigned Fee Statements & Dues
              </CardTitle>
              <CardDescription>View all assigned course fee installments for {profile.name}.</CardDescription>
            </div>
            <Button
              size="sm"
              onClick={() => navigate('/fees')}
              className="rounded-xl font-bold text-xs gap-1 bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              <Plus size={14} /> Add New Fee Entry
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {feeSchedule.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-muted/50 text-xs font-bold uppercase tracking-wider text-muted-foreground border-b">
                    <tr>
                      <th className="p-4 pl-6">Course / Fee Title</th>
                      <th className="p-4">Due Date</th>
                      <th className="p-4">Total Fee</th>
                      <th className="p-4">Teacher Discount</th>
                      <th className="p-4">Net Payable</th>
                      <th className="p-4">Paid</th>
                      <th className="p-4">Due</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 pr-6 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y font-medium">
                    {feeSchedule.map((fee: StudentFee) => {
                      const itemOverdue = fee.status === 'OVERDUE' || (fee.due_amount > 0 && new Date(fee.due_date) < new Date());

                      return (
                        <tr key={fee.student_fee_id} className="hover:bg-muted/30 transition-colors">
                          <td className="p-4 pl-6 font-bold text-slate-900 dark:text-zinc-50">{fee.fee_structure_name}</td>
                          <td className="p-4 text-xs text-muted-foreground">
                            <span className={itemOverdue ? "text-rose-500 font-bold" : ""}>
                              {new Date(fee.due_date).toLocaleDateString()}
                            </span>
                          </td>
                          <td className="p-4">₹{fee.total_amount?.toLocaleString()}</td>
                          <td className="p-4 text-indigo-500 font-bold">-₹{fee.discount_amount?.toLocaleString()}</td>
                          <td className="p-4 font-bold">₹{fee.net_amount?.toLocaleString()}</td>
                          <td className="p-4 text-emerald-600 font-bold">₹{fee.paid_amount?.toLocaleString()}</td>
                          <td className="p-4 text-rose-500 font-black text-base">₹{fee.due_amount?.toLocaleString()}</td>
                          <td className="p-4">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              fee.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-600' :
                              fee.status === 'PARTIAL' ? 'bg-indigo-500/10 text-indigo-600' :
                              itemOverdue ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-500'
                            }`}>
                              {itemOverdue ? 'OVERDUE' : fee.status}
                            </span>
                          </td>
                          <td className="p-4 pr-6 text-right">
                            {fee.due_amount > 0 && (
                              <Button
                                size="sm"
                                onClick={() => navigate('/fees')}
                                className="rounded-xl font-bold h-8 text-xs bg-emerald-600 hover:bg-emerald-500 text-white"
                              >
                                Collect Dues
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center text-muted-foreground space-y-3">
                <IndianRupee size={40} className="mx-auto opacity-20" />
                <p className="font-bold">No fee structures assigned yet.</p>
                <Button size="sm" onClick={() => navigate('/fees')} className="rounded-xl font-bold bg-primary">
                  Assign Fee Entry Now
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB 2: PAYMENT RECEIPTS HISTORY */}
      {activeTab === 'payments' && (
        <Card className="rounded-[2.5rem] border border-border shadow-xl overflow-hidden animate-in fade-in duration-500">
          <CardHeader className="p-8 pb-4 border-b flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-black flex items-center gap-2">
                <FileText className="text-primary" /> Payment Receipts History
              </CardTitle>
              <CardDescription>All fee payments collected from {profile.name}.</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => refetch()} className="rounded-xl font-bold gap-1 text-xs">
              <RefreshCw size={14} /> Refresh
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {paymentHistory.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-muted/50 text-xs font-bold uppercase tracking-wider text-muted-foreground border-b">
                    <tr>
                      <th className="p-4 pl-6">Receipt #</th>
                      <th className="p-4">Date & Time</th>
                      <th className="p-4">Fee Title</th>
                      <th className="p-4">Mode</th>
                      <th className="p-4">Txn Ref</th>
                      <th className="p-4">Collected By</th>
                      <th className="p-4">Amount Paid</th>
                      <th className="p-4 pr-6 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y font-medium">
                    {paymentHistory.map((pmt: PaymentReportItem) => (
                      <tr key={pmt.payment_id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-4 pl-6 font-mono font-bold text-primary">{pmt.receipt_no}</td>
                        <td className="p-4 text-xs text-muted-foreground">{new Date(pmt.payment_date).toLocaleString()}</td>
                        <td className="p-4 font-semibold">{pmt.fee_title}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            pmt.payment_mode === 'CASH' ? 'bg-emerald-500/10 text-emerald-600' :
                            pmt.payment_mode === 'UPI' ? 'bg-purple-500/10 text-purple-600' : 'bg-blue-500/10 text-blue-600'
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
                No payment receipts found for this student.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB 3: ONLY ASSIGNED CATEGORIES & DISPLAY VIEWS */}
      {activeTab === 'categories' && (
        <div className="space-y-8 animate-in fade-in duration-500">
          {/* Assigned Categories */}
          <Card className="rounded-[2.5rem] border border-border shadow-xl overflow-hidden">
            <CardHeader className="p-8 pb-4 border-b">
              <CardTitle className="text-2xl font-black flex items-center gap-2">
                <BookOpen className="text-primary" /> Assigned Categories ({assignedCategories.length})
              </CardTitle>
              <CardDescription>ONLY course categories currently assigned to {profile.name}.</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              {assignedCategories.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {assignedCategories.map((cat) => (
                    <div
                      key={cat.id}
                      className="p-6 rounded-[2rem] border border-emerald-500/40 bg-emerald-500/5 shadow-md flex items-center justify-between"
                    >
                      <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                          Assigned Category
                        </span>
                        <h4 className="font-bold text-base text-slate-900 dark:text-zinc-50 pt-1">{cat.name}</h4>
                        {cat.category_type && <p className="text-xs text-muted-foreground">{cat.category_type}</p>}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleCategoryMutation.mutate({ student_user_id: id, category_id: cat.id })}
                        disabled={toggleCategoryMutation.isPending}
                        className="rounded-xl font-bold text-xs border-rose-500/30 text-rose-600 hover:bg-rose-500/10"
                      >
                        Revoke
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center text-muted-foreground space-y-2">
                  <BookOpen size={36} className="mx-auto opacity-20" />
                  <p className="font-bold">No categories assigned to this student yet.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Display Views */}
          <Card className="rounded-[2.5rem] border border-border shadow-xl overflow-hidden">
            <CardHeader className="p-8 pb-4 border-b">
              <CardTitle className="text-2xl font-black flex items-center gap-2">
                <LayoutGrid className="text-indigo-500" /> Display Views Access ({assignedDisplayViews.length})
              </CardTitle>
              <CardDescription>Display views available for {profile.name}'s franchise workspace.</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              {assignedDisplayViews.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {assignedDisplayViews.map((dv) => (
                    <div
                      key={dv.id}
                      className="p-4 rounded-2xl border border-border bg-card hover:bg-accent/40 transition-colors flex items-center gap-3"
                    >
                      <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-black">
                        <LayoutGrid size={18} />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-slate-900 dark:text-zinc-50">{dv.display_name}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">View ID #{dv.id}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">No display views found.</div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 4: STUDENT PRACTICE MCQ TESTS */}
      {activeTab === 'tests' && (
        <Card className="rounded-[2.5rem] border border-border shadow-xl overflow-hidden animate-in fade-in duration-500">
          <CardHeader className="p-8 pb-4 border-b">
            <CardTitle className="text-2xl font-black flex items-center gap-2">
              <Trophy className="text-yellow-500" /> Student Practice MCQ Tests ({practiceTests.length})
            </CardTitle>
            <CardDescription>MCQ test attempts and scores completed by {profile.name}.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {practiceTests.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-muted/50 text-xs font-bold uppercase tracking-wider text-muted-foreground border-b">
                    <tr>
                      <th className="p-4 pl-6">Test Title</th>
                      <th className="p-4">Date & Time Started</th>
                      <th className="p-4">Total Questions</th>
                      <th className="p-4">Score</th>
                      <th className="p-4">Accuracy</th>
                      <th className="p-4 pr-6 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y font-medium">
                    {practiceTests.map((t: any) => (
                      <tr key={t.attempt_id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-4 pl-6 font-bold text-slate-900 dark:text-zinc-50">{t.test_name}</td>
                        <td className="p-4 text-xs text-muted-foreground">
                          {t.started_at ? new Date(t.started_at).toLocaleString() : 'N/A'}
                        </td>
                        <td className="p-4 font-semibold">{t.total_questions || '-'}</td>
                        <td className="p-4 font-black text-emerald-600 text-base">{t.score} pts</td>
                        <td className="p-4">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-500/10 text-indigo-500">
                            {t.accuracy ?? 0}% Accuracy
                          </span>
                        </td>
                        <td className="p-4 pr-6 text-right">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-600">
                            Completed
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center text-muted-foreground space-y-2">
                <Trophy size={40} className="mx-auto opacity-20 text-yellow-500" />
                <p className="font-bold">No practice MCQ test attempts found for this student yet.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB 5: PROFILE & PERSONAL DETAILS FORM */}
      {activeTab === 'profile' && (
        <Card className="rounded-[2.5rem] border border-border shadow-xl overflow-hidden animate-in fade-in duration-500">
          <CardHeader className="p-8 pb-4 border-b">
            <CardTitle className="text-2xl font-black flex items-center gap-2">
              <User className="text-primary" /> Edit Personal Profile Details
            </CardTitle>
            <CardDescription>Update student contact info, father's name, or address.</CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <StudentDetailsForm initialData={profile || undefined} userId={id} />
          </CardContent>
        </Card>
      )}

      {/* Printable Receipt Modal */}
      <ReceiptModal
        paymentId={receiptPaymentId}
        onClose={() => setReceiptPaymentId(null)}
      />
    </div>
  );
};

export default StudentDetailsPage;
