import React, { useState } from 'react';
import { t } from '../game/localization';
import {
  getEffectiveStats,
  getUpgradeCost,
  MAX_UPGRADE_LEVEL,
  UpgradeType,
} from '../game/rules';
import { SaveData } from '../game/types';
import { getVehicleById } from '../game/vehicles';
import { CoinIcon } from './Icons';

interface UpgradesModalProps {
  save: SaveData;
  onUpgrade: (type: UpgradeType) => { success: boolean; reason?: string };
  onClose: () => void;
}

export const UpgradesModal: React.FC<UpgradesModalProps> = ({ save, onUpgrade, onClose }) => {
  const lang = save.language;
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const vehicle = getVehicleById(save.selectedVehicle);
  const stats = getEffectiveStats(vehicle, save.upgrades, false);

  const items: { key: UpgradeType; titleKey: string; descKey: string; statLine: string }[] = [
    {
      key: 'cannon',
      titleKey: 'upgrade_cannon',
      descKey: 'upgrade_cannon_desc',
      statLine: `DMG ${stats.weaponDamage} · ${stats.fireRate}/s`,
    },
    {
      key: 'engine',
      titleKey: 'upgrade_engine',
      descKey: 'upgrade_engine_desc',
      statLine: `${stats.baseMaxSpeedKmh} km/h`,
    },
    {
      key: 'wings',
      titleKey: 'upgrade_wings',
      descKey: 'upgrade_wings_desc',
      statLine: `ACC ${stats.acceleration}`,
    },
    {
      key: 'armor',
      titleKey: 'upgrade_armor',
      descKey: 'upgrade_armor_desc',
      statLine: `${stats.maxHearts} HEARTS`,
    },
  ];

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center p-4 bg-[#03060f]/80">
      <div className="w-full max-w-3xl rounded-2xl bg-[#090f1e] border border-slate-700 p-5 sm:p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-['Chakra_Petch'] font-bold text-white tracking-wider">
              {t(lang, 'upgrades')}
            </h2>
            <p className="text-xs text-slate-400">
              {vehicle.code} {vehicle.name}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-amber-400/30 text-amber-300 font-mono text-sm font-bold tabular-nums">
              <CoinIcon className="w-4 h-4" />
              <span>{save.coins.toLocaleString()}</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold cursor-pointer"
            >
              {t(lang, 'back')}
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="px-3 py-2 rounded bg-rose-950/90 border border-rose-500/60 text-rose-200 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {items.map((item) => {
            const lvl = save.upgrades[item.key];
            const max = MAX_UPGRADE_LEVEL[item.key];
            const isMax = lvl >= max;
            const cost = getUpgradeCost(item.key, lvl);
            const canAfford = save.coins >= cost;

            return (
              <div
                key={item.key}
                className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-white">{t(lang, item.titleKey)}</h3>
                    <span className="text-xs font-mono font-bold text-cyan-300 tabular-nums">
                      {t(lang, 'level')} {lvl}/{max}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{t(lang, item.descKey)}</p>
                  <div className="mt-2 flex gap-1">
                    {Array.from({ length: max }).map((_, i) => (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-sm ${i < lvl ? 'bg-cyan-400' : 'bg-slate-800'}`}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
                  <span className="text-xs font-mono text-slate-300 tabular-nums">{item.statLine}</span>
                  <button
                    type="button"
                    disabled={isMax}
                    onClick={() => {
                      const res = onUpgrade(item.key);
                      if (!res.success) {
                        setErrorMsg(t(lang, res.reason || 'insufficient_coins'));
                      } else {
                        setErrorMsg(null);
                      }
                    }}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer whitespace-nowrap ${
                      isMax
                        ? 'bg-slate-800 text-slate-500 cursor-default'
                        : canAfford
                          ? 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                          : 'bg-slate-800 text-amber-300/70 hover:bg-slate-700'
                    }`}
                  >
                    {isMax ? t(lang, 'max_level') : `${t(lang, 'upgrade')} · ${cost.toLocaleString()}`}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
