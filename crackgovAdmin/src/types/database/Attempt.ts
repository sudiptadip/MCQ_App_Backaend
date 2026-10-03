export default interface Attempt {
  id: number;
  student_id: number;
  test_id: number;
  score: number;
  started_at: string;     
  completed_at: string | null;
}