import React, { useMemo, useState } from 'react';
import { t } from '../game/localization';
import { SaveData, VehicleCategory } from '../game/types';
import { VEHICLE_DATABASE } from '../game/vehicles';

interface CollectionModalProps {
  save: SaveData;
  onSelectForGarage: (vehicleId: number) => void;
  onClose: () => void;
}

export const CollectionModal: React.FC<CollectionModalProps> = ({
  save,
  onSelectForGarage,
  onClose,
}) => {
  const lang = save.language;
  const [cat, setCat] = useState<VehicleCategory | 'ALL'>('ALL');

  const list = useMemo(
    () => VEHICLE_DATABASE.filter((v) => cat === 'ALL' || v.category === cat),
    [cat]
  );

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center p-4 bg-[#03060f]/85">
      <div className="w-full max-w-5xl rounded-2xl bg-[#090f1e] border border-slate-700 p-5 flex flex-col gap-4 max-h-[90vh]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-['Chakra_Petch'] font-bold text-white tracking-wider">
              {t(lang, 'collection')}
            </h2>
            <p className="text-xs font-mono text-cyan-300 tabular-nums">
              {save.ownedVehicles.length} / {VEHICLE_DATABASE.length} {t(lang, 'owned')}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold cursor-pointer"
          >
            {t(lang, 'back')}
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {(
            [
              ['ALL', 'cat_all'],
              ['CAR', 'cat_car'],
              ['AIRCRAFT', 'cat_aircraft'],
              ['SPACESHIP', 'cat_spaceship'],
              ['HYBRID', 'cat_hybrid'],
            ] as const
          ).map(([c, key]) => (
            <button
              key={c}
              type="button"
              onClick={() => setCat(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                cat === c ? 'bg-cyan-400 text-slate-950' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {t(lang, key)}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5 overflow-y-auto pr-1">
          {list.map((v) => {
            const owned = save.ownedVehicles.includes(v.id);
            const active = save.selectedVehicle === v.id;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => onSelectForGarage(v.id)}
                className={`p-3 rounded-xl text-left border transition-colors cursor-pointer ${
                  active
                    ? 'bg-cyan-500/20 border-cyan-400'
                    : owned
                      ? 'bg-slate-900 border-emerald-500/40 hover:border-emerald-400'
                      : 'bg-slate-950/80 border-slate-800 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-slate-400">{v.code}</span>
                  <span className={active ? 'text-cyan-300 font-bold' : owned ? 'text-emerald-400' : 'text-slate-500'}>
                    {active ? t(lang, 'selected') : owned ? t(lang, 'owned') : t(lang, 'locked')}
                  </span>
                </div>
                <div className="text-xs font-bold text-white truncate mt-1">{v.name}</div>
                <div className="text-[11px] font-mono text-slate-400 mt-1 tabular-nums">
                  {v.maxSpeed} km/h · {v.price.toLocaleString()}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
