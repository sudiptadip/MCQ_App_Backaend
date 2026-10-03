import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Trophy,
  Award,
  Zap,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react";
import { storage } from "../../utils/storage";
import { STORAGE_KEYS } from "../../constants";
import type { User } from "../../features/auth/types";
import { getLeaderboard } from "../../features/leaderboard/api/leaderboard.api";
import type { LeaderboardEntry, LeaderboardFilters } from "../../features/leaderboard/types";
import Loading from "../../components/common/Loading";
import Error from "../../components/common/Error";

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const getBarColor = (pct: number) => {
  if (pct >= 88) return "#22c55e";
  if (pct >= 78) return "#6366f1";
  if (pct >= 65) return "#f59e0b";
  return "#f43f5e";
};

const getAccuracyTextColor = (pct: number) => {
  if (pct >= 88) return "#22c55e";
  if (pct >= 78) return "#818cf8";
  if (pct >= 65) return "#f59e0b";
  return "#f43f5e";
};

const initials = (name: string) =>
  name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase() || "??";

// ─── PODIUM CARD ─────────────────────────────────────────────────────────────

interface PodiumProps {
  entry: LeaderboardEntry;
  place: 1 | 2 | 3;
}

type PodiumCfg = {
  badge: string;
  avatarGradient: string;
  ringColor: string;
  cardBg: string;
  cardBorder: string;
  stageGradient: string;
  stageH: number;
  avatarSize: number;
  nameSize: string;
  offsetTop: number;
};

const PODIUM_CFG: Record<1 | 2 | 3, PodiumCfg> = {
  1: {
    badge: "🥇",
    avatarGradient: "linear-gradient(135deg,#fbbf24,#d97706)",
    ringColor: "#f59e0b",
    cardBg: "linear-gradient(180deg,rgba(251,191,36,0.15) 0%,rgba(251,191,36,0.04) 100%)",
    cardBorder: "#f59e0b",
    stageGradient: "linear-gradient(180deg,#fbbf24,#d97706)",
    stageH: 52,
    avatarSize: 72,
    nameSize: "16px",
    offsetTop: 0,
  },
  2: {
    badge: "🥈",
    avatarGradient: "linear-gradient(135deg,#94a3b8,#64748b)",
    ringColor: "#94a3b8",
    cardBg: "linear-gradient(180deg,rgba(148,163,184,0.12) 0%,rgba(148,163,184,0.03) 100%)",
    cardBorder: "#64748b",
    stageGradient: "linear-gradient(180deg,#94a3b8,#64748b)",
    stageH: 36,
    avatarSize: 60,
    nameSize: "14px",
    offsetTop: 32,
  },
  3: {
    badge: "🥉",
    avatarGradient: "linear-gradient(135deg,#fb923c,#ea580c)",
    ringColor: "#fb923c",
    cardBg: "linear-gradient(180deg,rgba(251,146,60,0.12) 0%,rgba(251,146,60,0.03) 100%)",
    cardBorder: "#fb923c",
    stageGradient: "linear-gradient(180deg,#fb923c,#ea580c)",
    stageH: 24,
    avatarSize: 54,
    nameSize: "13px",
    offsetTop: 52,
  },
};

const PodiumCard: React.FC<PodiumProps> = ({ entry, place }) => {
  const c = PODIUM_CFG[place];
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", marginTop: c.offsetTop }}>
      {/* Card */}
      <div
        style={{
          width: "100%",
          background: c.cardBg,
          border: `2px solid ${c.cardBorder}`,
          borderRadius: 24,
          padding: "20px 16px 16px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 0,
          boxShadow: `0 8px 32px ${c.ringColor}33`,
        }}
      >
        {/* Badge */}
        <span style={{ fontSize: 22, lineHeight: 1, marginBottom: 10 }}>{c.badge}</span>

        {/* Avatar circle */}
        <div
          style={{
            width: c.avatarSize,
            height: c.avatarSize,
            borderRadius: "50%",
            background: c.avatarGradient,
            border: `3px solid ${c.ringColor}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 12,
            boxShadow: `0 4px 16px ${c.ringColor}55`,
          }}
        >
          <span style={{ color: "#fff", fontWeight: 900, fontSize: c.avatarSize * 0.3, letterSpacing: -0.5 }}>
            {initials(entry.student_name)}
          </span>
        </div>

        {/* Name */}
        <p
          className="text-slate-800 dark:text-zinc-100"
          style={{
            fontWeight: 900,
            fontSize: c.nameSize,
            textAlign: "center",
            margin: 0,
            lineHeight: 1.2,
            maxWidth: "100%",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {entry.student_name}
        </p>
        <p className="text-slate-400 dark:text-zinc-500" style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, margin: "4px 0 0" }}>
          {entry.franchise_name}
        </p>

        {/* Stats */}
        <div style={{ display: "flex", gap: 8, marginTop: 14, width: "100%" }}>
          <div
            className="border border-slate-200/50 dark:border-zinc-800/80"
            style={{
              flex: 1,
              background: "rgba(99,102,241,0.06)",
              borderRadius: 12,
              padding: "10px 8px",
              textAlign: "center",
            }}
          >
            <p className="text-slate-400 dark:text-zinc-500 font-extrabold" style={{ fontSize: 8, textTransform: "uppercase", letterSpacing: 1, margin: "0 0 3px" }}>
              Marks
            </p>
            <p className="text-slate-800 dark:text-zinc-200" style={{ fontSize: 15, fontWeight: 900, margin: 0 }}>
              {entry.total_marks}
            </p>
          </div>
          <div
            className="border border-slate-200/50 dark:border-zinc-800/80"
            style={{
              flex: 1,
              background: "rgba(99,102,241,0.06)",
              borderRadius: 12,
              padding: "10px 8px",
              textAlign: "center",
            }}
          >
            <p className="text-slate-400 dark:text-zinc-500 font-extrabold" style={{ fontSize: 8, textTransform: "uppercase", letterSpacing: 1, margin: "0 0 3px" }}>
              Accuracy
            </p>
            <p style={{ fontSize: 15, fontWeight: 900, color: getAccuracyTextColor(entry.average_accuracy), margin: 0 }}>
              {entry.average_accuracy}%
            </p>
          </div>
        </div>
      </div>

      {/* Stage block */}
      <div style={{ width: "100%", height: c.stageH, background: c.stageGradient, borderRadius: "0 0 12px 12px", opacity: 0.8 }} />
    </div>
  );
};

// ─── ROSTER ROW ──────────────────────────────────────────────────────────────

interface RosterRowProps {
  entry: LeaderboardEntry;
  isSelf: boolean;
}

const RosterRow: React.FC<RosterRowProps> = ({ entry, isSelf }) => (
  <div
    id={`leaderboard-row-${entry.student_user_id}`}
    className={`
      flex items-center gap-4 px-5 py-4 rounded-[1.5rem] border transition-all duration-200
      ${isSelf
        ? "border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/20 shadow-md shadow-indigo-500/5 dark:shadow-none"
        : "border-slate-200/60 dark:border-zinc-800/85 bg-card hover:border-indigo-300 dark:hover:border-indigo-850 hover:shadow-md"
      }
    `}
  >
    {/* Rank */}
    <div style={{ minWidth: 36, textAlign: "center" }}>
      <span className={`text-sm font-black ${isSelf ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-zinc-500"}`}>
        #{entry.rank}
      </span>
    </div>

    {/* Avatar */}
    <div
      className={`
        h-10 w-10 rounded-xl flex items-center justify-center font-black text-xs shrink-0
        ${isSelf
          ? "bg-indigo-600 text-white"
          : "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-transparent"
        }
      `}
    >
      {initials(entry.student_name)}
    </div>

    {/* Name + franchise */}
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <p className="font-extrabold text-sm text-slate-800 dark:text-zinc-50 truncate margin-0 leading-tight">
          {entry.student_name}
        </p>
        {isSelf && (
          <span className="bg-indigo-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider">
            You
          </span>
        )}
      </div>
      <p className="text-[10px] font-extrabold text-slate-400 dark:text-zinc-500 uppercase tracking-widest truncate mt-1">
        {entry.franchise_name}
      </p>
    </div>

    {/* Stats (hidden small) */}
    <div
      className="lb-stats"
      style={{ display: "flex", alignItems: "center", gap: 28, flexShrink: 0 }}
    >
      <div style={{ textAlign: "center", minWidth: 48 }}>
        <p className="text-[9px] font-extrabold text-slate-400 dark:text-zinc-500 uppercase tracking-widest margin-0">
          Attempts
        </p>
        <p className="text-xs font-black text-slate-700 dark:text-zinc-200 mt-1">
          {entry.total_attempts}
        </p>
      </div>
      <div style={{ textAlign: "center", minWidth: 52 }}>
        <p className="text-[9px] font-extrabold text-slate-400 dark:text-zinc-500 uppercase tracking-widest margin-0">
          Solved
        </p>
        <p className="text-xs font-black text-slate-700 dark:text-zinc-200 mt-1">
          {entry.total_questions_solved}
        </p>
      </div>
      {/* Accuracy bar */}
      <div style={{ minWidth: 130 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
          <span className="text-[9px] font-extrabold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
            Accuracy
          </span>
          <span style={{ fontSize: 11, fontWeight: 900, color: getAccuracyTextColor(entry.average_accuracy) }}>
            {entry.average_accuracy}%
          </span>
        </div>
        <div className="h-1.5 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
          <div
            style={{
              height: "100%",
              width: `${entry.average_accuracy}%`,
              background: getBarColor(entry.average_accuracy),
              borderRadius: 6,
              transition: "width 0.8s ease",
            }}
          />
        </div>
      </div>
    </div>

    {/* Marks chip */}
    <div
      className={`
        shrink-0 p-2.5 rounded-xl text-center min-w-[68px]
        ${isSelf
          ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
          : "bg-slate-50 dark:bg-zinc-800/80 border border-slate-200/60 dark:border-zinc-800/80 text-slate-700 dark:text-zinc-100"
        }
      `}
    >
      <p className="text-xs font-black leading-none">
        {entry.total_marks}
      </p>
      <p className={`text-[8px] font-extrabold mt-1 tracking-wider uppercase ${isSelf ? "text-indigo-200" : "text-slate-450 dark:text-zinc-500"}`}>
        pts
      </p>
    </div>
  </div>
);

// ─── MAIN LEADERBOARD PAGE ───────────────────────────────────────────────────

const LeaderboardPage: React.FC = () => {
  const currentUser = storage.get<User>(STORAGE_KEYS.USER);
  const [sort, setSort] = useState<"marks" | "practice">("marks");

  useEffect(() => {
    document.title = "Weekly Leaderboard | MCQ App";
  }, []);

  const filters: LeaderboardFilters = {
    time_range: "week",
    franchise_id: null,
    sort_by: sort
  };

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["leaderboard", filters],
    queryFn: () => getLeaderboard(filters),
    retry: 1,
  });

  const mySelf = data?.find((e) => e.student_user_id === Number(currentUser?.id ?? 999));
  const p1 = data?.find((e) => e.rank === 1);
  const p2 = data?.find((e) => e.rank === 2);
  const p3 = data?.find((e) => e.rank === 3);

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .lb-stats { display: none !important; }
        }
      `}</style>

      <div style={{ paddingBottom: 100 }} className="space-y-8 animate-in fade-in duration-500">
        {/* ── HERO BANNER ─────────────────────────────────────────────── */}
        <div
          style={{
            position: "relative",
            overflow: "hidden",
            borderRadius: 24,
            padding: "36px 36px 32px",
            background: "linear-gradient(135deg,#4f46e5 0%,#7c3aed 55%,#9333ea 100%)",
          }}
        >
          {/* Mesh Dot pattern */}
          <div
            style={{
              position: "absolute", inset: 0, opacity: 0.12,
              backgroundImage: "radial-gradient(white 1.5px,transparent 1.5px)",
              backgroundSize: "28px 28px",
              pointerEvents: "none",
            }}
          />

          <div style={{ position: "relative", zIndex: 1, display: "flex", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: 24 }}>
            {/* Left Header */}
            <div>
              <span
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  fontSize: 10, fontWeight: 800, letterSpacing: 2,
                  textTransform: "uppercase", color: "#fde68a",
                  background: "rgba(255,255,255,0.15)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  padding: "6px 14px", borderRadius: 999, marginBottom: 14,
                }}
              >
                <Trophy size={12} fill="#fde68a" /> Weekly Standings
              </span>
              <h1 style={{ fontSize: 32, fontWeight: 900, color: "#fff", margin: 0, letterSpacing: -0.5, lineHeight: 1.1 }}>
                Weekly <span style={{ color: "#c4b5fd" }}>Leaderboard</span>
              </h1>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.65)", margin: "10px 0 0", lineHeight: 1.6 }}>
                Top students ranked by this week's practice performance.
              </p>
            </div>

            {/* Right sort switches */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-end" }}>
              <div
                style={{
                  display: "flex", background: "rgba(0,0,0,0.2)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 12, padding: 4,
                }}
              >
                {(["marks", "practice"] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setSort(v)}
                    style={{
                      display: "flex", alignItems: "center", gap: 6,
                      padding: "8px 16px", borderRadius: 9, border: "none", cursor: "pointer",
                      fontSize: 12, fontWeight: 800, transition: "all 0.2s",
                      background: sort === v ? "#fff" : "transparent",
                      color: sort === v ? "#4f46e5" : "rgba(255,255,255,0.7)",
                    }}
                  >
                    {v === "marks" ? <Award size={13} /> : <Zap size={13} />}
                    {v === "marks" ? "By Marks" : "By Practice"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── CORE VIEWS ──────────────────────────────────────────────── */}
        {isLoading && (
          <div className="py-24 bg-card rounded-[2.5rem] border border-border shadow-sm flex items-center justify-center">
            <Loading message="Fetching real-time rankings..." />
          </div>
        )}

        {isError && (
          <div className="py-12">
            <Error
              title="Failed to Load Leaderboard"
              message="The backend rankings API appears offline. Please ensure the SpLeaderboard stored procedure has been executed successfully."
              onRetry={refetch}
            />
          </div>
        )}

        {!isLoading && !isError && data && (
          <>
            {data.length === 0 ? (
              <div className="py-24 text-center bg-card rounded-[2.5rem] border border-border">
                <Trophy size={48} className="mx-auto text-slate-350 dark:text-zinc-600 mb-4" />
                <h3 className="text-lg font-bold text-slate-800 dark:text-zinc-200">No Standings Yet</h3>
                <p className="text-sm text-slate-500 dark:text-zinc-500 mt-2">
                  Be the first student to practice and take the lead on the board!
                </p>
              </div>
            ) : (
              <>
                {/* ── PODIUM SECTION ──────────────────────────────────────────── */}
                <div style={{ marginBottom: 40 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-end",
                      gap: 12,
                      maxWidth: 680,
                      margin: "0 auto",
                    }}
                  >
                    {/* Rank 2 (Left card) */}
                    {p2 && <PodiumCard entry={p2} place={2} />}
                    {/* Rank 1 (Center card, tallest) */}
                    {p1 && <PodiumCard entry={p1} place={1} />}
                    {/* Rank 3 (Right card) */}
                    {p3 && <PodiumCard entry={p3} place={3} />}
                  </div>
                </div>

                {/* ── FULL STANDINGS Roster ────────────────────────────────────── */}
                <div className="space-y-4 pt-2">
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 4px" }}>
                    <h2 className="text-base font-black text-slate-800 dark:text-zinc-50 flex items-center gap-2">
                      <TrendingUp size={18} className="text-indigo-500" />
                      Full Standings
                    </h2>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                      {data.length} students
                    </span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {data.map((entry) => (
                      <RosterRow
                        key={entry.student_user_id}
                        entry={entry}
                        isSelf={entry.student_user_id === Number(currentUser?.id ?? 999)}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* ── STICKY YOUR RANK FOOTER ──────────────────────────────────── */}
        {!isLoading && !isError && mySelf && (
          <div style={{ position: "sticky", bottom: 16, zIndex: 30, marginTop: 32 }}>
            <div
              style={{
                background: "linear-gradient(135deg,#0f172a 0%,#1e1b4b 50%,#0f172a 100%)",
                border: "1px solid rgba(99,102,241,0.3)",
                borderRadius: 20,
                padding: "14px 20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
                boxShadow: "0 8px 40px rgba(99,102,241,0.25), 0 2px 8px rgba(0,0,0,0.5)",
              }}
            >
              {/* Left Rank */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                <div
                  style={{
                    width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                    background: "linear-gradient(135deg,#fbbf24,#d97706)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 900, fontSize: 13, color: "#451a03",
                  }}
                >
                  #{mySelf.rank}
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontWeight: 850, fontSize: 13, color: "#f1f5f9", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {mySelf.student_name}
                  </p>
                  <p style={{ fontSize: 10, color: "#818cf8", fontWeight: 700, margin: "2px 0 0" }}>
                    Your weekly rank
                  </p>
                </div>
              </div>

              {/* Stats Center */}
              <div className="lb-stats" style={{ display: "flex", alignItems: "center", gap: 24, flexShrink: 0 }}>
                {[
                  { label: "Attempts", value: mySelf.total_attempts, color: "#e2e8f0" },
                  { label: "Accuracy", value: `${mySelf.average_accuracy}%`, color: "#fde68a" },
                  { label: "Marks", value: `${mySelf.total_marks} pts`, color: "#34d399" },
                ].map((s, i) => (
                  <React.Fragment key={s.label}>
                    {i > 0 && <div style={{ width: 1, height: 28, background: "rgba(99,102,241,0.3)" }} />}
                    <div style={{ textAlign: "center" }}>
                      <p style={{ fontSize: 9, color: "#6366f1", fontWeight: 800, textTransform: "uppercase", letterSpacing: 1.5, margin: "0 0 3px" }}>
                        {s.label}
                      </p>
                      <p style={{ fontSize: 14, fontWeight: 900, color: s.color, margin: 0 }}>
                        {s.value}
                      </p>
                    </div>
                  </React.Fragment>
                ))}
              </div>

              {/* Locator scroll-to */}
              <button
                onClick={() => {
                  const el = document.getElementById(`leaderboard-row-${mySelf.student_user_id}`);
                  el?.scrollIntoView({ behavior: "smooth", block: "center" });
                }}
                style={{
                  flexShrink: 0,
                  display: "flex", alignItems: "center", gap: 6,
                  background: "#fff", color: "#1e1b4b",
                  fontSize: 11, fontWeight: 900,
                  padding: "9px 16px", borderRadius: 12, border: "none",
                  cursor: "pointer", transition: "all 0.15s ease",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.04)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
              >
                Find Me <ArrowUpRight size={13} />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default LeaderboardPage;
