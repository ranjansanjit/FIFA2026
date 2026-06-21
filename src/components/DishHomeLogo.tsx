import React from "react";

const logoAsset = "/src/assets/images/dishhome_logo_1781699374576.jpg";

interface DishHomeLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  lightBackground?: boolean;
}

export function DishHomeLogo({ 
  className = "", 
  size = "md", 
  showText = true,
  lightBackground = false 
}: DishHomeLogoProps) {
  
  // Dimensions based on size preset
  const dimensions = {
    sm: { icon: "w-8 h-8", text: "text-xs" },
    md: { icon: "w-14 h-14", text: "text-base" },
    lg: { icon: "w-24 h-24", text: "text-2xl" },
    xl: { icon: "w-36 h-36", text: "text-4xl" }
  }[size];

  return (
    <div className={`flex flex-col items-center justify-center gap-2 ${className}`}>
      {/* Red rounded background box containing the custom "dh" emblem */}
      <div 
        className={`relative ${dimensions.icon} rounded-2xl bg-[#E31E24] shadow-md flex items-center justify-center overflow-hidden border border-red-500/10 group transition-all duration-300 hover:scale-105 hover:shadow-red-500/20`}
      >
        {/* We use our generated DishHome brand logo asset */}
        <img 
          src={logoAsset} 
          alt="DishHome Logo Symbol" 
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover select-none"
        />
        
        {/* Fallback elegant absolute overlay lines to catch edge renders */}
        <div className="absolute inset-0 bg-red-500/5 mix-blend-color-dodge pointer-events-none" />
      </div>

      {/* Corporate dual-tone text underneath the emblem */}
      {showText && (
        <div className="font-sans font-extrabold tracking-wide select-none flex items-center">
          <span className={lightBackground ? "text-slate-900" : "text-white"}>
            Dish
          </span>
          <span className="text-[#E31E24]">
            Home
          </span>
        </div>
      )}
    </div>
  );
}
