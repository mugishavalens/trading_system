"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { CheckCircle2, ChevronDown } from "lucide-react";
import { CATEGORIES, LESSONS, LessonCategory } from "@/lib/lessons";

const STORAGE_KEY = "ai_trading_demo_learn_progress";

const LEVEL_STYLES: Record<string, string> = {
  beginner: "text-success",
  intermediate: "text-accent",
  advanced: "text-danger",
};

export default function LearnPage() {
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [category, setCategory] = useState<LessonCategory>("Fundamentals");
  const [openId, setOpenId] = useState<string | null>(LESSONS[0].id);
  const [selectedOption, setSelectedOption] = useState<Record<string, number>>({});

  const visibleLessons = LESSONS.filter((l) => l.category === category);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setCompleted(new Set(JSON.parse(stored)));
      } catch {
        // ignore malformed storage
      }
    }
  }, []);

  function persist(next: Set<string>) {
    setCompleted(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(next)));
  }

  function answerQuiz(lessonId: string, optionIndex: number, correctIndex: number) {
    setSelectedOption((prev) => ({ ...prev, [lessonId]: optionIndex }));
    if (optionIndex === correctIndex) {
      const next = new Set(completed);
      next.add(lessonId);
      persist(next);
    }
  }

  const progressPct = Math.round((completed.size / LESSONS.length) * 100);

  return (
    <div className="mx-auto max-w-3xl">
      <div>
        <h1 className="text-xl font-semibold">Learn</h1>
        <p className="mt-1 text-sm text-muted">
          Short lessons on the concepts behind the AI's recommendations. Answer
          each quiz question correctly to mark a lesson complete.
        </p>
      </div>

      <div className="glass mt-4 rounded-2xl p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">Overall progress</span>
          <span className="font-medium">
            {completed.size}/{LESSONS.length} lessons
          </span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-surface-2">
          <div
            className="h-2 rounded-full bg-accent transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        {CATEGORIES.map((c) => {
          const total = LESSONS.filter((l) => l.category === c).length;
          const done = LESSONS.filter(
            (l) => l.category === c && completed.has(l.id)
          ).length;
          return (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={clsx(
                "rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
                category === c
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border text-muted hover:text-foreground"
              )}
            >
              {c}
              <span className="ml-1.5 text-xs opacity-70">
                {done}/{total}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 space-y-3">
        {visibleLessons.map((lesson) => {
          const isOpen = openId === lesson.id;
          const isDone = completed.has(lesson.id);
          const chosen = selectedOption[lesson.id];

          return (
            <div key={lesson.id} className="glass overflow-hidden rounded-2xl">
              <button
                onClick={() => setOpenId(isOpen ? null : lesson.id)}
                className="flex w-full items-center justify-between px-5 py-4 text-left"
              >
                <div className="flex items-center gap-3">
                  {isDone ? (
                    <CheckCircle2 size={20} className="text-success shrink-0" />
                  ) : (
                    <div className="h-5 w-5 shrink-0 rounded-full border-2 border-border" />
                  )}
                  <div>
                    <p className="font-medium">{lesson.title}</p>
                    <p className={clsx("text-xs", LEVEL_STYLES[lesson.level])}>
                      {lesson.level}
                    </p>
                  </div>
                </div>
                <ChevronDown
                  size={18}
                  className={clsx(
                    "text-muted transition-transform",
                    isOpen && "rotate-180"
                  )}
                />
              </button>

              {isOpen && (
                <div className="border-t border-border px-5 py-4">
                  <p className="text-sm text-foreground/90">{lesson.body}</p>

                  <div className="mt-4 rounded-lg border border-border bg-background/60 p-4">
                    <p className="text-sm font-medium">{lesson.quiz.question}</p>
                    <div className="mt-3 space-y-2">
                      {lesson.quiz.options.map((option, i) => {
                        const isChosen = chosen === i;
                        const isCorrect = i === lesson.quiz.correctIndex;
                        return (
                          <button
                            key={option}
                            onClick={() =>
                              answerQuiz(lesson.id, i, lesson.quiz.correctIndex)
                            }
                            className={clsx(
                              "w-full rounded-lg border px-4 py-2 text-left text-sm transition-colors",
                              isChosen && isCorrect && "border-success bg-success/10",
                              isChosen && !isCorrect && "border-danger bg-danger/10",
                              !isChosen && "border-border hover:border-muted"
                            )}
                          >
                            {option}
                          </button>
                        );
                      })}
                    </div>
                    {chosen !== undefined && chosen !== lesson.quiz.correctIndex && (
                      <p className="mt-2 text-xs text-danger">
                        Not quite — try another option.
                      </p>
                    )}
                    {chosen === lesson.quiz.correctIndex && (
                      <p className="mt-2 text-xs text-success">
                        Correct — lesson marked complete.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
