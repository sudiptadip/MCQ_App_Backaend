export default interface Franchise {
  id: number;

  // Basic Info
  name: string;
  code: string;
  owner_name?: string | null;

  // Contact
  contact_email?: string | null;
  contact_phone?: string | null;
  alternate_phone?: string | null;
  website_url?: string | null;

  // Address
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postal_code?: string | null;

  // Branding
  logo_url?: string | null;
  logo_document_Id?: number | null;

  // SMTP Configuration
  smtp_host?: string | null;
  smtp_port?: number | null;
  smtp_email?: string | null;
  smtp_password?: string | null;
  smtp_enable_ssl: boolean;
  smtp_sender_name?: string | null;

  // Business Details
  pan_number?: string | null;
  gst_number?: string | null;

  // Status
  status?: boolean | null;

  // Audit
  created_at?: string | null;


  
}