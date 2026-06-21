import React, { useState } from "react";
import { Match } from "../types";
import { ShieldCheck, Crosshair, Award, Flame, Users, Sparkles, Trophy } from "lucide-react";

interface MatchPredictionModuleProps {
  userId: string;
  match: Match;
  onPredictionSubmitted: () => void;
  onClose: () => void;
}

export function MatchPredictionModule({ userId, match, onPredictionSubmitted, onClose }: MatchPredictionModuleProps) {
  // Input form parameters
  const [winner, setWinner] = useState<"A" | "B" | "draw" | "">("");
  const [scoreA, setScoreA] = useState<number>(0);
  const [scoreB, setScoreB] = useState<number>(0);
  const [firstGoalTeam, setFirstGoalTeam] = useState<"A" | "B" | "none">("A");
  const [firstGoalScorer, setFirstGoalScorer] = useState<string>("");
  const [totalGoals, setTotalGoals] = useState<number>(0);
  const [possession, setPossession] = useState<number>(50); // Predicted Team A possession
  const [manOfTheMatch, setManOfTheMatch] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const checkStatus = () => {
    if (match.status !== "upcoming" || match.locked) {
      return { allowed: false, reason: "❌ Match is locked or has already started/completed." };
    }
    const matchDate = new Date(match.startTime);
    const now = new Date();

    if (now.getTime() >= matchDate.getTime()) {
      return { allowed: false, reason: "❌ After match start → NOT allowed. Predictions are closed!" };
    }

    const matchYear = matchDate.getFullYear();
    const matchMonth = matchDate.getMonth();
    const matchDay = matchDate.getDate();

    const nowYear = now.getFullYear();
    const nowMonth = now.getMonth();
    const nowDay = now.getDate();

    const matchMidnight = new Date(matchYear, matchMonth, matchDay);
    const nowMidnight = new Date(nowYear, nowMonth, nowDay);

    const diffTime = matchMidnight.getTime() - nowMidnight.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return { allowed: false, reason: "❌ Same day prediction → NOT allowed. Predictions close at midnight of the match day." };
    } else if (diffDays > 1) {
      return { allowed: false, reason: "❌ More than 1 day before → NOT allowed. Predictions open exactly 1 day before kickoff." };
    } else if (diffDays < 0) {
      return { allowed: false, reason: "❌ Match date has already passed." };
    }

    return { allowed: true, reason: "✅ Prediction is open! (Exactly 1 day before kickoff)" };
  };

  const predictionStatus = checkStatus();

  const adjustScoreA = (newValue: number) => {
    const val = Math.max(0, newValue);
    setScoreA(val);
    if (val > scoreB) {
      setWinner("A");
    } else if (val < scoreB) {
      setWinner("B");
    } else {
      setWinner("draw");
    }
  };

  const adjustScoreB = (newValue: number) => {
    const val = Math.max(0, newValue);
    setScoreB(val);
    if (scoreA > val) {
      setWinner("A");
    } else if (scoreA < val) {
      setWinner("B");
    } else {
      setWinner("draw");
    }
  };

  const handleWinnerSelect = (selectedWinner: "A" | "B" | "draw") => {
    setWinner(selectedWinner);
    if (selectedWinner === "A" && scoreA <= scoreB) {
      setScoreA(scoreB + 1);
    } else if (selectedWinner === "B" && scoreB <= scoreA) {
      setScoreB(scoreA + 1);
    } else if (selectedWinner === "draw" && scoreA !== scoreB) {
      setScoreB(scoreA);
    }
  };

  const handlePredictSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!predictionStatus.allowed) {
      alert(`Submission blocked: ${predictionStatus.reason}`);
      return;
    }

    if (match.status !== "upcoming") {
      alert("This match has kicked off! Predictions are officially locked.");
      return;
    }

    if (!winner) {
      setErrorMsg("Please select a predicted Winner Team (or forecast DRAW) before locking your forecast!");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const response = await fetch("/api/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          matchId: match.id,
          predictedWinner: winner,
          predictedScoreA: scoreA,
          predictedScoreB: scoreB,
          firstGoalTeam,
          firstGoalScorer: firstGoalScorer || "None",
          totalGoals,
          possession,
          manOfTheMatch: manOfTheMatch || "TBD",
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setSuccessMsg("🎉 Forecast submitted successfully!");
        setTimeout(() => {
          onPredictionSubmitted();
        }, 1500);
      } else {
        setErrorMsg(data.error || "Roster submission failure.");
      }
    } catch (err) {
      setErrorMsg("Network error trying to process game predictive sheet.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#050A18] border border-[#00D1FF]/30 rounded-2xl w-full max-w-2xl p-6 relative shadow-2xl my-8">
        
        <div className="flex justify-between items-start mb-6 pb-2 border-b border-slate-800">
          <div>
            <h2 className="text-xl sm:text-2xl font-display font-bold text-white uppercase tracking-tight">Predict Match Sheet</h2>
            <p className="text-xs text-gray-400 mt-1">FIFA World Cup 2026 Prediction Card</p>
          </div>
          <button 
            id="btn_close_prediction" 
            onClick={onClose} 
            className="text-gray-400 hover:text-white text-sm font-mono hover:bg-slate-800 px-2.5 py-1 rounded transition-all"
          >
            ✕ CANCEL
          </button>
        </div>

        {/* Prediction window warning alert box */}
        <div className={`p-3 rounded-xl border mb-4 font-sans text-xs flex items-center gap-2.5 ${
          predictionStatus.allowed 
            ? "bg-emerald-950/35 text-emerald-400 border-emerald-500/25" 
            : "bg-red-950/35 text-red-400 border-red-500/25 animate-pulse"
        }`}>
          <Flame className="w-4.5 h-4.5 shrink-0" />
          <div>
            <span className="font-bold block uppercase tracking-wider text-[10px]">Prediction window status</span>
            <p className="mt-0.5">{predictionStatus.reason}</p>
          </div>
        </div>

        {/* Dynamic Points breakdown Reference table banner */}
        <div className="bg-white/5 p-4 rounded-xl border border-white/10 mb-6 flex flex-col sm:flex-row justify-between gap-4 font-mono select-none">
          <div>
            <span className="text-[10px] text-fifa-gold font-bold uppercase tracking-widest block mb-1">SCORE MATRIX POINTS</span>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-300">
              <span className="flex items-center gap-1">🏆 Winner/Draw: <strong className="text-fifa-neon">+3 points</strong></span>
              <span className="flex items-center gap-1">🎯 Exact Score: <strong className="text-fifa-neon">+5 points</strong></span>
              <span className="flex items-center gap-1">⚽ Total Points: <strong className="text-fifa-neon">Max 5 standard points</strong></span>
              <span className="flex items-center gap-1 text-[10px] text-slate-400 italic">Winners settled automatically</span>
            </div>
          </div>
          <div className="self-center hidden sm:block border-l border-slate-800 pl-4">
            <span className="text-slate-500 text-[10px] uppercase font-bold tracking-widest block mb-1">PREDICTING RULES</span>
            <span className="text-white font-extrabold text-[11px] block">Exactly before kick-off whistle</span>
          </div>
        </div>

        {/* Main interactive Predict form */}
        <form onSubmit={handlePredictSubmit} className="space-y-6">

          {/* Winner and Score Grid */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl space-y-3 col-span-1 md:col-span-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">1. Predict Winner (टिम छनोट गर्नुहोस)</span>
              <div className="grid grid-cols-3 gap-2 text-xs font-bold font-mono">
                {[
                  { id: "A", label: match.teamA, flag: match.flagA },
                  { id: "draw", label: "DRAW (बराबर)", flag: "🤝" },
                  { id: "B", label: match.teamB, flag: match.flagB },
                ].map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => handleWinnerSelect(item.id as any)}
                    className={`py-3 px-1 rounded-lg text-center cursor-pointer border uppercase tracking-wider transition-all flex flex-col items-center justify-center gap-1 ${
                      winner === item.id 
                        ? "border-fifa-gold bg-fifa-gold/15 text-white font-black scale-102 ring-1 ring-fifa-gold/30" 
                        : "border-slate-800 text-slate-400 hover:text-white bg-slate-905"
                    }`}
                  >
                    <span className="text-2xl filter drop-shadow-sm leading-none">{item.flag}</span>
                    <span className="text-[10px] sm:text-xs truncate max-w-full text-center block">{item.label}</span>
                  </button>
                ))}
              </div>

              {/* Real Date dynamic team vs question immediately shown as soon as team is selected */}
              {winner ? (
                <div className="mt-2.5 p-3.5 rounded-lg bg-linear-to-r from-fifa-blue/50 to-slate-900/60 border border-fifa-neon/20 space-y-2.5">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="bg-fifa-neon/20 text-fifa-neon font-mono text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider leading-none">
                      Active Poll Question
                    </span>
                    <span className="text-[9px] text-gray-400 font-mono leading-none">
                      📅 Real Kickoff: {match.nptTime || new Date(match.startTime).toLocaleString()}
                    </span>
                  </div>

                  <h3 className="text-xs sm:text-sm font-semibold text-white tracking-wide font-sans leading-normal">
                    {match.customWinnerQuestion || `Question: Which team will win the match between ${match.teamA} and ${match.teamB} on the real-world schedule?`}
                  </h3>

                  <div className="p-2.5 bg-black/45 rounded-md border border-white/5 font-mono text-[11px] flex justify-between items-center text-slate-300">
                    <span>
                      Selection:{" "}
                      <strong className="text-fifa-gold">
                        {winner === "A" ? `${match.flagA} ${match.teamA}` : winner === "B" ? `${match.flagB} ${match.teamB}` : "🤝 DRAW (बराबर)"}
                      </strong>
                    </span>
                    <span className="text-[9px] text-emerald-400 font-bold uppercase">
                      ✓ Active
                    </span>
                  </div>
                </div>
              ) : (
                <div className="mt-2 p-2.5 text-center text-[10px] text-gray-500 font-mono italic bg-slate-900/10 rounded-lg border border-dashed border-slate-850">
                  👆 Select a team/result option above to display the real-world kickoff question.
                </div>
              )}
            </div>

            <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl space-y-3 col-span-1 md:col-span-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block font-mono">2. Exact Match Score Prediction</span>
              <div className="flex items-center justify-center gap-4 font-mono">
                <div className="text-center">
                  <span className="text-xs text-slate-400 block mb-1">{match.teamA}</span>
                  <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1">
                    <button type="button" onClick={() => adjustScoreA(scoreA - 1)} className="text-white px-2 cursor-pointer">-</button>
                    <span className="w-8 text-center text-sm font-bold text-white">{scoreA}</span>
                    <button type="button" onClick={() => adjustScoreA(scoreA + 1)} className="text-white px-2 cursor-pointer">+</button>
                  </div>
                </div>
                <span className="text-slate-500 font-bold self-end mb-2">:</span>
                <div className="text-center">
                  <span className="text-xs text-slate-400 block mb-1">{match.teamB}</span>
                  <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1">
                    <button type="button" onClick={() => adjustScoreB(scoreB - 1)} className="text-white px-2 cursor-pointer">-</button>
                    <span className="w-8 text-center text-sm font-bold text-white">{scoreB}</span>
                    <button type="button" onClick={() => adjustScoreB(scoreB + 1)} className="text-white px-2 cursor-pointer">+</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* First Goal Team and total goals */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl space-y-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">3. First Goal Scoring Team</span>
              <div className="flex gap-2 text-xs font-bold font-mono">
                {[
                  { id: "A", label: match.teamA },
                  { id: "none", label: "NO GOAL" },
                  { id: "B", label: match.teamB },
                ].map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => setFirstGoalTeam(item.id as any)}
                    className={`flex-1 py-2 rounded text-center cursor-pointer border uppercase tracking-wider transition-all ${
                      firstGoalTeam === item.id 
                        ? "border-fifa-gold bg-fifa-gold/10 text-white font-black" 
                        : "border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl space-y-3 font-mono">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">4. Total Match Goals</span>
                <span className="text-xs text-fifa-neon font-bold">{totalGoals} GOALS</span>
              </div>
              <input 
                type="range" 
                min={0} 
                max={10} 
                value={totalGoals}
                onChange={(e) => setTotalGoals(Number(e.target.value))}
                className="w-full accent-fifa-neon cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-gray-500">
                <span>0 Goals</span>
                <span>5 Goals</span>
                <span>10+ goals</span>
              </div>
            </div>
          </div>

          {/* Scorer inputs and Possession slider */}
          <div className="grid md:grid-cols-2 gap-4 font-mono">
            
            <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">5. First Goal Scorer</label>
                <input 
                  type="text" 
                  placeholder="e.g. Christian Pulisic or Manish Dangi"
                  value={firstGoalScorer}
                  onChange={(e) => setFirstGoalScorer(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-white focus:outline-none focus:border-fifa-gold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">6. Game Man of the Match (MOM)</label>
                <input 
                  type="text" 
                  placeholder="e.g. Kiran Limbu"
                  value={manOfTheMatch}
                  onChange={(e) => setManOfTheMatch(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-white focus:outline-none focus:border-fifa-gold"
                />
              </div>
            </div>

            <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">7. Predicted Possession Balance</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-white mb-2">
                  <span>{match.teamA}: {possession}%</span>
                  <span>{match.teamB}: {100 - possession}%</span>
                </div>
                <input 
                  type="range" 
                  min={10} 
                  max={90} 
                  value={possession}
                  onChange={(e) => setPossession(Number(e.target.value))}
                  className="w-full accent-fifa-gold cursor-pointer"
                />
              </div>
              <div className="text-[10px] text-slate-500 leading-normal border-t border-slate-900 pt-2 select-none">
                🏆 Accuracy matching within ±5% possession calculates standard platform validation.
              </div>
            </div>

          </div>

          {errorMsg && (
            <div className="text-red-400 text-xs text-center border border-red-500/30 p-2.5 rounded bg-red-950/20">
              ⚠️ {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="text-emerald-400 text-xs text-center border border-emerald-500/30 p-2.5 rounded bg-emerald-950/20 font-bold">
              {successMsg}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="bg-slate-850 hover:bg-slate-800 text-gray-300 py-2.5 px-5 rounded-xl cursor-pointer text-xs font-bold tracking-wider"
            >
              CANCEL
            </button>
            <button
              id="btn_predict_submit"
              type="submit"
              disabled={loading || !predictionStatus.allowed}
              className={`py-2.5 px-6 rounded-xl shadow-lg hover:scale-102 font-bold text-xs tracking-wider uppercase inline-flex items-center gap-1.5 transition-all ${
                predictionStatus.allowed 
                  ? "bg-gradient-to-r from-fifa-gold to-yellow-500 hover:from-yellow-400 hover:to-fifa-gold text-fifa-blue cursor-pointer" 
                  : "bg-slate-850 text-slate-500 border border-slate-800 cursor-not-allowed"
              }`}
            >
              <ShieldCheck className="w-4 h-4 shrink-0" />
              {loading ? "Locking ballot..." : predictionStatus.allowed ? "Lock Predictions" : "Predictions Locked"}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
