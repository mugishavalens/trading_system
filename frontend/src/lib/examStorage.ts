export const EXAM_RESULT_KEY = "ai_trading_demo_final_exam_result";

export interface ExamResult {
  scorePct: number;
  passed: boolean;
  completedAt: string;
}

export function saveExamResult(result: ExamResult) {
  localStorage.setItem(EXAM_RESULT_KEY, JSON.stringify(result));
}

export function loadExamResult(): ExamResult | null {
  const stored = localStorage.getItem(EXAM_RESULT_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as ExamResult;
  } catch {
    return null;
  }
}
