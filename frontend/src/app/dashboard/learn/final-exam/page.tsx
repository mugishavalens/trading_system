"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { Trophy, Lock, CheckCircle2, XCircle } from "lucide-react";
import { LESSONS } from "@/lib/lessons";
import { FINAL_EXAM_QUESTIONS, PASS_THRESHOLD_PCT } from "@/lib/finalExam";
import { ExamResult, loadExamResult, saveExamResult } from "@/lib/examStorage";

const LESSON_PROGRESS_KEY = "ai_trading_demo_learn_progress";

export default function FinalExamPage() {
  const [unlocked, setUnlocked] = useState<boolean | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState<ExamResult | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(LESSON_PROGRESS_KEY);
    let completedCount = 0;
    if (stored) {
      try {
        completedCount = (JSON.parse(stored) as string[]).length;
      } catch {
        completedCount = 0;
      }
    }
    setUnlocked(completedCount >= LESSONS.length);
    setSubmitted(loadExamResult());
  }, []);

  function selectAnswer(questionIndex: number, optionIndex: number) {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [questionIndex]: optionIndex }));
  }

  function submitExam() {
    const correctCount = FINAL_EXAM_QUESTIONS.reduce(
      (count, q, i) => (answers[i] === q.correctIndex ? count + 1 : count),
      0
    );
    const scorePct = Math.round((correctCount / FINAL_EXAM_QUESTIONS.length) * 100);
    const result: ExamResult = {
      scorePct,
      passed: scorePct >= PASS_THRESHOLD_PCT,
      completedAt: new Date().toISOString(),
    };
    saveExamResult(result);
    setSubmitted(result);
  }

  function retake() {
    setAnswers({});
    setSubmitted(null);
  }

  if (unlocked === null) return null;

  if (!unlocked) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="glass flex flex-col items-center rounded-2xl p-10 text-center">
          <Lock size={32} className="text-muted" />
          <p className="mt-4 font-semibold">Final Exam is locked</p>
          <p className="mt-2 text-sm text-muted">
            Complete every course in Learn first — courses unlock one at a
            time, in order.
          </p>
          <Link
            href="/dashboard/learn"
            className="mt-6 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-black hover:bg-accent-2 transition-colors"
          >
            Back to Learn
          </Link>
        </div>
      </div>
    );
  }

  const answeredCount = Object.keys(answers).length;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center gap-3">
        <Trophy size={24} className="text-accent" />
        <div>
          <h1 className="text-xl font-semibold">Final Exam</h1>
          <p className="text-sm text-muted">
            {FINAL_EXAM_QUESTIONS.length} questions · {PASS_THRESHOLD_PCT}% required to pass
          </p>
        </div>
      </div>

      {submitted && (
        <div
          className={clsx(
            "glass mt-4 flex items-center gap-4 rounded-2xl border-2 p-6",
            submitted.passed ? "border-success/40" : "border-danger/40"
          )}
        >
          {submitted.passed ? (
            <CheckCircle2 size={32} className="text-success shrink-0" />
          ) : (
            <XCircle size={32} className="text-danger shrink-0" />
          )}
          <div>
            <p className="font-semibold">
              {submitted.passed ? "Passed — Certified" : "Not passed yet"}
            </p>
            <p className="text-sm text-muted">
              Score: {submitted.scorePct}% (need {PASS_THRESHOLD_PCT}%)
            </p>
          </div>
          {!submitted.passed && (
            <button
              onClick={retake}
              className="ml-auto rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-surface transition-colors"
            >
              Retake
            </button>
          )}
        </div>
      )}

      <div className="mt-4 space-y-3">
        {FINAL_EXAM_QUESTIONS.map((q, qi) => {
          const chosen = answers[qi];
          return (
            <div key={qi} className="glass rounded-2xl p-5">
              <p className="text-sm font-medium">
                {qi + 1}. {q.question}
              </p>
              <div className="mt-3 space-y-2">
                {q.options.map((option, oi) => {
                  const isChosen = chosen === oi;
                  const showResult = submitted !== null;
                  const isCorrect = oi === q.correctIndex;
                  return (
                    <button
                      key={option}
                      onClick={() => selectAnswer(qi, oi)}
                      disabled={submitted !== null}
                      className={clsx(
                        "w-full rounded-lg border px-4 py-2 text-left text-sm transition-colors",
                        showResult && isCorrect && "border-success bg-success/10",
                        showResult && isChosen && !isCorrect && "border-danger bg-danger/10",
                        !showResult && isChosen && "border-accent bg-accent/10",
                        !showResult && !isChosen && "border-border hover:border-muted",
                        showResult && !isChosen && !isCorrect && "border-border opacity-60"
                      )}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {!submitted && (
        <button
          onClick={submitExam}
          disabled={answeredCount < FINAL_EXAM_QUESTIONS.length}
          className="mt-4 w-full rounded-lg bg-accent px-4 py-3 font-medium text-black hover:bg-accent-2 disabled:opacity-50 transition-colors"
        >
          {answeredCount < FINAL_EXAM_QUESTIONS.length
            ? `Answer all questions (${answeredCount}/${FINAL_EXAM_QUESTIONS.length})`
            : "Submit Exam"}
        </button>
      )}

      <Link
        href="/dashboard/learn"
        className="mt-4 block text-center text-sm text-muted hover:text-foreground"
      >
        Back to Learn
      </Link>
    </div>
  );
}
