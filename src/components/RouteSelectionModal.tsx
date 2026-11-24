import React, { useState } from 'react';
import { t } from '../game/localization';
import { LanguageCode, RouteOption } from '../game/types';

interface RouteSelectionModalProps {
  routes: RouteOption[];
  lang: LanguageCode;
  onSelect: (route: RouteOption) => void;
}

export const RouteSelectionModal: React.FC<RouteSelectionModalProps> = ({
  routes,
  lang,
  onSelect,
}) => {
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart || routes.length < 3) return;
    const tEnd = e.changedTouches[0];
    const dx = tEnd.clientX - touchStart.x;
    const dy = tEnd.clientY - touchStart.y;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) {
      onSelect(dx < 0 ? routes[0] : routes[2]);
    } else if (dy < -45) {
      onSelect(routes[1]);
    }
    setTouchStart(null);
  };

  return (
    <div
      className="fixed inset-0 z-30 flex flex-col items-center justify-center p-4 bg-[#03060f]/80"
      onTouchStart={(e) => setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY })}
      onTouchEnd={handleTouchEnd}
    >
      <div className="text-center mb-5">
        <h2 className="text-2xl sm:text-3xl font-['Chakra_Petch'] font-bold text-cyan-300 tracking-wider">
          {t(lang, 'route_title')}
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 mt-1">{t(lang, 'route_subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl">
        {routes.map((route, idx) => {
          const hexAccent = `#${route.dimension.accentColor.toString(16).padStart(6, '0')}`;
          const hexSky = `#${route.dimension.horizonColor.toString(16).padStart(6, '0')}`;
          return (
            <button
              key={route.dimension.id}
              type="button"
              onClick={() => onSelect(route)}
              className="group p-4 rounded-xl bg-[#0a1122] hover:bg-[#101c36] border border-slate-700 hover:border-cyan-400 text-left flex flex-col gap-3 transition-transform hover:-translate-y-1 cursor-pointer"
            >
              {/* Dimension Visual Preview Swatch */}
              <div
                className="w-full h-24 rounded-lg border border-white/10 flex items-end p-2.5"
                style={{
                  background: `linear-gradient(160deg, ${hexSky} 0%, #050811 85%)`,
                }}
              >
                <span
                  className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-black/60"
                  style={{ color: hexAccent }}
                >
                  [{idx + 1}] {t(lang, route.environmentFocus.toLowerCase())}
                </span>
              </div>

              <div>
                <h3 className="text-base font-['Chakra_Petch'] font-bold text-white">
                  {t(lang, route.dimension.nameKey)}
                </h3>
                <div className="flex items-center justify-between text-xs font-mono mt-2">
                  <span className="text-amber-300">
                    {t(lang, 'route_bonus')}: +{route.bonusCoins}
                  </span>
                  <span className="text-slate-300">
                    {t(lang, 'route_risk')}: {t(lang, route.riskLabelKey)}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
