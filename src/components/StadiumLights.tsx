import React from "react";

export function StadiumLights() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Dynamic Pitch Field Lines Overlay */}
      <div className="absolute inset-x-0 bottom-0 top-1/2 opacity-5 border-t-2 border-white pointer-events-none" />
      <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full border border-white opacity-[0.02] pointer-events-none" />
      
      {/* Blue Beam L (Left Stadium Light) */}
      <div className="absolute top-[-10%] left-[-10%] w-[350px] h-[750px] bg-fifa-neon rounded-full stadium-beam mix-blend-screen" 
           style={{ animationDelay: "0s" }} />

      {/* Gold Beam R (Right Stadium Light) */}
      <div className="absolute top-[-15%] right-[-10%] w-[380px] h-[800px] bg-fifa-gold rounded-full stadium-beam mix-blend-screen"
           style={{ animationDelay: "2s", animationDuration: "11s" }} />

      {/* Deep Atmosphere Pitch Vignette */}
      <div className="absolute inset-0 bg-radial-[circle_at_center,transparent_40%,rgba(5,10,24,0.95)]" />
    </div>
  );
}
