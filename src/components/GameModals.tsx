import React from 'react';
import { t } from '../game/localization';
import { LanguageCode, RunStats } from '../game/types';

interface PauseModalProps {
  lang: LanguageCode;
  onResume: () => void;
  onRestart: () => void;
  onMainMenu: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  lang,
  onResume,
  onRestart,
  onMainMenu,
}) => (
  <div className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-[#03060f]/80">
    <div className="w-full max-w-sm rounded-2xl bg-[#090f1e] border border-slate-700 p-6 flex flex-col gap-3 text-center">
      <h2 className="text-2xl font-['Chakra_Petch'] font-bold text-white tracking-wider mb-2">
        {t(lang, 'paused')}
      </h2>
      <button
        type="button"
        onClick={onResume}
        className="w-full py-3 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-sm tracking-wider cursor-pointer"
      >
        {t(lang, 'resume')}
      </button>
      <button
        type="button"
        onClick={onRestart}
        className="w-full py-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm cursor-pointer"
      >
        {t(lang, 'restart')}
      </button>
      <button
        type="button"
        onClick={onMainMenu}
        className="w-full py-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-semibold text-sm cursor-pointer"
      >
        {t(lang, 'main_menu')}
      </button>
    </div>
  </div>
);

interface GameOverModalProps {
  stats: RunStats;
  highScore: number;
  lang: LanguageCode;
  canWatchReviveAd?: boolean;
  canDoubleCoinsAd?: boolean;
  adLoading?: boolean;
  onWatchReviveAd?: () => void;
  onWatchDoubleCoinsAd?: () => void;
  onOpenSupport?: () => void;
  onRetry: () => void;
  onGarage: () => void;
  onMainMenu: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  stats,
  highScore,
  lang,
  canWatchReviveAd,
  canDoubleCoinsAd,
  adLoading,
  onWatchReviveAd,
  onWatchDoubleCoinsAd,
  onOpenSupport,
  onRetry,
  onGarage,
  onMainMenu,
}) => (
  <div className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-[#03060f]/85">
    <div className="w-full max-w-md rounded-2xl bg-[#090f1e] border border-rose-500/40 p-6 flex flex-col gap-4">
      <div className="text-center">
        <h2 className="text-2xl font-['Chakra_Petch'] font-bold text-rose-400 tracking-wider">
          {t(lang, 'game_over')}
        </h2>
        <div className="text-xs font-mono text-slate-400 mt-1 tabular-nums">
          {t(lang, 'high_score')}: {highScore.toLocaleString()}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
          <div className="text-[11px] text-slate-400">{t(lang, 'distance')}</div>
          <div className="text-lg font-['Chakra_Petch'] font-bold tabular-nums text-white">
            {stats.distance.toLocaleString()}m
          </div>
        </div>
        <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
          <div className="text-[11px] text-slate-400">{t(lang, 'score')}</div>
          <div className="text-lg font-['Chakra_Petch'] font-bold tabular-nums text-cyan-300">
            {stats.score.toLocaleString()}
          </div>
        </div>
        <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
          <div className="text-[11px] text-slate-400">{t(lang, 'coins_earned')}</div>
          <div className="text-lg font-mono font-bold tabular-nums text-amber-300">
            +{stats.coinsEarned.toLocaleString()}
          </div>
        </div>
        <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
          <div className="text-[11px] text-slate-400">{t(lang, 'obstacles_destroyed')}</div>
          <div className="text-lg font-mono font-bold tabular-nums text-white">
            {stats.obstaclesDestroyed}
          </div>
        </div>
        <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
          <div className="text-[11px] text-slate-400">{t(lang, 'bosses_defeated')}</div>
          <div className="text-lg font-mono font-bold tabular-nums text-rose-300">
            {stats.bossesDefeated}
          </div>
        </div>
        <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
          <div className="text-[11px] text-slate-400">{t(lang, 'max_combo')}</div>
          <div className="text-lg font-mono font-bold tabular-nums text-orange-300">
            x{stats.maxCombo.toFixed(1)}
          </div>
        </div>
      </div>

      {(canWatchReviveAd || canDoubleCoinsAd) && (
        <div className="flex flex-col gap-2">
          {canWatchReviveAd && onWatchReviveAd && (
            <button
              type="button"
              disabled={adLoading}
              onClick={onWatchReviveAd}
              className="w-full py-2.5 rounded-lg bg-emerald-400 hover:bg-emerald-300 disabled:opacity-60 text-slate-950 font-bold text-sm tracking-wide cursor-pointer"
            >
              {t(lang, 'watch_ad_revive')}
            </button>
          )}
          {canDoubleCoinsAd && onWatchDoubleCoinsAd && stats.coinsEarned > 0 && (
            <button
              type="button"
              disabled={adLoading}
              onClick={onWatchDoubleCoinsAd}
              className="w-full py-2.5 rounded-lg bg-amber-400 hover:bg-amber-300 disabled:opacity-60 text-slate-950 font-bold text-sm tracking-wide cursor-pointer"
            >
              {t(lang, 'watch_ad_double_coins')} (+{stats.coinsEarned.toLocaleString()})
            </button>
          )}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-2.5">
        <button
          type="button"
          data-start="true"
          onClick={onRetry}
          className="flex-1 py-3 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-sm tracking-wider cursor-pointer"
        >
          {t(lang, 'restart')}
        </button>
        <button
          type="button"
          onClick={onGarage}
          className="flex-1 py-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm cursor-pointer"
        >
          {t(lang, 'garage')}
        </button>
        <button
          type="button"
          onClick={onMainMenu}
          className="flex-1 py-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-semibold text-sm cursor-pointer"
        >
          {t(lang, 'main_menu')}
        </button>
      </div>

      {onOpenSupport && (
        <button
          type="button"
          onClick={onOpenSupport}
          className="w-full py-2 rounded-lg bg-slate-900 hover:bg-amber-500/15 border border-amber-400/35 text-amber-300 font-semibold text-xs tracking-wide cursor-pointer"
        >
          {t(lang, 'support')}
        </button>
      )}
    </div>
  </div>
);

