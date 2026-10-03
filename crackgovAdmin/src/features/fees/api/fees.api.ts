import api from "../../../lib/axios";
import { API_ROUTES } from "../../../constants/apiRoute";
import type {
  FeesDashboardStats,
  StudentFee,
  FeeStructure,
  RecordPaymentDto,
  UpsertFeeStructureDto,
  AssignFeeStructureDto,
  ReceiptDetails,
} from "../types";

export const getFeesDashboard = async (): Promise<FeesDashboardStats> => {
  try {
    const response = await api.post(API_ROUTES.GET_FEES_DASHBOARD, {});
    if (response.data?.isSuccess && response.data?.data) {
      const raw = response.data.data;
      let recent = [];
      if (typeof raw.recent_payments === 'string') {
        try { recent = JSON.parse(raw.recent_payments); } catch (e) { recent = []; }
      } else if (Array.isArray(raw.recent_payments)) {
        recent = raw.recent_payments;
      }

      return {
        total_collected: Number(raw.total_collected || 0),
        total_due: Number(raw.total_due || 0),
        total_net: Number(raw.total_net || 0),
        overdue_count: Number(raw.overdue_count || 0),
        pending_count: Number(raw.pending_count || 0),
        collection_rate: Number(raw.collection_rate || 0),
        recent_payments: recent,
      };
    }
  } catch (error) {
    console.warn("Could not fetch fees dashboard stats", error);
  }

  return {
    total_collected: 0,
    total_due: 0,
    total_net: 0,
    overdue_count: 0,
    pending_count: 0,
    collection_rate: 0,
    recent_payments: [],
  };
};

export const getStudentFeesList = async (params?: {
  search?: string;
  status?: string;
  student_id?: number;
}): Promise<StudentFee[]> => {
  try {
    const response = await api.post(API_ROUTES.GET_STUDENT_FEES_LIST, params || {});
    if (response.data?.isSuccess) {
      return (response.data?.data as StudentFee[]) || [];
    }
  } catch (error) {
    console.warn("Could not fetch student fees list", error);
  }
  return [];
};

export const recordFeePayment = async (payload: RecordPaymentDto) => {
  const response = await api.post(API_ROUTES.RECORD_FEE_PAYMENT, payload);
  return response.data;
};

export const getFeeStructures = async (): Promise<FeeStructure[]> => {
  try {
    const response = await api.post(API_ROUTES.GET_FEE_STRUCTURES, {});
    if (response.data?.isSuccess) {
      return (response.data?.data as FeeStructure[]) || [];
    }
  } catch (error) {
    console.warn("Could not fetch fee structures", error);
  }
  return [];
};

export const upsertFeeStructure = async (payload: UpsertFeeStructureDto) => {
  const response = await api.post(API_ROUTES.UPSERT_FEE_STRUCTURE, payload);
  return response.data;
};

export const assignFeeStructure = async (payload: AssignFeeStructureDto) => {
  const response = await api.post(API_ROUTES.ASSIGN_FEE_STRUCTURE, payload);
  return response.data;
};

export const getPaymentReceipt = async (paymentId: number): Promise<ReceiptDetails | null> => {
  try {
    const response = await api.post(API_ROUTES.GET_PAYMENT_RECEIPT, { payment_id: paymentId });
    if (response.data?.isSuccess && response.data?.data) {
      return response.data.data as ReceiptDetails;
    }
  } catch (error) {
    console.warn("Could not fetch payment receipt", error);
  }
  return null;
};

export const getMyStudentFees = async () => {
  try {
    const response = await api.post(API_ROUTES.GET_MY_STUDENT_FEES, {});
    if (response.data?.isSuccess && response.data?.data) {
      const raw = response.data.data;
      let schedule = [];
      let history = [];
      if (typeof raw.fee_schedule === 'string') {
        try { schedule = JSON.parse(raw.fee_schedule); } catch (e) { schedule = []; }
      } else if (Array.isArray(raw.fee_schedule)) {
        schedule = raw.fee_schedule;
      }

      if (typeof raw.payment_history === 'string') {
        try { history = JSON.parse(raw.payment_history); } catch (e) { history = []; }
      } else if (Array.isArray(raw.payment_history)) {
        history = raw.payment_history;
      }

      return {
        fee_schedule: schedule,
        payment_history: history,
      };
    }
  } catch (error) {
    console.warn("Could not fetch student fees portal data", error);
  }

  return {
    fee_schedule: [],
    payment_history: [],
  };
};

export const getPaymentReports = async (params?: {
  from_date?: string;
  to_date?: string;
  payment_mode?: string;
  student_id?: number;
  search?: string;
}) => {
  try {
    const response = await api.post(API_ROUTES.GET_PAYMENT_REPORTS, params || {});
    if (response.data?.isSuccess && response.data?.data) {
      const raw = response.data.data;
      let pmtList = [];
      if (typeof raw.payments === 'string') {
        try { pmtList = JSON.parse(raw.payments); } catch (e) { pmtList = []; }
      } else if (Array.isArray(raw.payments)) {
        pmtList = raw.payments;
      }

      return {
        total_amount: Number(raw.total_amount || 0),
        total_count: Number(raw.total_count || 0),
        cash_amount: Number(raw.cash_amount || 0),
        digital_amount: Number(raw.digital_amount || 0),
        payments: pmtList,
      };
    }
  } catch (error) {
    console.warn("Could not fetch payment reports data", error);
  }

  return {
    total_amount: 0,
    total_count: 0,
    cash_amount: 0,
    digital_amount: 0,
    payments: [],
  };
};
