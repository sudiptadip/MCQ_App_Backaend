export interface UpsertFranchiseDto {
  id?: number;
  name: string;
  code?: string;
  contact_email: string;
  owner_name: string;
  password?: string;
  confirmPassword?: string;
  contact_phone?: string | null;
  alternate_phone?: string | null;
  website_url?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postal_code?: string | null;
  logo_url?: string | null;
  logo_document_Id?: number | null;
  smtp_host?: string | null;
  smtp_port?: number | null;
  smtp_email?: string | null;
  smtp_password?: string | null;
  smtp_enable_ssl?: boolean;
  smtp_sender_name?: string | null;
  pan_number?: string | null;
  gst_number?: string | null;
  status?: boolean | null;
}