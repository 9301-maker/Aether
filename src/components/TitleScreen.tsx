import React from 'react';
import { DIMENSIONS } from '../game/dimensions';
import { LANGUAGE_LABELS, t } from '../game/localization';
import { LanguageCode, SaveData } from '../game/types';
import { getVehicleById } from '../game/vehicles';
import { CoinIcon, TitleEmblem } from './Icons';

interface TitleScreenProps {
  save: SaveData;
  selectedDimId: number;
  onChangeDimension: (dimId: number) => void;
  onPlay: () => void;
  onOpenGarage: () => void;
  onOpenUpgrades: () => void;
  onOpenCollection: () => void;
  onOpenSettings: () => void;
  onOpenSupport?: () => void;
  onChangeLanguage: (lang: LanguageCode) => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  save,
  selectedDimId,
  onChangeDimension,
  onPlay,
  onOpenGarage,
  onOpenUpgrades,
  onOpenCollection,
  onOpenSettings,
  onOpenSupport,
  onChangeLanguage,
}) => {
  const lang = save.language;
  const activeVehicle = getVehicleById(save.selectedVehicle);

  return (
    <div className="fixed inset-0 z-10 pointer-events-none flex flex-col justify-between p-4 sm:p-7">
      {/* Top Row: Title Emblem on Left, Coins, Dimension & Language on Right — center ~70% left completely open for 3D Vehicle */}
      <div className="flex items-start justify-between gap-4">
        <div className="pointer-events-auto">
          <TitleEmblem subtitle={t(lang, 'game_subtitle')} />
          <div className="mt-2 text-xs text-slate-300 font-mono tracking-wide">
            {activeVehicle.code} · {activeVehicle.name}
          </div>
        </div>

        <div className="pointer-events-auto flex flex-wrap items-center justify-end gap-2 sm:gap-2.5">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#050914]/65 border border-amber-400/25 text-amber-300 font-mono text-sm font-bold tabular-nums">
            <CoinIcon className="w-4 h-4" />
            <span>{save.coins.toLocaleString()}</span>
          </div>

          <label className="sr-only" htmlFor="dim-select-menu">
            {t(lang, 'dimension')}
          </label>
          <select
            id="dim-select-menu"
            value={selectedDimId}
            onChange={(e) => onChangeDimension(Number(e.target.value))}
            className="max-w-[140px] sm:max-w-[175px] truncate px-2.5 py-1.5 rounded-lg bg-[#050914]/65 border border-white/15 text-cyan-200 text-xs font-medium focus:outline-none focus:border-cyan-400"
          >
            {DIMENSIONS.map((d) => (
              <option key={d.id} value={d.id} className="bg-slate-900 text-slate-100">
                #{d.id} {t(lang, d.nameKey)}
              </option>
            ))}
          </select>

          <label className="sr-only" htmlFor="lang-select-menu">
            {t(lang, 'settings_language')}
          </label>
          <select
            id="lang-select-menu"
            value={lang}
            onChange={(e) => onChangeLanguage(e.target.value as LanguageCode)}
            className="px-2.5 py-1.5 rounded-lg bg-[#050914]/65 border border-white/15 text-slate-200 text-xs font-medium focus:outline-none focus:border-cyan-400"
          >
            {(Object.keys(LANGUAGE_LABELS) as LanguageCode[]).map((code) => (
              <option key={code} value={code} className="bg-slate-900">
                {LANGUAGE_LABELS[code]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="flex flex-col gap-2.5 items-start sm:items-stretch">
        <div className="pointer-events-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              data-start="true"
              onClick={onPlay}
              className="px-7 py-2.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 active:scale-[0.98] text-slate-950 font-['Chakra_Petch'] font-bold text-base sm:text-lg tracking-wider transition-transform cursor-pointer whitespace-nowrap shadow-[0_0_24px_rgba(0,240,255,0.35)]"
            >
              {t(lang, 'play')}
            </button>
            <button
              type="button"
              onClick={onOpenGarage}
              className="px-3.5 py-2.5 rounded-lg bg-[#050914]/65 hover:bg-slate-800/80 border border-cyan-400/30 text-cyan-100 font-semibold text-xs sm:text-sm transition-colors cursor-pointer whitespace-nowrap"
            >
              {t(lang, 'garage')}
            </button>
            <button
              type="button"
              onClick={onOpenUpgrades}
              className="px-3.5 py-2.5 rounded-lg bg-[#050914]/65 hover:bg-slate-800/80 border border-white/15 text-slate-100 font-semibold text-xs sm:text-sm transition-colors cursor-pointer whitespace-nowrap"
            >
              {t(lang, 'upgrades')}
            </button>
            <button
              type="button"
              onClick={onOpenCollection}
              className="px-3.5 py-2.5 rounded-lg bg-[#050914]/65 hover:bg-slate-800/80 border border-white/15 text-slate-100 font-semibold text-xs sm:text-sm transition-colors cursor-pointer whitespace-nowrap"
            >
              {t(lang, 'collection')}
            </button>
            <button
              type="button"
              onClick={onOpenSettings}
              className="px-3.5 py-2.5 rounded-lg bg-[#050914]/65 hover:bg-slate-800/80 border border-white/15 text-slate-100 font-semibold text-xs sm:text-sm transition-colors cursor-pointer whitespace-nowrap"
            >
              {t(lang, 'settings')}
            </button>
            {onOpenSupport && (
              <button
                type="button"
                onClick={onOpenSupport}
                className="px-3.5 py-2.5 rounded-lg bg-[#050914]/75 hover:bg-amber-500/20 border border-amber-400/45 text-amber-300 font-semibold text-xs sm:text-sm transition-colors cursor-pointer whitespace-nowrap"
              >
                {t(lang, 'support')}
              </button>
            )}
          </div>

          {save.highScore > 0 && (
            <div className="flex items-center gap-4 text-xs font-mono tabular-nums text-slate-300 bg-[#090f1e]/85 px-3 py-2 rounded-lg border border-slate-800">
              <span>
                {t(lang, 'high_score')}: <strong className="text-cyan-300">{save.highScore.toLocaleString()}</strong>
              </span>
              <span>
                {t(lang, 'distance')}: <strong className="text-slate-100">{save.bestDistance.toLocaleString()}m</strong>
              </span>
            </div>
          )}
        </div>

        {/* Single flat control hint line */}
        <p className="text-[11px] sm:text-xs text-slate-400 font-mono tracking-wide">
          {t(lang, 'controls_hint')}
        </p>
      </div>
    </div>
  );
};
