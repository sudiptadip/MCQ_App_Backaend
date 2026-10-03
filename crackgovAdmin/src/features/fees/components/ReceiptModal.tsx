import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getPaymentReceipt } from '../api/fees.api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Printer, CheckCircle2, Building2, Calendar, CreditCard, Loader2 } from 'lucide-react';

interface ReceiptModalProps {
  paymentId: number | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ paymentId, onClose }) => {
  const { data: receipt, isLoading } = useQuery({
    queryKey: ['paymentReceipt', paymentId],
    queryFn: () => getPaymentReceipt(paymentId!),
    enabled: paymentId !== null,
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={paymentId !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl rounded-[2rem] p-0 overflow-hidden print:shadow-none print:border-0 print:max-w-none">
        <DialogHeader className="p-6 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex flex-row items-center justify-between shrink-0">
          <div>
            <DialogTitle className="text-2xl font-black flex items-center gap-2">
              <CheckCircle2 className="text-emerald-400 h-6 w-6" /> Official Fee Receipt
            </DialogTitle>
            <p className="text-xs text-slate-300 font-mono mt-1">Receipt #: {receipt?.receipt_no || '...'}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={handlePrint} className="text-white hover:bg-white/10 rounded-xl gap-2 font-bold print:hidden">
            <Printer size={16} /> Print / Save
          </Button>
        </DialogHeader>

        <div className="p-8 space-y-6 print:p-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
              <Loader2 size={36} className="animate-spin text-primary mb-3" />
              <p className="font-semibold">Generating Official Fee Receipt...</p>
            </div>
          ) : receipt ? (
            <>
              {/* Franchise / Institution Header */}
              <div className="flex justify-between items-start border-b pb-6">
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-zinc-50 flex items-center gap-2">
                    <Building2 className="text-primary h-5 w-5" />
                    {receipt.franchise_name || 'MCQ Academy'}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {receipt.franchise_email || 'contact@academy.com'} • {receipt.franchise_phone || '+91 98765 43210'}
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-3 py-1 bg-emerald-500/10 text-emerald-600 font-bold text-xs rounded-full uppercase tracking-wider">
                    {receipt.fee_status || 'PAID'}
                  </span>
                  <p className="text-xs text-muted-foreground mt-2 flex items-center justify-end gap-1">
                    <Calendar size={13} /> {new Date(receipt.payment_date).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Student Details */}
              <div className="grid grid-cols-2 gap-4 bg-muted/30 p-4 rounded-2xl">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Student Name</p>
                  <p className="font-bold text-slate-900 dark:text-zinc-50 text-base">{receipt.student_name}</p>
                  <p className="text-xs text-muted-foreground">{receipt.student_email}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Payment Method</p>
                  <p className="font-bold text-slate-900 dark:text-zinc-50 text-base flex items-center gap-1.5 capitalize">
                    <CreditCard size={16} className="text-primary" /> {receipt.payment_mode}
                  </p>
                  {receipt.transaction_ref && (
                    <p className="text-xs font-mono text-muted-foreground">Ref: {receipt.transaction_ref}</p>
                  )}
                </div>
              </div>

              {/* Fee Breakdown Table */}
              <div className="border rounded-2xl overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-muted/50 text-xs font-bold uppercase tracking-wider text-muted-foreground border-b">
                    <tr>
                      <th className="p-3 pl-4">Fee Structure</th>
                      <th className="p-3 text-right">Net Amount</th>
                      <th className="p-3 text-right">Paid Now</th>
                      <th className="p-3 text-right pr-4">Balance Due</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y font-medium">
                    <tr>
                      <td className="p-3 pl-4 font-bold">{receipt.fee_structure_name}</td>
                      <td className="p-3 text-right">₹{receipt.net_amount?.toLocaleString()}</td>
                      <td className="p-3 text-right text-emerald-600 font-bold">₹{receipt.amount_paid?.toLocaleString()}</td>
                      <td className="p-3 text-right pr-4 text-rose-500 font-bold">₹{receipt.due_amount?.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Remarks & Stamp */}
              <div className="flex justify-between items-end pt-4 border-t">
                <div className="max-w-xs">
                  {receipt.remarks && (
                    <>
                      <p className="text-[10px] font-bold uppercase text-muted-foreground">Note / Remarks</p>
                      <p className="text-xs text-muted-foreground italic">{receipt.remarks}</p>
                    </>
                  )}
                </div>
                <div className="text-center border-t-2 border-dashed border-slate-300 pt-2 px-6">
                  <p className="text-xs font-bold text-slate-700 dark:text-zinc-300">Authorized Signatory</p>
                  <p className="text-[10px] text-muted-foreground">Computer Generated Receipt</p>
                </div>
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-muted-foreground">Receipt details could not be loaded.</div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
