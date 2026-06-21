import React, { useState } from "react";
import { Sparkles, BarChart2, Star, Trophy, RefreshCw, Compass, AlertCircle } from "lucide-react";

interface Team {
  name: string;
  flag: string;
  group: string;
  fifaRanking: number;
  coach: string;
  squad: string[];
  stats: { played: number; won: number; drawn: number; lost: number; goalsFor: number; goalsAgainst: number };
  previousWC: string;
  perfHistory: number[]; // numerical rating logs
}

interface FifaTeamDatabaseProps {
  teams: Team[];
}

export function FifaTeamDatabase({ teams }: FifaTeamDatabaseProps) {
  const [selectedTeam, setSelectedTeam] = useState<Team>(teams[0] || null);

  // Gemini AI recommendation state
  const [teamAAnalysis, setTeamAAnalysis] = useState<string>("Nepal");
  const [teamBAnalysis, setTeamBAnalysis] = useState<string>("USA");
  const [aiReport, setAiReport] = useState<string>("");
  const [aiLoading, setAiLoading] = useState<boolean>(false);

  const fetchGeminiInsights = async () => {
    if (teamAAnalysis.toLowerCase() === teamBAnalysis.toLowerCase()) {
      alert("Please select distinct rival teams for the analysis.");
      return;
    }

    setAiLoading(true);
    setAiReport("");

    try {
      const response = await fetch("/api/gemini/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamA: teamAAnalysis, teamB: teamBAnalysis }),
      });

      const data = await response.json();
      if (response.ok && data.text) {
        setAiReport(data.text);
      } else {
        setAiReport(`⚠️ Gemini error: ${data.error || "Rivalry calculation error"}`);
      }
    } catch (err) {
      setAiReport("⚠️ System could not fetch insights. Verify backend server running status.");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="relative z-10 w-full max-w-6xl mx-auto px-4 py-6 font-sans">
      
      {/* Title block */}
      <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-slate-800">
        <Trophy className="w-6 h-6 text-fifa-gold" />
        <div>
          <h2 className="text-xl sm:text-2xl font-display font-bold text-white uppercase tracking-tight">Teams Standing & AI Insights</h2>
          <p className="text-xs text-slate-400 mt-1">FIFA World Cup 2026 Core Roster and Gemini Analytical Engine</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 items-start">
        
        {/* Left: Teams Sidebar list */}
        <div className="lg:col-span-1 space-y-3">
          <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest block mb-1">Participating Roster</span>
          <div className="bg-white/5 border border-white/10 rounded-xl max-h-[450px] overflow-y-auto p-2 space-y-1.5 shadow-xl select-none">
            {teams.map((t) => {
              const isSelected = selectedTeam?.name === t.name;
              return (
                <button
                  key={t.name}
                  onClick={() => setSelectedTeam(t)}
                  className={`w-full text-left p-3 rounded-lg border text-xs font-mono font-bold flex items-center justify-between transition-all cursor-pointer ${
                    isSelected 
                      ? "border-fifa-gold bg-fifa-gold/10 text-white" 
                      : "border-transparent bg-transparent text-slate-400 hover:bg-slate-950 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-2xl filter drop-shadow-sm">{t.flag}</span>
                    <span>{t.name}</span>
                  </div>
                  <span className="text-[10px] text-gray-500 font-normal">Rank #{t.fifaRanking}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Center: Selected Team stats details (1/3) */}
        {selectedTeam && (
          <div className="lg:col-span-2 space-y-6">
            
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
              {/* Gold gradient burst */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-fifa-gold/5 rounded-full blur-3xl" />
              
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <span className="text-5xl filter drop-shadow-lg">{selectedTeam.flag}</span>
                  <div>
                    <h3 className="text-2xl font-display font-black text-white uppercase">{selectedTeam.name}</h3>
                    <span className="text-xs font-mono text-fifa-neon tracking-wide">Coach: {selectedTeam.coach}</span>
                  </div>
                </div>
                <div className="bg-slate-950 px-3.5 py-1.5 border border-slate-800 rounded-xl text-center font-mono">
                  <span className="text-[9px] text-slate-500 block uppercase font-bold tracking-widest">FIFA RANK</span>
                  <span className="text-base font-extrabold text-fifa-gold">#{selectedTeam.fifaRanking}</span>
                </div>
              </div>

              {/* Stats table */}
              <div className="grid grid-cols-6 gap-2 text-center font-mono text-xs mb-6 select-none bg-slate-950 p-3 rounded-xl border border-slate-850">
                {[
                  { label: "GP", val: selectedTeam.stats.played },
                  { label: "W", val: selectedTeam.stats.won },
                  { label: "D", val: selectedTeam.stats.drawn },
                  { label: "L", val: selectedTeam.stats.lost },
                  { label: "GF", val: selectedTeam.stats.goalsFor },
                  { label: "GA", val: selectedTeam.stats.goalsAgainst },
                ].map((st, i) => (
                  <div key={i} className="border-r border-slate-800/80 last:border-r-0">
                    <span className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">{st.label}</span>
                    <span className="block text-white font-extrabold text-sm sm:text-base mt-0.5">{st.val}</span>
                  </div>
                ))}
              </div>

              {/* Performance graph - pure lightweight responsive inline SVG */}
              <div className="mb-6">
                <span className="text-slate-400 text-[10px] uppercase font-mono font-bold tracking-widest mb-2 block">Team Performance Trend Graph</span>
                <div className="w-full bg-slate-950 p-4 rounded-xl border border-slate-800 h-32 relative select-none">
                  <svg className="w-full h-full" viewBox="0 0 500 100" preserveAspectRatio="none">
                    {/* Gridlines */}
                    <line x1="0" y1="20" x2="500" y2="20" stroke="#1e293b" strokeDasharray="3,3" />
                    <line x1="0" y1="50" x2="500" y2="50" stroke="#1e293b" strokeDasharray="3,3" />
                    <line x1="0" y1="80" x2="500" y2="80" stroke="#1e293b" strokeDasharray="3,3" />
                    
                    {/* Polynomial line connection */}
                    <polyline
                      fill="none"
                      stroke="#FFD700"
                      strokeWidth="3.5"
                      points={selectedTeam.perfHistory.map((val, i) => `${i * 125},${100 - val}`).join(" ")}
                    />

                    {/* Data dots */}
                    {selectedTeam.perfHistory.map((val, i) => (
                      <circle
                        key={i}
                        cx={i * 125}
                        cy={100 - val}
                        r="5"
                        fill="#00D1FF"
                        stroke="#050d18"
                        strokeWidth="2"
                      />
                    ))}
                  </svg>
                  <div className="flex justify-between text-[8px] font-mono font-bold text-gray-500 uppercase mt-2">
                    <span>Group Playoff 1</span>
                    <span>Qualification 2</span>
                    <span>Final Knockout Preps</span>
                  </div>
                </div>
              </div>

              {/* Records and Squad */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                  <h4 className="text-xs text-fifa-gold font-bold font-mono tracking-widest uppercase">History WC Records</h4>
                  <p className="text-slate-300 text-xs font-mono leading-relaxed">{selectedTeam.previousWC}</p>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                  <h4 className="text-xs text-fifa-neon font-bold font-mono tracking-widest uppercase">Squad Details</h4>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {selectedTeam.squad.map((p) => (
                      <span key={p} className="bg-slate-900 border border-slate-800 text-[10px] font-mono px-2 py-0.5 rounded text-white">
                        🏃 {p}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

      </div>

      {/* Dynamic Gemini Analytical Prediction insights block (Horizontal full viewport) */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl mt-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-fifa-neon/5 rounded-full blur-3xl" />
        
        <div className="flex items-center gap-2 mb-4 border-b border-slate-800/80 pb-3">
          <Sparkles className="w-5 h-5 text-fifa-gold shrink-0 animate-spin-slow" />
          <h3 className="font-display font-bold text-white uppercase tracking-wider">Ask standard Gemini Rivalry Coach</h3>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-6 pb-4 border-b border-slate-800/50">
          <p className="text-xs text-slate-400 max-w-md">
            Query the deep prediction analysis algorithms driven securely server-side by Google Gemini Flash parameters. Select any two competing nations to trigger!
          </p>
          <div className="flex gap-2 items-center font-mono text-xs">
            {/* Team A selector */}
            <select
              value={teamAAnalysis}
              onChange={(e) => setTeamAAnalysis(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded p-2 text-white font-mono"
            >
              {teams.map((t) => (
                <option key={t.name} value={t.name}>{t.name}</option>
              ))}
            </select>
            <span className="text-slate-500 font-bold">VS</span>
            {/* Team B selector */}
            <select
              value={teamBAnalysis}
              onChange={(e) => setTeamBAnalysis(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded p-2 text-white font-mono"
            >
              {teams.map((t) => (
                <option key={t.name} value={t.name}>{t.name}</option>
              ))}
            </select>

            <button
              id="btn_gemini_predict"
              disabled={aiLoading}
              onClick={fetchGeminiInsights}
              className="bg-linear-to-r from-fifa-gold to-yellow-500 hover:from-yellow-400 hover:to-fifa-gold text-fifa-blue font-bold px-4 py-2 rounded shadow-md cursor-pointer transition-all uppercase text-[10px] tracking-wider shrink-0"
            >
              {aiLoading ? "Consulting AI..." : "Launch Analysis"}
            </button>
          </div>
        </div>

        {/* AI Report Card */}
        {aiReport ? (
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-850 font-mono text-xs leading-relaxed max-w-4xl mx-auto block max-h-[300px] overflow-y-auto whitespace-pre-wrap select-text text-slate-200">
            {aiReport}
          </div>
        ) : (
          aiLoading && (
            <div className="flex flex-col items-center justify-center py-10 select-none font-mono">
              <RefreshCw className="w-8 h-8 text-fifa-neon animate-spin mb-3" />
              <span className="text-xs text-slate-400 tracking-wider">Generating elite tactical World Cup preview...</span>
            </div>
          )
        )}

      </div>

    </div>
  );
}
