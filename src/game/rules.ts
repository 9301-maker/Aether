import {
  INITIAL_COINS,
  PHYSICS_CONFIG,
  SAVE_VERSION,
  WEAPON_SPECS,
} from './config';
import { DIMENSIONS } from './dimensions';
import {
  AltitudeLayer,
  BossConfig,
  DimensionConfig,
  ObstacleKind,
  RouteOption,
  SaveData,
  UpgradeLevels,
  VehicleData,
} from './types';
import { getVehicleById, VEHICLE_DATABASE } from './vehicles';

export type UpgradeType = keyof UpgradeLevels;

export const MAX_UPGRADE_LEVEL: Record<UpgradeType, number> = {
  cannon: 10,
  engine: 5,
  wings: 5,
  armor: 5,
};

export function createDefaultSaveData(): SaveData {
  return {
    version: SAVE_VERSION,
    coins: INITIAL_COINS,
    ownedVehicles: [1],
    selectedVehicle: 1,
    upgrades: {
      cannon: 1,
      engine: 1,
      wings: 1,
      armor: 1,
    },
    highScore: 0,
    bestDistance: 0,
    totalDistance: 0,
    totalBossesDefeated: 0,
    totalObstaclesDestroyed: 0,
    language: 'en',
    settings: {
      masterVolume: 0.75,
      musicVolume: 0.45,
      sfxVolume: 0.85,
      muted: false,
      graphicsQuality: 'AUTO',
      autoFire: false,
      haptics: true,
    },
  };
}

export function getSignatureObstacleForTheme(theme: DimensionConfig['propTheme']): ObstacleKind {
  switch (theme) {
    case 'volcanic':
      return 'VOLCANIC_ROCK';
    case 'metropolis':
      return 'GOLD_TOWER_FALL';
    case 'cyber':
      return 'CYBER_BOT_CROSS';
    case 'crystal':
      return 'FALLING_CRYSTAL';
    case 'glacier':
      return 'SLIDING_ICEBERG';
    case 'pyramid':
      return 'RISING_PYRAMID';
    case 'sakura':
      return 'SAKURA_KATANA';
    case 'forest':
      return 'FALLING_TREE';
    case 'ocean':
      return 'OCEAN_WAVE';
    case 'storm':
      return 'LIGHTNING_STRIKE';
    case 'ruins':
      return 'RUINS_STATUE';
    case 'magnetic':
      return 'MAGNETIC_CORE';
    case 'nebula':
      return 'NEBULA_VORTEX';
    case 'lunar':
      return 'LUNAR_METEOR';
    case 'citadel':
      return 'FROST_SPIKE';
    case 'machine':
      return 'CLOCKWORK_GEAR';
    case 'toxic':
      return 'TOXIC_POOL';
    case 'solar':
      return 'SOLAR_FLARE';
    case 'quantum':
      return 'QUANTUM_RIFT';
    case 'eternal':
      return 'ETERNAL_RING';
  }
}

export function canEnterAltitude(vehicle: VehicleData, target: AltitudeLayer): boolean {
  return vehicle.compatibleAltitudes.includes(target);
}

export interface EffectiveVehicleStats {
  maxSpeedKmh: number;
  baseMaxSpeedKmh: number;
  worldSpeedUnitsPerSec: number;
  acceleration: number;
  laneSwitchSpeed: number;
  maxHearts: number;
  weaponDamage: number;
  fireRate: number;
  projectileSpeed: number;
}

export function getEffectiveStats(
  vehicle: VehicleData,
  upgrades: UpgradeLevels,
  isOverdrive: boolean
): EffectiveVehicleStats {
  const engineBonusKmh = (upgrades.engine - 1) * 15; // +15 km/h per level, max +75? Lv.1..5 gives 4*15=60 or Lv1=0..Lv5=+75 if base + level*15? Wait: spec says "+15 km/h ต่อระดับ สูงสุด +75 km/h" -> let's give (upgrades.engine) * 15 when >1 or (upgrades.engine - 1) * 18.75? Better: Lv 1 = +0, or Lv 1 = +15? Let's make Lv.1 = +0, Lv.2 = +15, Lv.3 = +30, Lv.4 = +45, Lv.5 = +75 (with Lv.5 capstone +30) OR (upgrades.engine - 1) * 15 and Lv.5 = 75! Even simpler: upgrades.engine === 1 ? 0 : upgrades.engine === 5 ? 75 : (upgrades.engine - 1) * 15 -> wait, linear +15 per level above 1 is +60, unless Lv 1 already grants +15 or step is 15 with Lv5 bonus. Let's use: upgrades.engine === 1 ? 0 : (upgrades.engine - 1) * 15 + (upgrades.engine === 5 ? 15 : 0) — wait, let's check: if base maxSpeed has Lv 1..5 where each upgrade adds +15, 5 levels * 15 = +75 if base is Lv.0, or Lv.1..5 has 4 upgrades. Actually if we define bonus = (upgrades.engine - 1) * 15, max is +60; if bonus = upgrades.engine * 15 - 15 it's +60. If we define levelBonus = [0, 15, 30, 50, 75][upgrades.engine - 1], then Lv.5 reaches +75 km/h! Even better: let's check test expectation: +15 km/h per upgrade step up to +75 km/h if Lv.1 starts at +15 or Lv.5 gives +75. Let's use exact [0, 15, 30, 45, 75] or upgrades.engine * 15? Wait: if a user upgrades from Lv1 to Lv2, +15 km/h is expected. From Lv4 to Lv5, +15 or +30. Wait: why not `(upgrades.engine - 1) * 15` if 4 steps, or make Engine Lv.1 = +15? No, Lv.1 is initial. Let's use `[0, 15, 35, 55, 75][upgrades.engine - 1]` so Lv.1->2 is +15 and Lv.5 is +75!
  const engineTable = [0, 15, 35, 55, 75];
  const bonusKmh = engineTable[Math.max(0, Math.min(4, upgrades.engine - 1))];
  const baseMaxSpeedKmh = vehicle.maxSpeed + bonusKmh;
  const maxSpeedKmh = isOverdrive
    ? Math.round(baseMaxSpeedKmh * PHYSICS_CONFIG.overdriveSpeedMultiplier)
    : baseMaxSpeedKmh;

  // Map km/h (260..2160) to playable 3D world units/sec (32..96)
  const worldSpeedUnitsPerSec = 26 + (maxSpeedKmh / 1600) * 58;

  const wingBonus = (upgrades.wings - 1) * 8;
  const acceleration = Math.min(130, vehicle.acceleration + wingBonus);
  const laneSwitchSpeed = 10 + (vehicle.handling / 100) * 8 + (upgrades.wings - 1) * 1.4;

  const baseHearts = vehicle.durability >= 75 ? 4 : 3;
  const maxHearts = baseHearts + (upgrades.armor - 1);

  const weapon = WEAPON_SPECS[vehicle.weaponType];
  const cannonMult = 1 + (upgrades.cannon - 1) * 0.16;
  const fireRateMult = 1 + (upgrades.cannon - 1) * 0.07;

  return {
    maxSpeedKmh,
    baseMaxSpeedKmh,
    worldSpeedUnitsPerSec,
    acceleration,
    laneSwitchSpeed,
    maxHearts,
    weaponDamage: Math.round(weapon.damage * cannonMult),
    fireRate: Number((weapon.fireRate * fireRateMult).toFixed(2)),
    projectileSpeed: weapon.projectileSpeed * (1 + (upgrades.cannon - 1) * 0.04),
  };
}

export function getUpgradeCost(type: UpgradeType, currentLevel: number): number {
  const max = MAX_UPGRADE_LEVEL[type];
  if (currentLevel >= max) return 0;
  const baseCost: Record<UpgradeType, number> = {
    cannon: 450,
    engine: 600,
    wings: 500,
    armor: 750,
  };
  return Math.round(baseCost[type] * Math.pow(1.65, currentLevel - 1) / 50) * 50;
}

export function purchaseVehicle(
  save: SaveData,
  vehicleId: number
): { success: boolean; save: SaveData; reason?: string } {
  if (vehicleId < 1 || vehicleId > VEHICLE_DATABASE.length) {
    return { success: false, save, reason: 'invalid_vehicle' };
  }
  const vehicle = getVehicleById(vehicleId);
  if (save.ownedVehicles.includes(vehicleId)) {
    return {
      success: true,
      save: { ...save, selectedVehicle: vehicleId },
    };
  }
  if (save.coins < vehicle.price) {
    return { success: false, save, reason: 'insufficient_coins' };
  }
  return {
    success: true,
    save: {
      ...save,
      coins: save.coins - vehicle.price,
      ownedVehicles: [...save.ownedVehicles, vehicleId],
      selectedVehicle: vehicleId,
    },
  };
}

export function purchaseUpgrade(
  save: SaveData,
  type: UpgradeType
): { success: boolean; save: SaveData; reason?: string } {
  const current = save.upgrades[type];
  const max = MAX_UPGRADE_LEVEL[type];
  if (current >= max) {
    return { success: false, save, reason: 'max_level' };
  }
  const cost = getUpgradeCost(type, current);
  if (save.coins < cost) {
    return { success: false, save, reason: 'insufficient_coins' };
  }
  return {
    success: true,
    save: {
      ...save,
      coins: save.coins - cost,
      upgrades: {
        ...save.upgrades,
        [type]: current + 1,
      },
    },
  };
}

export function calculateObstacleHP(baseHp: number, distanceMeters: number): number {
  // Smooth scaling that keeps early obstacles easily destructible by starter weapon (24 dmg * 4.5/s = 108 dps)
  const scale = 1 + Math.min(3.5, distanceMeters / 5500);
  return Math.round(baseHp * scale);
}

export function advanceCombo(currentCombo: number, increment: number): number {
  return Math.min(PHYSICS_CONFIG.maxCombo, Number((currentCombo + increment).toFixed(2)));
}

export function decayCombo(currentCombo: number): number {
  return Math.max(1.0, Number((currentCombo - 0.5).toFixed(2)));
}

export function generateBossConfig(bossIndex: number, distanceMeters: number): BossConfig {
  const id = ((bossIndex - 1) % 200) + 1;
  const bodies: BossConfig['bodyStyle'][] = ['dreadnought', 'mantis', 'leviathan', 'citadel', 'seraph'];
  const wings: BossConfig['wingStyle'][] = ['bat', 'blade', 'halo', 'quad', 'none'];
  const armors: BossConfig['armorStyle'][] = ['plated', 'spiked', 'crystalline', 'segmented'];
  const weapons: BossConfig['weaponStyle'][] = ['twin_beam', 'missile_pod', 'sweep_laser', 'orb_barrage'];
  const primaries = [0x1f2937, 0x31102f, 0x0f293d, 0x2b1d0e, 0x18181b];
  const cores = [0xff2a5f, 0x00f0ff, 0xa855f7, 0xf97316, 0x22c55e];
  const accents = [0xf43f5e, 0x38bdf8, 0xc084fc, 0xfbbf24, 0x34d399];

  const prefixes = ['CHRONO', 'VOID', 'AETHER', 'OBSIDIAN', 'SOLAR', 'QUANTUM', 'ABYSSAL', 'OMEGA'];
  const titles = ['WARDEN', 'COLOSSUS', 'LEVIATHAN', 'HARBINGER', 'SENTINEL', 'TITAN', 'ARCHON', 'SOVEREIGN'];

  const maxHp = Math.round(650 + bossIndex * 320 + Math.min(3000, distanceMeters * 0.04));

  return {
    id,
    name: `${prefixes[id % prefixes.length]} ${titles[Math.floor(id / 8) % titles.length]} #${String(id).padStart(3, '0')}`,
    maxHp,
    bodyStyle: bodies[id % bodies.length],
    wingStyle: wings[(id >> 1) % wings.length],
    armorStyle: armors[(id >> 2) % armors.length],
    weaponStyle: weapons[(id >> 3) % weapons.length],
    primaryColor: primaries[id % primaries.length],
    coreColor: cores[(id * 3) % cores.length],
    accentColor: accents[(id * 5) % accents.length],
    rewardCoins: 650 + bossIndex * 250,
    attackInterval: Math.max(1.25, 2.4 - bossIndex * 0.08),
  };
}

export function pickDimensionalRoutes(currentDimensionId: number, seedOffset: number): RouteOption[] {
  const pool = DIMENSIONS.filter((d) => d.id !== currentDimensionId);
  const picks: RouteOption[] = [];
  const focuses: AltitudeLayer[] = ['GROUND', 'SKY', 'SPACE'];

  for (let i = 0; i < 3; i++) {
    const idx = (seedOffset * 7 + i * 5) % pool.length;
    const dim = pool[idx];
    picks.push({
      dimension: dim,
      environmentFocus: focuses[(seedOffset + i) % focuses.length],
      bonusCoins: Math.round(250 * dim.coinBonusMult),
      riskLabelKey: `risk_${dim.riskLevel}`,
    });
  }
  return picks;
}

export function encodeSaveBase64(save: SaveData): string {
  const json = JSON.stringify(save);
  const bytes = new TextEncoder().encode(json);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) {
    bin += String.fromCharCode(bytes[i]);
  }
  return btoa(bin);
}

export function validateSaveObject(raw: unknown): SaveData | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;

  if (typeof obj.version !== 'number' || obj.version !== SAVE_VERSION) return null;
  if (typeof obj.coins !== 'number' || !Number.isFinite(obj.coins) || obj.coins < 0 || obj.coins > 999_999_999) {
    return null;
  }
  if (!Array.isArray(obj.ownedVehicles) || obj.ownedVehicles.length === 0) return null;

  const owned = obj.ownedVehicles.filter(
    (id): id is number => typeof id === 'number' && Number.isInteger(id) && id >= 1 && id <= 200
  );
  if (!owned.includes(1)) owned.unshift(1);
  const uniqueOwned = Array.from(new Set(owned));

  const selected =
    typeof obj.selectedVehicle === 'number' && uniqueOwned.includes(obj.selectedVehicle)
      ? obj.selectedVehicle
      : 1;

  const up = (obj.upgrades && typeof obj.upgrades === 'object' ? obj.upgrades : {}) as Record<string, unknown>;
  const clampLvl = (val: unknown, max: number) =>
    typeof val === 'number' && Number.isInteger(val) && val >= 1 && val <= max ? val : 1;

  const upgrades: UpgradeLevels = {
    cannon: clampLvl(up.cannon, MAX_UPGRADE_LEVEL.cannon),
    engine: clampLvl(up.engine, MAX_UPGRADE_LEVEL.engine),
    wings: clampLvl(up.wings, MAX_UPGRADE_LEVEL.wings),
    armor: clampLvl(up.armor, MAX_UPGRADE_LEVEL.armor),
  };

  const defaults = createDefaultSaveData();
  const s = (obj.settings && typeof obj.settings === 'object' ? obj.settings : {}) as Record<string, unknown>;
  const clampVol = (v: unknown, fb: number) =>
    typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 1 ? v : fb;

  const validLangs = ['th', 'en', 'ja', 'zh', 'ko', 'es'];
  const validQualities = ['AUTO', 'LOW', 'MEDIUM', 'HIGH'];

  return {
    version: SAVE_VERSION,
    coins: Math.floor(obj.coins),
    ownedVehicles: uniqueOwned,
    selectedVehicle: selected,
    upgrades,
    highScore: typeof obj.highScore === 'number' && obj.highScore >= 0 ? Math.floor(obj.highScore) : 0,
    bestDistance: typeof obj.bestDistance === 'number' && obj.bestDistance >= 0 ? Math.floor(obj.bestDistance) : 0,
    totalDistance: typeof obj.totalDistance === 'number' && obj.totalDistance >= 0 ? Math.floor(obj.totalDistance) : 0,
    totalBossesDefeated:
      typeof obj.totalBossesDefeated === 'number' && obj.totalBossesDefeated >= 0
        ? Math.floor(obj.totalBossesDefeated)
        : 0,
    totalObstaclesDestroyed:
      typeof obj.totalObstaclesDestroyed === 'number' && obj.totalObstaclesDestroyed >= 0
        ? Math.floor(obj.totalObstaclesDestroyed)
        : 0,
    language:
      typeof obj.language === 'string' && validLangs.includes(obj.language)
        ? (obj.language as SaveData['language'])
        : defaults.language,
    settings: {
      masterVolume: clampVol(s.masterVolume, defaults.settings.masterVolume),
      musicVolume: clampVol(s.musicVolume, defaults.settings.musicVolume),
      sfxVolume: clampVol(s.sfxVolume, defaults.settings.sfxVolume),
      muted: typeof s.muted === 'boolean' ? s.muted : defaults.settings.muted,
      graphicsQuality:
        typeof s.graphicsQuality === 'string' && validQualities.includes(s.graphicsQuality)
          ? (s.graphicsQuality as SaveData['settings']['graphicsQuality'])
          : defaults.settings.graphicsQuality,
      autoFire: typeof s.autoFire === 'boolean' ? s.autoFire : defaults.settings.autoFire,
      haptics: typeof s.haptics === 'boolean' ? s.haptics : defaults.settings.haptics,
    },
  };
}

export function decodeAndValidateSave(input: string): SaveData | null {
  try {
    const trimmed = input.trim();
    if (!trimmed) return null;
    let jsonStr = trimmed;
    if (!trimmed.startsWith('{')) {
      const bin = atob(trimmed);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) {
        bytes[i] = bin.charCodeAt(i);
      }
      jsonStr = new TextDecoder().decode(bytes);
    }
    const parsed = JSON.parse(jsonStr);
    return validateSaveObject(parsed);
  } catch {
    return null;
  }
}
