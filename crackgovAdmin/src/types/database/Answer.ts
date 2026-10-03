export default interface Answer {
    id: number;
    attempt_id: number;
    question_id: number;
    selected_option_id: number;
    is_correct: boolean;
}