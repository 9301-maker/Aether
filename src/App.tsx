import { useCallback, useEffect, useRef, useState } from 'react';
import { CollectionModal } from './components/CollectionModal';
import { GameOverModal, PauseModal } from './components/GameModals';
import { GameplayHUD } from './components/GameplayHUD';
import { GarageModal } from './components/GarageModal';
import { RouteSelectionModal } from './components/RouteSelectionModal';
import { SettingsModal } from './components/SettingsModal';
import { SupportModal } from './components/SupportModal';
import { TitleScreen } from './components/TitleScreen';
import { UpgradesModal } from './components/UpgradesModal';
import { audioManager } from './game/audio';
import { crazyGames } from './game/crazygames';
import { GameEngine } from './game/engine';
import {
  purchaseUpgrade,
  purchaseVehicle,
  UpgradeType,
} from './game/rules';
import { saveManager } from './game/saveManager';
import {
  AltitudeLayer,
  GameSettings,
  GameState,
  HudSnapshot,
  LanguageCode,
  RouteOption,
  RunStats,
  SaveData,
} from './game/types';

function mapBodyDatasetState(state: GameState): string {
  switch (state) {
    case 'MAIN_MENU':
    case 'BOOT':
    case 'LOADING':
      return 'title';
    case 'GAMEPLAY':
    case 'BOSS_BATTLE':
      return 'playing';
    case 'PAUSED':
      return 'paused';
    case 'GAME_OVER':
      return 'gameover';
    case 'ROUTE_SELECTION':
      return 'route';
    default:
      return state.toLowerCase();
  }
}

const INITIAL_HUD: HudSnapshot = {
  distance: 0,
  score: 0,
  runCoins: 0,
  totalCoins: 2000,
  combo: 1.0,
  comboTimerRatio: 0,
  hearts: 3,
  maxHearts: 3,
  shieldActive: false,
  shieldTimer: 0,
  magnetActive: false,
  magnetTimer: 0,
  overdriveCharge: 0,
  overdriveActive: false,
  overdriveTimer: 0,
  currentSpeedKmh: 0,
  maxSpeedKmh: 260,
  isAtMaxSpeed: false,
  altitude: 'GROUND',
  dimensionId: 1,
  bossActive: false,
  bossName: '',
  bossHp: 0,
  bossMaxHp: 1,
  bossWarning: null,
  alertMessage: null,
  floatingNotification: null,
};

export default function App() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [save, setSave] = useState<SaveData>(() => saveManager.load().data);
  const saveRef = useRef<SaveData>(save);

  const [gameState, setGameState] = useState<GameState>('MAIN_MENU');
  const gameStateRef = useRef<GameState>('MAIN_MENU');

  const [hud, setHud] = useState<HudSnapshot>(INITIAL_HUD);
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const routesRef = useRef<RouteOption[]>([]);
  const [lastRunStats, setLastRunStats] = useState<RunStats | null>(null);
  const [webglError, setWebglError] = useState<string | null>(null);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [coinsDoubledThisRun, setCoinsDoubledThisRun] = useState(false);
  const [adLoading, setAdLoading] = useState(false);
  const [selectedDimId, setSelectedDimId] = useState<number>(() => {
    const raw = Number(new URLSearchParams(window.location.search).get('dim'));
    return Number.isFinite(raw) && raw >= 1 && raw <= 20 ? Math.floor(raw) : 3;
  });

  const swipeStartRef = useRef<{ x: number; y: number } | null>(null);

  const commitSave = useCallback((next: SaveData) => {
    saveRef.current = next;
    setSave(next);
    saveManager.save(next);
    engineRef.current?.updateSaveData(next);
  }, []);

  useEffect(() => {
    document.body.dataset.state = mapBodyDatasetState(gameState);
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const engine = new GameEngine(container, saveRef.current, {
      onHudUpdate: (snap) => setHud(snap),
      onStateChange: (nextState) => {
        gameStateRef.current = nextState;
        document.body.dataset.state = mapBodyDatasetState(nextState);
        setGameState(nextState);
      },
      onRunComplete: (stats) => {
        setLastRunStats(stats);
        const cur = saveRef.current;
        const updated: SaveData = {
          ...cur,
          coins: cur.coins + stats.coinsEarned,
          highScore: Math.max(cur.highScore, stats.score),
          bestDistance: Math.max(cur.bestDistance, stats.distance),
          totalDistance: cur.totalDistance + stats.distance,
          totalBossesDefeated: cur.totalBossesDefeated + stats.bossesDefeated,
          totalObstaclesDestroyed: cur.totalObstaclesDestroyed + stats.obstaclesDestroyed,
        };
        commitSave(updated);
      },
      onRoutesReady: (opts) => {
        routesRef.current = opts;
        setRoutes(opts);
      },
      onWebGLError: (msg) => setWebglError(msg),
    });

    engineRef.current = engine;

    const params = new URLSearchParams(window.location.search);
    const dimParam = Number(params.get('dim'));
    if (Number.isFinite(dimParam) && dimParam >= 1 && dimParam <= 20) {
      engine.setStartDimension(Math.floor(dimParam));
    }
    if (params.get('autostart') === '1') {
      engine.startNewRun();
    }

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, [commitSave]);

  // Unified Keyboard Input & Blur Hygiene
  useEffect(() => {
    const heldKeys = new Set<string>();

    const onKeyDown = (e: KeyboardEvent) => {
      // Avoid intercepting typing in inputs/textareas
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      const state = gameStateRef.current;

      if (state === 'MAIN_MENU' && (e.code === 'Enter' || e.code === 'Space')) {
        e.preventDefault();
        audioManager.unlock();
        engineRef.current?.startNewRun();
        return;
      }

      if (state === 'ROUTE_SELECTION') {
        if (e.key === '1' && routesRef.current[0]) engineRef.current?.selectRoute(routesRef.current[0]);
        if (e.key === '2' && routesRef.current[1]) engineRef.current?.selectRoute(routesRef.current[1]);
        if (e.key === '3' && routesRef.current[2]) engineRef.current?.selectRoute(routesRef.current[2]);
        return;
      }

      if (e.code === 'Escape' || e.code === 'KeyP') {
        if (state === 'GAMEPLAY' || state === 'BOSS_BATTLE') {
          e.preventDefault();
          engineRef.current?.setState('PAUSED');
        } else if (state === 'PAUSED') {
          e.preventDefault();
          engineRef.current?.setState('GAMEPLAY');
        }
        return;
      }

      if (state !== 'GAMEPLAY' && state !== 'BOSS_BATTLE') return;

      if (e.code === 'Space') {
        e.preventDefault();
        engineRef.current?.setFiring(true);
        if (!heldKeys.has(e.code)) {
          engineRef.current?.fireOnce();
        }
      }

      if (heldKeys.has(e.code)) return;
      heldKeys.add(e.code);

      if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
        e.preventDefault();
        engineRef.current?.switchLane(-1);
      } else if (e.code === 'KeyD' || e.code === 'ArrowRight') {
        e.preventDefault();
        engineRef.current?.switchLane(1);
      } else if (e.code === 'KeyW' || e.code === 'ArrowUp') {
        e.preventDefault();
        engineRef.current?.triggerJump();
      } else if (e.code === 'KeyS' || e.code === 'ArrowDown') {
        e.preventDefault();
        engineRef.current?.triggerCrouchOrFastFall();
      } else if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        e.preventDefault();
        engineRef.current?.triggerOverdrive();
      } else if (e.key === '1') {
        engineRef.current?.switchAltitude('GROUND');
      } else if (e.key === '2') {
        engineRef.current?.switchAltitude('SKY');
      } else if (e.key === '3') {
        engineRef.current?.switchAltitude('SPACE');
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      heldKeys.delete(e.code);
      if (e.code === 'Space') {
        engineRef.current?.setFiring(false);
      }
    };

    const clearHeld = () => {
      heldKeys.clear();
      engineRef.current?.setFiring(false);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', clearHeld);
    document.addEventListener('visibilitychange', clearHeld);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', clearHeld);
      document.removeEventListener('visibilitychange', clearHeld);
    };
  }, []);

  const handleStartPlay = () => {
    audioManager.playUiClick();
    (document.activeElement as HTMLElement | null)?.blur?.();
    setCoinsDoubledThisRun(false);
    setShowSupportModal(false);
    engineRef.current?.startNewRun();
  };

  const handleWatchReviveAd = () => {
    if (adLoading) return;
    setAdLoading(true);
    const started = crazyGames.requestRewardedAd(
      () => {
        engineRef.current?.reviveCurrentRun();
      },
      () => {
        setAdLoading(false);
      }
    );
    if (!started) setAdLoading(false);
  };

  const handleWatchDoubleCoinsAd = () => {
    if (adLoading || coinsDoubledThisRun || !lastRunStats || lastRunStats.coinsEarned <= 0) return;
    setAdLoading(true);
    const bonus = lastRunStats.coinsEarned;
    const started = crazyGames.requestRewardedAd(
      () => {
        setCoinsDoubledThisRun(true);
        const cur = saveRef.current;
        commitSave({
          ...cur,
          coins: cur.coins + bonus,
        });
        setLastRunStats((prev) => (prev ? { ...prev, coinsEarned: prev.coinsEarned + bonus } : prev));
      },
      () => {
        setAdLoading(false);
      }
    );
    if (!started) setAdLoading(false);
  };

  const handleBuyOrSelectVehicle = (id: number) => {
    audioManager.playUiClick();
    const res = purchaseVehicle(saveRef.current, id);
    if (res.success) {
      commitSave(res.save);
    }
    return { success: res.success, reason: res.reason };
  };

  const handleUpgrade = (type: UpgradeType) => {
    audioManager.playUiClick();
    const res = purchaseUpgrade(saveRef.current, type);
    if (res.success) {
      commitSave(res.save);
    }
    return { success: res.success, reason: res.reason };
  };

  const handleUpdateSettings = (partial: Partial<GameSettings>) => {
    audioManager.playUiClick();
    commitSave({
      ...saveRef.current,
      settings: { ...saveRef.current.settings, ...partial },
    });
  };

  const handleChangeLanguage = (language: LanguageCode) => {
    audioManager.playUiClick();
    commitSave({ ...saveRef.current, language });
  };

  const handleChangeDimension = (dimId: number) => {
    audioManager.playUiClick();
    setSelectedDimId(dimId);
    engineRef.current?.setStartDimension(dimId);
  };

  const handleAltitudeSelect = (alt: AltitudeLayer) => {
    engineRef.current?.switchAltitude(alt);
  };

  const isPlaying = gameState === 'GAMEPLAY' || gameState === 'BOSS_BATTLE';

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#050811]">
      {/* Isolated WebGL Canvas Mount Container */}
      <div
        ref={mountRef}
        data-testid="game-canvas-container"
        className="absolute inset-0 w-full h-full touch-none"
        onTouchStart={(e) => {
          if (!isPlaying || e.touches.length === 0) return;
          swipeStartRef.current = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY,
          };
        }}
        onTouchEnd={(e) => {
          if (!isPlaying || !swipeStartRef.current || e.changedTouches.length === 0) return;
          const end = e.changedTouches[0];
          const dx = end.clientX - swipeStartRef.current.x;
          const dy = end.clientY - swipeStartRef.current.y;
          swipeStartRef.current = null;
          if (Math.abs(dx) > 36 && Math.abs(dx) > Math.abs(dy)) {
            engineRef.current?.switchLane(dx < 0 ? -1 : 1);
          } else if (Math.abs(dy) > 36) {
            if (dy < 0) engineRef.current?.triggerJump();
            else engineRef.current?.triggerCrouchOrFastFall();
          }
        }}
      />

      {webglError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#050811] text-center">
          <div className="max-w-md p-6 rounded-xl bg-slate-900 border border-rose-500/40 text-slate-100">
            <h1 className="text-lg font-bold text-rose-400 mb-2">AETHER HORIZON</h1>
            <p className="text-sm text-slate-300">{webglError}</p>
          </div>
        </div>
      )}

      {gameState === 'MAIN_MENU' && (
        <TitleScreen
          save={save}
          selectedDimId={selectedDimId}
          onChangeDimension={handleChangeDimension}
          onPlay={handleStartPlay}
          onOpenGarage={() => {
            audioManager.playUiClick();
            engineRef.current?.setState('GARAGE');
          }}
          onOpenUpgrades={() => {
            audioManager.playUiClick();
            engineRef.current?.setState('UPGRADES');
          }}
          onOpenCollection={() => {
            audioManager.playUiClick();
            engineRef.current?.setState('COLLECTION');
          }}
          onOpenSettings={() => {
            audioManager.playUiClick();
            engineRef.current?.setState('SETTINGS');
          }}
          onOpenSupport={
            crazyGames.isAvailable()
              ? undefined
              : () => {
                  audioManager.playUiClick();
                  setShowSupportModal(true);
                }
          }
          onChangeLanguage={handleChangeLanguage}
        />
      )}

      {isPlaying && (
        <GameplayHUD
          hud={hud}
          lang={save.language}
          muted={save.settings.muted}
          autoFire={save.settings.autoFire}
          onToggleMute={() => handleUpdateSettings({ muted: !save.settings.muted })}
          onToggleAutoFire={() => handleUpdateSettings({ autoFire: !save.settings.autoFire })}
          onPause={() => engineRef.current?.setState('PAUSED')}
          onAltitudeSelect={handleAltitudeSelect}
          onJump={() => engineRef.current?.triggerJump()}
          onCrouch={() => engineRef.current?.triggerCrouchOrFastFall()}
          onFireStart={() => {
            engineRef.current?.setFiring(true);
            engineRef.current?.fireOnce();
          }}
          onFireEnd={() => engineRef.current?.setFiring(false)}
          onOverdrive={() => engineRef.current?.triggerOverdrive()}
        />
      )}

      {gameState === 'GARAGE' && (
        <GarageModal
          save={save}
          onPreviewVehicle={(id) => engineRef.current?.previewVehicle(id)}
          onBuyOrSelect={handleBuyOrSelectVehicle}
          onRotate={(dx) => engineRef.current?.rotateGarage(dx)}
          onZoom={(dy) => engineRef.current?.zoomGarage(dy)}
          onDrawerRatioChange={(ratio) => engineRef.current?.setGarageDrawerRatio(ratio)}
          onClose={() => {
            audioManager.playUiClick();
            engineRef.current?.previewVehicle(null);
            engineRef.current?.setState('MAIN_MENU');
          }}
        />
      )}

      {gameState === 'UPGRADES' && (
        <UpgradesModal
          save={save}
          onUpgrade={handleUpgrade}
          onClose={() => {
            audioManager.playUiClick();
            engineRef.current?.setState('MAIN_MENU');
          }}
        />
      )}

      {gameState === 'COLLECTION' && (
        <CollectionModal
          save={save}
          onSelectForGarage={(id) => {
            audioManager.playUiClick();
            engineRef.current?.previewVehicle(id);
            engineRef.current?.setState('GARAGE');
          }}
          onClose={() => {
            audioManager.playUiClick();
            engineRef.current?.setState('MAIN_MENU');
          }}
        />
      )}

      {gameState === 'SETTINGS' && (
        <SettingsModal
          save={save}
          onUpdateSettings={handleUpdateSettings}
          onChangeLanguage={handleChangeLanguage}
          onImportSave={(encoded) => {
            const restored = saveManager.importSave(encoded);
            if (!restored) return false;
            commitSave(restored);
            return true;
          }}
          onResetSave={() => {
            const fresh = saveManager.reset();
            commitSave(fresh);
          }}
          onClose={() => {
            audioManager.playUiClick();
            engineRef.current?.setState('MAIN_MENU');
          }}
        />
      )}

      {gameState === 'ROUTE_SELECTION' && (
        <RouteSelectionModal
          routes={routes}
          lang={save.language}
          onSelect={(route) => engineRef.current?.selectRoute(route)}
        />
      )}

      {gameState === 'PAUSED' && (
        <PauseModal
          lang={save.language}
          onResume={() => engineRef.current?.setState('GAMEPLAY')}
          onRestart={() => engineRef.current?.startNewRun()}
          onMainMenu={() => engineRef.current?.setState('MAIN_MENU')}
        />
      )}

      {gameState === 'GAME_OVER' && lastRunStats && (
        <GameOverModal
          stats={lastRunStats}
          highScore={save.highScore}
          lang={save.language}
          canWatchReviveAd={crazyGames.isAvailable() && !(engineRef.current?.hasUsedRevive() ?? true)}
          canDoubleCoinsAd={crazyGames.isAvailable() && !coinsDoubledThisRun}
          adLoading={adLoading}
          onWatchReviveAd={handleWatchReviveAd}
          onWatchDoubleCoinsAd={handleWatchDoubleCoinsAd}
          onOpenSupport={
            crazyGames.isAvailable()
              ? undefined
              : () => {
                  audioManager.playUiClick();
                  setShowSupportModal(true);
                }
          }
          onRetry={handleStartPlay}
          onGarage={() => engineRef.current?.setState('GARAGE')}
          onMainMenu={() => engineRef.current?.setState('MAIN_MENU')}
        />
      )}

      {showSupportModal && (
        <SupportModal lang={save.language} onClose={() => setShowSupportModal(false)} />
      )}
    </div>
  );
}
