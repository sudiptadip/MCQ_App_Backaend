export interface User {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  role: string;
  franchise_id: number | null;
  created_at: string;
  updated_at: string | null;
}