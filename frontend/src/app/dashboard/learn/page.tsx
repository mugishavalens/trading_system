"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import {
  CheckCircle2,
  ChevronDown,
  Lock,
  BookOpen,
  PlayCircle,
  ExternalLink,
  Trophy,
} from "lucide-react";
import {
  CATEGORIES,
  LESSONS,
  LessonCategory,
  bookSearchUrl,
  videoSearchUrl,
} from "@/lib/lessons";
import { PASS_THRESHOLD_PCT } from "@/lib/finalExam";
import { EXAM_RESULT_KEY, ExamResult } from "@/lib/examStorage";

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
  const [examResult, setExamResult] = useState<ExamResult | null>(null);

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
    const storedExam = localStorage.getItem(EXAM_RESULT_KEY);
    if (storedExam) {
      try {
        setExamResult(JSON.parse(storedExam));
      } catch {
        // ignore malformed storage
      }
    }
  }, []);

  function persist(next: Set<string>) {
    setCompleted(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(next)));
  }

  function isUnlocked(lesson: (typeof LESSONS)[number]): boolean {
    const index = LESSONS.findIndex((l) => l.id === lesson.id);
    if (index === 0) return true;
    return completed.has(LESSONS[index - 1].id);
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
  const allLessonsDone = completed.size === LESSONS.length;
  const level =
    examResult?.passed
      ? "Certified Trader"
      : progressPct >= 67
      ? "Advanced Trader"
      : progressPct >= 34
      ? "Developing Trader"
      : "Novice Trader";

  return (
    <div className="mx-auto max-w-3xl">
      <div>
        <h1 className="text-xl font-semibold">Learn</h1>
        <p className="mt-1 text-sm text-muted">
          Courses unlock in order — finish one (including its short assessment) to
          unlock the next. Complete every course to unlock the Final Exam.
        </p>
      </div>

      <div className="glass mt-4 rounded-2xl p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-accent">{level}</span>
          <span className="font-medium">
            {completed.size}/{LESSONS.length} courses · {progressPct}%
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
          const unlocked = isUnlocked(lesson);
          const isOpen = unlocked && openId === lesson.id;
          const isDone = completed.has(lesson.id);
          const chosen = selectedOption[lesson.id];

          return (
            <div key={lesson.id} className="glass overflow-hidden rounded-2xl">
              <button
                onClick={() => unlocked && setOpenId(isOpen ? null : lesson.id)}
                disabled={!unlocked}
                className={clsx(
                  "flex w-full items-center justify-between px-5 py-4 text-left",
                  !unlocked && "cursor-not-allowed opacity-50"
                )}
              >
                <div className="flex items-center gap-3">
                  {isDone ? (
                    <CheckCircle2 size={20} className="text-success shrink-0" />
                  ) : unlocked ? (
                    <div className="h-5 w-5 shrink-0 rounded-full border-2 border-border" />
                  ) : (
                    <Lock size={18} className="text-muted shrink-0" />
                  )}
                  <div>
                    <p className="font-medium">{lesson.title}</p>
                    <p className={clsx("text-xs", LEVEL_STYLES[lesson.level])}>
                      {lesson.level}
                      {!unlocked && " · complete the previous course to unlock"}
                    </p>
                  </div>
                </div>
                {unlocked && (
                  <ChevronDown
                    size={18}
                    className={clsx(
                      "text-muted transition-transform",
                      isOpen && "rotate-180"
                    )}
                  />
                )}
              </button>

              {isOpen && (
                <div className="border-t border-border px-5 py-4">
                  <p className="text-sm text-foreground/90">{lesson.body}</p>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border border-border bg-background/60 p-3">
                      <p className="flex items-center gap-1.5 text-xs font-medium text-muted">
                        <BookOpen size={13} /> Recommended reading
                      </p>
                      <ul className="mt-2 space-y-1.5">
                        {lesson.resources.books.map((book) => (
                          <li key={book.title}>
                            <a
                              href={bookSearchUrl(book)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-start gap-1 text-xs text-accent hover:underline"
                            >
                              <ExternalLink size={11} className="mt-0.5 shrink-0" />
                              <span>
                                {book.title} — <span className="text-muted">{book.author}</span>
                              </span>
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-lg border border-border bg-background/60 p-3">
                      <p className="flex items-center gap-1.5 text-xs font-medium text-muted">
                        <PlayCircle size={13} /> Watch & learn
                      </p>
                      <ul className="mt-2 space-y-1.5">
                        {lesson.resources.videos.map((video) => (
                          <li key={video.title}>
                            <a
                              href={videoSearchUrl(video)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-start gap-1 text-xs text-accent hover:underline"
                            >
                              <ExternalLink size={11} className="mt-0.5 shrink-0" />
                              <span>{video.title}</span>
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

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
                        Correct — course marked complete. Next course unlocked.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Link
        href={allLessonsDone ? "/dashboard/learn/final-exam" : "#"}
        aria-disabled={!allLessonsDone}
        className={clsx(
          "glass mt-3 flex items-center justify-between rounded-2xl border-2 p-5 transition-colors",
          allLessonsDone
            ? "border-accent/40 hover:bg-surface-2"
            : "cursor-not-allowed border-border opacity-60"
        )}
        onClick={(e) => {
          if (!allLessonsDone) e.preventDefault();
        }}
      >
        <div className="flex items-center gap-3">
          {allLessonsDone ? (
            <Trophy size={22} className="text-accent shrink-0" />
          ) : (
            <Lock size={20} className="text-muted shrink-0" />
          )}
          <div>
            <p className="font-semibold">Final Exam</p>
            <p className="text-xs text-muted">
              {allLessonsDone
                ? examResult
                  ? `Last attempt: ${examResult.scorePct}% — ${
                      examResult.passed ? "passed" : "not yet passed"
                    }`
                  : `10 questions covering every course — ${PASS_THRESHOLD_PCT}% needed to pass`
                : "Complete every course above to unlock"}
            </p>
          </div>
        </div>
        {examResult?.passed && (
          <span className="rounded-full bg-success/15 px-3 py-1 text-xs font-medium text-success">
            Certified
          </span>
        )}
      </Link>
    </div>
  );
}
