export type GameState =
  | 'BOOT'
  | 'LOADING'
  | 'MAIN_MENU'
  | 'GARAGE'
  | 'UPGRADES'
  | 'COLLECTION'
  | 'SETTINGS'
  | 'GAMEPLAY'
  | 'PAUSED'
  | 'ROUTE_SELECTION'
  | 'BOSS_BATTLE'
  | 'GAME_OVER';

export type AltitudeLayer = 'GROUND' | 'SKY' | 'SPACE';

export type VehicleCategory = 'CAR' | 'AIRCRAFT' | 'SPACESHIP' | 'HYBRID';

export type WeaponId =
  | 'PULSE_BLASTER'
  | 'TWIN_GATLING'
  | 'HEAVY_RAILGUN'
  | 'SPREAD_SHOT'
  | 'QUAD_BARRAGE'
  | 'HOMING_MISSILE'
  | 'PLASMA_WAVE'
  | 'NOVA_CANNON';

export type LanguageCode = 'th' | 'en' | 'ja' | 'zh' | 'ko' | 'es';

export type GraphicsQuality = 'AUTO' | 'LOW' | 'MEDIUM' | 'HIGH';

export interface WeaponSpec {
  id: WeaponId;
  nameKey: string;
  color: number;
  hexColor: string;
  fireRate: number; // shots per second
  damage: number;
  projectileSpeed: number;
  pattern: 'single' | 'twin' | 'pierce' | 'spread3' | 'quad4' | 'homing' | 'wave3' | 'nova';
}

export interface VehicleModelConfig {
  hullShape: 'wedge' | 'coupe' | 'gt' | 'interceptor' | 'delta' | 'bomber' | 'cruiser' | 'needle' | 'ring' | 'triwing' | 'apex';
  wingStyle: 'none' | 'spoiler' | 'swept' | 'forward' | 'split' | 'halo' | 'variable';
  thrusterCount: 1 | 2 | 3 | 4;
  turretMount: 'hood' | 'roof' | 'wing' | 'nose' | 'dorsal';
  primaryColor: number;
  secondaryColor: number;
  accentColor: number;
  emissiveColor: number;
  metalness: number;
  roughness: number;
  lengthScale: number;
  widthScale: number;
}

export interface VehicleData {
  id: number; // 1..200
  code: string; // #001..#200
  name: string;
  category: VehicleCategory;
  price: number;
  maxSpeed: number; // km/h
  acceleration: number; // 1..100
  handling: number; // 1..100
  durability: number; // 1..100
  weaponType: WeaponId;
  compatibleAltitudes: AltitudeLayer[];
  modelConfig: VehicleModelConfig;
}

export interface UpgradeLevels {
  cannon: number; // 1..10
  engine: number; // 1..5 (+15 km/h per lv, max +75)
  wings: number; // 1..5
  armor: number; // 1..5 (+max hearts)
}

export interface GameSettings {
  masterVolume: number; // 0..1
  musicVolume: number; // 0..1
  sfxVolume: number; // 0..1
  muted: boolean;
  graphicsQuality: GraphicsQuality;
  autoFire: boolean;
}

export interface SaveData {
  version: number;
  coins: number;
  ownedVehicles: number[];
  selectedVehicle: number;
  upgrades: UpgradeLevels;
  highScore: number;
  bestDistance: number;
  totalDistance: number;
  totalBossesDefeated: number;
  totalObstaclesDestroyed: number;
  language: LanguageCode;
  settings: GameSettings;
}

export interface DimensionConfig {
  id: number; // 1..20
  nameKey: string;
  nameFallback: string;
  skyColor: number;
  horizonColor: number;
  fogColor: number;
  fogDensity: number;
  keyLightColor: number;
  hemiSkyColor: number;
  hemiGroundColor: number;
  roadColor: number;
  curbEmissive: number;
  accentColor: number;
  spaceNebulaColor: number;
  propTheme: 'volcanic' | 'metropolis' | 'cyber' | 'crystal' | 'glacier' | 'pyramid' | 'sakura' | 'forest' | 'ocean' | 'storm' | 'ruins' | 'magnetic' | 'nebula' | 'lunar' | 'citadel' | 'machine' | 'toxic' | 'solar' | 'quantum' | 'eternal';
  coinBonusMult: number;
  difficultyMult: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  ambientFreq: number;
}

export interface RouteOption {
  dimension: DimensionConfig;
  environmentFocus: AltitudeLayer;
  bonusCoins: number;
  riskLabelKey: string;
}

export interface BossConfig {
  id: number; // 1..200
  name: string;
  maxHp: number;
  bodyStyle: 'dreadnought' | 'mantis' | 'leviathan' | 'citadel' | 'seraph';
  wingStyle: 'bat' | 'blade' | 'halo' | 'quad' | 'none';
  armorStyle: 'plated' | 'spiked' | 'crystalline' | 'segmented';
  weaponStyle: 'twin_beam' | 'missile_pod' | 'sweep_laser' | 'orb_barrage';
  primaryColor: number;
  coreColor: number;
  accentColor: number;
  rewardCoins: number;
  attackInterval: number;
}

export interface RunStats {
  distance: number;
  score: number;
  coinsEarned: number;
  obstaclesDestroyed: number;
  bossesDefeated: number;
  maxCombo: number;
}

export interface HudSnapshot {
  distance: number;
  score: number;
  runCoins: number;
  totalCoins: number;
  combo: number;
  comboTimerRatio: number;
  hearts: number;
  maxHearts: number;
  shieldActive: boolean;
  shieldTimer: number;
  magnetActive: boolean;
  magnetTimer: number;
  overdriveCharge: number; // 0..100
  overdriveActive: boolean;
  overdriveTimer: number;
  currentSpeedKmh: number;
  maxSpeedKmh: number;
  isAtMaxSpeed: boolean;
  altitude: AltitudeLayer;
  dimensionId: number;
  bossActive: boolean;
  bossName: string;
  bossHp: number;
  bossMaxHp: number;
  bossWarning: string | null;
  alertMessage: string | null;
  floatingNotification: { id: number; text: string; color: string } | null;
}
