export default interface Tests {
    id?: number;
    name: string;
    total_questions: number;
    duration_minutes: number;
    description?: string;
    min_no_of_question_attempt?: string;
    is_assigned_by_franchise?: boolean;
    shuffle_questions?: boolean;
    shuffle_options?: boolean;
}