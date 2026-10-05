export interface ContactSubmission {
  id: number;
  name: string;
  contactInfo: string;
  title: string;
  description: string;
  isRead: boolean;
  createdOn: string;
}

export interface ContactPage {
  items: ContactSubmission[];
  totalCount: number;
  page: number;
  pageSize: number;
}
