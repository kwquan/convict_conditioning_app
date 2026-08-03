import React, { useState, useEffect } from "react";
import {
  Hammer, History, ChevronsUp, ChevronsDown, CircleDot, Footprints,
  ArrowUp, Waves, Flame, ChevronLeft, Check, X, Loader2, CalendarDays,
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, BarChart, Bar, Cell,
} from "recharts";

/* ---------------------------------------------------------------------- */
/* Design tokens                                                          */
/* ---------------------------------------------------------------------- */
const C = {
  bg: "#121417",
  surface: "#1B1E23",
  surface2: "#22262C",
  border: "#2C3138",
  text: "#F3F1EB",
  textMuted: "#8C919B",
  textFaint: "#5B6069",
  accent: "#FF5A36",
  ok: "#57B37E",
  fail: "#D9634F",
};

/* ---------------------------------------------------------------------- */
/* Program data — Convict Conditioning "Good Behavior" 3-day split        */
/* ---------------------------------------------------------------------- */
const MOVEMENTS = [
  {
    id: "pushups", label: "Pushups", icon: ChevronsUp,
    steps: ["Wall Pushup", "Incline Pushup", "Kneeling Pushup", "Half Pushup", "Full Pushup",
      "Close Pushup", "Uneven Pushup", "Half One-Arm Pushup", "Lever Pushup", "One-Arm Pushup"],
  },
  {
    id: "legraises", label: "Leg Raises", icon: CircleDot,
    steps: ["Knee Tuck", "Flat Knee Raise", "Flat Bent Leg Raise", "Flat Frog Raise", "Flat Straight Leg Raise",
      "Hanging Knee Raise", "Hanging Bent Leg Raise", "Hanging Frog Raise", "Partial Straight Leg Raise", "Hanging Straight Leg Raise"],
  },
  {
    id: "pullups", label: "Pull-ups", icon: ChevronsDown,
    steps: ["Vertical Pull", "Horizontal Pull", "Jackknife Pull-up", "Half Pull-up", "Full Pull-up",
      "Close Pull-up", "Uneven Pull-up", "Half One-Arm Pull-up", "Assisted One-Arm Pull-up", "One-Arm Pull-up"],
  },
  {
    id: "squats", label: "Squats", icon: Footprints,
    steps: ["Shoulderstand Squat", "Jackknife Squat", "Supported Squat", "Half Squat", "Full Squat",
      "Close Squat", "Uneven Squat", "Half One-Leg Squat", "Assisted One-Leg Squat", "One-Leg Squat"],
  },
  {
    id: "handstandpushups", label: "Handstand Pushups", icon: ArrowUp,
    steps: ["Wall Headstand", "Crow Stand", "Wall Handstand", "Half Handstand Pushup", "Full Handstand Pushup",
      "Close Handstand Pushup", "Uneven Handstand Pushup", "Half One-Arm Handstand Pushup", "Lever Handstand Pushup", "One-Arm Handstand Pushup"],
  },
  {
    id: "bridges", label: "Bridges", icon: Waves,
    steps: ["Short Bridge", "Straight Bridge", "Angled Bridge", "Head Bridge", "Half Bridge",
      "Full Bridge", "Wall Walking Bridge (Down)", "Wall Walking Bridge (Up)", "Closing Bridge", "Stand-to-Stand Bridge"],
  },
];
const CARDIO = { id: "cardio", label: "Cardio", icon: Flame };

const SCHEDULE = {
  1: ["pushups", "legraises"],        // Monday
  3: ["pullups", "squats"],           // Wednesday
  5: ["handstandpushups", "bridges"], // Friday
};

const STANDARDS = [
  { id: "beginner", label: "Beginner" },
  { id: "intermediate", label: "Intermediate" },
  { id: "progression", label: "Progression" },
];

const getMovement = (id) => MOVEMENTS.find((m) => m.id === id);

/* ---------------------------------------------------------------------- */
/* Date helpers                                                           */
/* ---------------------------------------------------------------------- */
const pad = (n) => String(n).padStart(2, "0");
const toDateStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const prettyDate = (d) => d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });

function getScheduleForDate(date) {
  return SCHEDULE[date.getDay()] || null;
}

function pruneRecords(records) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 365);
  const cutoffStr = toDateStr(cutoff);
  return (records || []).filter((r) => r.date >= cutoffStr);
}

/* ---------------------------------------------------------------------- */
/* Small UI atoms                                                         */
/* ---------------------------------------------------------------------- */
function PulseDivider() {
  return (
    <svg viewBox="0 0 400 24" className="w-full h-6" preserveAspectRatio="none">
      <polyline
        points="0,12 140,12 158,2 172,22 188,4 202,12 400,12"
        fill="none" stroke={C.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        className="pulse-line"
      />
    </svg>
  );
}

function Card({ children, onClick, style, className = "" }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-2xl p-4 transition active:scale-[0.98] ${className}`}
      style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, ...style }}
    >
      {children}
    </button>
  );
}

function BackHeader({ title, subtitle, onBack, accent }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <button onClick={onBack} className="rounded-full p-2 shrink-0" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
        <ChevronLeft size={20} color={C.text} />
      </button>
      <div className="min-w-0">
        <div className="text-lg font-semibold truncate" style={{ color: C.text, fontFamily: "'Oswald', sans-serif", letterSpacing: "0.02em" }}>
          {title}
        </div>
        {subtitle && <div className="text-xs truncate" style={{ color: accent || C.textMuted }}>{subtitle}</div>}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Main App                                                                */
/* ---------------------------------------------------------------------- */
export default function Ironworks() {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [currentExercise, setCurrentExerciseState] = useState({});
  const [view, setView] = useState("main");
  const [answers, setAnswers] = useState({});
  const [activeMovement, setActiveMovement] = useState(null);

  const today = new Date();
  const todayStr = toDateStr(today);
  const todaySchedule = getScheduleForDate(today);
  const todayRecord = records.find((r) => r.date === todayStr);

  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get("ironworks-state", false);
        if (res && res.value) {
          const parsed = JSON.parse(res.value);
          setRecords(pruneRecords(parsed.records || []));
          setCurrentExerciseState(parsed.currentExercise || {});
        }
      } catch (e) {
        // no data yet
      }
      setLoading(false);
    })();
  }, []);

  async function persist(nextRecords, nextCurrentExercise) {
    const pruned = pruneRecords(nextRecords);
    setRecords(pruned);
    setCurrentExerciseState(nextCurrentExercise);
    try {
      await window.storage.set("ironworks-state", JSON.stringify({ records: pruned, currentExercise: nextCurrentExercise }), false);
    } catch (e) {
      console.error("Ironworks: failed to save", e);
    }
  }

  function pickStartingExercise(movementId, exerciseName) {
    const next = { ...currentExercise, [movementId]: exerciseName };
    persist(records, next);
  }

  function startRecording() {
    const init = {};
    todaySchedule.forEach((m) => {
      init[m] = { exercise: currentExercise[m] || null, standard: null, status: null, reps: "" };
    });
    init.cardio = { distanceKm: "" };
    setAnswers(init);
    setView("record-form");
  }

  async function handleSkip() {
    await persist([...records, { date: todayStr, status: "skipped" }], currentExercise);
    setView("main");
  }

  function isFormComplete() {
    const movementsOk = todaySchedule.every((m) => {
      const a = answers[m];
      if (!a || !a.exercise || !a.standard || !a.status) return false;
      if (a.status === "failed") return a.reps !== "" && !isNaN(Number(a.reps)) && Number(a.reps) >= 0;
      return true;
    });
    const c = answers.cardio;
    const cardioOk = c && c.distanceKm !== "" && !isNaN(Number(c.distanceKm)) && Number(c.distanceKm) >= 0;
    return movementsOk && cardioOk;
  }

  async function handleComplete() {
    const entries = todaySchedule.map((m) => {
      const a = answers[m];
      const entry = { movement: m, exercise: a.exercise, standard: a.standard, status: a.status };
      if (a.status === "failed") entry.reps = Number(a.reps);
      return entry;
    });
    const record = {
      date: todayStr,
      status: "completed",
      entries,
      cardio: { distanceKm: Number(answers.cardio.distanceKm) },
    };
    await persist([...records, record], currentExercise);
    setView("main");
  }

  /* ---------------- history helpers ---------------- */
  function getCumulativeWeekly() {
    const dow = today.getDay();
    const diffToMonday = dow === 0 ? -6 : 1 - dow;
    const currentMonday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + diffToMonday);
    const weeks = [];
    let cumCompleted = 0, cumFailed = 0;
    for (let i = 51; i >= 0; i--) {
      const start = new Date(currentMonday); start.setDate(currentMonday.getDate() - 7 * i);
      const end = new Date(start); end.setDate(start.getDate() + 6);
      const startStr = toDateStr(start), endStr = toDateStr(end);
      let wCompleted = 0, wFailed = 0;
      records.forEach((r) => {
        if (r.status === "completed" && r.date >= startStr && r.date <= endStr) {
          (r.entries || []).forEach((e) => {
            if (e.status === "completed") wCompleted += 1;
            else if (e.status === "failed") wFailed += 1;
          });
        }
      });
      cumCompleted += wCompleted;
      cumFailed += wFailed;
      weeks.push({ label: `${start.getMonth() + 1}/${start.getDate()}`, completed: cumCompleted, failed: cumFailed });
    }
    return weeks;
  }

  function getStepStats(movementId, stepName) {
    const counts = {
      beginner: { completed: 0, failed: 0 },
      intermediate: { completed: 0, failed: 0 },
      progression: { completed: 0, failed: 0 },
    };
    records.forEach((r) => {
      if (r.status !== "completed") return;
      (r.entries || []).forEach((e) => {
        if (e.movement === movementId && e.exercise === stepName) counts[e.standard][e.status] += 1;
      });
    });
    return counts;
  }

  function getCardioPoints() {
    return records
      .filter((r) => r.status === "completed" && r.cardio && typeof r.cardio.distanceKm === "number")
      .map((r) => ({ date: r.date, km: r.cardio.distanceKm }))
      .sort((a, b) => a.km - b.km);
  }

  /* ------------------------------------------------------------------ */
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96" style={{ backgroundColor: C.bg }}>
        <Loader2 className="animate-spin" color={C.accent} size={28} />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex justify-center" style={{ backgroundColor: C.bg, fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
        .pulse-line { stroke-dasharray: 500; stroke-dashoffset: 500; animation: dash 2.6s ease-in-out infinite; }
        @keyframes dash { 0% { stroke-dashoffset: 500; opacity: 0.4; } 50% { stroke-dashoffset: 0; opacity: 1; } 100% { stroke-dashoffset: -500; opacity: 0.4; } }
        .glow-btn { animation: glow 1.8s ease-in-out infinite; }
        @keyframes glow { 0%, 100% { box-shadow: 0 0 0px rgba(255,90,54,0.0); } 50% { box-shadow: 0 0 18px rgba(255,90,54,0.55); } }
        @media (prefers-reduced-motion: reduce) { .pulse-line, .glow-btn { animation: none !important; } }
      `}</style>

      <div className="w-full max-w-md px-4 pt-6 pb-10">
        {view === "main" && (
          <MainView
            today={today} todaySchedule={todaySchedule} todayRecord={todayRecord}
            onRecord={() => setView("day")} onHistory={() => setView("history-root")}
          />
        )}

        {view === "day" && (
          <DayView
            todaySchedule={todaySchedule}
            onBack={() => setView("main")}
            onRecord={startRecording}
            onSkip={handleSkip}
          />
        )}

        {view === "record-form" && (
          <RecordFormView
            todaySchedule={todaySchedule}
            answers={answers}
            setAnswers={setAnswers}
            onPickExercise={pickStartingExercise}
            onBack={() => setView("day")}
            onComplete={handleComplete}
            isComplete={isFormComplete()}
          />
        )}

        {view === "history-root" && (
          <HistoryRootView
            weeklyData={getCumulativeWeekly()}
            onBack={() => setView("main")}
            onOpenMovement={(id) => { setActiveMovement(id); setView("history-movement"); }}
            onOpenCardio={() => setView("history-cardio")}
          />
        )}

        {view === "history-movement" && (
          <HistoryMovementView
            movement={getMovement(activeMovement)}
            getStepStats={getStepStats}
            onBack={() => setView("history-root")}
          />
        )}

        {view === "history-cardio" && (
          <HistoryCardioView points={getCardioPoints()} onBack={() => setView("history-root")} />
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* MAIN VIEW                                                              */
/* ---------------------------------------------------------------------- */
function MainView({ today, todaySchedule, todayRecord, onRecord, onHistory }) {
  const recordDisabled = !todaySchedule || !!todayRecord;
  const recordSubtitle = !todaySchedule
    ? "Nothing scheduled"
    : todayRecord
    ? (todayRecord.status === "completed" ? "Completed" : "Skipped")
    : "Not recorded";

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="text-3xl font-bold" style={{ color: C.text, fontFamily: "'Oswald', sans-serif", letterSpacing: "0.05em" }}>
          IRONWORKS
        </div>
        <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full" style={{ backgroundColor: C.surface, color: C.textMuted, border: `1px solid ${C.border}` }}>
          <CalendarDays size={13} />
          {prettyDate(today)}
        </div>
      </div>
      <div className="text-xs mb-2" style={{ color: todaySchedule ? C.accent : C.textMuted }}>
        {todaySchedule ? "Workout Day" : "Rest Day"}
      </div>
      <PulseDivider />

      <div className="grid grid-cols-2 gap-3 mt-6">
        <Card
          onClick={recordDisabled ? undefined : onRecord}
          style={{ opacity: recordDisabled ? 0.45 : 1 }}
          className={recordDisabled ? "cursor-not-allowed" : ""}
        >
          <div className="flex flex-col items-center text-center gap-2 py-2">
            <div className="rounded-xl p-3" style={{ backgroundColor: C.surface2, border: `1px solid ${C.border}` }}>
              <Hammer size={24} color={C.accent} />
            </div>
            <div className="text-base font-semibold" style={{ color: C.text, fontFamily: "'Oswald', sans-serif", letterSpacing: "0.02em" }}>
              Record
            </div>
            <div className="text-xs" style={{ color: todayRecord && todayRecord.status === "completed" ? C.ok : C.textMuted }}>
              {recordSubtitle}
            </div>
          </div>
        </Card>

        <Card onClick={onHistory}>
          <div className="flex flex-col items-center text-center gap-2 py-2">
            <div className="rounded-xl p-3" style={{ backgroundColor: C.surface2, border: `1px solid ${C.border}` }}>
              <History size={24} color={C.text} />
            </div>
            <div className="text-base font-semibold" style={{ color: C.text, fontFamily: "'Oswald', sans-serif", letterSpacing: "0.02em" }}>
              History
            </div>
            <div className="text-xs" style={{ color: C.textMuted }}>
              Training log
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* DAY VIEW (record / skip)                                               */
/* ---------------------------------------------------------------------- */
function DayView({ todaySchedule, onBack, onRecord, onSkip }) {
  return (
    <div>
      <BackHeader title="Today's Session" onBack={onBack} />
      <div className="rounded-2xl p-5" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
        <div className="text-xs uppercase tracking-wide mb-3" style={{ color: C.textMuted }}>
          On the schedule
        </div>
        <div className="flex flex-col gap-2 mb-5">
          {todaySchedule.map((m) => {
            const mDef = getMovement(m);
            const Icon = mDef.icon;
            return (
              <div key={m} className="flex items-center gap-2">
                <Icon size={16} color={C.accent} />
                <span className="text-sm" style={{ color: C.text }}>{mDef.label}</span>
              </div>
            );
          })}
          <div className="flex items-center gap-2">
            <Flame size={16} color={C.accent} />
            <span className="text-sm" style={{ color: C.text }}>Cardio</span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onRecord}
            className="flex-1 rounded-xl py-3 font-semibold text-sm"
            style={{ backgroundColor: C.accent, color: "#0F1115", fontFamily: "'Oswald', sans-serif", letterSpacing: "0.03em" }}
          >
            Record
          </button>
          <button
            onClick={onSkip}
            className="flex-1 rounded-xl py-3 font-semibold text-sm"
            style={{ backgroundColor: "transparent", color: C.textMuted, border: `1px solid ${C.border}`, fontFamily: "'Oswald', sans-serif", letterSpacing: "0.03em" }}
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* RECORD FORM VIEW                                                       */
/* ---------------------------------------------------------------------- */
function RecordFormView({ todaySchedule, answers, setAnswers, onPickExercise, onBack, onComplete, isComplete }) {
  function updateMovement(m, patch) {
    setAnswers({ ...answers, [m]: { ...answers[m], ...patch } });
  }
  function chooseExercise(m, step) {
    onPickExercise(m, step);
    updateMovement(m, { exercise: step, standard: null, status: null, reps: "" });
  }

  return (
    <div className="pb-24">
      <BackHeader title="Record Workout" onBack={onBack} />

      <div className="flex flex-col gap-5">
        {todaySchedule.map((m) => {
          const mDef = getMovement(m);
          const Icon = mDef.icon;
          const a = answers[m];
          return (
            <div key={m} className="rounded-2xl p-4" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
              <div className="flex items-center gap-2 mb-3">
                <Icon size={16} color={C.accent} />
                <div className="text-sm font-semibold" style={{ color: C.text, fontFamily: "'Oswald', sans-serif" }}>
                  {mDef.label}
                </div>
              </div>

              {!a.exercise ? (
                <div>
                  <div className="text-xs mb-2" style={{ color: C.textMuted }}>Choose your starting exercise</div>
                  <div className="flex flex-col gap-1.5">
                    {mDef.steps.map((step, i) => (
                      <button
                        key={step}
                        onClick={() => chooseExercise(m, step)}
                        className="text-left rounded-lg px-3 py-2 text-sm"
                        style={{ backgroundColor: C.surface2, color: C.text, border: `1px solid ${C.border}` }}
                      >
                        <span style={{ color: C.textFaint }}>{i + 1}.</span> {step}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-medium" style={{ color: C.text }}>{a.exercise}</div>
                    <button onClick={() => updateMovement(m, { exercise: null, standard: null, status: null, reps: "" })} className="text-xs" style={{ color: C.textFaint }}>
                      Change
                    </button>
                  </div>

                  <div className="text-xs mb-1.5" style={{ color: C.textMuted }}>Standard</div>
                  <div className="flex gap-2 mb-3">
                    {STANDARDS.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => updateMovement(m, { standard: s.id })}
                        className="flex-1 rounded-lg py-2 text-xs font-semibold"
                        style={{
                          backgroundColor: a.standard === s.id ? C.accent : C.surface2,
                          color: a.standard === s.id ? "#0F1115" : C.textMuted,
                        }}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>

                  <div className="text-xs mb-1.5" style={{ color: C.textMuted }}>Result</div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateMovement(m, { status: "completed" })}
                      className="flex-1 rounded-lg py-2 text-xs font-semibold flex items-center justify-center gap-1"
                      style={{ backgroundColor: a.status === "completed" ? C.ok : C.surface2, color: a.status === "completed" ? "#0F1115" : C.textMuted }}
                    >
                      <Check size={13} /> Completed
                    </button>
                    <button
                      onClick={() => updateMovement(m, { status: "failed" })}
                      className="flex-1 rounded-lg py-2 text-xs font-semibold flex items-center justify-center gap-1"
                      style={{ backgroundColor: a.status === "failed" ? C.fail : C.surface2, color: a.status === "failed" ? "#0F1115" : C.textMuted }}
                    >
                      <X size={13} /> Failed
                    </button>
                  </div>

                  {a.status === "failed" && (
                    <input
                      type="number" min="0" inputMode="numeric" placeholder="Reps completed"
                      value={a.reps}
                      onChange={(e) => updateMovement(m, { reps: e.target.value })}
                      className="w-full rounded-lg px-3 py-2 text-sm outline-none mt-3"
                      style={{ backgroundColor: C.surface2, color: C.text, border: `1px solid ${C.border}` }}
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}

        <div className="rounded-2xl p-4" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
          <div className="flex items-center gap-2 mb-3">
            <Flame size={16} color={C.accent} />
            <div className="text-sm font-semibold" style={{ color: C.text, fontFamily: "'Oswald', sans-serif" }}>Cardio</div>
          </div>
          <input
            type="number" min="0" step="0.1" inputMode="decimal" placeholder="Distance run (km)"
            value={answers.cardio.distanceKm}
            onChange={(e) => setAnswers({ ...answers, cardio: { distanceKm: e.target.value } })}
            className="w-full rounded-lg px-3 py-2 text-sm outline-none"
            style={{ backgroundColor: C.surface2, color: C.text, border: `1px solid ${C.border}` }}
          />
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 flex justify-center pb-6 pt-3 px-4" style={{ background: `linear-gradient(to top, ${C.bg} 60%, transparent)` }}>
        <div className="w-full max-w-md">
          <button
            disabled={!isComplete}
            onClick={onComplete}
            className={`w-full rounded-xl py-3 font-semibold text-sm ${isComplete ? "glow-btn" : ""}`}
            style={{ backgroundColor: isComplete ? C.accent : C.surface2, color: isComplete ? "#0F1115" : C.textFaint, fontFamily: "'Oswald', sans-serif", letterSpacing: "0.03em" }}
          >
            Complete Workout
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* HISTORY: ROOT                                                          */
/* ---------------------------------------------------------------------- */
function HistoryRootView({ weeklyData, onBack, onOpenMovement, onOpenCardio }) {
  return (
    <div>
      <BackHeader title="History" onBack={onBack} />

      <div className="grid grid-cols-4 gap-2.5 mb-6">
        {MOVEMENTS.map((m) => {
          const Icon = m.icon;
          return (
            <button key={m.id} onClick={() => onOpenMovement(m.id)} className="flex flex-col items-center gap-1.5 rounded-xl p-2.5" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
              <Icon size={20} color={C.accent} />
              <span className="text-[10px] text-center leading-tight" style={{ color: C.textMuted }}>{m.label}</span>
            </button>
          );
        })}
        <button onClick={onOpenCardio} className="flex flex-col items-center gap-1.5 rounded-xl p-2.5" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
          <Flame size={20} color={C.accent} />
          <span className="text-[10px] text-center leading-tight" style={{ color: C.textMuted }}>Cardio</span>
        </button>
      </div>

      <div className="rounded-2xl p-4" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
        <div className="text-xs uppercase tracking-wide mb-1" style={{ color: C.textMuted }}>Cumulative attempts</div>
        <div className="text-xs mb-3" style={{ color: C.textFaint }}>Last 52 weeks · completed vs failed</div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={weeklyData} margin={{ top: 5, right: 8, left: -22, bottom: 0 }}>
            <CartesianGrid stroke={C.border} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: C.textFaint, fontSize: 10 }} interval={7} axisLine={{ stroke: C.border }} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fill: C.textFaint, fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ backgroundColor: C.surface2, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }} labelStyle={{ color: C.text }} />
            <Legend wrapperStyle={{ fontSize: 11, color: C.textMuted }} />
            <Line type="monotone" dataKey="completed" name="Completed" stroke={C.ok} strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="failed" name="Failed" stroke={C.fail} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* HISTORY: MOVEMENT DETAIL                                               */
/* ---------------------------------------------------------------------- */
function StatBar({ label, count, max, color }) {
  const pct = max > 0 ? Math.max((count / max) * 100, count > 0 ? 6 : 0) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 text-[10px] shrink-0" style={{ color: C.textFaint }}>{label}</div>
      <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ backgroundColor: C.surface2 }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <div className="w-5 text-[10px] text-right shrink-0" style={{ color: C.textMuted }}>{count}</div>
    </div>
  );
}

function HistoryMovementView({ movement, getStepStats, onBack }) {
  const Icon = movement.icon;
  let maxCount = 1;
  const allStats = movement.steps.map((step) => {
    const s = getStepStats(movement.id, step);
    STANDARDS.forEach((std) => {
      maxCount = Math.max(maxCount, s[std.id].completed, s[std.id].failed);
    });
    return { step, s };
  });

  return (
    <div>
      <BackHeader title={movement.label} onBack={onBack} />
      <div className="flex flex-col gap-3">
        {allStats.map(({ step, s }, i) => {
          const hasAny = STANDARDS.some((std) => s[std.id].completed > 0 || s[std.id].failed > 0);
          return (
            <div key={step} className="rounded-2xl p-3.5 flex gap-3" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
              <div className="rounded-lg p-2 h-fit shrink-0" style={{ backgroundColor: C.surface2 }}>
                <Icon size={16} color={C.accent} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium mb-2 truncate" style={{ color: C.text }}>
                  <span style={{ color: C.textFaint }}>{i + 1}.</span> {step}
                </div>
                {hasAny ? (
                  <div className="flex flex-col gap-1.5">
                    {STANDARDS.map((std) => (
                      <div key={std.id} className="flex flex-col gap-0.5">
                        <StatBar label={std.label} count={s[std.id].completed} max={maxCount} color={C.ok} />
                        <StatBar label="" count={s[std.id].failed} max={maxCount} color={C.fail} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-[11px]" style={{ color: C.textFaint }}>No attempts yet</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* HISTORY: CARDIO DETAIL                                                 */
/* ---------------------------------------------------------------------- */
function HistoryCardioView({ points, onBack }) {
  const data = points.map((p, i) => ({ idx: i + 1, km: p.km, date: p.date }));
  return (
    <div>
      <BackHeader title="Cardio" onBack={onBack} />
      <div className="rounded-2xl p-4" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
        <div className="text-xs uppercase tracking-wide mb-1" style={{ color: C.textMuted }}>Distance per session</div>
        <div className="text-xs mb-3" style={{ color: C.textFaint }}>Shortest to longest</div>
        {data.length === 0 ? (
          <div className="text-sm py-8 text-center" style={{ color: C.textFaint }}>No cardio sessions recorded yet</div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data} margin={{ top: 5, right: 8, left: -22, bottom: 0 }}>
              <CartesianGrid stroke={C.border} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="idx" tick={false} axisLine={{ stroke: C.border }} tickLine={false} />
              <YAxis tick={{ fill: C.textFaint, fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: C.surface2, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: C.text }}
                formatter={(v) => [`${v} km`, "Distance"]}
                labelFormatter={(_, p) => (p && p[0] ? p[0].payload.date : "")}
              />
              <Bar dataKey="km" radius={[4, 4, 0, 0]}>
                {data.map((_, i) => <Cell key={i} fill={C.accent} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
