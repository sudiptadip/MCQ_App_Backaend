export interface TestimonialItem {
  id: number;
  studentName: string;
  examName?: string;
  rankOrScore?: string;
  avatarUrl?: string;
  content: string;
  rating: number;
  displayOrder: number;
}
