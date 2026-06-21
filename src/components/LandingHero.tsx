import React, { useState, useEffect } from "react";
import { Trophy, Users, ShieldAlert, Award } from "lucide-react";
import { DishHomeLogo } from "./DishHomeLogo";

interface LandingHeroProps {
  onJoinClick: () => void;
  registeredUsersCount: number;
  prizePool?: number;
  winnersTicker: Array<{ id: string; text: string }>;
}

export function LandingHero({ onJoinClick, registeredUsersCount, winnersTicker }: LandingHeroProps) {

  return (
    <div className="relative z-10 w-full max-w-6xl mx-auto px-4 py-8 md:py-16 text-center select-none">
      
      {/* Brand Logos and Trophy co-branding row */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12 mb-8 select-none animate-in fade-in slide-in-from-top-6 duration-1000">
        {/* DishHome Logo */}
        <div className="relative shrink-0">
          <div className="absolute inset-0 bg-[#E31E24]/10 rounded-full blur-2xl animate-pulse" />
          <DishHomeLogo size="xl" showText={true} />
        </div>

        {/* Separator / Plus icon */}
        <div className="text-[#00D1FF]/40 font-mono text-xl font-bold uppercase hidden sm:block shrink-0">
          ×
        </div>

        {/* Dynamic Animated Trophy Decoration */}
        <div className="relative flex justify-center shrink-0">
          <div className="absolute w-40 h-40 bg-fifa-gold rounded-full opacity-[0.12] blur-2xl animate-pulse" />
          <div className="relative px-8 py-6 bg-white/5 backdrop-blur-md rounded-3xl border border-[#00D1FF]/30 hover:border-[#00D1FF]/60 transition-all cursor-pointer group shadow-2xl flex flex-col items-center justify-center">
            <Trophy className="w-16 h-16 text-fifa-gold animate-[bounce_3s_infinite] group-hover:scale-110 duration-300" />
            <div className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-fifa-neon opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-fifa-neon"></span>
            </div>
            <span className="text-[9px] text-fifa-gold font-mono font-black uppercase tracking-widest mt-2">
              🏆 Predict arena
            </span>
          </div>
        </div>
      </div>

      {/* Main Pitch Branding Header */}
      <h1 className="font-display font-bold text-4xl sm:text-6xl tracking-tight leading-none bg-gradient-to-r from-white via-fifa-gold to-white bg-clip-text text-transparent drop-shadow-lg mb-4 uppercase">
        FIFA 2026 Game Predict
      </h1>
      
      <p className="text-gray-300 font-sans text-sm sm:text-lg max-w-2xl mx-auto mb-8 font-light">
        The ultimate real-time prediction engine for World Cup 2026. Submit matches, answer rapid live questions during matches, and climb the global leaderboards with companion fans!
      </p>

      {/* Live Winners Scrolling Ticker */}
      <div className="w-full max-w-4xl mx-auto mb-10 overflow-hidden bg-white/5 backdrop-blur-sm border-y border-[#00D1FF]/20 py-2.5 px-4 rounded-lg flex items-center gap-4 text-xs font-mono">
        <span className="bg-fifa-gold text-fifa-blue px-2 py-0.5 rounded font-bold uppercase tracking-wider scale-95 shrink-0 animate-pulse">
          TOP PREDICTORS
        </span>
        <div className="relative w-full overflow-hidden h-5">
          <div className="absolute flex animate-[marquee_25s_linear_infinite] whitespace-nowrap gap-16 text-fifa-neon hover:pause cursor-default">
            {winnersTicker.map((tick, idx) => (
              <span key={tick.id || idx} className="inline-flex items-center gap-1">
                🏆 {tick.text}
              </span>
            ))}
          </div>
        </div>
      </div>



      {/* Call To Actions & Stats Bento Grid */}
      <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto items-stretch">
        
        {/* Play Card */}
        <div className="bg-white/5 border border-[#00D1FF]/30 rounded-2xl p-6 flex flex-col justify-between items-center shadow-xl hover:shadow-[#00D1FF]/5 transition-all">
          <div className="mb-4">
            <Award className="w-10 h-10 text-fifa-gold mx-auto mb-2" />
            <h3 className="font-display font-semibold text-lg text-white">Join Challenge</h3>
            <p className="text-gray-400 text-xs mt-1">Unlock full VIP World Cup predictions and premium points ledger.</p>
          </div>
          <button 
            id="btn_join_action"
            onClick={onJoinClick}
            className="w-full bg-linear-to-r from-fifa-gold to-yellow-500 hover:from-yellow-500 hover:to-fifa-gold text-fifa-blue font-semibold py-2.5 px-6 rounded-lg shadow-lg hover:shadow-fifa-gold/20 hover:scale-[1.02] active:scale-[0.98] transition-all text-sm tracking-wider uppercase font-display"
          >
            Predict Now
          </button>
        </div>

        {/* Registered Users */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col justify-center items-center shadow-xl">
          <div className="w-12 h-12 rounded-full bg-fifa-neon/10 flex items-center justify-center mb-3">
            <Users className="w-6 h-6 text-fifa-neon" />
          </div>
          <span className="text-xs text-gray-400 font-bold tracking-widest uppercase">Active Predictors</span>
          <span className="text-3xl font-mono font-bold text-white mt-1">{registeredUsersCount.toLocaleString()}</span>
          <p className="text-[10px] text-slate-500 mt-2">Nepal, India, USA and global players playing live.</p>
        </div>

      </div>

      {/* Styled Infinite Marquee Animation Injector */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .hover\\:pause:hover {
          animation-play-state: paused;
        }
      `}</style>

    </div>
  );
}
