export interface UpdateStudentDetailsDto {
  user_id: number;
  gender?: string | null;
  date_of_birth?: string | null;
  mobile_no?: string | null;
  alternate_mobile_no?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  email?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postal_code?: string | null;
  profile_image_url?: string | null;
  status: boolean;
  ValidityDate?: string | null;
}

