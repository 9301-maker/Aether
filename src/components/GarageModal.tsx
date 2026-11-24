import React, { useEffect, useMemo, useRef, useState } from 'react';
import { WEAPON_SPECS } from '../game/config';
import { t } from '../game/localization';
import { getEffectiveStats } from '../game/rules';
import { SaveData, VehicleCategory } from '../game/types';
import { getVehicleById, VEHICLE_DATABASE } from '../game/vehicles';
import { CoinIcon } from './Icons';

interface GarageModalProps {
  save: SaveData;
  onPreviewVehicle: (id: number) => void;
  onBuyOrSelect: (id: number) => { success: boolean; reason?: string };
  onRotate: (dx: number) => void;
  onZoom: (dy: number) => void;
  onDrawerRatioChange: (ratio: number) => void;
  onClose: () => void;
}

const MIN_DRAWER_VH = 13;
const DEFAULT_DRAWER_VH = 36;
const MAX_DRAWER_VH = 68;

export const GarageModal: React.FC<GarageModalProps> = ({
  save,
  onPreviewVehicle,
  onBuyOrSelect,
  onRotate,
  onZoom,
  onDrawerRatioChange,
  onClose,
}) => {
  const lang = save.language;
  const [category, setCategory] = useState<VehicleCategory | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [inspectedId, setInspectedId] = useState<number>(save.selectedVehicle);
  const [feedback, setFeedback] = useState<string | null>(null);

  // 360 turntable drag
  const [draggingModel, setDraggingModel] = useState(false);
  const [lastModelX, setLastModelX] = useState(0);

  // Draggable bottom showroom drawer (height in vh)
  const [drawerVh, setDrawerVh] = useState<number>(DEFAULT_DRAWER_VH);
  const [isDraggingDrawer, setIsDraggingDrawer] = useState(false);
  const dragStartRef = useRef<{ y: number; startVh: number; moved: boolean } | null>(null);

  useEffect(() => {
    const ratio = (drawerVh - MIN_DRAWER_VH) / (MAX_DRAWER_VH - MIN_DRAWER_VH);
    onDrawerRatioChange(ratio);
  }, [drawerVh, onDrawerRatioChange]);

  const drawerState =
    drawerVh <= MIN_DRAWER_VH + 4 ? 'collapsed' : drawerVh >= MAX_DRAWER_VH - 8 ? 'expanded' : 'default';

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return VEHICLE_DATABASE.filter((v) => {
      if (category !== 'ALL' && v.category !== category) return false;
      if (q && !v.name.toLowerCase().includes(q) && !v.code.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [category, search]);

  const inspected = getVehicleById(inspectedId);
  const isOwned = save.ownedVehicles.includes(inspected.id);
  const isSelected = save.selectedVehicle === inspected.id;
  const stats = getEffectiveStats(inspected, save.upgrades, false);
  const weapon = WEAPON_SPECS[inspected.weaponType];

  const handleInspect = (id: number) => {
    setInspectedId(id);
    setFeedback(null);
    onPreviewVehicle(id);
  };

  const handleAction = () => {
    const res = onBuyOrSelect(inspected.id);
    if (!res.success) {
      setFeedback(t(lang, res.reason || 'insufficient_coins'));
    } else {
      setFeedback(null);
    }
  };

  const cycleDrawerPreset = () => {
    if (drawerState === 'collapsed') setDrawerVh(DEFAULT_DRAWER_VH);
    else if (drawerState === 'default') setDrawerVh(MAX_DRAWER_VH);
    else setDrawerVh(MIN_DRAWER_VH);
  };

  return (
    <div className="fixed inset-0 z-20 pointer-events-none flex flex-col justify-between">
      {/* Top Bar */}
      <div className="pointer-events-auto flex items-center justify-between gap-3 p-3 sm:p-5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-[#070c18]/80 hover:bg-slate-800 border border-white/15 text-slate-100 text-xs font-semibold cursor-pointer"
          >
            {t(lang, 'back')}
          </button>
          <h2 className="text-base sm:text-xl font-['Chakra_Petch'] font-bold text-white tracking-wider">
            {t(lang, 'garage')}
          </h2>
        </div>

        <div className="hidden sm:block px-3 py-1 rounded bg-[#070c18]/65 border border-white/10 text-[11px] font-mono text-slate-300">
          {t(lang, 'garage_hint')}
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#070c18]/80 border border-amber-400/30 text-amber-300 font-mono text-sm font-bold tabular-nums">
          <CoinIcon className="w-4 h-4" />
          <span>{save.coins.toLocaleString()}</span>
        </div>
      </div>

      {/* Central 3D Turntable Drag Zone */}
      <div
        className="pointer-events-auto flex-1 cursor-grab active:cursor-grabbing"
        onPointerDown={(e) => {
          setDraggingModel(true);
          setLastModelX(e.clientX);
        }}
        onPointerMove={(e) => {
          if (!draggingModel) return;
          onRotate(e.clientX - lastModelX);
          setLastModelX(e.clientX);
        }}
        onPointerUp={() => setDraggingModel(false)}
        onPointerLeave={() => setDraggingModel(false)}
        onWheel={(e) => onZoom(e.deltaY)}
      />

      {/* Resizable Showroom Bottom Sheet with Slide Up/Down Handle */}
      <div
        data-testid="garage-drawer"
        data-drawer-state={drawerState}
        style={{ height: `${drawerVh}vh` }}
        className={`pointer-events-auto mx-2 sm:mx-4 mb-2 sm:mb-3 rounded-2xl bg-[#070c18]/92 border border-white/12 flex flex-col overflow-hidden shadow-[0_-10px_40px_rgba(0,0,0,0.6)] ${
          isDraggingDrawer ? '' : 'transition-[height] duration-200 ease-out'
        }`}
      >
        {/* Tactile Slide Handle Bar */}
        <div
          role="slider"
          tabIndex={0}
          aria-label={t(lang, 'drawer_handle')}
          aria-valuemin={MIN_DRAWER_VH}
          aria-valuemax={MAX_DRAWER_VH}
          aria-valuenow={Math.round(drawerVh)}
          data-testid="garage-drawer-handle"
          onPointerDown={(e) => {
            e.stopPropagation();
            e.currentTarget.setPointerCapture(e.pointerId);
            setIsDraggingDrawer(true);
            dragStartRef.current = { y: e.clientY, startVh: drawerVh, moved: false };
          }}
          onPointerMove={(e) => {
            if (!dragStartRef.current) return;
            const dy = dragStartRef.current.y - e.clientY;
            if (Math.abs(dy) > 5) dragStartRef.current.moved = true;
            const deltaVh = (dy / Math.max(360, window.innerHeight)) * 100;
            const nextVh = Math.max(MIN_DRAWER_VH, Math.min(MAX_DRAWER_VH, dragStartRef.current.startVh + deltaVh));
            setDrawerVh(nextVh);
          }}
          onPointerUp={(e) => {
            if (!dragStartRef.current) return;
            if (e.currentTarget.hasPointerCapture(e.pointerId)) {
              e.currentTarget.releasePointerCapture(e.pointerId);
            }
            const moved = dragStartRef.current.moved;
            dragStartRef.current = null;
            setIsDraggingDrawer(false);
            if (!moved) {
              cycleDrawerPreset();
            } else if (drawerVh < 21) {
              setDrawerVh(MIN_DRAWER_VH);
            } else if (drawerVh > 55) {
              setDrawerVh(MAX_DRAWER_VH);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowUp') {
              e.preventDefault();
              setDrawerVh((v) => Math.min(MAX_DRAWER_VH, v + 14));
            } else if (e.key === 'ArrowDown') {
              e.preventDefault();
              setDrawerVh((v) => Math.max(MIN_DRAWER_VH, v - 14));
            } else if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              cycleDrawerPreset();
            }
          }}
          className="shrink-0 flex flex-col items-center justify-center py-2 px-4 border-b border-white/10 cursor-ns-resize select-none touch-none hover:bg-white/5"
        >
          <div className="w-12 h-1.5 rounded-full bg-slate-500/80 mb-1" />
          <div className="w-full flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span className="truncate">
              {inspected.code} {inspected.name}
            </span>
            <span className="text-cyan-300/90 hidden sm:inline">{t(lang, 'drawer_handle')}</span>
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                setDrawerVh(drawerState === 'collapsed' ? DEFAULT_DRAWER_VH : MIN_DRAWER_VH);
              }}
              className="px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-[10px] cursor-pointer"
            >
              {drawerState === 'collapsed' ? t(lang, 'drawer_expand') : t(lang, 'drawer_collapse')}
            </button>
          </div>
        </div>

        {/* Drawer Body: Compact Action Bar when Collapsed, Full Split Showroom when Expanded/Default */}
        {drawerState === 'collapsed' ? (
          <div className="flex-1 px-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="text-cyan-300">{inspected.compatibleAltitudes.join(' · ')}</span>
              <span className="text-slate-300 hidden sm:inline">{stats.baseMaxSpeedKmh} km/h</span>
              <span className="text-amber-300">
                {isOwned ? t(lang, 'owned') : `${inspected.price.toLocaleString()} ${t(lang, 'coins')}`}
              </span>
            </div>
            <button
              type="button"
              disabled={isSelected}
              onClick={handleAction}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold tracking-wider cursor-pointer whitespace-nowrap ${
                isSelected
                  ? 'bg-slate-800 text-slate-400 cursor-default'
                  : isOwned
                    ? 'bg-cyan-400 hover:bg-cyan-300 text-slate-950'
                    : 'bg-amber-400 hover:bg-amber-300 text-slate-950'
              }`}
            >
              {isSelected
                ? t(lang, 'selected')
                : isOwned
                  ? t(lang, 'select')
                  : `${t(lang, 'buy')} (${inspected.price.toLocaleString()})`}
            </button>
          </div>
        ) : (
          <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3 p-3 sm:p-4">
            {/* Left: Vehicle Catalog */}
            <div className="lg:col-span-7 flex flex-col gap-2 min-h-0">
              <div className="flex flex-wrap items-center justify-between gap-2 shrink-0">
                <div className="flex flex-wrap gap-1">
                  {(
                    [
                      ['ALL', 'cat_all'],
                      ['CAR', 'cat_car'],
                      ['AIRCRAFT', 'cat_aircraft'],
                      ['SPACESHIP', 'cat_spaceship'],
                      ['HYBRID', 'cat_hybrid'],
                    ] as const
                  ).map(([cat, labelKey]) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`px-2.5 py-1 rounded text-[11px] font-semibold cursor-pointer ${
                        category === cat
                          ? 'bg-cyan-400 text-slate-950'
                          : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {t(lang, labelKey)}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t(lang, 'search_placeholder')}
                  aria-label={t(lang, 'search_placeholder')}
                  className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="flex-1 min-h-0 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 overflow-y-auto pr-1">
                {filtered.map((v) => {
                  const owned = save.ownedVehicles.includes(v.id);
                  const active = save.selectedVehicle === v.id;
                  const current = inspectedId === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => handleInspect(v.id)}
                      className={`p-2 rounded-lg text-left border transition-colors cursor-pointer ${
                        current
                          ? 'bg-cyan-500/20 border-cyan-400'
                          : 'bg-slate-900/80 border-white/10 hover:border-slate-500'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                        <span>{v.code}</span>
                        <span
                          className={
                            active ? 'text-cyan-300 font-bold' : owned ? 'text-emerald-400' : 'text-amber-300'
                          }
                        >
                          {active ? 'EQ' : owned ? 'OWN' : `${v.price.toLocaleString()}`}
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-slate-100 truncate mt-0.5">{v.name}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right: Vehicle Spec Inspector */}
            <div className="lg:col-span-5 flex flex-col justify-between gap-2 p-3 rounded-xl bg-slate-950/65 border border-white/10 min-h-0">
              <div>
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="text-sm sm:text-base font-['Chakra_Petch'] font-bold text-white truncate">
                    {inspected.code} {inspected.name}
                  </h3>
                  <span className="text-[11px] font-mono text-cyan-300 whitespace-nowrap">
                    {inspected.compatibleAltitudes.join(' · ')}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">{t(lang, weapon.nameKey)}</div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-2.5 text-xs">
                  <div className="flex justify-between font-mono tabular-nums">
                    <span className="text-slate-400">{t(lang, 'stat_speed')}</span>
                    <span className="text-white font-bold">{stats.baseMaxSpeedKmh} km/h</span>
                  </div>
                  <div className="flex justify-between font-mono tabular-nums">
                    <span className="text-slate-400">{t(lang, 'stat_accel')}</span>
                    <span className="text-white font-bold">{stats.acceleration}</span>
                  </div>
                  <div className="flex justify-between font-mono tabular-nums">
                    <span className="text-slate-400">{t(lang, 'stat_handling')}</span>
                    <span className="text-white font-bold">{inspected.handling}</span>
                  </div>
                  <div className="flex justify-between font-mono tabular-nums">
                    <span className="text-slate-400">{t(lang, 'stat_durability')}</span>
                    <span className="text-white font-bold">{inspected.durability}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-2 border-t border-white/10">
                {feedback ? (
                  <span className="text-xs text-rose-400 font-semibold">{feedback}</span>
                ) : (
                  <div className="text-xs font-mono tabular-nums text-amber-300">
                    {isOwned ? t(lang, 'owned') : `${inspected.price.toLocaleString()} ${t(lang, 'coins')}`}
                  </div>
                )}

                <button
                  type="button"
                  disabled={isSelected}
                  onClick={handleAction}
                  className={`px-5 py-2 rounded-lg text-xs font-bold tracking-wider cursor-pointer whitespace-nowrap ${
                    isSelected
                      ? 'bg-slate-800 text-slate-400 cursor-default'
                      : isOwned
                        ? 'bg-cyan-400 hover:bg-cyan-300 text-slate-950'
                        : 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                  }`}
                >
                  {isSelected
                    ? t(lang, 'selected')
                    : isOwned
                      ? t(lang, 'select')
                      : `${t(lang, 'buy')} (${inspected.price.toLocaleString()})`}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
