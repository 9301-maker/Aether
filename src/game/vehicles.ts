import {
  AltitudeLayer,
  VehicleCategory,
  VehicleData,
  VehicleModelConfig,
  WeaponId,
} from './types';

const CAR_PREFIXES = [
  'Apex', 'Vortex', 'Cobalt', 'Neon', 'Phantom', 'Vector', 'Stratos', 'Pulse', 'Mirage', 'Zenith',
];
const CAR_MODELS = ['GT-X', 'Interceptor', 'Viper', 'Spectre', 'Raptor'];

const AIR_PREFIXES = [
  'Aero', 'Tempest', 'Valkyrie', 'Falcon', 'Zephyr', 'Mach', 'Talon', 'Cirrus', 'Hornet', 'Nimbus',
];
const AIR_MODELS = ['Interceptor', 'Wing-II', 'Jetstream', 'Dart', 'Raven'];

const SPACE_PREFIXES = [
  'Nebula', 'Pulsar', 'Astral', 'Quasar', 'Orion', 'Ion', 'Solaris', 'Void', 'Galactic', 'Supernova',
];
const SPACE_MODELS = ['Cruiser', 'Dreadwing', 'Starfighter', 'Vanguard', 'Odyssey'];

const HYBRID_PREFIXES = [
  'Aether', 'Quantum', 'Chrono', 'Dimensional', 'Hyperion', 'Omni', 'Omega', 'Singularity', 'Paradox', 'Eternity',
];
const HYBRID_MODELS = ['Shift-X', 'Nexus', 'Apex', 'Prime', 'Transcend'];

const PRIMARY_PALETTE = [
  0x1e293b, 0x0f172a, 0x334155, 0x881337, 0x1e40af,
  0x0f766e, 0x4c1d95, 0x92400e, 0xcbd5e1, 0x27272a,
];
const SECONDARY_PALETTE = [
  0x64748b, 0x94a3b8, 0x475569, 0xdbeafe, 0x1e293b,
];
const ACCENT_PALETTE = [
  0x38bdf8, 0x60a5fa, 0x818cf8, 0xea580c, 0x14b8a6,
  0x0ea5e9, 0xeab308, 0x94a3b8,
];

function getWeaponForId(id: number): WeaponId {
  if (id <= 15) return 'PULSE_BLASTER';
  if (id <= 35) return 'TWIN_GATLING';
  if (id <= 50) return 'HEAVY_RAILGUN';
  if (id <= 75) return 'SPREAD_SHOT';
  if (id <= 100) return 'QUAD_BARRAGE';
  if (id <= 125) return 'HOMING_MISSILE';
  if (id <= 150) return 'PLASMA_WAVE';
  return 'NOVA_CANNON';
}

function getCategoryForId(id: number): VehicleCategory {
  if (id <= 50) return 'CAR';
  if (id <= 100) return 'AIRCRAFT';
  if (id <= 150) return 'SPACESHIP';
  return 'HYBRID';
}

function getCompatibleAltitudes(category: VehicleCategory): AltitudeLayer[] {
  switch (category) {
    case 'CAR':
      return ['GROUND'];
    case 'AIRCRAFT':
      return ['GROUND', 'SKY'];
    case 'SPACESHIP':
    case 'HYBRID':
      return ['GROUND', 'SKY', 'SPACE'];
  }
}

function computePrice(id: number, category: VehicleCategory): number {
  if (id === 1) return 0; // Starter
  if (id === 2) return 2000; // Immediately buyable with initial 2,000 coins
  if (category === 'CAR') {
    const t = (id - 2) / 48;
    return Math.round((2000 + Math.pow(t, 1.5) * 14000) / 100) * 100;
  }
  if (category === 'AIRCRAFT') {
    const t = (id - 51) / 49;
    return Math.round((6500 + Math.pow(t, 1.45) * 38000) / 250) * 250;
  }
  if (category === 'SPACESHIP') {
    const t = (id - 101) / 49;
    return Math.round((24000 + Math.pow(t, 1.55) * 125000) / 500) * 500;
  }
  const t = (id - 151) / 49;
  return Math.round((85000 + Math.pow(t, 1.65) * 415000) / 1000) * 1000;
}

function buildModelConfig(id: number, category: VehicleCategory): VehicleModelConfig {
  const hullList: Record<VehicleCategory, VehicleModelConfig['hullShape'][]> = {
    CAR: ['wedge', 'coupe', 'gt'],
    AIRCRAFT: ['interceptor', 'delta', 'bomber'],
    SPACESHIP: ['cruiser', 'needle', 'ring'],
    HYBRID: ['triwing', 'apex', 'ring'],
  };
  const wingList: Record<VehicleCategory, VehicleModelConfig['wingStyle'][]> = {
    CAR: ['none', 'spoiler', 'split'],
    AIRCRAFT: ['swept', 'forward', 'split'],
    SPACESHIP: ['halo', 'split', 'swept'],
    HYBRID: ['variable', 'halo', 'triwing' in hullList ? 'swept' : 'split'],
  };
  const mountList: VehicleModelConfig['turretMount'][] = ['hood', 'roof', 'wing', 'nose', 'dorsal'];

  const hulls = hullList[category];
  const wings = wingList[category];
  const primaryColor = PRIMARY_PALETTE[(id * 3 + (id % 5)) % PRIMARY_PALETTE.length];
  const secondaryColor = SECONDARY_PALETTE[(id * 7) % SECONDARY_PALETTE.length];
  const accentColor = ACCENT_PALETTE[(id * 5 + Math.floor(id / 10)) % ACCENT_PALETTE.length];

  return {
    hullShape: hulls[id % hulls.length],
    wingStyle: wings[(id >> 1) % wings.length],
    thrusterCount: ((id % 4) + 1) as 1 | 2 | 3 | 4,
    turretMount: mountList[(id + (category === 'CAR' ? 0 : 2)) % mountList.length],
    primaryColor,
    secondaryColor,
    accentColor,
    emissiveColor: accentColor,
    metalness: category === 'CAR' ? 0.72 + (id % 3) * 0.08 : 0.8 + (id % 4) * 0.04,
    roughness: category === 'CAR' ? 0.22 + (id % 4) * 0.06 : 0.16 + (id % 3) * 0.07,
    lengthScale: 0.92 + ((id * 13) % 7) * 0.04,
    widthScale: 0.92 + ((id * 11) % 6) * 0.04,
  };
}

function buildVehicle(id: number): VehicleData {
  const category = getCategoryForId(id);
  const code = `#${String(id).padStart(3, '0')}`;
  const idxInCat = ((id - 1) % 50);
  const ratio = idxInCat / 49;

  let name = '';
  let minSpd = 260;
  let maxSpd = 440;

  if (category === 'CAR') {
    name = `${CAR_PREFIXES[idxInCat % CAR_PREFIXES.length]} ${CAR_MODELS[Math.floor(idxInCat / 10)]} ${idxInCat + 1}`;
    minSpd = 260;
    maxSpd = 440;
  } else if (category === 'AIRCRAFT') {
    name = `${AIR_PREFIXES[idxInCat % AIR_PREFIXES.length]} ${AIR_MODELS[Math.floor(idxInCat / 10)]} Mk.${(idxInCat % 5) + 1}`;
    minSpd = 420;
    maxSpd = 780;
  } else if (category === 'SPACESHIP') {
    name = `${SPACE_PREFIXES[idxInCat % SPACE_PREFIXES.length]} ${SPACE_MODELS[Math.floor(idxInCat / 10)]} S-${idxInCat + 1}`;
    minSpd = 750;
    maxSpd = 1350;
  } else {
    name = `${HYBRID_PREFIXES[idxInCat % HYBRID_PREFIXES.length]} ${HYBRID_MODELS[Math.floor(idxInCat / 10)]} D-${idxInCat + 1}`;
    minSpd = 850;
    maxSpd = 1600;
  }

  return {
    id,
    code,
    name,
    category,
    price: computePrice(id, category),
    maxSpeed: Math.round(minSpd + (maxSpd - minSpd) * ratio),
    acceleration: Math.round(35 + (id / 200) * 60),
    handling: Math.round(42 + ((id % 10) * 2.5) + (id / 200) * 32),
    durability: Math.round(35 + (id / 200) * 60),
    weaponType: getWeaponForId(id),
    compatibleAltitudes: getCompatibleAltitudes(category),
    modelConfig: buildModelConfig(id, category),
  };
}

export const VEHICLE_DATABASE: VehicleData[] = Array.from({ length: 200 }, (_, i) => buildVehicle(i + 1));

export function getVehicleById(id: number): VehicleData {
  return VEHICLE_DATABASE[id - 1] || VEHICLE_DATABASE[0];
}
