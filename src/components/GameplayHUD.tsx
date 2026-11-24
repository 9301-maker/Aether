import React from 'react';
import { getDimensionById } from '../game/dimensions';
import { t } from '../game/localization';
import { AltitudeLayer, HudSnapshot, LanguageCode } from '../game/types';
import { CoinIcon, HeartIcon, ShieldIcon } from './Icons';

interface GameplayHUDProps {
  hud: HudSnapshot;
  lang: LanguageCode;
  muted: boolean;
  autoFire: boolean;
  onToggleMute: () => void;
  onToggleAutoFire: () => void;
  onPause: () => void;
  onAltitudeSelect: (alt: AltitudeLayer) => void;
  onJump: () => void;
  onCrouch: () => void;
  onFireStart: () => void;
  onFireEnd: () => void;
  onOverdrive: () => void;
}

export const GameplayHUD: React.FC<GameplayHUDProps> = ({
  hud,
  lang,
  muted,
  autoFire,
  onToggleMute,
  onToggleAutoFire,
  onPause,
  onAltitudeSelect,
  onJump,
  onCrouch,
  onFireStart,
  onFireEnd,
  onOverdrive,
}) => {
  const dim = getDimensionById(hud.dimensionId);
  const overdriveReady = hud.overdriveCharge >= 100 && !hud.overdriveActive;

  return (
    <div className="fixed inset-0 z-10 pointer-events-none flex flex-col justify-between p-2.5 sm:p-4">
      {/* Top Perimeter Strip: Left Telemetry + Hearts/Overdrive, Right Speed + Compact Controls */}
      <div className="flex items-start justify-between gap-2">
        {/* Top-Left: Lightweight Borderless Telemetry & Vitality */}
        <div className="flex flex-col gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#050914]/55 border border-white/10">
          <div className="flex items-baseline gap-3 sm:gap-4">
            <div>
              <span className="block text-[9px] uppercase tracking-wider text-slate-400 leading-none">
                {t(lang, 'distance')}
              </span>
              <span
                className="text-base sm:text-lg font-['Chakra_Petch'] font-bold tabular-nums text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]"
                data-testid="hud-distance"
              >
                {hud.distance.toLocaleString()}m
              </span>
            </div>

            <div>
              <span className="block text-[9px] uppercase tracking-wider text-slate-400 leading-none">
                {t(lang, 'score')}
              </span>
              <span
                className="text-base sm:text-lg font-['Chakra_Petch'] font-bold tabular-nums text-cyan-300 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]"
                data-testid="hud-score"
              >
                {hud.score.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center gap-1 self-center">
              <CoinIcon className="w-3.5 h-3.5" />
              <span
                className="text-xs sm:text-sm font-mono font-bold tabular-nums text-amber-300"
                data-testid="hud-coins"
              >
                +{hud.runCoins.toLocaleString()}
              </span>
            </div>

            {hud.combo > 1 && (
              <span className="text-xs sm:text-sm font-mono font-bold tabular-nums text-orange-400 self-center">
                x{hud.combo.toFixed(1)}
              </span>
            )}
          </div>

          {/* Inline Hearts + Slim Overdrive Bar */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-0.5" aria-label="Hearts">
              {Array.from({ length: hud.maxHearts }).map((_, idx) => (
                <HeartIcon key={idx} filled={idx < hud.hearts} className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              <div className="w-16 sm:w-24 h-1.5 bg-slate-900/90 rounded-full overflow-hidden border border-white/10">
                <div
                  className={`h-full transition-[width] duration-75 ${
                    hud.overdriveActive ? 'bg-amber-400' : overdriveReady ? 'bg-cyan-300' : 'bg-cyan-600'
                  }`}
                  style={{ width: `${hud.overdriveActive ? 100 : hud.overdriveCharge}%` }}
                />
              </div>
              <span className="text-[10px] font-mono tabular-nums text-slate-300">
                {hud.overdriveActive ? `${hud.overdriveTimer}s` : `${hud.overdriveCharge}%`}
              </span>
            </div>

            {hud.shieldActive && (
              <div className="flex items-center gap-1 text-[10px] font-mono text-cyan-300 tabular-nums">
                <ShieldIcon className="w-3.5 h-3.5" />
                <span>{hud.shieldTimer}s</span>
              </div>
            )}

            {hud.magnetActive && (
              <span className="text-[10px] font-mono text-purple-300 tabular-nums">MAG {hud.magnetTimer}s</span>
            )}
          </div>

          <div className="hidden sm:block text-[10px] text-slate-400 tracking-wide">
            {t(lang, dim.nameKey)}
          </div>
        </div>

        {/* Top-Right: Compact Utility Icons + Sleek Speed Readout */}
        <div className="flex flex-col items-end gap-1.5">
          <div className="pointer-events-auto flex items-center gap-1.5">
            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.currentTarget.blur();
                onToggleAutoFire();
              }}
              aria-label={t(lang, 'auto_fire')}
              className={`px-2 py-1.5 rounded-md text-[11px] font-semibold border cursor-pointer whitespace-nowrap ${
                autoFire
                  ? 'bg-cyan-500/25 border-cyan-400/70 text-cyan-200'
                  : 'bg-[#050914]/60 border-white/15 text-slate-300'
              }`}
            >
              {t(lang, 'auto_fire')}
            </button>
            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.currentTarget.blur();
                onToggleMute();
              }}
              aria-label={muted ? 'Unmute' : 'Mute'}
              className="px-2 py-1.5 rounded-md bg-[#050914]/60 border border-white/15 text-slate-200 text-[11px] font-mono cursor-pointer"
            >
              {muted ? 'MUTE' : 'SFX'}
            </button>
            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.currentTarget.blur();
                onPause();
              }}
              aria-label={t(lang, 'pause')}
              className="px-2.5 py-1.5 rounded-md bg-[#050914]/60 hover:bg-slate-800/80 border border-white/20 text-white text-[11px] font-semibold cursor-pointer"
            >
              II
            </button>
          </div>

          <div className="px-2.5 py-1 rounded-md bg-[#050914]/50 border border-white/10 text-right">
            <div className="flex items-baseline justify-end gap-1">
              <span
                className={`text-xl sm:text-2xl font-['Chakra_Petch'] font-bold tabular-nums leading-none ${
                  hud.overdriveActive ? 'text-amber-300' : 'text-white'
                }`}
              >
                {hud.currentSpeedKmh}
              </span>
              <span className="text-[10px] font-mono text-slate-400">km/h</span>
            </div>
            <div className="text-[9px] font-mono tabular-nums text-slate-400">
              {t(lang, 'max_speed')} {hud.maxSpeedKmh.toLocaleString()}
              {hud.isAtMaxSpeed && <span className="text-cyan-300 font-bold"> · {t(lang, 'max_indicator')}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Top-Center Alerts / Boss Bar (only shown when active, never blocks central road) */}
      <div className="flex flex-col items-center gap-1.5 mb-auto mt-2">
        {hud.bossActive && (
          <div className="w-full max-w-sm px-3.5 py-1.5 rounded-lg bg-[#090d1a]/80 border border-rose-500/50">
            <div className="flex items-center justify-between text-[11px] font-bold text-rose-300 mb-1">
              <span>{hud.bossName}</span>
              <span className="font-mono tabular-nums">
                {hud.bossHp} / {hud.bossMaxHp}
              </span>
            </div>
            <div className="w-full h-2 bg-slate-900 rounded-sm overflow-hidden">
              <div
                className="h-full bg-rose-500 transition-[width] duration-75"
                style={{ width: `${Math.max(0, (hud.bossHp / Math.max(1, hud.bossMaxHp)) * 100)}%` }}
              />
            </div>
            {hud.bossWarning && (
              <div className="mt-1 text-center text-[10px] font-mono font-bold text-amber-300">
                {hud.bossWarning}
              </div>
            )}
          </div>
        )}

        {hud.alertMessage && (
          <div className="px-3.5 py-1.5 rounded-lg bg-rose-950/90 border border-rose-400/80 text-rose-100 text-xs font-bold tracking-wide text-center">
            {hud.alertMessage}
          </div>
        )}

        {hud.floatingNotification && !hud.alertMessage && (
          <div
            key={hud.floatingNotification.id}
            className="px-2.5 py-0.5 rounded bg-[#050914]/70 text-xs font-mono font-bold"
            style={{ color: hud.floatingNotification.color }}
          >
            {hud.floatingNotification.text}
          </div>
        )}
      </div>

      {/* Bottom Edge: Slim Right-Edge Altitude Rail + Unobtrusive Corner Thumb Controls */}
      <div className="flex items-end justify-between gap-2">
        {/* Bottom-Left: Compact Jump & Crouch */}
        <div className="pointer-events-auto flex items-center gap-1.5">
          <button
            type="button"
            tabIndex={-1}
            onPointerDown={(e) => {
              e.stopPropagation();
              onJump();
            }}
            className="min-w-[54px] sm:min-w-[66px] min-h-[40px] sm:min-h-[42px] px-2.5 py-1.5 rounded-lg bg-[#060a14]/55 active:bg-cyan-500/35 border border-white/15 text-slate-100 text-[11px] font-bold tracking-wide cursor-pointer touch-none"
          >
            {t(lang, 'jump')}
          </button>
          <button
            type="button"
            tabIndex={-1}
            onPointerDown={(e) => {
              e.stopPropagation();
              onCrouch();
            }}
            className="min-w-[56px] sm:min-w-[66px] min-h-[40px] sm:min-h-[42px] px-2.5 py-1.5 rounded-lg bg-[#060a14]/55 active:bg-cyan-500/35 border border-white/15 text-slate-100 text-[11px] font-bold tracking-wide cursor-pointer touch-none"
          >
            {t(lang, 'crouch')}
          </button>
        </div>

        {/* Bottom-Right: Compact Altitude Stack above Overdrive & Fire */}
        <div className="flex flex-col items-end gap-1.5">
          <div className="pointer-events-auto flex items-center gap-1 bg-[#050914]/55 p-1 rounded-md border border-white/10">
            {(['GROUND', 'SKY', 'SPACE'] as AltitudeLayer[]).map((alt) => {
              const keyNum = alt === 'GROUND' ? '1' : alt === 'SKY' ? '2' : '3';
              const active = hud.altitude === alt;
              return (
                <button
                  key={alt}
                  type="button"
                  tabIndex={-1}
                  onClick={(e) => {
                    e.currentTarget.blur();
                    onAltitudeSelect(alt);
                  }}
                  className={`px-2 py-1 rounded text-[10px] font-mono font-bold cursor-pointer transition-colors whitespace-nowrap ${
                    active
                      ? 'bg-cyan-400 text-slate-950'
                      : 'text-slate-300 hover:bg-white/10'
                  }`}
                >
                  {keyNum}·{t(lang, alt.toLowerCase())}
                </button>
              );
            })}
          </div>

          <div className="pointer-events-auto flex items-center gap-1.5">
            <button
              type="button"
              tabIndex={-1}
              disabled={!overdriveReady}
              onPointerDown={(e) => {
                e.stopPropagation();
                onOverdrive();
              }}
              className={`min-w-[66px] sm:min-w-[82px] min-h-[40px] sm:min-h-[42px] px-2.5 py-1.5 rounded-lg text-[11px] font-bold tracking-wide border cursor-pointer touch-none ${
                overdriveReady
                  ? 'bg-amber-400 text-slate-950 border-amber-200'
                  : 'bg-[#060a14]/45 text-slate-500 border-white/10 cursor-not-allowed'
              }`}
            >
              {t(lang, 'overdrive')}
            </button>
            <button
              type="button"
              tabIndex={-1}
              onPointerDown={(e) => {
                e.stopPropagation();
                onFireStart();
              }}
              onPointerUp={(e) => {
                e.stopPropagation();
                onFireEnd();
              }}
              onPointerLeave={onFireEnd}
              onPointerCancel={onFireEnd}
              className="min-w-[64px] sm:min-w-[82px] min-h-[40px] sm:min-h-[42px] px-3 py-1.5 rounded-lg bg-cyan-500/85 active:bg-cyan-300 text-slate-950 font-['Chakra_Petch'] font-bold text-xs tracking-wider cursor-pointer touch-none"
            >
              {t(lang, 'fire')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
