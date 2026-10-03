export interface FeeStructure {
  id: number;
  name: string;
  amount: number;
  frequency: string;
  description?: string;
  status: boolean;
  created_at: string;
}

export interface StudentFee {
  student_fee_id: number;
  student_id: number;
  student_name: string;
  student_email: string;
  fee_structure_id: number;
  fee_structure_name: string;
  total_amount: number;
  discount_amount: number;
  net_amount: number;
  paid_amount: number;
  due_amount: number;
  due_date: string;
  status: 'PAID' | 'PARTIAL' | 'PENDING' | 'OVERDUE' | string;
  created_at: string;
}

export interface FeePaymentItem {
  payment_id: number;
  receipt_no: string;
  amount_paid: number;
  payment_mode: string;
  transaction_ref?: string;
  payment_date: string;
  student_name?: string;
  student_email?: string;
  fee_structure_name?: string;
  fee_title?: string;
}

export interface FeesDashboardStats {
  total_collected: number;
  total_due: number;
  total_net: number;
  overdue_count: number;
  pending_count: number;
  collection_rate: number;
  recent_payments: FeePaymentItem[];
}

export interface RecordPaymentDto {
  student_fee_id: number;
  amount_paid: number;
  payment_mode: string;
  transaction_ref?: string;
  remarks?: string;
}

export interface UpsertFeeStructureDto {
  id?: number;
  name: string;
  amount: number;
  frequency: string;
  description?: string;
}

export interface AssignFeeStructureDto {
  student_id: number;
  fee_structure_id?: number;
  fee_title?: string;
  total_amount?: number;
  discount_amount?: number;
  initial_paid_amount?: number;
  payment_mode?: string;
  due_date?: string;
  remarks?: string;
  number_of_months?: number;
}

export interface StudentFeeScheduleItem {
  student_fee_id: number;
  fee_title: string;
  total_amount: number;
  discount_amount: number;
  net_amount: number;
  paid_amount: number;
  due_amount: number;
  due_date: string;
  status: 'PAID' | 'PARTIAL' | 'PENDING' | 'OVERDUE' | string;
}

export interface StudentPortalFeesData {
  fee_schedule: StudentFeeScheduleItem[];
  payment_history: FeePaymentItem[];
}

export interface ReceiptDetails {
  payment_id: number;
  receipt_no: string;
  amount_paid: number;
  payment_mode: string;
  transaction_ref?: string;
  payment_date: string;
  remarks?: string;
  student_name: string;
  student_email: string;
  fee_structure_name: string;
  total_amount: number;
  discount_amount: number;
  net_amount: number;
  paid_amount: number;
  due_amount: number;
  fee_status: string;
  franchise_name?: string;
  franchise_phone?: string;
  franchise_email?: string;
}

export interface PaymentReportFilterParams {
  from_date?: string;
  to_date?: string;
  payment_mode?: string;
  student_id?: number;
  search?: string;
}

export interface PaymentReportItem {
  payment_id: number;
  receipt_no: string;
  amount_paid: number;
  payment_mode: string;
  transaction_ref?: string;
  payment_date: string;
  remarks?: string;
  student_name: string;
  student_email: string;
  fee_title: string;
  collected_by_name: string;
}

export interface PaymentReportData {
  total_amount: number;
  total_count: number;
  cash_amount: number;
  digital_amount: number;
  payments: PaymentReportItem[];
}
