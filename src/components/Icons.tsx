import React from 'react';

export const TitleEmblem: React.FC<{ subtitle: string }> = ({ subtitle }) => (
  <div className="flex flex-col items-start select-none">
    <svg
      viewBox="0 0 420 68"
      className="w-[260px] sm:w-[340px] h-auto drop-shadow-[0_4px_16px_rgba(0,240,255,0.28)]"
      aria-label="Aether Horizon"
    >
      <defs>
        <linearGradient id="ah-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="55%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#00f0ff" />
        </linearGradient>
      </defs>
      <path
        d="M8 52 L28 16 L48 52 L39 52 L28 31 L17 52 Z"
        fill="#00f0ff"
      />
      <path d="M22 44 L34 44 L31 38 L25 38 Z" fill="#f97316" />
      <text
        x="62"
        y="46"
        fill="url(#ah-grad)"
        fontFamily="Chakra Petch, sans-serif"
        fontWeight="700"
        fontSize="36"
        letterSpacing="3"
      >
        AETHER HORIZON
      </text>
      <line x1="62" y1="56" x2="395" y2="56" stroke="#38bdf8" strokeWidth="1.5" strokeOpacity="0.45" />
    </svg>
    <div className="mt-1 pl-1 text-xs sm:text-sm font-semibold tracking-[0.28em] text-cyan-300 uppercase">
      {subtitle}
    </div>
  </div>
);

export const HeartIcon: React.FC<{ filled: boolean; className?: string }> = ({
  filled,
  className = 'w-6 h-6',
}) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path
      d="M12 20.5 L4.2 12.8 C2 10.6 2 7 4.4 4.9 C6.5 3.1 9.7 3.5 11.4 5.7 L12 6.5 L12.6 5.7 C14.3 3.5 17.5 3.1 19.6 4.9 C22 7 22 10.6 19.8 12.8 Z"
      fill={filled ? '#f43f5e' : 'rgba(15,23,42,0.7)'}
      stroke={filled ? '#fda4af' : '#475569'}
      strokeWidth="1.8"
    />
  </svg>
);

export const CoinIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <circle cx="12" cy="12" r="9.5" fill="#f59e0b" stroke="#fef08a" strokeWidth="1.8" />
    <polygon points="12,6 15.5,12 12,18 8.5,12" fill="#fef08a" />
  </svg>
);

export const ShieldIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path
      d="M12 2.5 L20 6 V12.5 C20 17.2 16.6 20.6 12 22 C7.4 20.6 4 17.2 4 12.5 V6 Z"
      fill="rgba(0,240,255,0.22)"
      stroke="#00f0ff"
      strokeWidth="1.8"
    />
  </svg>
);
