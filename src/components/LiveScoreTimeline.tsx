import React, { useState, useEffect, useRef } from "react";
import { Match, ChatMessage, LiveQuestion } from "../types";
import { 
  Trophy, MessageSquareText, Radio, Flame, ShieldAlert, 
  Send, Smile, StarsIcon, HelpCircle, Check, ArrowRight 
} from "lucide-react";

interface LiveScoreTimelineProps {
  userId: string;
  userName: string;
  userCountry: string;
  match: Match;
  onClose: () => void;
}

export function LiveScoreTimeline({ userId, userName, userCountry, match, onClose }: LiveScoreTimelineProps) {
  const [timeline, setTimeline] = useState(match.timeline);
  const [score, setScore] = useState({ scoreA: match.scoreA, scoreB: match.scoreB });
  const [chatList, setChatList] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [activeLiveQuestions, setActiveLiveQuestions] = useState<LiveQuestion[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [resolvedQuestions, setResolvedQuestions] = useState<string[]>([]);
  
  // Interactive Fan Poll State
  const [pollVotes, setPollVotes] = useState({ teamA: 145, teamB: 88, draw: 52 });
  const [userVoted, setUserVoted] = useState(false);

  // Chat Auto-scroll Ref
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Standard Football Stickers list
  const STICKERS = [
    { label: "Siuuu! 🐐", code: "🐐 siuuu" },
    { label: "Goal! ⚽", code: "⚽ goal" },
    { label: "Foul! 🟥", code: "🟥 foul" },
    { label: "Unbelievable! 🤯", code: "🤯 omg" },
    { label: "Offside! 🚩", code: "🚩 offside" }
  ];

  // Poll server state every 2.5 seconds to achieve indistinguishable real-time updates safely
  useEffect(() => {
    let active = true;

    const fetchLatestMatchAndQuestions = async () => {
      try {
        // Fetch matches
        const resMatches = await fetch("/api/matches");
        if (resMatches.ok && active) {
          const listMatches: Match[] = await resMatches.json();
          const fresh = listMatches.find((m) => m.id === match.id);
          if (fresh) {
            setScore({ scoreA: fresh.scoreA, scoreB: fresh.scoreB });
            setTimeline(fresh.timeline);
          }
        }

        // Fetch live chat
        const resChat = await fetch("/api/chat");
        if (resChat.ok && active) {
          const dataChat: ChatMessage[] = await resChat.json();
          setChatList(dataChat);
        }

        // Fetch live questions
        const resQ = await fetch("/api/live-questions");
        if (resQ.ok && active) {
          const dataQ: LiveQuestion[] = await resQ.json();
          // Only show questions matching current match
          setActiveLiveQuestions(dataQ.filter((q) => q.matchId === match.id));
        }
      } catch (err) {
        console.warn("Live syncing error:", err);
      }
    };

    fetchLatestMatchAndQuestions();
    const interval = setInterval(fetchLatestMatchAndQuestions, 2500);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [match.id]);

  // Scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatList]);

  const handleSendChatAndModeration = async (e?: React.FormEvent, stickerValue?: string) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() && !stickerValue) return;

    const currentMsg = chatInput;
    setChatInput("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userName,
          country: userCountry,
          message: stickerValue ? "" : currentMsg,
          sticker: stickerValue || "",
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        alert(err.error || "Anti-Spam Blocked.");
      } else {
        const newMsg = await response.json();
        setChatList((prev) => [...prev, newMsg]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendReaction = async (chatId: string, emoji: string) => {
    try {
      const response = await fetch("/api/chat/react", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId, emoji }),
      });
      if (response.ok) {
        const updated = await response.json();
        setChatList((prev) => prev.map((c) => (c.id === chatId ? updated : c)));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLiveQuestionSubmit = async (questionId: string) => {
    const ans = selectedAnswers[questionId];
    if (!ans) {
      alert("Please check/select an option response first.");
      return;
    }

    try {
      const response = await fetch("/api/live-questions/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, questionId, answer: ans }),
      });

      if (response.ok) {
        setResolvedQuestions((prev) => [...prev, questionId]);
      }
    } catch (err) {
      console.warn(err);
    }
  };

  const castPollVote = (option: "teamA" | "teamB" | "draw") => {
    if (userVoted) return;
    setPollVotes((prev) => ({ ...prev, [option]: prev[option] + 1 }));
    setUserVoted(true);
  };

  const totalVotes = pollVotes.teamA + pollVotes.teamB + pollVotes.draw;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md overflow-hidden font-sans">
      <div className="bg-[#050A18] border border-[#00D1FF]/30 rounded-2xl w-full max-w-5xl h-[95vh] flex flex-col overflow-hidden relative shadow-2xl">
        
        {/* Dynamic Pitch Header and Closing controls */}
        <div className="bg-black/40 backdrop-blur-md p-4 border-b border-[#00D1FF]/20 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-red-500 animate-[pulse_1.5s_infinite]" />
            <span className="font-display font-black text-xs sm:text-sm text-white uppercase tracking-wider">FIFA Match Interactivity Room</span>
          </div>
          <button 
            id="btn_timeline_close" 
            onClick={onClose} 
            className="text-gray-400 hover:text-white text-xs font-mono bg-slate-900 border border-slate-800 px-3 py-1.5 rounded transition-all cursor-pointer"
          >
            ✕ LEAVE ARENA
          </button>
        </div>

        {/* Dynamic Action Scoreboard Display */}
        <div className="bg-gradient-to-b from-black/60 to-transparent p-5 border-b border-[#00D1FF]/20 shrink-0 text-center relative overflow-hidden select-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-fifa-neon/5 rounded-full blur-2xl" />
          
          <div className="flex justify-center items-center gap-6 sm:gap-10">
            <div className="text-center">
              <span className="text-4xl sm:text-5xl drop-shadow-md">{match.flagA}</span>
              <span className="block text-xs font-bold text-gray-400 mt-2 uppercase font-display tracking-wider">{match.teamA}</span>
            </div>

            <div className="text-center font-mono shrink-0">
              <div className="text-3xl sm:text-5xl font-extrabold text-white tracking-widest">{score.scoreA} - {score.scoreB}</div>
              {match.status === "live" ? (
                <div className="inline-flex items-center gap-1 bg-red-650 text-white text-[9px] font-bold px-2 py-0.5 rounded uppercase mt-2 shadow animate-[pulse_2s_infinite]">
                  <span>75' LIVE</span>
                </div>
              ) : (
                <span className="inline-block text-[9px] font-bold text-gray-500 border border-slate-800 px-2 py-0.5 rounded mt-2 uppercase">
                  MATCH ENDED
                </span>
              )}
            </div>

            <div className="text-center">
              <span className="text-4xl sm:text-5xl drop-shadow-md">{match.flagB}</span>
              <span className="block text-xs font-bold text-gray-400 mt-2 uppercase font-display tracking-wider">{match.teamB}</span>
            </div>
          </div>
        </div>

        {/* Main Two-Column Interactive Grid */}
        <div className="flex-1 grid md:grid-cols-5 overflow-hidden">
          
          {/* Left Column: Match Timeline, Events & Surveys (3/5 width) */}
          <div className="md:col-span-3 flex flex-col border-r border-slate-800 overflow-y-auto p-4 space-y-6">
            
            {/* Live Question survey panel */}
            {match.status === "live" && activeLiveQuestions.length > 0 && (
              <div className="bg-slate-950 p-4 border border-fifa-gold/30 rounded-xl shadow-lg relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-24 h-24 bg-fifa-gold/10 rounded-full blur-2xl" />
                <div className="flex items-center gap-1.5 mb-2 border-b border-slate-800/80 pb-1.5">
                  <HelpCircle className="w-4.5 h-4.5 text-fifa-gold shrink-0 animate-pulse" />
                  <span className="text-[10px] font-bold font-mono text-fifa-gold uppercase tracking-widest">LIVE QUESTION BOOT</span>
                </div>

                {activeLiveQuestions.map((q) => {
                  const hasAnswered = resolvedQuestions.includes(q.id);
                  return (
                    <div key={q.id} className="space-y-3 py-2">
                      <p className="text-xs sm:text-sm font-semibold text-white font-mono leading-relaxed">
                        🤔 {q.text} <span className="text-fifa-neon">({q.points} Points)</span>
                      </p>
                      
                      {hasAnswered ? (
                        <div className="text-emerald-400 text-xs font-mono font-bold bg-slate-900 p-2.5 rounded border border-slate-800/80 text-center animate-fade-in flex items-center justify-center gap-1">
                          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                          SUBMISSION RECORDED! WAIT FOR INSTANT SETTLEMENT ON ACTION.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-1.5">
                            {q.options.map((opt) => {
                              const isChecked = selectedAnswers[q.id] === opt;
                              return (
                                <button
                                  key={opt}
                                  type="button"
                                  onClick={() => setSelectedAnswers((prev) => ({ ...prev, [q.id]: opt }))}
                                  className={`p-2 rounded text-left text-xs font-mono cursor-pointer border transition-all ${
                                    isChecked 
                                      ? "border-fifa-gold bg-fifa-gold/10 text-white font-bold" 
                                      : "border-slate-900 bg-slate-900 text-slate-400 hover:text-white"
                                  }`}
                                >
                                  {opt}
                                </button>
                              );
                            })}
                          </div>
                          <div className="flex justify-end font-mono">
                            <button
                              onClick={() => handleLiveQuestionSubmit(q.id)}
                              className="bg-linear-to-r from-fifa-gold to-yellow-500 hover:from-yellow-400 hover:to-fifa-gold text-fifa-blue text-[10px] font-bold py-1.5 px-3.5 rounded-lg cursor-pointer flex items-center gap-1 shrink-0 uppercase"
                            >
                              LOCK MY CHOICE <ArrowRight className="w-3.5 h-3.5 text-fifa-blue" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Fan poll widget */}
            <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl space-y-3">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block mb-1">📢 LIVE SPECTATOR POLL</span>
              <p className="text-xs text-white">Who will win this match? (Nepal vs USA match check)</p>
              
              {userVoted ? (
                <div className="space-y-2 font-mono text-xs pt-1 select-none">
                  {[
                    { label: match.teamA, key: "teamA" as const, color: "bg-fifa-neon" },
                    { label: "Draw Match", key: "draw" as const, color: "bg-slate-700" },
                    { label: match.teamB, key: "teamB" as const, color: "bg-fifa-gold" }
                  ].map((opt) => {
                    const pct = Math.round((pollVotes[opt.key] / totalVotes) * 100) || 0;
                    return (
                      <div key={opt.key}>
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="text-slate-300 font-bold">{opt.label}</span>
                          <span className="text-white font-bold">{pct}% ({pollVotes[opt.key]} votes)</span>
                        </div>
                        <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                          <div className={`${opt.color} h-full`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex gap-2 font-mono text-xs">
                  <button onClick={() => castPollVote("teamA")} className="flex-1 p-2 bg-slate-900 border border-slate-800 text-slate-300 rounded hover:border-fifa-neon transition-all uppercase cursor-pointer">{match.teamA}</button>
                  <button onClick={() => castPollVote("draw")} className="flex-1 p-2 bg-slate-900 border border-slate-800 text-slate-300 rounded hover:border-slate-600 transition-all uppercase cursor-pointer">DRAW</button>
                  <button onClick={() => castPollVote("teamB")} className="flex-1 p-2 bg-slate-900 border border-slate-800 text-slate-300 rounded hover:border-fifa-gold transition-all uppercase cursor-pointer">{match.teamB}</button>
                </div>
              )}
            </div>

            {/* Official Events Feed list */}
            <div>
              <span className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest block mb-4">⏱️ MATCH TIMELINE EVENTS</span>
              <div className="space-y-4 font-mono text-xs select-none pl-2">
                {timeline.length > 0 ? (
                  timeline.map((ev) => {
                    const indicator = ev.type === "goal" ? "⚽" : ev.type === "card" ? "🟨" : ev.type === "substitution" ? "🔄" : ev.type === "var" ? "🖥️" : "⏱️";
                    return (
                      <div key={ev.id} className="relative pl-6 border-l border-slate-800 pb-2">
                        {/* Event indicator dot */}
                        <div className="absolute -left-3 top-[-2px] w-6 h-6 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center text-[10px] shadow-sm select-none">
                          {indicator}
                        </div>
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <span className="font-bold text-white uppercase">{ev.type} Event</span>
                            <p className="text-gray-400 mt-0.5 leading-relaxed text-[11px]">{ev.detail}</p>
                          </div>
                          <span className="text-fifa-gold font-extrabold pb-1 shrink-0">{ev.time}'</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center p-6 bg-slate-950 rounded-xl text-slate-600">
                    Waiting for referee kickoff whistle to log field formations...
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Right Column: Community Match Chat & Stickers (2/5 width) */}
          <div className="md:col-span-2 flex flex-col bg-slate-950 overflow-hidden">
            
            {/* Chat header panel */}
            <div className="p-3.5 bg-slate-900 border-b border-slate-800 shrink-0 flex items-center gap-1.5 font-mono select-none">
              <MessageSquareText className="w-4.5 h-4.5 text-fifa-neon" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">Fan Chat Arena</span>
              <span className="text-[9px] bg-emerald-950 text-emerald-400 px-1.5 py-0.5 rounded font-medium shrink-0 animate-pulse ml-auto">
                AI MODERATED
              </span>
            </div>

            {/* Chat Stream message scroll container */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 font-mono text-xs">
              {chatList.map((msg) => (
                <div key={msg.id} className="bg-slate-900/85 p-2 px-3 rounded-lg border border-slate-800 space-y-1 relative group">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-extrabold text-slate-300 uppercase">{msg.userName} ({msg.country})</span>
                    <span className="text-slate-500 font-normal">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  {msg.sticker ? (
                    <div className="inline-block bg-slate-950 py-1.5 px-3 rounded border border-fifa-gold/10 text-fifa-gold font-bold text-sm select-none">
                      {msg.sticker}
                    </div>
                  ) : (
                    <p className="text-gray-300 leading-relaxed text-[11px]">{msg.message}</p>
                  )}

                  {/* Reaction rows */}
                  <div className="flex flex-wrap gap-1 pt-1.5">
                    {["⚽", "🔥", "🙌", "👀"].map((emoji) => {
                      const count = msg.reactions[emoji] || 0;
                      return (
                        <button
                          key={emoji}
                          onClick={() => handleSendReaction(msg.id, emoji)}
                          className="px-1.5 py-0.5 bg-slate-950 border border-slate-850 hover:border-slate-700 hover:text-white rounded text-[10px] flex items-center gap-1 text-slate-400 cursor-pointer select-none transition-all"
                        >
                          <span>{emoji}</span>
                          {count > 0 && <span>{count}</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* In-chat quick stickers shelf */}
            <div className="px-3 py-2 bg-slate-900/60 border-t border-slate-850 shrink-0 overflow-x-auto whitespace-nowrap flex gap-1.5">
              {STICKERS.map((st) => (
                <button
                  key={st.code}
                  type="button"
                  onClick={() => handleSendChatAndModeration(undefined, st.label)}
                  className="bg-slate-950 hover:bg-slate-900 text-[10px] font-bold py-1 px-3 border border-slate-800 hover:border-slate-700 text-fifa-gold rounded-full cursor-pointer shrink-0 transition-all"
                >
                  {st.label}
                </button>
              ))}
            </div>

            {/* Chat Input form footer */}
            <form onSubmit={(e) => handleSendChatAndModeration(e)} className="p-3 bg-slate-900 border-t border-slate-800 shrink-0 flex gap-2">
              <input
                type="text"
                maxLength={100}
                placeholder="Say something nice..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded px-2.5 py-2 text-xs text-white focus:outline-none focus:border-fifa-neon font-mono"
              />
              <button
                type="submit"
                className="bg-linear-to-r from-fifa-neon to-sky-500 hover:from-sky-450 hover:to-fifa-neon text-fifa-dark px-3.5 rounded flex items-center justify-center cursor-pointer shadow font-semibold"
              >
                <Send className="w-4 h-4 shrink-0" />
              </button>
            </form>

          </div>

        </div>

      </div>
    </div>
  );
}
