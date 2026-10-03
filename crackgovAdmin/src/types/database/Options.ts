export interface QuestionOption {
  id: number;
  question_id: number;
  option_text: string;
  is_correct?: boolean | null;
}