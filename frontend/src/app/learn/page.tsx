"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, Play, CheckCircle2, XCircle, ChevronRight,
  Clock, BarChart2, Award, Search, Filter,
} from "lucide-react";
import Link from "next/link";
import LandingNav from "@/components/LandingNav";
import LandingFooter from "@/components/LandingFooter";
import { LESSONS, CATEGORIES, videoSearchUrl, bookSearchUrl, type LessonCategory } from "@/lib/lessons";
import { useAuth } from "@/lib/auth-context";
import AuthGate from "@/components/AuthGate";

const LEVEL_COLOR: Record<string, string> = {
  beginner: "bg-green-500/15 text-green-400",
  intermediate: "bg-amber-500/15 text-amber-400",
  advanced: "bg-red-500/15 text-red-400",
};

const LEVEL_ORDER = { beginner: 0, intermediate: 1, advanced: 2 };

export default function LearnPage() {
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState<LessonCategory | "All">("All");
  const [search, setSearch] = useState("");
  const [openLesson, setOpenLesson] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, number | null>>({});
  const [showAuthGate, setShowAuthGate] = useState(false);

  function openExternal(url: string) {
    if (!user) { setShowAuthGate(true); return; }
    window.open(url, "_blank", "noopener,noreferrer");
  }

  const filtered = LESSONS
    .filter((l) => activeCategory === "All" || l.category === activeCategory)
    .filter((l) => l.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level]);

  const completed = Object.entries(answers).filter(
    ([id, ans]) => {
      const lesson = LESSONS.find((l) => l.id === id);
      return lesson && ans === lesson.quiz.correctIndex;
    }
  ).length;

  return (
    <div className="flex-1">
      <LandingNav />

      {/* Hero */}
      <section className="relative overflow-hidden px-6 pt-20 pb-16">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background: "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(99,102,241,0.15) 0%, var(--background) 70%)",
          }}
        />
        <div className="mx-auto max-w-4xl text-center">
          <motion.span
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-medium text-indigo-400"
          >
            <BookOpen size={12} /> Trading Academy
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-6 text-5xl font-extrabold tracking-tight"
          >
            Learn to Trade{" "}
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Like a Pro
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-4 text-lg text-muted max-w-2xl mx-auto"
          >
            Structured courses from beginner to advanced — with real quizzes,
            video resources, and a certification exam.
          </motion.p>

          {/* Progress bar */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 inline-flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 px-6 py-3 backdrop-blur-sm"
          >
            <Award size={18} className="text-accent" />
            <div className="text-left">
              <p className="text-xs text-muted">Your Progress</p>
              <p className="text-sm font-semibold">{completed} / {LESSONS.length} lessons completed</p>
            </div>
            <div className="h-2 w-32 rounded-full bg-white/10">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-accent to-amber-400 transition-all"
                style={{ width: `${(completed / LESSONS.length) * 100}%` }}
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Filters */}
      <section className="px-6 pb-6">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              {(["All", ...CATEGORIES] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                    activeCategory === cat
                      ? "bg-accent text-black shadow-lg shadow-accent/30"
                      : "border border-white/10 bg-white/5 text-muted hover:text-foreground hover:bg-white/10"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search courses..."
                className="rounded-xl border border-white/10 bg-white/5 pl-9 pr-4 py-2 text-sm outline-none focus:border-accent/50 w-56"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Course grid */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((lesson, i) => {
              const answered = answers[lesson.id] !== undefined && answers[lesson.id] !== null;
              const correct = answered && answers[lesson.id] === lesson.quiz.correctIndex;
              const isOpen = openLesson === lesson.id;

              return (
                <motion.div
                  key={lesson.id}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`rounded-3xl border transition-all duration-300 overflow-hidden ${
                    isOpen
                      ? "border-accent/40 shadow-xl shadow-accent/10"
                      : "border-white/10 hover:border-white/20"
                  } bg-white/[0.03] backdrop-blur-sm`}
                >
                  {/* Card header */}
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${LEVEL_COLOR[lesson.level]}`}>
                            {lesson.level}
                          </span>
                          <span className="rounded-full border border-white/10 px-2.5 py-0.5 text-xs text-muted">
                            {lesson.category}
                          </span>
                          {correct && (
                            <span className="flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-0.5 text-xs text-success">
                              <CheckCircle2 size={10} /> Done
                            </span>
                          )}
                        </div>
                        <h3 className="mt-3 font-semibold text-base leading-snug">{lesson.title}</h3>
                      </div>
                    </div>

                    <p className="mt-3 text-sm text-muted leading-relaxed line-clamp-3">{lesson.body}</p>

                    {/* Resources */}
                    <div className="mt-4 flex flex-wrap gap-2">
                      {lesson.resources.videos.map((v) => (
                        <button
                          key={v.title}
                          onClick={() => openExternal(videoSearchUrl(v))}
                          className="flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/20 transition-colors"
                        >
                          <Play size={10} className="fill-red-400" /> Watch Video
                        </button>
                      ))}
                      {lesson.resources.books.map((b) => (
                        <button
                          key={b.title}
                          onClick={() => openExternal(bookSearchUrl(b))}
                          className="flex items-center gap-1.5 rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-400 hover:bg-blue-500/20 transition-colors"
                        >
                          <BookOpen size={10} /> {b.title.split(":")[0]}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => setOpenLesson(isOpen ? null : lesson.id)}
                      className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition-all ${
                        isOpen
                          ? "bg-accent/20 text-accent"
                          : "bg-white/5 text-muted hover:bg-white/10 hover:text-foreground"
                      }`}
                    >
                      {isOpen ? "Hide Quiz" : "Take Quiz"}
                      <ChevronRight size={14} className={`transition-transform ${isOpen ? "rotate-90" : ""}`} />
                    </button>
                  </div>

                  {/* Quiz panel */}
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden border-t border-white/10"
                      >
                        <QuizPanel
                          lesson={lesson}
                          selected={answers[lesson.id] ?? null}
                          onAnswer={(idx) => setAnswers((prev) => ({ ...prev, [lesson.id]: idx }))}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <Filter size={32} className="text-muted mb-4" />
              <p className="text-muted">No courses match your search.</p>
            </div>
          )}

          {/* Certification CTA */}
          {completed >= 5 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-12 rounded-3xl border border-accent/30 bg-gradient-to-br from-accent/10 to-transparent p-8 text-center"
            >
              <Award size={32} className="mx-auto text-accent mb-3" />
              <h3 className="text-xl font-bold">You&apos;re ready for the Final Exam!</h3>
              <p className="mt-2 text-muted text-sm">Complete {completed} lessons — take the certification exam to earn your badge.</p>
              <Link
                href="/dashboard/learn/final-exam"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-accent to-amber-400 px-6 py-3 font-semibold text-black hover:shadow-lg hover:shadow-accent/30 transition-all"
              >
                Take Final Exam <ChevronRight size={16} />
              </Link>
            </motion.div>
          )}
        </div>
      </section>

      <LandingFooter />

      {/* Auth gate */}
      {showAuthGate && (
        <AuthGate onClose={() => setShowAuthGate(false)} message="Sign in to access video and book resources." />
      )}
    </div>
  );
}

function QuizPanel({
  lesson,
  selected,
  onAnswer,
}: {
  lesson: (typeof LESSONS)[0];
  selected: number | null;
  onAnswer: (idx: number) => void;
}) {
  const answered = selected !== null;
  const correct = selected === lesson.quiz.correctIndex;

  return (
    <div className="p-6 bg-white/[0.02]">
      <p className="text-xs font-semibold uppercase tracking-wide text-accent mb-3">Quiz</p>
      <p className="text-sm font-medium mb-4">{lesson.quiz.question}</p>
      <div className="space-y-2">
        {lesson.quiz.options.map((opt, i) => {
          let style = "border-white/10 bg-white/5 text-muted hover:border-white/20 hover:text-foreground";
          if (answered) {
            if (i === lesson.quiz.correctIndex) style = "border-success/40 bg-success/10 text-success";
            else if (i === selected) style = "border-danger/40 bg-danger/10 text-danger";
            else style = "border-white/5 bg-white/[0.02] text-muted opacity-50";
          }
          return (
            <button
              key={i}
              disabled={answered}
              onClick={() => onAnswer(i)}
              className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-sm text-left transition-all ${style}`}
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-current text-xs font-bold">
                {String.fromCharCode(65 + i)}
              </span>
              {opt}
              {answered && i === lesson.quiz.correctIndex && <CheckCircle2 size={14} className="ml-auto text-success" />}
              {answered && i === selected && i !== lesson.quiz.correctIndex && <XCircle size={14} className="ml-auto text-danger" />}
            </button>
          );
        })}
      </div>
      {answered && (
        <p className={`mt-3 text-sm font-medium ${correct ? "text-success" : "text-danger"}`}>
          {correct ? "✓ Correct! Well done." : "✗ Not quite — the correct answer is highlighted above."}
        </p>
      )}
    </div>
  );
}
