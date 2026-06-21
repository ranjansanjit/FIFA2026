import React from "react";
import { Trophy, Award, CheckCircle } from "lucide-react";

interface WinnerInfo {
  userId: string;
  name: string;
  country: string;
  points: number;
  accuracy: number;
  badge?: string;
  exactScoreCount?: number;
}

interface TournamentWinnersProps {
  leaderboard: WinnerInfo[];
  prizePool?: number;
  language: "EN" | "NP" | "HI";
}

const translations = {
  EN: {
    title: "Tournament Champions Announcement",
    subtitle: "Official final standings and cash prize distribution ceremony",
    place1: "Grand Champion (1st)",
    place2: "Stellar Runner-Up (2nd)",
    place3: "Elite Forecaster (3rd)",
    prizepool: "Total Prize Pool",
    congratulations: "Congratulations to the winners of the FIFA World Cup 2026 Forecast Challenge!",
    rank: "Rank",
    player: "Predictor Player",
    points: "Points",
    accuracy: "Accuracy Ratio",
    prize: "Reward Prize",
  },
  NP: {
    title: "प्रतियोगिता विजेता घोषणा",
    subtitle: "आधिकारिक अन्तिम नतिजा र नगद पुरस्कार वितरण घोषणा",
    place1: "महाविजेता (प्रथम)",
    place2: "उप-विजेता (द्वितीय)",
    place3: "कुशल भविष्यवक्ता (तृतीय)",
    prizepool: "कुल पुरस्कार राशि",
    congratulations: "फिफा विश्वकप २०२६ पूर्वानुमान चुनौतीका सबै विजेताहरूलाई हार्दिक बधाई!",
    rank: "स्थान",
    player: "खेलाडी/भविष्यवक्ता",
    points: "अङ्क",
    accuracy: "शुद्धता दर",
    prize: "पुरस्कार राशि",
  },
  HI: {
    title: "टूर्नामेंट विजेता घोषणा",
    subtitle: "आधिकारिक अंतिम रैंकिंग और नकद पुरस्कार वितरण समारोह",
    place1: "ग्रैंड चैंपियन (प्रथम)",
    place2: "उप-विजेता (द्वितीय)",
    place3: "कुशल भविष्यवक्ता (तृतीय)",
    prizepool: "कुल पुरस्कार राशि",
    congratulations: "फीफा विश्व कप 2026 पूर्वानुमान चुनौती के विजेताओं को हार्दिक बधाई!",
    rank: "रैंक",
    player: "भविष्यवक्ता खिलाड़ी",
    points: "अंक",
    accuracy: "सटीकता दर",
    prize: "पुरस्कार राशि",
  }
};

export function TournamentWinners({ leaderboard, prizePool = 50000, language }: TournamentWinnersProps) {
  const text = translations[language] || translations.EN;

  // Select top 3
  const top3 = leaderboard.slice(0, 3);
  
  if (top3.length === 0) {
    return null;
  }

  // Handle Prize Distributions
  const getPrizes = (index: number) => {
    const share = index === 0 ? 0.5 : index === 1 ? 0.3 : 0.2;
    const value = prizePool * share;
    return {
      amount: `Rs. ${value.toLocaleString()}`,
      badge: index === 0 ? "🏆 Golden Cup + 50% Pool" : index === 1 ? "🥈 Silver Medal + 30% Pool" : "🥉 Bronze Medal + 20% Pool"
    };
  };

  return (
    <div id="tournament-winners-announcement" className="w-full max-w-4xl mx-auto px-4 py-8 font-sans">
      <div className="bg-slate-900 border border-fifa-gold/30 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden bg-gradient-to-b from-slate-900 via-[#050B1B] to-slate-950">
        
        {/* Decorative Golden Ambient Lights & Confetti Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-fifa-gold/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Header Title Section */}
        <div className="text-center relative z-10 space-y-3 mb-12">
          <div className="inline-flex items-center gap-2 bg-fifa-gold/10 border border-fifa-gold/30 px-4 py-1.5 rounded-full animate-pulse">
            <Trophy className="w-4 h-4 text-fifa-gold" />
            <span className="text-[10px] sm:text-xs text-fifa-gold font-mono font-bold uppercase tracking-widest">
              OFFICIAL FINAL RESOLUTIONS
            </span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-fifa-gold via-white to-yellow-500 uppercase tracking-tight">
            {text.title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto font-medium">
            {text.subtitle}
          </p>
          
          <div className="bg-slate-950/80 border border-white/5 rounded-2xl py-3 px-6 inline-block mt-4 max-w-sm mx-auto">
            <span className="text-[10px] text-slate-500 font-mono uppercase font-bold block">{text.prizepool}</span>
            <span className="text-xl font-display font-extrabold text-emerald-400">Rs. {prizePool.toLocaleString()} /-</span>
          </div>
        </div>

        {/* 🏆 STUNNING 3D-STYLE PODIUM VIEW 🏆 */}
        <div className="grid grid-cols-3 gap-3 md:gap-6 items-end relative z-10 max-w-2xl mx-auto mb-12 pt-6">
          
          {/* 🥈 2ND PLACE PODIUM */}
          {top3[1] && (
            <div className="flex flex-col items-center">
              <div className="text-center mb-2 scale-95">
                <span className="bg-slate-800 text-slate-300 border border-slate-700 w-8 h-8 rounded-full inline-flex items-center justify-center font-bold font-mono text-xs shadow-md">
                  2
                </span>
                <p className="text-[10px] md:text-xs font-black text-white uppercase mt-1 truncate max-w-[80px] md:max-w-[120px]">
                  {top3[1].name}
                </p>
                <p className="text-[10px] text-fifa-gold font-bold">{top3[1].points} PTS</p>
              </div>
              <div className="w-full bg-gradient-to-t from-slate-800/80 to-slate-700/40 border-t-2 border-slate-400/30 rounded-t-xl h-24 md:h-32 flex flex-col justify-center items-center shadow-lg relative p-2 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-slate-400 to-transparent" />
                <Award className="w-6 h-6 md:w-8 md:h-8 text-slate-300 opacity-60 mb-1" />
                <span className="text-[9px] md:text-[10px] text-slate-400 font-bold uppercase tracking-wider text-center line-clamp-1">
                  Runner-Up
                </span>
                <span className="text-[10px] text-emerald-400 font-bold font-mono mt-0.5">
                  {getPrizes(1).amount}
                </span>
              </div>
            </div>
          )}

          {/* 🥇 1ST PLACE CHAMPION PODIUM */}
          {top3[0] && (
            <div className="flex flex-col items-center">
              {/* Crown Emblem Overlay */}
              <div className="text-center mb-2 relative scale-110 -top-2">
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-2xl animate-bounce">👑</div>
                <span className="bg-[#FFE600] text-slate-950 border border-white/20 w-10 h-10 rounded-full inline-flex items-center justify-center font-black font-mono text-sm shadow-xl shadow-yellow-500/10">
                  1
                </span>
                <p className="text-xs md:text-sm font-black text-fifa-gold uppercase mt-1 truncate max-w-[100px] md:max-w-[140px] tracking-wide">
                  {top3[0].name}
                </p>
                <p className="text-xs text-white font-extrabold">{top3[0].points} PTS</p>
              </div>
              <div className="w-full bg-gradient-to-t from-yellow-950/60 via-fifa-gold/20 to-fifa-gold/30 border-t-4 border-[#FFE600]/80 rounded-t-2xl h-32 md:h-44 flex flex-col justify-center items-center shadow-2xl relative p-3 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-300 to-transparent" />
                <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-yellow-500/10 rounded-full blur-xl pointer-events-none" />
                <Trophy className="w-8 h-8 md:w-12 md:h-12 text-[#FFE300] filter drop-shadow-[0_0_10px_rgba(255,227,0,0.4)] mb-2" />
                <span className="text-[10px] md:text-xs text-[#FFE300] font-mono font-bold uppercase tracking-widest text-center">
                  CHAMPION
                </span>
                <span className="text-xs md:text-sm text-emerald-400 font-black font-mono mt-1">
                  {getPrizes(0).amount}
                </span>
              </div>
            </div>
          )}

          {/* 🥉 3RD PLACE PODIUM */}
          {top3[2] && (
            <div className="flex flex-col items-center">
              <div className="text-center mb-2 scale-90">
                <span className="bg-[#C87533]/20 text-[#CD7F32] border border-[#CD7F32]/50 w-8 h-8 rounded-full inline-flex items-center justify-center font-bold font-mono text-xs shadow-md">
                  3
                </span>
                <p className="text-[10px] md:text-xs font-black text-white uppercase mt-1 truncate max-w-[80px] md:max-w-[120px]">
                  {top3[2].name}
                </p>
                <p className="text-[10px] text-fifa-gold font-bold">{top3[2].points} PTS</p>
              </div>
              <div className="w-full bg-gradient-to-t from-orange-950/30 to-orange-900/10 border-t-2 border-orange-500/20 rounded-t-xl h-20 md:h-26 flex flex-col justify-center items-center shadow-md relative p-2 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#CD7F32] to-transparent" />
                <Award className="w-6 h-6 text-[#CD7F32] opacity-70 mb-1" />
                <span className="text-[9px] text-[#CD7F32] font-semibold uppercase tracking-wider text-center line-clamp-1">
                  3rd Place
                </span>
                <span className="text-[10px] text-emerald-400 font-bold font-mono mt-0.5">
                  {getPrizes(2).amount}
                </span>
              </div>
            </div>
          )}

        </div>

        {/* Congratulations block quote */}
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 md:p-5 flex items-center gap-4 relative z-10 mb-8 font-mono text-xs sm:text-xs text-slate-300 max-w-2xl mx-auto leading-relaxed">
          <CheckCircle className="w-6 h-6 shrink-0 text-emerald-400" />
          <p>{text.congratulations}</p>
        </div>

        {/* Detailed Leaderboard and Prize Information Table */}
        <div className="bg-slate-950/70 border border-white/5 rounded-2xl overflow-hidden relative z-10 shrink-0">
          <div className="p-4 bg-slate-950/80 border-b border-white/5">
            <span className="text-white font-mono font-bold text-xs uppercase tracking-widest">
              🏆 OFFICIAL TOURNAMENT PODIUM LAURELS
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-white/[0.02] text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-white/5">
                <tr>
                  <th className="p-3.5 text-center">{text.rank}</th>
                  <th className="p-3.5">{text.player}</th>
                  <th className="p-3.5 text-center">{text.points}</th>
                  <th className="p-3.5 text-center">{text.accuracy}</th>
                  <th className="p-3.5 text-right">{text.prize}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-semibold text-slate-200">
                {top3.map((winner, idx) => {
                  const prizes = getPrizes(idx);
                  return (
                    <tr 
                      key={winner.userId || idx} 
                      className={`hover:bg-white/[0.01] transition-all ${
                        idx === 0 
                          ? "bg-yellow-500/5 text-yellow-100" 
                          : idx === 1 
                            ? "bg-slate-800/10" 
                            : ""
                      }`}
                    >
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-black font-mono text-xs ${
                          idx === 0 
                            ? "bg-[#FFE600] text-slate-950" 
                            : idx === 1 
                              ? "bg-slate-300 text-slate-950" 
                              : "bg-[#CD7F32] text-white"
                        }`}>
                          #{idx + 1}
                        </span>
                      </td>
                      <td className="p-4 uppercase tracking-wide font-display text-white">
                        <div className="flex items-center gap-1.5">
                          <span>{winner.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono font-bold bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                            {winner.country}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-center text-fifa-gold font-bold text-sm">
                        {winner.points} PTS
                      </td>
                      <td className="p-4 text-center text-slate-400 font-bold text-xs">
                        {winner.accuracy}% (Acc)
                      </td>
                      <td className="p-4 text-right">
                        <div className="text-emerald-400 font-extrabold text-sm">{prizes.amount}</div>
                        <div className="text-[9px] text-slate-500 font-mono leading-none mt-0.5">{prizes.badge}</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
