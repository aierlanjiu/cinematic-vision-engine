import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  isActive?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', onClick, isActive }) => {
  return (
    <div 
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-2xl border transition-all duration-300
        backdrop-blur-xl
        ${isActive 
          ? 'bg-white/20 border-white/40 shadow-[0_0_30px_rgba(255,255,255,0.15)] scale-[1.02]' 
          : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 shadow-lg'
        }
        ${className}
      `}
    >
      {/* Noise Texture Overlay for that "Frosted" grain */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
      </div>
      
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};
