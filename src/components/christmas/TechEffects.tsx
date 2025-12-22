import React from 'react';

const TechEffects: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-20">
      {/* HUD 边框 */}
      <div className="absolute inset-0">
        <div className="absolute top-4 left-4 w-24 h-24">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-cyan-400/80 to-transparent" />
          <div className="absolute top-0 left-0 h-full w-[2px] bg-gradient-to-b from-cyan-400/80 to-transparent" />
          <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-cyan-400 animate-pulse" />
        </div>
        <div className="absolute top-4 right-4 w-24 h-24">
          <div className="absolute top-0 right-0 w-full h-[2px] bg-gradient-to-l from-cyan-400/80 to-transparent" />
          <div className="absolute top-0 right-0 h-full w-[2px] bg-gradient-to-b from-cyan-400/80 to-transparent" />
          <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-cyan-400 animate-pulse" />
        </div>
        <div className="absolute bottom-4 left-4 w-24 h-24">
          <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-cyan-400/80 to-transparent" />
          <div className="absolute bottom-0 left-0 h-full w-[2px] bg-gradient-to-t from-cyan-400/80 to-transparent" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-cyan-400 animate-pulse" />
        </div>
        <div className="absolute bottom-4 right-4 w-24 h-24">
          <div className="absolute bottom-0 right-0 w-full h-[2px] bg-gradient-to-l from-cyan-400/80 to-transparent" />
          <div className="absolute bottom-0 right-0 h-full w-[2px] bg-gradient-to-t from-cyan-400/80 to-transparent" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-cyan-400 animate-pulse" />
        </div>
        <div className="absolute top-6 left-32 text-cyan-400/60 font-mono text-[10px] tracking-wider">
          SYSTEM ACTIVE
        </div>
        <div className="absolute top-6 right-32 text-cyan-400/60 font-mono text-[10px] tracking-wider">
          GESTURE TRACKING
        </div>
      </div>

      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          backgroundPosition: 'center center',
        }}
      />

      <div className="absolute inset-0">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full animate-float"
            style={{
              width: `${2 + Math.random() * 2}px`,
              height: `${2 + Math.random() * 2}px`,
              background: i % 3 === 0
                ? 'radial-gradient(circle, rgba(255, 215, 0, 0.15) 0%, transparent 70%)'
                : i % 3 === 1
                ? 'radial-gradient(circle, rgba(255, 255, 255, 0.12) 0%, transparent 70%)'
                : 'radial-gradient(circle, rgba(147, 197, 253, 0.1) 0%, transparent 70%)',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${8 + Math.random() * 12}s`,
            }}
          />
        ))}
      </div>

      <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/40" />
    </div>
  );
};

export default TechEffects;
