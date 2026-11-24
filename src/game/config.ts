import { AltitudeLayer, WeaponId, WeaponSpec } from './types';

export const SAVE_VERSION = 1;
export const PRIMARY_SAVE_KEY = 'aether_horizon_save';
export const BACKUP_SAVE_KEY = 'aether_horizon_backup';

export const LANE_POSITIONS = [-3.4, 0, 3.4] as const;
export const LANE_WIDTH = 3.4;

export const ALTITUDE_HEIGHTS: Record<AltitudeLayer, number> = {
  GROUND: 0,
  SKY: 28,
  SPACE: 62,
};

export const PHYSICS_CONFIG = {
  gravityGround: -42,
  gravitySky: -24,
  gravitySpace: -14,
  jumpVelocity: 16.5,
  doubleJumpVelocity: 14.5,
  fastFallVelocity: -36,
  crouchDuration: 0.75,
  coyoteTime: 0.11,
  jumpBufferTime: 0.12,
  invulnerabilityDuration: 1.35,
  overdriveDuration: 7.5,
  overdriveSpeedMultiplier: 1.35,
  comboDuration: 4.5,
  maxCombo: 5.0,
  routeIntervalMeters: 900,
  bossIntervalMeters: 5000,
  chunkLength: 60,
  visibleChunks: 6,
};

export const WEAPON_SPECS: Record<WeaponId, WeaponSpec> = {
  PULSE_BLASTER: {
    id: 'PULSE_BLASTER',
    nameKey: 'weapon_pulse_blaster',
    color: 0x00f0ff,
    hexColor: '#00f0ff',
    fireRate: 4.5,
    damage: 24,
    projectileSpeed: 105,
    pattern: 'single',
  },
  TWIN_GATLING: {
    id: 'TWIN_GATLING',
    nameKey: 'weapon_twin_gatling',
    color: 0xffaa00,
    hexColor: '#ffaa00',
    fireRate: 9.0,
    damage: 14,
    projectileSpeed: 120,
    pattern: 'twin',
  },
  HEAVY_RAILGUN: {
    id: 'HEAVY_RAILGUN',
    nameKey: 'weapon_heavy_railgun',
    color: 0x38bdf8,
    hexColor: '#38bdf8',
    fireRate: 2.2,
    damage: 62,
    projectileSpeed: 165,
    pattern: 'pierce',
  },
  SPREAD_SHOT: {
    id: 'SPREAD_SHOT',
    nameKey: 'weapon_spread_shot',
    color: 0x22d3ee,
    hexColor: '#22d3ee',
    fireRate: 3.6,
    damage: 20,
    projectileSpeed: 110,
    pattern: 'spread3',
  },
  QUAD_BARRAGE: {
    id: 'QUAD_BARRAGE',
    nameKey: 'weapon_quad_barrage',
    color: 0xf97316,
    hexColor: '#f97316',
    fireRate: 4.8,
    damage: 18,
    projectileSpeed: 118,
    pattern: 'quad4',
  },
  HOMING_MISSILE: {
    id: 'HOMING_MISSILE',
    nameKey: 'weapon_homing_missile',
    color: 0xa855f7,
    hexColor: '#a855f7',
    fireRate: 2.8,
    damage: 48,
    projectileSpeed: 95,
    pattern: 'homing',
  },
  PLASMA_WAVE: {
    id: 'PLASMA_WAVE',
    nameKey: 'weapon_plasma_wave',
    color: 0xc084fc,
    hexColor: '#c084fc',
    fireRate: 4.0,
    damage: 34,
    projectileSpeed: 128,
    pattern: 'wave3',
  },
  NOVA_CANNON: {
    id: 'NOVA_CANNON',
    nameKey: 'weapon_nova_cannon',
    color: 0xf43f5e,
    hexColor: '#f43f5e',
    fireRate: 3.2,
    damage: 56,
    projectileSpeed: 140,
    pattern: 'nova',
  },
};

export const INITIAL_COINS = 2000;
