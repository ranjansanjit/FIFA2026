import React, { useState } from "react";
import { UserProfile, Match, Prediction, DishHomeQuestion, LiveQuestion } from "../types";
import { 
  Trophy, Award, RefreshCw, Star, Compass, Play, 
  Map, Calendar, Users, MessageSquareCode, Gift, CheckCircle, Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface UserDashboardProps {
  user: UserProfile;
  matches: Match[];
  predictions: Prediction[];
  dishHomeQuestions: DishHomeQuestion[];
  liveQuestions: LiveQuestion[];
  onOpenPrediction: (match: Match) => void;
  onOpenLiveScore: (match: Match) => void;
  onCheckIn: () => Promise<void>;
  onAnswerDishHome: (answer: string) => void;
  onSpinWheelReward: (points: number) => void;
  language: "EN" | "NP" | "HI";
}

export function UserDashboard({
  user,
  matches,
  predictions,
  dishHomeQuestions,
  liveQuestions,
  onOpenPrediction,
  onOpenLiveScore,
  onCheckIn,
  onAnswerDishHome,
  onSpinWheelReward,
  language
}: UserDashboardProps) {

  // Dashboard Tabs
  const [activeTab, setActiveTab] = useState<"lobby" | "brackets" | "rewards" | "fantasy">("lobby");
  const [selectedMatchStatus, setSelectedMatchStatus] = useState<"all" | "live" | "upcoming" | "completed">("all");
  
  // Checking-In visual locks
  const [checkingIn, setCheckingIn] = useState(false);

  // Spin Wheel parameters
  const [spinning, setSpinning] = useState(false);
  const [spinResult, setSpinResult] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);

  // Dishhome local input
  const [selectedDHAnswer, setSelectedDHAnswer] = useState<string>("");
  const [customDHAnswer, setCustomDHAnswer] = useState<string>("");
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);
  const [dhSubmitted, setDhSubmitted] = useState<boolean>(false);

  // Mini Fantasy Selection State
  const [fantasyPlayers, setFantasyPlayers] = useState<string[]>([]);
  const starPool = ["Manish Dangi 🇳🇵", "Christian Pulisic 🇺🇸", "Lionel Messi 🇦🇷", "Kylian Mbappé 🇫🇷", "Jamal Musiala 🇩🇪", "Vinicius Jr 🇧🇷", "Kiran Limbu 🇳🇵"];

  // Language Localizations
  const localizations = {
    EN: {
      profile: "Predictor Profile",
      rank: "Rank",
      pts: "Points",
      acc: "Accuracy",
      badges: "Earned Badge",
      matches: "Match Center",
      rules: "Entry Pass Active",
      spin: "Daily Lucky Draw Spin Wheel",
      bonus: "Ready to Spin",
      checkIn: "Daily Reward Streak",
      dishHome: "DishHome TV Package Survey",
      submit: "Submit Answer",
    },
    NP: {
      profile: "पूर्वानुमानक प्रोफाइल",
      rank: "स्थान",
      pts: "अंक",
      acc: "शुद्धता",
      badges: "प्राप्त ब्याज",
      matches: "खेल विवरण",
      rules: "VIP प्रवेश पास सक्रिय",
      spin: "दैनिक लक्की ड्र स्पिन व्हील",
      bonus: "घुमाउन तयार हुनुहोस्",
      checkIn: "दैनिक हाजिरी पुरस्कार",
      dishHome: "डिशहोम विशेष भुक्तानी सर्वेक्षण",
      submit: "उत्तर पेश गर्नुहोस्",
    },
    HI: {
      profile: "भविष्यवक्ता प्रोफाइल",
      rank: "रैंक",
      pts: "अंक",
      acc: "सटीकता",
      badges: "अर्जित बैज",
      matches: "मैच सेंटर",
      rules: "VIP प्रवेश पत्र सक्रिय",
      spin: "दैनिक भाग्यशाली स्पिन व्हील",
      bonus: "स्पिन करने के लिए तैयार",
      checkIn: "दैनिक चेक-इन पुरस्कार",
      dishHome: "डिशहोम टीवी पैकेज सर्वेक्षण",
      submit: "उत्तर सबमिट करें",
    }
  };

  const text = localizations[language] || localizations.EN;

  const triggerDailyCheckIn = async () => {
    setCheckingIn(true);
    await onCheckIn();
    setCheckingIn(false);
  };

  const triggerSpinWheel = () => {
    if (spinning) return;
    setSpinning(true);
    setSpinResult(null);

    // Dynamic spinning effect using transform
    const extraDegrees = Math.floor(1800 + Math.random() * 1800);
    const targetRot = rotation + extraDegrees;
    setRotation(targetRot);

    setTimeout(() => {
      setSpinning(false);
      const rewards = [50, 10, 100, 25, 150, 5];
      const sector = Math.floor((targetRot % 360) / 60);
      const won = rewards[sector] || 25;
      
      setSpinResult(`🎉 Congratulations! You landed on +${won} Points!`);
      onSpinWheelReward(won);
    }, 3000);
  };

  const selectFantasy = (player: string) => {
    if (fantasyPlayers.includes(player)) {
      setFantasyPlayers(fantasyPlayers.filter(p => p !== player));
    } else {
      if (fantasyPlayers.length >= 5) {
        alert("Maximum of 5 players allowed in FIFA Fantasy Star Squad!");
        return;
      }
      setFantasyPlayers([...fantasyPlayers, player]);
    }
  };

  // Filtered Matches
  const filteredMatches = matches.filter((m) => {
    if (selectedMatchStatus === "all") return true;
    return m.status === selectedMatchStatus;
  });

  return (
    <div className="relative z-10 w-full max-w-6xl mx-auto px-4 py-6 font-sans">
      
      {/* Upper Navigation Tabs */}
      <div className="flex border-b border-slate-800 mb-6 overflow-x-auto shrink-0 pb-1 gap-1">
        {[
          { id: "lobby", label: "MATCH LOBBY", icon: Compass },
          { id: "brackets", label: "TOURNAMENT BRACKETS", icon: Map },
          { id: "rewards", label: "SPIN WHEEL & STREAKS", icon: Gift },
          { id: "fantasy", label: "MOCK FANTASY TEAM", icon: StarsIcon }
        ].map((tab) => {
          const isSelected = activeTab === tab.id;
          const IconComp = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 py-3 px-4 rounded-t-xl text-xs font-bold uppercase tracking-wider cursor-pointer border-t border-x transition-all shrink-0 ${
                isSelected 
                  ? "bg-slate-900 text-fifa-gold border-slate-800 z-10 font-bold" 
                  : "bg-transparent text-slate-400 border-transparent hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* --- DASHBOARD LOBBY TAB --- */}
      {activeTab === "lobby" && (
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="grid lg:grid-cols-3 gap-6 items-start"
        >
          
          {/* User Profile Summary Card */}
          <div className="lg:col-span-1 bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-fifa-neon/5 rounded-full blur-2xl" />
            
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-gradient-to-tr from-fifa-gold to-yellow-500 rounded-2xl flex items-center justify-center font-bold text-fifa-blue text-2xl font-display shadow-lg uppercase select-none">
                {user.name.slice(0, 2)}
              </div>
              <div>
                <h2 className="text-xl font-bold font-display text-white">{user.name}</h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${user.isPaid ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  <span className="text-[10px] uppercase font-mono tracking-wider font-bold">
                    {user.isPaid ? text.rules : "Payment Required"}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 py-4 border-y border-slate-800 mb-4 font-mono text-center">
              <div>
                <div className="text-gray-400 text-[10px] uppercase font-bold">{text.rank}</div>
                <div className="text-lg font-bold text-white mt-1">#{user.rank}</div>
              </div>
              <div>
                <div className="text-gray-400 text-[10px] uppercase font-bold">{text.pts}</div>
                <div className="text-lg font-bold text-fifa-gold mt-1">{user.points}</div>
              </div>
              <div>
                <div className="text-gray-400 text-[10px] uppercase font-bold">{text.acc}</div>
                <div className="text-lg font-bold text-fifa-neon mt-1">{user.accuracy}%</div>
              </div>
            </div>

            {/* Badges / Awards Badge display */}
            <div className="mb-4">
              <span className="text-slate-400 text-[10px] uppercase font-bold tracking-widest">{text.badges}</span>
              <div className="flex items-center gap-2 mt-1 bg-slate-950 p-2.5 border border-slate-800 rounded-lg">
                <Trophy className="w-5 h-5 text-fifa-gold shrink-0 animate-pulse" />
                <span className="text-sm font-semibold font-mono text-white tracking-wide">{user.badge}</span>
              </div>
            </div>

            {/* PLAY THE MATCH button */}
            <div className="mb-4">
              <button
                id="btn_play_the_match"
                onClick={() => {
                  // Find first active/upcoming match that has not been predicted yet
                  const unpredicted = matches.find((m) => {
                    const hasPredicted = predictions.some((p) => p.matchId === m.id);
                    return m.status === "upcoming" && !hasPredicted;
                  });

                  const targetMatch = unpredicted || matches.find((m) => m.status === "upcoming") || matches[0];
                  if (targetMatch) {
                    if (!user.isPaid) {
                      alert("VIP Season Pass is required to submit match forecasts. Please register in the Checkout Tab first!");
                    } else {
                      onOpenPrediction(targetMatch);
                    }
                  } else {
                    alert("No matches available at the moment!");
                  }
                }}
                className="w-full bg-gradient-to-r from-fifa-gold to-yellow-500 hover:from-yellow-400 hover:to-fifa-gold text-fifa-blue font-extrabold py-3 px-4 rounded-xl cursor-pointer uppercase text-xs tracking-wider flex items-center justify-center gap-1.5 shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-current shrink-0 animate-pulse" />
                🎮 PLAY THE MATCH / PREDICT NOW
              </button>
            </div>

            {/* Referrals & Promos */}
            <div className="bg-black/20 p-3 rounded-xl border border-white/10 font-mono text-xs">
              <span className="text-emerald-400 font-bold block mb-1">🎁 REFERRAL CODE ACTIVE</span>
              <div className="flex justify-between items-center bg-white/5 px-2 py-1.5 rounded border border-white/10">
                <span className="text-white font-bold tracking-widest">{user.referralCode}</span>
                <span className="text-[10px] text-gray-400 font-normal">Referred: {user.referredCount}</span>
              </div>
              <p className="text-[9px] text-slate-500 mt-1.5">Share code to earn +100 bonus prediction units once they verify!</p>
            </div>
          </div>

          {/* Matches & Surveys Column */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Matches Header filters */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 shadow-xl flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-fifa-gold" />
                <h3 className="font-display font-bold text-white uppercase tracking-wider">{text.matches}</h3>
              </div>
              <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-[10px] font-mono gap-1 font-bold">
                {[
                  { id: "all", label: "ALL" },
                  { id: "live", label: "🔴 LIVE" },
                  { id: "upcoming", label: "UPCOMING" },
                  { id: "completed", label: "COMPLETED" },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedMatchStatus(item.id as any)}
                    className={`px-3 py-1.5 rounded-md cursor-pointer transition-all ${
                      selectedMatchStatus === item.id 
                        ? "bg-fifa-gold text-fifa-blue font-bold shadow-md" 
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Matches Notice & Live Question Alerts */}
            {liveQuestions.length > 0 && (
              <div className="bg-linear-to-r from-red-950/40 via-slate-900/90 to-slate-900/90 border border-red-500/30 rounded-xl p-4 shadow-lg animate-pulse flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center font-bold text-red-500 text-sm">
                    🔴
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white uppercase font-display tracking-wider">Active Real-Time Live Question!</h4>
                    <p className="text-xs text-gray-300">Earn up to 50 points by resolving predictions instantly during action.</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold text-red-400">DISAPPEARS POST-MATCH</span>
              </div>
            )}

            {/* Matches Listing Cards */}
            <div className="grid md:grid-cols-2 gap-4">
              {filteredMatches.length > 0 ? (
                filteredMatches.map((match) => {
                  const userPrediction = predictions.find((p) => p.matchId === match.id);
                  const hasPredicted = !!userPrediction;
                  const isLocked = match.status !== "upcoming";

                  return (
                    <div 
                      key={match.id}
                      className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-white/20 hover:shadow-2xl transition-all relative overflow-hidden group flex flex-col justify-between"
                    >
                      {/* Flag elements and live tags */}
                      <div className="flex justify-between items-center mb-3 text-xs font-mono">
                        <span className="bg-slate-820 px-2 py-0.5 rounded text-gray-400 font-bold uppercase scale-90">
                          {match.group}
                        </span>
                        {match.status === "live" ? (
                          <div className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                            <span className="text-red-500 font-bold text-[10px] tracking-wide">🔴 LIVE STREAMING</span>
                          </div>
                        ) : match.status === "completed" ? (
                          <span className="text-slate-400 text-[10px] uppercase font-bold">✓ FINAL RESULT</span>
                        ) : (
                          <span className="text-fifa-neon text-[10px] font-bold">LOCKS ON KICKOFF</span>
                        )}
                      </div>

                      {/* Football Match Score Row */}
                      <div className="flex justify-around items-center py-4 select-none">
                        <div className="text-center">
                          <span className="text-4xl filter drop-shadow-md">{match.flagA}</span>
                          <span className="block text-xs font-bold text-slate-300 tracking-wider mt-1.5 uppercase font-display">{match.teamA}</span>
                        </div>
                        <div className="text-center px-4 font-mono flex items-center gap-2">
                          {match.status !== "upcoming" ? (
                            <span className="text-3xl font-extrabold text-white">{match.scoreA} - {match.scoreB}</span>
                          ) : (
                            <div className="flex flex-col items-center gap-1.5 bg-slate-950 px-3 py-2 rounded-lg border border-slate-850">
                              <span className="text-[8px] text-fifa-neon font-sans font-bold uppercase tracking-widest leading-none">NPT Time (नेपाली समय)</span>
                              <span className="text-xs sm:text-sm font-extrabold text-white text-center leading-none">
                                {match.nptTime || new Date(match.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="text-center">
                          <span className="text-4xl filter drop-shadow-md">{match.flagB}</span>
                          <span className="block text-xs font-bold text-slate-300 tracking-wider mt-1.5 uppercase font-display">{match.teamB}</span>
                        </div>
                      </div>

                      {/* Display of individual prediction details */}
                      {userPrediction && (
                        <div className="my-3 p-3 rounded-xl bg-black/45 border border-white/5 font-mono text-[11px] space-y-1.5">
                          <div className="flex justify-between items-center text-slate-400">
                            <span>Your Forecast:</span>
                            <span className="text-white font-extrabold text-xs">
                              {userPrediction.predictedWinner === "draw" 
                                ? "🤝 DRAW" 
                                : userPrediction.predictedWinner === "A" 
                                  ? `${match.flagA || "⚽"} ${match.teamA}` 
                                  : `${match.flagB || "⚽"} ${match.teamB}`
                              } [{userPrediction.predictedScoreA} - {userPrediction.predictedScoreB}]
                            </span>
                          </div>
                          
                          {match.status === "completed" ? (
                            <div className="pt-2 mt-1.5 border-t border-white/5 flex flex-wrap gap-2 justify-between items-center">
                              <div className="flex flex-wrap gap-1.5">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                  userPrediction.winnerCorrect === true
                                    ? "bg-emerald-950/40 text-emerald-400 border border-emerald-500/20"
                                    : "bg-red-950/40 text-red-400 border border-red-500/10"
                                }`}>
                                  Winner: {userPrediction.winnerCorrect === true ? "Correct ✓" : "Incorrect ✗"}
                                </span>
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                  userPrediction.scoreCorrect === true
                                    ? "bg-emerald-950/40 text-emerald-400 border border-emerald-500/20"
                                    : "bg-red-950/40 text-red-400 border border-red-500/10"
                                }`}>
                                  Score: {userPrediction.scoreCorrect === true ? "Correct ✓" : "Incorrect ✗"}
                                </span>
                              </div>
                              <span className="text-[#00D1FF] font-black text-xs">
                                +{userPrediction.pointsGranted} PTS
                              </span>
                            </div>
                          ) : (
                            <div className="text-[10px] text-zinc-500 leading-normal italic text-right">
                              * Settle triggers on final whistle
                            </div>
                          )}
                        </div>
                      )}

                      {/* CTAs and checks */}
                      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                        {hasPredicted ? (
                          <span className="text-[10px] font-bold font-mono text-emerald-400 flex items-center gap-1">
                            <span className="text-sm">✓</span> PREDICTED ACTIVE
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold font-mono text-gray-500 font-normal">
                            NO PREDICTION YET
                          </span>
                        )}

                        {match.status === "live" ? (
                          <button
                            id={`btn_match_live_${match.id}`}
                            onClick={() => onOpenLiveScore(match)}
                            className="bg-linear-to-r from-red-600 to-red-700 text-white text-xs font-bold py-1.5 px-3.5 rounded hover:from-red-500 hover:to-red-650 transition-all cursor-pointer shadow-lg animate-pulse"
                          >
                            INTERACT LIVE & CHAT 🔴
                          </button>
                        ) : match.status === "completed" ? (
                          <button
                            id={`btn_match_result_${match.id}`}
                            onClick={() => onOpenLiveScore(match)}
                            className="bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-bold py-1.5 px-3 rounded transition-all cursor-pointer"
                          >
                            VIEW TIMELINE
                          </button>
                        ) : hasPredicted ? (
                          <button
                            disabled
                            className="bg-slate-800 border border-slate-700/50 text-slate-500 text-xs font-bold py-2 px-4 rounded-xl cursor-not-allowed flex items-center gap-1.5 uppercase font-mono"
                          >
                            <span className="text-emerald-500 font-bold">✓</span> ALREADY PREDICTED (गरिसकियो)
                          </button>
                        ) : (
                          <button
                            id={`btn_match_predict_${match.id}`}
                            onClick={() => {
                              if (!user.isPaid) {
                                alert("VIP Season Pass is required to submit match forecasts. Please register in the Checkout Tab first!");
                              } else {
                                onOpenPrediction(match);
                              }
                            }}
                            className="bg-gradient-to-r from-fifa-gold to-yellow-500 hover:from-yellow-400 hover:to-fifa-gold text-fifa-blue text-xs font-black py-2 px-4 rounded-xl shadow-md hover:scale-[1.03] active:scale-[0.97] transition-all cursor-pointer flex items-center gap-1 uppercase"
                          >
                            <Play className="w-3 h-3 fill-current shrink-0" />
                            PLAY / PREDICT (खेल्नुहोस)
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-2 text-center p-8 bg-slate-900 rounded-2xl border border-slate-800 font-mono text-xs text-gray-500">
                  No matches categorized as {selectedMatchStatus} at the moment.
                </div>
              )}
            </div>

            {/* Special Dishhome question surveys - Real automatic reward mechanics */}
            {dishHomeQuestions.map((dh) => (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                whileHover={{ scale: 1.005, borderColor: "rgba(220, 38, 38, 0.4)" }}
                key={dh.id}
                className="bg-gradient-to-br from-slate-900/90 to-slate-950/95 border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-1.5 bg-red-600 h-full" />
                <div className="flex items-center justify-between mb-3 border-b border-slate-850 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-red-500 animate-spin-slow" />
                    <span className="font-display font-semibold text-sm text-white uppercase tracking-wider">{text.dishHome}</span>
                  </div>
                  <span className="text-[9px] font-mono font-bold bg-slate-950 border border-slate-800 p-1.5 rounded text-red-400 animate-pulse">
                    SPECIAL AUTO-POINTS
                  </span>
                </div>

                <p className="text-gray-100 text-sm font-semibold mb-4 leading-relaxed font-mono">
                  {dh.text}
                </p>

                {dhSubmitted ? (
                  <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-emerald-950/40 border border-emerald-800/40 p-4 rounded-xl text-xs leading-normal text-emerald-400 font-mono text-center space-y-1"
                  >
                    <p className="font-bold text-sm">🎉 Submitted Successfully! (दर्ता भयो)</p>
                    <p className="text-slate-300">Your answer holds active credit under the DishHome survey module.</p>
                    <p className="text-emerald-500 font-bold text-[10px] mt-1 uppercase tracking-wider">Estimated: {isCustomMode ? customDHAnswer : selectedDHAnswer}</p>
                    <p className="text-[9px] text-slate-500 mt-1">Points (+{dh.points} PTS) will credit instantly upon official package release validation!</p>
                  </motion.div>
                ) : (
                  <div className="space-y-4">
                    
                    {/* Toggle Selector for options vs writing input */}
                    <div className="flex items-center justify-between bg-black/40 p-1 rounded-xl border border-white/5">
                      <button
                        type="button"
                        onClick={() => setIsCustomMode(false)}
                        className={`flex-1 py-2 text-center rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer ${!isCustomMode ? "bg-red-600 text-white shadow" : "text-slate-400 hover:text-white"}`}
                      >
                        Choose List (विकल्प रोज्नुहोस्)
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsCustomMode(true)}
                        className={`flex-1 py-2 text-center rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer ${isCustomMode ? "bg-red-600 text-white shadow" : "text-slate-400 hover:text-white"}`}
                      >
                        ✍️ Custom Write (संख्या लेख्नुहोस्)
                      </button>
                    </div>

                    <AnimatePresence mode="wait">
                      {!isCustomMode ? (
                        /* Standard Choice list buttons with high feedback */
                        <motion.div
                          key="option-list"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          transition={{ duration: 0.2 }}
                          className="grid sm:grid-cols-2 gap-2"
                        >
                          {dh.options.map((opt) => {
                            const isSelected = selectedDHAnswer === opt;
                            return (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => setSelectedDHAnswer(opt)}
                                className={`p-3 rounded-xl border text-left text-xs font-mono transition-all font-semibold cursor-pointer flex items-center justify-between ${
                                  isSelected 
                                    ? "border-red-500 bg-red-950/30 text-white shadow-[0_0_15px_rgba(239,68,68,0.15)] scale-[1.01]" 
                                    : "border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700 hover:text-white"
                                }`}
                              >
                                <span>{opt}</span>
                                {isSelected && <span className="text-red-500 text-xs">●</span>}
                              </button>
                            );
                          })}
                        </motion.div>
                      ) : (
                        /* Text Write field - yasma lekhane input option */
                        <motion.div
                          key="custom-write"
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          transition={{ duration: 0.2 }}
                          className="space-y-2"
                        >
                          <label className="text-[10px] text-red-400 font-extrabold tracking-wide block uppercase font-mono">
                            ✍️ Enter Exact Customer Number or Your Estimate (संख्या वा अनुमानित विवरण लेख्नुहोस्):
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. 135,000 customers (वा आफ्नै शब्दमा...) "
                            value={customDHAnswer}
                            onChange={(e) => setCustomDHAnswer(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-650 font-mono focus:outline-none focus:border-red-500/80 focus:ring-1 focus:ring-red-500/20"
                          />
                          <p className="text-[9.5px] text-slate-500 leading-normal font-sans">
                            💡 You can type anything. E.g., numbers like <strong className="text-slate-300">"130,500"</strong>, <strong className="text-slate-300">"Above 150,000"</strong> or any custom Nepali estimate text feedback!
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Submit Row */}
                    <div className="flex justify-end pt-1 border-t border-slate-850">
                      <button
                        type="button"
                        onClick={() => {
                          const ansToSubmit = isCustomMode ? customDHAnswer : selectedDHAnswer;
                          if (!ansToSubmit.trim()) {
                            alert(isCustomMode ? "Please type your custom answer or estimate first!" : "Please select an option from the list or switch to Custom Write!");
                            return;
                          }
                          onAnswerDishHome(ansToSubmit);
                          setDhSubmitted(true);
                        }}
                        className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-650 text-white text-xs font-black py-2.5 px-6 rounded-xl cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-red-950/40 uppercase tracking-widest flex items-center gap-1.5"
                      >
                        <CheckCircle className="w-4 h-4 shrink-0" />
                        {text.submit}
                      </button>
                    </div>

                  </div>
                )}
              </motion.div>
            ))}

          </div>

        </motion.div>
      )}

      {/* --- REWARDS SPIN & TIMES STREAKS TAB --- */}
      {activeTab === "rewards" && (
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="grid lg:grid-cols-2 gap-8 items-start"
        >
          
          {/* Daily Streak Check and check-in */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl text-center">
            <Gift className="w-12 h-12 text-fifa-gold mx-auto mb-3" />
            <h3 className="font-display font-semibold text-lg text-white mb-2">{text.checkIn}</h3>
            <p className="text-gray-400 text-xs max-w-sm mx-auto mb-6">
              Log in daily to scale your streak multiplier! Check-in resets if you miss a single rotation cycle.
            </p>

            <div className="inline-flex gap-2 max-w-sm overflow-x-auto justify-center mb-6 py-2 bg-black/20 p-4 border border-white/10 rounded-xl">
              {[1, 2, 3, 4, 5, 6, 7].map((day) => {
                const isActive = user.dailyCheckInChain >= day;
                return (
                  <div key={day} className="text-center shrink-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs ${
                      isActive 
                        ? "bg-gradient-to-tr from-fifa-gold to-yellow-500 text-fifa-blue" 
                        : "bg-slate-800 text-slate-600"
                    }`}>
                      D{day}
                    </div>
                    <div className="text-[8px] font-bold text-gray-500 mt-1 uppercase">+{day * 25}P</div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={triggerDailyCheckIn}
              disabled={checkingIn}
              className="w-full max-w-xs bg-linear-to-r from-fifa-neon to-sky-500 hover:from-sky-400 hover:to-fifa-neon text-fifa-dark font-bold py-3 px-6 rounded-xl cursor-pointer shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all text-xs tracking-wider uppercase"
            >
              Check-In Today (+{ (user.dailyCheckInChain + 1) * 25} PTS)
            </button>
          </div>

          {/* Interactive Wheel of fortune Spin Game */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col justify-center items-center">
            <h3 className="font-display font-bold text-base text-white uppercase tracking-wider mb-2">{text.spin}</h3>
            <p className="text-slate-400 text-xs text-center max-w-xs mb-8">
              Take your chance on the real-time spinning platform wheel. Landing sectors reward points directly to your central leaderboard.
            </p>
            
            {/* The physical rendered spinner wheel */}
            <div className="relative w-64 h-64 mb-8">
              {/* Spinning Selector Arrow Indicator */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[20px] border-t-fifa-gold filter drop-shadow-xl select-none" />
              
              <div 
                className="w-full h-full rounded-full border-4 border-fifa-gold shadow-2xl relative overflow-hidden select-none"
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transition: spinning ? "transform 3s cubic-bezier(0.1, 0.8, 0.1, 1)" : "none",
                  background: "radial-gradient(circle, #050d18 30%, #0b1a30 100%)"
                }}
              >
                {/* Visual Wheel Slices */}
                {[
                  { deg: 0, val: "+50" },
                  { deg: 60, val: "+10" },
                  { deg: 120, val: "+100" },
                  { deg: 180, val: "+25" },
                  { deg: 240, val: "+150" },
                  { deg: 300, val: "+5" },
                ].map((slice, i) => (
                  <div 
                    key={i}
                    className="absolute inset-0 origin-center flex justify-center pt-4"
                    style={{ transform: `rotate(${slice.deg}deg)` }}
                  >
                    <span className="text-white font-mono font-black text-sm block tracking-widest text-[#f0f9ff]/90 select-none bg-slate-950/60 p-1.5 rounded-lg border border-slate-800">
                      {slice.val}
                    </span>
                  </div>
                ))}
                
                {/* Center Core Cap pin */}
                <div className="absolute inset-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-linear-to-tr from-fifa-gold to-yellow-500 border border-white flex items-center justify-center font-bold text-xs" />
              </div>
            </div>

            <button
              onClick={triggerSpinWheel}
              disabled={spinning}
              className={`px-8 py-3.5 rounded-xl font-bold uppercase text-xs tracking-wider transition-all shadow-md mt-2 ${
                spinning 
                  ? "bg-slate-800 text-slate-500 cursor-not-allowed" 
                  : "bg-linear-to-r from-fifa-gold to-yellow-500 hover:from-yellow-400 hover:to-fifa-gold text-fifa-blue cursor-pointer hover:scale-105 active:scale-95"
              }`}
            >
              {spinning ? "SPINNING ACTION..." : text.bonus}
            </button>

            {spinResult && (
              <div className="mt-4 text-xs font-mono font-semibold text-fifa-neon bg-slate-950 p-2.5 rounded-lg border border-slate-800 animate-pulse text-center">
                {spinResult}
              </div>
            )}
          </div>

        </motion.div>
      )}

      {/* --- TOURNAMENT BRACKETS VISUAL TAB --- */}
      {activeTab === "brackets" && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35 }}
          className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl overflow-x-auto"
        >
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-fifa-gold" />
            <h3 className="font-display font-bold text-white uppercase tracking-wider">World Cup 2026 Brackets Tracker</h3>
          </div>
          <p className="text-slate-400 text-xs mb-8">
            Track participating groups, semi-finals, and finals bracket progression. Locks immediately on kickoff.
          </p>

          {/* Bracket Grid mockup */}
          <div className="min-w-[800px] grid grid-cols-4 gap-6 py-6 font-mono select-none">
            {/* Round of 16 */}
            <div className="space-y-8 flex flex-col justify-center">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest text-center border-b border-slate-800 pb-2">ROUND OF 16</span>
              {[
                { r: "R1", team1: "USA", flag1: "🇺🇸", team2: "Nepal", flag2: "🇳🇵", winner: "Nepal" },
                { r: "R2", team1: "Brazil", flag1: "🇧🇷", team2: "Germany", flag2: "🇩🇪", winner: "TBD" }
              ].map((m, idx) => (
                <div key={idx} className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1.5 text-xs text-slate-300">
                  <div className="flex justify-between items-center font-bold">
                    <span>{m.flag1} {m.team1}</span>
                    <span className="text-slate-500 font-normal">Pending</span>
                  </div>
                  <div className="flex justify-between items-center text-fifa-neon font-bold">
                    <span>{m.flag2} {m.team2}</span>
                    <span className="bg-fifa-neon/10 text-fifa-neon px-1 rounded text-[8px]">Live</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Quarter Finals */}
            <div className="space-y-8 flex flex-col justify-center">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest text-center border-b border-slate-800 pb-2">QUARTER FINALS</span>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1.5 text-xs text-slate-400">
                <div className="flex justify-between items-center">
                  <span>🇳🇵 Nepal (R1)</span>
                  <span>-</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>🇧🇷 Brazil/🇩🇪 Germany (R2)</span>
                  <span>-</span>
                </div>
              </div>
            </div>

            {/* Semi Finals */}
            <div className="space-y-8 flex flex-col justify-center">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest text-center border-b border-slate-800 pb-2">SEMI FINALS</span>
              <div className="bg-slate-950/40 p-3 rounded-lg border-2 border-dashed border-slate-800 text-xs text-slate-600 text-center py-6">
                Waiting on Quarters
              </div>
            </div>

            {/* Final Match Trophy */}
            <div className="space-y-8 flex flex-col justify-center items-center">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest text-center border-b border-slate-800 pb-2 w-full">GRAND FINALS</span>
              <div className="bg-slate-950/80 border border-fifa-gold/20 p-4 rounded-xl text-center space-y-3 relative group overflow-hidden w-full">
                <div className="absolute top-0 right-0 w-12 h-12 bg-fifa-gold/5 rounded-full blur-xl group-hover:bg-fifa-gold/15 transition-all" />
                <Trophy className="w-8 h-8 text-fifa-gold mx-auto animate-bounce" />
                <span className="text-[9px] font-bold text-fifa-gold uppercase block mt-1">METLIFE STADIUM (NJ)</span>
                <span className="text-xs font-bold text-white block mt-0.5">FINAL CHAMPION (19 JULY)</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* --- MOCK FANTASY TEAM TAB --- */}
      {activeTab === "fantasy" && (
        <motion.div 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35 }}
          className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl"
        >
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-fifa-gold" />
            <h3 className="font-display font-bold text-white uppercase tracking-wider">World Cup Star Mock Fantasy Selection</h3>
          </div>
          <p className="text-slate-400 text-xs mb-6">
            Build your private dream roster with world-class performers and automatic Nepal representatives. Predict who earns the Golden Boot!
          </p>

          <span className="text-[10px] text-slate-500 font-bold block mb-3 uppercase tracking-wider font-mono">Select up to 5 Players:</span>
          
          <div className="flex flex-wrap gap-2 mb-6">
            {starPool.map((player) => {
              const isSelected = fantasyPlayers.includes(player);
              return (
                <button
                  key={player}
                  onClick={() => selectFantasy(player)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-mono font-semibold tracking-wide transition-all border cursor-pointer select-none ${
                    isSelected 
                      ? "border-fifa-neon bg-fifa-neon/10 text-white" 
                      : "border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700 hover:text-white"
                  }`}
                >
                  {player}
                </button>
              );
            })}
          </div>

          <div className="bg-slate-950 rounded-xl p-4 border border-slate-800">
            <span className="text-xs text-slate-400 font-bold block mb-2 uppercase font-mono">Your Drafted Stars ({fantasyPlayers.length}/5):</span>
            {fantasyPlayers.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {fantasyPlayers.map((player, idx) => (
                  <span key={idx} className="bg-slate-900 border border-slate-800 text-fifa-gold px-3 py-1 rounded-lg text-xs font-mono flex items-center gap-1">
                    🏅 {player}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-xs text-slate-600 block italic font-mono">No stars drafted yet. Click on indicators above to form your dream squad!</span>
            )}
          </div>
        </motion.div>
      )}

    </div>
  );
}

// Minimal placeholder component to satisfy ts compiler imports
function StarsIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    </svg>
  );
}
