import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getMyStudentFees } from '../../features/fees/api/fees.api';
import { ReceiptModal } from '../../features/fees/components/ReceiptModal';
import {
  IndianRupee,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Printer,
  Sparkles,
  Loader2,
  FileText,
  ShieldCheck
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import type { StudentFeeScheduleItem, FeePaymentItem } from '../../features/fees/types';

export const StudentFeesPage: React.FC = () => {
  const [receiptPaymentId, setReceiptPaymentId] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['myStudentFeesPortal'],
    queryFn: getMyStudentFees,
  });

  const feeSchedule: StudentFeeScheduleItem[] = data?.fee_schedule || [];
  const paymentHistory: FeePaymentItem[] = data?.payment_history || [];

  // Aggregates
  const totalPaid = feeSchedule.reduce((acc: number, curr: StudentFeeScheduleItem) => acc + (curr.paid_amount || 0), 0);
  const totalDue = feeSchedule.reduce((acc: number, curr: StudentFeeScheduleItem) => acc + (curr.due_amount || 0), 0);

  const nextDueItem = feeSchedule.find((f: StudentFeeScheduleItem) => f.due_amount > 0);

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto animate-in fade-in duration-700">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-indigo-600 via-purple-700 to-slate-900 p-8 md:p-12 text-white shadow-2xl">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <IndianRupee size={160} />
        </div>
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-[10px] font-bold uppercase tracking-widest text-yellow-300">
            <Sparkles size={14} /> Student Fee Portal
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white">
            My Fees & Installment Schedule
          </h1>
          <p className="text-indigo-100/90 text-lg max-w-xl font-medium">
            Track your monthly fee installments, due dates, and view or download official payment receipts anytime.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="rounded-[2rem] border-0 shadow-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white overflow-hidden">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                <CheckCircle2 size={24} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-2 py-1 rounded-full">Total Paid</span>
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-100 mb-1">Paid Fees</p>
            <p className="text-3xl font-black">
              {isLoading ? <Loader2 className="animate-spin" size={24} /> : `₹${totalPaid.toLocaleString()}`}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-0 shadow-xl bg-gradient-to-br from-rose-500 to-red-700 text-white overflow-hidden">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                <AlertTriangle size={24} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-2 py-1 rounded-full">Pending</span>
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-rose-100 mb-1">Total Outstanding Dues</p>
            <p className="text-3xl font-black">
              {isLoading ? <Loader2 className="animate-spin" size={24} /> : `₹${totalDue.toLocaleString()}`}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-0 shadow-xl bg-gradient-to-br from-slate-900 to-slate-800 text-white overflow-hidden">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                <Calendar size={24} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-2 py-1 rounded-full">Next Due</span>
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">Next Upcoming Due Date</p>
            <p className="text-xl font-black text-emerald-400">
              {nextDueItem ? new Date(nextDueItem.due_date).toLocaleDateString() : 'No Pending Dues 🎉'}
            </p>
            {nextDueItem && (
              <p className="text-xs text-slate-300 mt-1 font-semibold">Amount: ₹{nextDueItem.due_amount?.toLocaleString()}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Monthly Installments Roadmap */}
      <Card className="rounded-[2.5rem] border border-border shadow-xl overflow-hidden">
        <CardHeader className="p-8 pb-4 border-b">
          <CardTitle className="text-2xl font-black flex items-center gap-2">
            <Calendar className="text-primary" /> Monthly Installments Schedule
          </CardTitle>
          <CardDescription>All your assigned course fee installments and due dates.</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="p-12 text-center text-muted-foreground flex flex-col items-center">
              <Loader2 size={32} className="animate-spin text-primary mb-2" /> Loading fee schedule...
            </div>
          ) : feeSchedule.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {feeSchedule.map((item: StudentFeeScheduleItem, index: number) => {
                const isOverdue = item.status === 'OVERDUE' || (item.due_amount > 0 && new Date(item.due_date) < new Date());
                const isPaid = item.status === 'PAID';

                return (
                  <div
                    key={item.student_fee_id || index}
                    className={`
                      p-6 rounded-[2rem] border transition-all duration-300 relative overflow-hidden flex flex-col justify-between
                      ${isPaid
                        ? 'border-emerald-500/30 bg-emerald-500/5'
                        : isOverdue
                        ? 'border-rose-500/40 bg-rose-500/5 shadow-md'
                        : 'border-border bg-card'
                      }
                    `}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                        Installment #{index + 1}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        isPaid ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' :
                        isOverdue ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400' : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                      }`}>
                        {isPaid ? 'PAID' : isOverdue ? 'OVERDUE' : item.status}
                      </span>
                    </div>

                    <div className="space-y-1 mb-4">
                      <h4 className="font-black text-slate-900 dark:text-zinc-50 text-base">{item.fee_title}</h4>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock size={13} /> Due Date: <strong className={isOverdue ? "text-rose-500" : ""}>{new Date(item.due_date).toLocaleDateString()}</strong>
                      </p>
                    </div>

                    <div className="pt-4 border-t border-border/60 flex justify-between items-center text-xs">
                      <div>
                        <p className="text-muted-foreground font-semibold">Net Fee: ₹{item.net_amount?.toLocaleString()}</p>
                        <p className="text-emerald-600 font-bold">Paid: ₹{item.paid_amount?.toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold uppercase text-muted-foreground">Due Amount</p>
                        <p className={`text-lg font-black ${item.due_amount > 0 ? "text-rose-500" : "text-emerald-600"}`}>
                          ₹{item.due_amount?.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center text-muted-foreground">
              No fee installment records found. Your fee plan will appear here once assigned by your institution.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Receipts History */}
      <Card className="rounded-[2.5rem] border border-border shadow-xl overflow-hidden">
        <CardHeader className="p-8 pb-4 border-b">
          <CardTitle className="text-2xl font-black flex items-center gap-2">
            <FileText className="text-primary" /> My Payment Receipts
          </CardTitle>
          <CardDescription>View and download official receipts for payments made.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-muted-foreground flex flex-col items-center">
              <Loader2 size={32} className="animate-spin text-primary mb-2" /> Loading receipt history...
            </div>
          ) : paymentHistory.length > 0 ? (
            <div className="divide-y">
              {paymentHistory.map((pmt: FeePaymentItem) => (
                <div key={pmt.payment_id} className="p-6 flex flex-wrap items-center justify-between gap-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-black">
                      <ShieldCheck size={24} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-zinc-50 text-base">{pmt.fee_title}</p>
                      <p className="text-xs text-muted-foreground font-mono">Receipt #: {pmt.receipt_no}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-lg font-black text-emerald-600">+₹{pmt.amount_paid?.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground capitalize">{pmt.payment_mode} • {new Date(pmt.payment_date).toLocaleDateString()}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setReceiptPaymentId(pmt.payment_id)}
                      className="rounded-xl font-bold gap-1 text-primary border-primary/20 hover:bg-primary/10"
                    >
                      <Printer size={16} /> Receipt
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-muted-foreground">
              No payment receipts found yet. Receipts will appear here as payments are recorded.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Printable Receipt Modal */}
      <ReceiptModal
        paymentId={receiptPaymentId}
        onClose={() => setReceiptPaymentId(null)}
      />
    </div>
  );
};

export default StudentFeesPage;
