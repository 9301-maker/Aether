import * as THREE from 'three';
import { ALTITUDE_HEIGHTS, LANE_POSITIONS, PHYSICS_CONFIG } from './config';
import { calculateObstacleHP } from './rules';
import { AltitudeLayer, DimensionConfig } from './types';
import {
  getBuildingEmissiveTexture,
  getBuildingWindowTexture,
  getContactShadowTexture,
  getRoadBumpTexture,
  getRoadRoughnessTexture,
  getRoadTexture,
  getTerrainTexture,
} from './vehicleBuilder';

export type ObstacleKind =
  | 'ROAD_BARRIER'
  | 'ENERGY_CRATE'
  | 'TRAFFIC_VEHICLE'
  | 'LASER_GATE'
  | 'HEAVY_BLOCK'
  | 'MOVING_OBSTACLE'
  | 'ENEMY_AIRCRAFT'
  | 'ASTEROID'
  | 'VOLCANIC_ROCK'
  | 'QUANTUM_RIFT';

export type PowerUpKind = 'HEART' | 'SHIELD' | 'MAGNET';

export type BiomeKind =
  | 'urban'
  | 'volcanic'
  | 'quantum'
  | 'crystal'
  | 'ancient'
  | 'nature'
  | 'industrial';

export function getBiomeForTheme(theme: DimensionConfig['propTheme']): BiomeKind {
  switch (theme) {
    case 'volcanic':
    case 'solar':
      return 'volcanic';
    case 'quantum':
    case 'magnetic':
    case 'storm':
    case 'eternal':
      return 'quantum';
    case 'crystal':
    case 'glacier':
    case 'citadel':
      return 'crystal';
    case 'pyramid':
    case 'ruins':
      return 'ancient';
    case 'forest':
    case 'sakura':
    case 'toxic':
    case 'ocean':
      return 'nature';
    case 'machine':
    case 'lunar':
    case 'nebula':
      return 'industrial';
    default:
      return 'urban';
  }
}

export interface PooledObstacle {
  active: boolean;
  kind: ObstacleKind;
  altitude: AltitudeLayer;
  lane: number; // 0, 1, 2
  x: number;
  y: number;
  z: number;
  hp: number;
  maxHp: number;
  destructible: boolean;
  requiresCrouch: boolean;
  requiresJump: boolean;
  moveDir: number;
  movePhase: number;
  hitFlashTimer: number;
  rewardCoins: number;
  eruptProgress: number;
  eruptStartX: number;
  eruptStartY: number;
  eruptTargetX: number;
  eruptTargetY: number;
  mesh: THREE.Group;
  flashMaterials: THREE.MeshStandardMaterial[];
  hpBarBg: THREE.Mesh;
  hpBarFill: THREE.Mesh;
  halfWidth: number;
  halfHeight: number;
  halfDepth: number;
}

export interface PooledCoin {
  active: boolean;
  isGem: boolean;
  x: number;
  y: number;
  z: number;
  value: number;
  mesh: THREE.Group;
}

export interface PooledPowerUp {
  active: boolean;
  kind: PowerUpKind;
  x: number;
  y: number;
  z: number;
  mesh: THREE.Group;
}

export interface PooledProjectile {
  active: boolean;
  fromBoss: boolean;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  damage: number;
  pierce: boolean;
  homing: boolean;
  life: number;
  mesh: THREE.Mesh;
}

interface ParticleState {
  active: boolean;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  size: number;
  color: THREE.Color;
}

interface WorldChunk {
  group: THREE.Group;
  zCenter: number;
  groundBaseGroup: THREE.Group;
  roadCrackGroup: THREE.Group;
  groundBiomes: Record<BiomeKind, THREE.Group>;
  skyBaseGroup: THREE.Group;
  skyBiomes: Record<BiomeKind, THREE.Group>;
  spaceBaseGroup: THREE.Group;
  spaceBiomes: Record<BiomeKind, THREE.Group>;
}

const ALL_BIOMES: BiomeKind[] = [
  'urban',
  'volcanic',
  'quantum',
  'crystal',
  'ancient',
  'nature',
  'industrial',
];

export class WorldManager {
  private scene: THREE.Scene;
  private chunks: WorldChunk[] = [];
  private obstacles: PooledObstacle[] = [];
  private coins: PooledCoin[] = [];
  private powerUps: PooledPowerUp[] = [];
  private projectiles: PooledProjectile[] = [];

  private particleMesh: THREE.InstancedMesh;
  private particles: ParticleState[] = [];
  private particleCursor = 0;
  private readonly maxParticles: number;

  private skyDomeMat!: THREE.ShaderMaterial;
  private starField: THREE.Points;
  private skyBackdropPlanet: THREE.Group;
  private skylineGroup!: THREE.Group;
  private backdropRidgeNearMat!: THREE.MeshStandardMaterial;
  private backdropRidgeFarMat!: THREE.MeshStandardMaterial;

  // Shared environmental materials (softened, non-glaring)
  private roadMat: THREE.MeshStandardMaterial;
  private curbMat: THREE.MeshStandardMaterial;
  private accentBeaconMat: THREE.MeshStandardMaterial;
  private skyRibbonMat: THREE.MeshBasicMaterial;
  private spaceRailMat: THREE.MeshBasicMaterial;
  private propMat: THREE.MeshStandardMaterial;
  private steelMat: THREE.MeshStandardMaterial;
  private buildingMat: THREE.MeshStandardMaterial;
  private terrainMat: THREE.MeshStandardMaterial;
  private foliageMat: THREE.MeshStandardMaterial;
  private cloudMat: THREE.MeshStandardMaterial;

  // Biome-specific materials
  private fissureMat: THREE.MeshStandardMaterial;
  private volcanoRockMat: THREE.MeshStandardMaterial;
  private magmaMat: THREE.MeshStandardMaterial;
  private quantumGlowMat: THREE.MeshStandardMaterial;
  private crystalMat: THREE.MeshPhysicalMaterial;
  private sandstoneMat: THREE.MeshStandardMaterial;
  private natureBlossomMat: THREE.MeshStandardMaterial;

  private activeBiome: BiomeKind = 'urban';
  private activeAltitude: AltitudeLayer = 'GROUND';
  private activeIsGarage = false;

  private dummy = new THREE.Object3D();
  private nextSpawnZ = -70;
  private waveIndex = 0;

  constructor(scene: THREE.Scene, maxAnisotropy: number, isLowQuality: boolean) {
    this.scene = scene;
    this.maxParticles = isLowQuality ? 120 : 280;

    const roadTex = getRoadTexture(maxAnisotropy);
    const roadRough = getRoadRoughnessTexture(maxAnisotropy);
    const roadBump = getRoadBumpTexture(maxAnisotropy);
    const terrainTex = getTerrainTexture(maxAnisotropy);
    const bldgTex = getBuildingWindowTexture(maxAnisotropy);
    const bldgEmissive = getBuildingEmissiveTexture(maxAnisotropy);

    this.roadMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: roadTex,
      roughnessMap: roadRough,
      bumpMap: roadBump,
      bumpScale: 0.022,
      roughness: 0.96,
      metalness: 0.06,
      envMapIntensity: 0.24,
    });
    this.curbMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.62,
      metalness: 0.42,
    });
    this.accentBeaconMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x38bdf8,
      emissiveIntensity: 0.42,
      roughness: 0.28,
    });
    this.skyRibbonMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.18,
      side: THREE.DoubleSide,
    });
    this.spaceRailMat = new THREE.MeshBasicMaterial({
      color: 0x818cf8,
      transparent: true,
      opacity: 0.28,
    });
    this.propMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.62,
      metalness: 0.45,
    });
    this.steelMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.42,
      metalness: 0.78,
    });
    this.buildingMat = new THREE.MeshStandardMaterial({
      color: 0xb8c4d4,
      map: bldgTex,
      emissiveMap: bldgEmissive,
      emissive: 0xd8dee9,
      emissiveIntensity: 0.34,
      roughness: 0.45,
      metalness: 0.52,
      envMapIntensity: 0.6,
    });
    this.terrainMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      map: terrainTex,
      roughness: 0.94,
      metalness: 0.08,
      envMapIntensity: 0.25,
    });
    this.foliageMat = new THREE.MeshStandardMaterial({
      color: 0x16382c,
      roughness: 0.88,
      metalness: 0.04,
    });
    // Soft twilight atmospheric clouds (never bright white glaring!)
    this.cloudMat = new THREE.MeshStandardMaterial({
      color: 0x384b68,
      roughness: 1.0,
      metalness: 0.0,
      envMapIntensity: 0.04,
      transparent: true,
      opacity: 0.44,
    });

    this.fissureMat = new THREE.MeshStandardMaterial({
      color: 0xea580c,
      emissive: 0xc2410c,
      emissiveIntensity: 0.68,
      roughness: 0.35,
    });
    this.volcanoRockMat = new THREE.MeshStandardMaterial({
      color: 0x261d1c,
      roughness: 0.92,
      metalness: 0.08,
    });
    this.magmaMat = new THREE.MeshStandardMaterial({
      color: 0xf97316,
      emissive: 0xea580c,
      emissiveIntensity: 0.95,
      roughness: 0.35,
    });
    this.quantumGlowMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x7c3aed,
      emissiveIntensity: 0.82,
      roughness: 0.25,
    });
    this.crystalMat = new THREE.MeshPhysicalMaterial({
      color: 0x7dd3fc,
      emissive: 0x0284c7,
      emissiveIntensity: 0.32,
      roughness: 0.14,
      metalness: 0.25,
      clearcoat: 0.9,
      envMapIntensity: 0.85,
    });
    this.sandstoneMat = new THREE.MeshStandardMaterial({
      color: 0x8c6d46,
      roughness: 0.88,
      metalness: 0.06,
    });
    this.natureBlossomMat = new THREE.MeshStandardMaterial({
      color: 0xb94a72,
      roughness: 0.78,
      metalness: 0.05,
    });

    this.initSkyDome();
    this.initChunks();
    this.initBackdrop();
    this.initPools();

    // Instanced particle ring buffer
    const pGeo = new THREE.OctahedronGeometry(0.2, 0);
    const pMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.particleMesh = new THREE.InstancedMesh(pGeo, pMat, this.maxParticles);
    this.particleMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.particleMesh.frustumCulled = false;
    this.scene.add(this.particleMesh);

    for (let i = 0; i < this.maxParticles; i++) {
      this.particles.push({
        active: false,
        x: 0,
        y: -999,
        z: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        life: 0,
        maxLife: 1,
        size: 1,
        color: new THREE.Color(0x38bdf8),
      });
      this.dummy.position.set(0, -999, 0);
      this.dummy.scale.setScalar(0.001);
      this.dummy.updateMatrix();
      this.particleMesh.setMatrixAt(i, this.dummy.matrix);
      this.particleMesh.setColorAt(i, this.particles[i].color);
    }

    // Starfield for Space Layer
    const starCount = isLowQuality ? 420 : 980;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      starPos[i * 3] = (Math.random() - 0.5) * 260;
      starPos[i * 3 + 1] = 35 + Math.random() * 145;
      starPos[i * 3 + 2] = (Math.random() - 0.5) * 380;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    this.starField = new THREE.Points(
      starGeo,
      new THREE.PointsMaterial({ color: 0xcbd5e1, size: 0.58, sizeAttenuation: true })
    );
    this.scene.add(this.starField);

    // Distant ringed planet vista in Space
    this.skyBackdropPlanet = new THREE.Group();
    const planet = new THREE.Mesh(
      new THREE.SphereGeometry(24, 30, 22),
      new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.72, metalness: 0.18 })
    );
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(30, 45, 56),
      new THREE.MeshBasicMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.28, side: THREE.DoubleSide })
    );
    ring.rotation.x = Math.PI * 0.42;
    ring.rotation.y = 0.35;
    this.skyBackdropPlanet.add(planet, ring);
    this.skyBackdropPlanet.position.set(58, 88, -245);
    this.scene.add(this.skyBackdropPlanet);
  }

  private initSkyDome(): void {
    this.skyDomeMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      uniforms: {
        uSkyColor: { value: new THREE.Color(0x091324) },
        uHorizonColor: { value: new THREE.Color(0x1d3f66) },
        uSunColor: { value: new THREE.Color(0x7aa2c8) },
        uSunDir: { value: new THREE.Vector3(0.22, 0.2, -1.0).normalize() },
        uTime: { value: 0 },
      },
      vertexShader: `
        varying vec3 vWorldDir;
        void main() {
          vWorldDir = normalize(position);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uSkyColor;
        uniform vec3 uHorizonColor;
        uniform vec3 uSunColor;
        uniform vec3 uSunDir;
        uniform float uTime;
        varying vec3 vWorldDir;

        float hash2(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
        }
        float noise2(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(
            mix(hash2(i + vec2(0.0, 0.0)), hash2(i + vec2(1.0, 0.0)), u.x),
            mix(hash2(i + vec2(0.0, 1.0)), hash2(i + vec2(1.0, 1.0)), u.x),
            u.y
          );
        }

        void main() {
          vec3 dir = normalize(vWorldDir);
          float h = clamp(dir.y * 1.45 + 0.06, 0.0, 1.0);
          vec3 col = mix(uHorizonColor, uSkyColor, pow(h, 0.7));

          // Gentle horizon atmospheric mist (non-glaring)
          float band = exp(-abs(dir.y - 0.02) * 8.0);
          col += uHorizonColor * band * 0.16;

          // Soft twilight cirrus clouds tinted smoothly to the dimension palette
          if (dir.y > 0.01) {
            vec2 cloudUv = dir.xz / (dir.y + 0.24) * 1.35 + vec2(uTime * 0.008, -uTime * 0.005);
            float n = noise2(cloudUv) * 0.6 + noise2(cloudUv * 2.2) * 0.4;
            float cloudMask = smoothstep(0.46, 0.84, n) * smoothstep(0.01, 0.18, dir.y) * smoothstep(0.75, 0.18, dir.y);
            vec3 cloudTint = mix(uSkyColor * 1.15, uHorizonColor * 0.95, 0.55);
            col = mix(col, cloudTint, cloudMask * 0.26);
          }

          // Restrained celestial moon/sun disc + gentle aura (zero blinding white hotspot)
          float sunDot = max(dot(dir, uSunDir), 0.0);
          float sunDisc = smoothstep(0.9972, 0.9988, sunDot);
          float sunHalo = pow(sunDot, 16.0) * 0.11 + pow(sunDot, 90.0) * 0.12;
          col += uSunColor * (sunHalo + sunDisc * 0.22);

          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });

    const dome = new THREE.Mesh(new THREE.SphereGeometry(320, 32, 20), this.skyDomeMat);
    dome.renderOrder = -10;
    this.scene.add(dome);
  }

  private createBiomeRecord(): Record<BiomeKind, THREE.Group> {
    return {
      urban: new THREE.Group(),
      volcanic: new THREE.Group(),
      quantum: new THREE.Group(),
      crystal: new THREE.Group(),
      ancient: new THREE.Group(),
      nature: new THREE.Group(),
      industrial: new THREE.Group(),
    };
  }

  private populateGroundBiomes(chunkIdx: number, len: number, biomes: Record<BiomeKind, THREE.Group>): void {
    // 1. URBAN METROPOLIS: Glass skyscrapers + overhead steel highway gantries + evergreen conifers
    const urban = biomes.urban;
    for (let tIdx = -1; tIdx <= 1; tIdx += 2) {
      for (const side of [-1, 1]) {
        const tz = tIdx * 13;
        const tx = side * 9.0;
        const planter = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.62, 0.35, 10), this.curbMat);
        planter.position.set(tx, 0.22, tz);
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 1.15, 8), this.propMat);
        trunk.position.set(tx, 0.85, tz);
        const tier1 = new THREE.Mesh(new THREE.ConeGeometry(0.85, 1.5, 9), this.foliageMat);
        tier1.position.set(tx, 1.85, tz);
        const tier2 = new THREE.Mesh(new THREE.ConeGeometry(0.65, 1.35, 9), this.foliageMat);
        tier2.position.set(tx, 2.65, tz);
        const tier3 = new THREE.Mesh(new THREE.ConeGeometry(0.42, 1.1, 9), this.foliageMat);
        tier3.position.set(tx, 3.35, tz);
        urban.add(planter, trunk, tier1, tier2, tier3);
      }
    }
    for (let p = 0; p < 6; p++) {
      const side = p % 2 === 0 ? -1 : 1;
      const row = Math.floor(p / 2);
      const isOuter = row === 2;
      const h = isOuter ? 22 + ((chunkIdx * 7 + p * 5) % 24) : 13 + ((chunkIdx * 5 + p * 7) % 18);
      const w = isOuter ? 5.2 + (p % 2) * 1.8 : 3.8 + ((p + chunkIdx) % 3) * 1.1;
      const bz = (row - 1) * 17 + (side > 0 ? 4 : -4);
      const bx = side * (isOuter ? 24.5 + (chunkIdx % 2) * 3.5 : 13.6 + (p % 2) * 2.4);

      const podium = new THREE.Mesh(new THREE.BoxGeometry(w * 1.2, 2.8, 5.2), this.propMat);
      podium.position.set(bx, 1.35, bz);
      const bldg = new THREE.Mesh(new THREE.BoxGeometry(w, h, 4.6), this.buildingMat);
      bldg.position.set(bx, h * 0.5 + 1.4, bz);
      const tierH = 3.2 + (p % 3) * 1.5;
      const tier = new THREE.Mesh(new THREE.BoxGeometry(w * 0.74, tierH, 3.4), this.buildingMat);
      tier.position.set(bx, h + 1.4 + tierH * 0.5, bz);
      const crownRim = new THREE.Mesh(new THREE.BoxGeometry(w * 0.76, 0.14, 3.5), this.accentBeaconMat);
      crownRim.position.set(bx, h + 1.4 + tierH, bz);
      const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.13, 3.4, 8), this.steelMat);
      spire.position.set(bx, h + 1.4 + tierH + 1.7, bz);
      const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), this.accentBeaconMat);
      beacon.position.set(bx, h + 1.4 + tierH + 3.4, bz);
      urban.add(podium, bldg, tier, crownRim, spire, beacon);
    }
    if (chunkIdx % 2 === 0) {
      const colL = new THREE.Mesh(new THREE.BoxGeometry(0.32, 7.2, 0.42), this.steelMat);
      colL.position.set(-7.7, 3.6, -len * 0.25);
      const colR = colL.clone();
      colR.position.x = 7.7;
      const truss = new THREE.Mesh(new THREE.BoxGeometry(15.8, 0.48, 0.52), this.steelMat);
      truss.position.set(0, 7.1, -len * 0.25);
      const signBoard = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.95, 0.16), this.propMat);
      signBoard.position.set(0, 6.95, -len * 0.25 + 0.3);
      const signTrim = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.08, 0.18), this.accentBeaconMat);
      signTrim.position.set(0, 6.52, -len * 0.25 + 0.31);
      urban.add(colL, colR, truss, signBoard, signTrim);
    }

    // 2. VOLCANIC: Sculpted Volcano Cones with recessed glowing magma craters, lava flows & obsidian spires
    const volcanic = biomes.volcanic;
    for (let v = 0; v < 2; v++) {
      const side = v === 0 ? -1 : 1;
      const vx = side * (17.5 + ((chunkIdx + v) % 2) * 3.5);
      const vz = (v - 0.5) * 26;
      const vh = 13 + ((chunkIdx * 5 + v * 7) % 8);
      const vRad = 9.5 + (v % 2) * 2.2;

      // Truncated volcano mountain cone
      const cone = new THREE.Mesh(new THREE.CylinderGeometry(2.6, vRad, vh, 11), this.volcanoRockMat);
      cone.position.set(vx, vh * 0.5 - 0.2, vz);

      // Crater rim collar & recessed molten lava pool
      const craterRim = new THREE.Mesh(new THREE.TorusGeometry(2.45, 0.55, 8, 14), this.volcanoRockMat);
      craterRim.rotation.x = Math.PI / 2;
      craterRim.position.set(vx, vh - 0.1, vz);
      const magmaPool = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.1, 0.3, 12), this.magmaMat);
      magmaPool.position.set(vx, vh - 0.25, vz);

      // Glowing lava fissure river hugging volcano slope from crater rim down to base
      const topR = 2.5;
      const xTop = vx - side * (topR * 0.92);
      const yTop = vh - 0.35;
      const xBot = vx - side * (vRad * 0.94);
      const yBot = 0.2;
      const ldx = xTop - xBot;
      const ldy = yTop - yBot;
      const riverLen = Math.hypot(ldx, ldy) * 0.92;
      const lavaRiver = new THREE.Mesh(new THREE.BoxGeometry(0.42, riverLen, 0.9), this.magmaMat);
      lavaRiver.position.set((xTop + xBot) * 0.5, (yTop + yBot) * 0.5, vz + 0.15);
      lavaRiver.rotation.z = -Math.atan2(ldx, ldy);

      volcanic.add(cone, craterRim, magmaPool, lavaRiver);
    }
    // Jagged basalt pillars along road shoulders
    for (let b = 0; b < 4; b++) {
      const side = b % 2 === 0 ? -1 : 1;
      const spire = new THREE.Mesh(
        new THREE.ConeGeometry(1.1 + (b % 2) * 0.4, 4.2 + (b % 3) * 1.6, 5),
        this.volcanoRockMat
      );
      spire.position.set(side * (9.5 + (b % 2) * 1.4), 2.0, (b - 1.5) * 14);
      volcanic.add(spire);
    }

    // 3. QUANTUM RIFT: Levitating fractured monoliths & tilted Dimensional Portal Arches
    const quantum = biomes.quantum;
    for (let q = 0; q < 4; q++) {
      const side = q % 2 === 0 ? -1 : 1;
      const qx = side * (12.2 + (q % 2) * 3.8);
      const qz = (q - 1.5) * 14;
      const baseMonolith = new THREE.Mesh(new THREE.BoxGeometry(1.8, 7.5 + (q % 3) * 2.5, 1.8), this.propMat);
      baseMonolith.position.set(qx, 4.2, qz);
      baseMonolith.rotation.z = side * 0.08;
      const shardFloat = new THREE.Mesh(new THREE.OctahedronGeometry(1.5, 0), this.quantumGlowMat);
      shardFloat.scale.set(0.8, 1.8, 0.8);
      shardFloat.position.set(qx, 10.5 + (q % 2) * 2.2, qz);
      const riftRing = new THREE.Mesh(new THREE.TorusGeometry(2.3, 0.14, 8, 20), this.quantumGlowMat);
      riftRing.position.set(qx, 9.8, qz);
      riftRing.rotation.set(0.35, side * 0.5, 0.25);
      quantum.add(baseMonolith, shardFloat, riftRing);
    }
    // Dimensional Portal Gate spanning over highway every alternate chunk
    if (chunkIdx % 2 === 0) {
      const archRing = new THREE.Mesh(new THREE.TorusGeometry(8.2, 0.26, 8, 28, Math.PI), this.quantumGlowMat);
      archRing.position.set(0, 0.2, -len * 0.2);
      const innerArc = new THREE.Mesh(new THREE.TorusGeometry(7.6, 0.12, 8, 28, Math.PI), this.accentBeaconMat);
      innerArc.position.set(0, 0.2, -len * 0.2);
      quantum.add(archRing, innerArc);
    }

    // 4. CRYSTAL / GLACIER: Clustered giant translucent crystal spires & ice arches
    const crystal = biomes.crystal;
    for (let c = 0; c < 6; c++) {
      const side = c % 2 === 0 ? -1 : 1;
      const cx = side * (11.2 + (c % 3) * 3.2);
      const cz = (c - 2.5) * 10;
      const ch = 6.5 + ((chunkIdx + c * 3) % 10);
      const shard = new THREE.Mesh(new THREE.ConeGeometry(1.4 + (c % 2) * 0.6, ch, 6), this.crystalMat);
      shard.position.set(cx, ch * 0.45, cz);
      shard.rotation.z = side * (0.14 + (c % 2) * 0.12);
      const subShard = new THREE.Mesh(new THREE.ConeGeometry(0.95, ch * 0.6, 5), this.crystalMat);
      subShard.position.set(cx - side * 1.1, ch * 0.25, cz + 0.8);
      subShard.rotation.z = side * 0.34;
      crystal.add(shard, subShard);
    }

    // 5. ANCIENT / PYRAMID: Stepped Pyramids & Weathered Obelisks/Columns
    const ancient = biomes.ancient;
    for (let a = 0; a < 2; a++) {
      const side = a === 0 ? -1 : 1;
      const ax = side * 19.5;
      const az = (a - 0.5) * 28;
      const pyr = new THREE.Mesh(new THREE.ConeGeometry(8.8, 12.5, 4), this.sandstoneMat);
      pyr.rotation.y = Math.PI / 4;
      pyr.position.set(ax, 6.0, az);
      ancient.add(pyr);
    }
    for (let col = 0; col < 4; col++) {
      const side = col % 2 === 0 ? -1 : 1;
      const cz = (col - 1.5) * 14;
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.72, 6.2, 8), this.sandstoneMat);
      pillar.position.set(side * 9.8, 3.1, cz);
      const cap = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.45, 1.6), this.sandstoneMat);
      cap.position.set(side * 9.8, 6.3, cz);
      ancient.add(pillar, cap);
    }

    // 6. NATURE / SAKURA / FOREST / OCEAN: Torii Gates & Blossom/Canopy Trees
    const nature = biomes.nature;
    for (let n = 0; n < 4; n++) {
      const side = n % 2 === 0 ? -1 : 1;
      const nx = side * (10.5 + (n % 2) * 3.5);
      const nz = (n - 1.5) * 14;
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.38, 4.2, 8), this.propMat);
      trunk.position.set(nx, 2.1, nz);
      const crown1 = new THREE.Mesh(new THREE.DodecahedronGeometry(2.1, 1), this.natureBlossomMat);
      crown1.scale.set(1.3, 0.72, 1.3);
      crown1.position.set(nx, 4.5, nz);
      const crown2 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.5, 1), this.natureBlossomMat);
      crown2.scale.set(1.2, 0.68, 1.2);
      crown2.position.set(nx - side * 0.8, 5.4, nz + 0.5);
      nature.add(trunk, crown1, crown2);
    }
    if (chunkIdx % 2 === 0) {
      // Iconic Torii / Canopy Arch spanning the road
      const postL = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.38, 7.6, 10), this.natureBlossomMat);
      postL.position.set(-7.6, 3.8, -len * 0.2);
      const postR = postL.clone();
      postR.position.x = 7.6;
      const lintelTop = new THREE.Mesh(new THREE.BoxGeometry(17.6, 0.55, 0.72), this.natureBlossomMat);
      lintelTop.position.set(0, 7.6, -len * 0.2);
      const lintelLow = new THREE.Mesh(new THREE.BoxGeometry(15.8, 0.38, 0.48), this.propMat);
      lintelLow.position.set(0, 6.4, -len * 0.2);
      nature.add(postL, postR, lintelTop, lintelLow);
    }

    // 7. INDUSTRIAL / MACHINE / LUNAR: Gear Towers & Radar Domes
    const industrial = biomes.industrial;
    for (let m = 0; m < 4; m++) {
      const side = m % 2 === 0 ? -1 : 1;
      const mx = side * (12.8 + (m % 2) * 4.5);
      const mz = (m - 1.5) * 14;
      const tower = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 2.1, 10.5, 8), this.steelMat);
      tower.position.set(mx, 5.2, mz);
      const gearRing = new THREE.Mesh(new THREE.TorusGeometry(2.3, 0.35, 8, 12), this.propMat);
      gearRing.position.set(mx, 8.2, mz);
      const dish = new THREE.Mesh(new THREE.SphereGeometry(1.6, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.5), this.steelMat);
      dish.position.set(mx, 10.6, mz);
      industrial.add(tower, gearRing, dish);
    }
  }

  private populateSkyBiomes(chunkIdx: number, biomes: Record<BiomeKind, THREE.Group>): void {
    const skyY = ALTITUDE_HEIGHTS.SKY;

    // Urban sky: sleek skyway beacons
    for (let i = 0; i < 2; i++) {
      const side = i === 0 ? -1 : 1;
      const buoy = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.55, 4.2, 8), this.steelMat);
      buoy.position.set(side * 9.8, skyY + 1.5, (i - 0.5) * 26);
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.45, 8, 6), this.accentBeaconMat);
      cap.position.set(side * 9.8, skyY + 3.8, (i - 0.5) * 26);
      biomes.urban.add(buoy, cap);
    }

    // Volcanic sky: towering ash & glowing ember plumes rising from below + floating volcanic rocks
    for (let i = 0; i < 3; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const ashCol = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 2.8, 18, 10), this.volcanoRockMat);
      ashCol.position.set(side * (13.5 + i * 2), skyY - 3, (i - 1) * 18);
      const magmaCloud = new THREE.Mesh(new THREE.DodecahedronGeometry(2.2, 1), this.magmaMat);
      magmaCloud.position.set(side * 12, skyY + 3.5, (i - 1) * 18);
      biomes.volcanic.add(ashCol, magmaCloud);
    }

    // Quantum sky: tilted dimensional rift rings & floating fracture shards
    for (let i = 0; i < 3; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const qRing = new THREE.Mesh(new THREE.TorusGeometry(3.4, 0.22, 8, 22), this.quantumGlowMat);
      qRing.position.set(side * 11.5, skyY + 1.5, (i - 1) * 18);
      qRing.rotation.set(0.4, side * 0.7, 0.3);
      const shard = new THREE.Mesh(new THREE.OctahedronGeometry(1.4, 0), this.quantumGlowMat);
      shard.scale.set(0.6, 1.9, 0.6);
      shard.position.set(side * 11.5, skyY + 1.5, (i - 1) * 18);
      biomes.quantum.add(qRing, shard);
    }
    if (chunkIdx % 2 === 0) {
      const skyPortal = new THREE.Mesh(new THREE.TorusGeometry(7.8, 0.2, 8, 28, Math.PI), this.quantumGlowMat);
      skyPortal.position.set(0, skyY - 0.5, 0);
      biomes.quantum.add(skyPortal);
    }

    // Crystal sky: levitating crystalline sky spires
    for (let i = 0; i < 3; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const spire = new THREE.Mesh(new THREE.OctahedronGeometry(2.1, 0), this.crystalMat);
      spire.scale.set(0.75, 2.2, 0.75);
      spire.position.set(side * 12.2, skyY + 1.2, (i - 1) * 18);
      biomes.crystal.add(spire);
    }

    // Ancient sky: floating stone temple pillars & sun rings
    for (let i = 0; i < 2; i++) {
      const side = i === 0 ? -1 : 1;
      const obelisk = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.95, 7.2, 4), this.sandstoneMat);
      obelisk.position.set(side * 11.5, skyY + 1.0, (i - 0.5) * 24);
      biomes.ancient.add(obelisk);
    }

    // Nature sky: floating sky islands topped with blossom/canopy foliage
    for (let i = 0; i < 2; i++) {
      const side = i === 0 ? -1 : 1;
      const ix = side * 13.5;
      const iz = (i - 0.5) * 25;
      const island = new THREE.Mesh(new THREE.ConeGeometry(3.4, 4.2, 7), this.propMat);
      island.rotation.x = Math.PI;
      island.position.set(ix, skyY - 2.2, iz);
      const tree = new THREE.Mesh(new THREE.DodecahedronGeometry(2.1, 1), this.natureBlossomMat);
      tree.scale.set(1.3, 0.75, 1.3);
      tree.position.set(ix, skyY + 0.8, iz);
      biomes.nature.add(island, tree);
    }

    // Industrial sky: floating turbine sky-derricks
    for (let i = 0; i < 2; i++) {
      const side = i === 0 ? -1 : 1;
      const body = new THREE.Mesh(new THREE.BoxGeometry(2.4, 3.2, 2.4), this.steelMat);
      body.position.set(side * 11.5, skyY + 1.0, (i - 0.5) * 25);
      const rotor = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.24, 8, 16), this.propMat);
      rotor.rotation.x = Math.PI / 2;
      rotor.position.set(side * 11.5, skyY + 3.0, (i - 0.5) * 25);
      biomes.industrial.add(body, rotor);
    }
  }

  private populateSpaceBiomes(biomes: Record<BiomeKind, THREE.Group>): void {
    const spY = ALTITUDE_HEIGHTS.SPACE;

    // Urban space: satellite pylons
    for (let s = 0; s < 2; s++) {
      const side = s === 0 ? -1 : 1;
      const sat = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.6, 2.4), this.steelMat);
      sat.position.set(side * 13.5, spY + 2.5, (s - 0.5) * 24);
      const panel = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.1, 1.4), this.accentBeaconMat);
      panel.position.copy(sat.position);
      biomes.urban.add(sat, panel);
    }

    // Volcanic space: molten magma meteors
    for (let s = 0; s < 3; s++) {
      const side = s % 2 === 0 ? -1 : 1;
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(2.6, 1), this.volcanoRockMat);
      rock.position.set(side * (14 + s * 2), spY + (s - 1) * 3, (s - 1) * 18);
      const core = new THREE.Mesh(new THREE.OctahedronGeometry(2.2, 0), this.magmaMat);
      core.position.copy(rock.position);
      biomes.volcanic.add(rock, core);
    }

    // Quantum space: giant tilted warp gates
    for (let s = 0; s < 2; s++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(7.5, 0.25, 8, 28), this.quantumGlowMat);
      ring.position.set(0, spY + 1.5, (s - 0.5) * 28);
      ring.rotation.z = s * 0.4;
      biomes.quantum.add(ring);
    }

    // Crystal space: prism asteroids
    for (let s = 0; s < 3; s++) {
      const side = s % 2 === 0 ? -1 : 1;
      const c = new THREE.Mesh(new THREE.OctahedronGeometry(2.5, 0), this.crystalMat);
      c.scale.set(0.8, 1.9, 0.8);
      c.position.set(side * 14, spY + (s - 1) * 3, (s - 1) * 18);
      biomes.crystal.add(c);
    }

    // Ancient space: orbital stone monoliths
    for (let s = 0; s < 2; s++) {
      const side = s === 0 ? -1 : 1;
      const ob = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.3, 8.2, 4), this.sandstoneMat);
      ob.position.set(side * 13.5, spY + 1.5, (s - 0.5) * 26);
      ob.rotation.z = side * 0.22;
      biomes.ancient.add(ob);
    }

    // Nature space: glowing bio-nebula clusters
    for (let s = 0; s < 3; s++) {
      const side = s % 2 === 0 ? -1 : 1;
      const bio = new THREE.Mesh(new THREE.DodecahedronGeometry(2.5, 1), this.natureBlossomMat);
      bio.position.set(side * 14, spY + (s - 1) * 3, (s - 1) * 18);
      biomes.nature.add(bio);
    }

    // Industrial space: steel truss orbital rings
    for (let s = 0; s < 2; s++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(8.2, 0.35, 8, 16), this.steelMat);
      ring.position.set(0, spY + 1.5, (s - 0.5) * 28);
      biomes.industrial.add(ring);
    }
  }

  private initChunks(): void {
    const len = PHYSICS_CONFIG.chunkLength;
    const roadGeo = new THREE.PlaneGeometry(13.2, len);
    roadGeo.rotateX(-Math.PI / 2);

    const curbGeo = new THREE.BoxGeometry(0.42, 0.22, len);
    const guardRailGeo = new THREE.BoxGeometry(0.1, 0.16, len);
    const sidewalkGeo = new THREE.BoxGeometry(2.6, 0.14, len);
    const ribbonGeo = new THREE.PlaneGeometry(1.1, len);
    ribbonGeo.rotateX(-Math.PI / 2);
    const railGeo = new THREE.BoxGeometry(0.12, 0.12, len);

    for (let i = 0; i < PHYSICS_CONFIG.visibleChunks; i++) {
      const group = new THREE.Group();
      const zCenter = -i * len + len * 0.2;
      group.position.z = zCenter;

      // --- GROUND BASE GROUP ---
      const groundBaseGroup = new THREE.Group();
      group.add(groundBaseGroup);

      const roadMesh = new THREE.Mesh(roadGeo, this.roadMat);
      roadMesh.receiveShadow = true;
      groundBaseGroup.add(roadMesh);

      const curbL = new THREE.Mesh(curbGeo, this.curbMat);
      curbL.position.set(-6.8, 0.11, 0);
      const curbR = new THREE.Mesh(curbGeo, this.curbMat);
      curbR.position.set(6.8, 0.11, 0);
      groundBaseGroup.add(curbL, curbR);

      const walkL = new THREE.Mesh(sidewalkGeo, this.curbMat);
      walkL.position.set(-8.4, 0.04, 0);
      const walkR = new THREE.Mesh(sidewalkGeo, this.curbMat);
      walkR.position.set(8.4, 0.04, 0);
      groundBaseGroup.add(walkL, walkR);

      const guardL = new THREE.Mesh(guardRailGeo, this.steelMat);
      guardL.position.set(-7.15, 0.52, 0);
      const guardR = new THREE.Mesh(guardRailGeo, this.steelMat);
      guardR.position.set(7.15, 0.52, 0);
      groundBaseGroup.add(guardL, guardR);

      for (let gz = -len * 0.4; gz <= len * 0.4; gz += 12) {
        for (const side of [-1, 1]) {
          const post = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.58, 0.12), this.propMat);
          post.position.set(side * 7.22, 0.29, gz);
          const stud = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.18), this.accentBeaconMat);
          stud.position.set(side * 6.55, 0.06, gz);
          groundBaseGroup.add(post, stud);
        }
      }

      const terrainGeo = new THREE.PlaneGeometry(240, len);
      terrainGeo.rotateX(-Math.PI / 2);
      const terrain = new THREE.Mesh(terrainGeo, this.terrainMat);
      terrain.position.y = -0.04;
      terrain.receiveShadow = true;
      groundBaseGroup.add(terrain);

      for (const l of [-1, 1]) {
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.11, 5.4, 8), this.steelMat);
        pole.position.set(l * 7.5, 2.7, len * 0.18);
        const arm = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.09, 0.16), this.steelMat);
        arm.position.set(l * 6.85, 5.35, len * 0.18);
        const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.07, 0.18), this.accentBeaconMat);
        lamp.position.set(l * 6.55, 5.29, len * 0.18);
        groundBaseGroup.add(pole, arm, lamp);
      }

      // Road Fissure Cracks / Quantum Rift Seams across the asphalt
      const roadCrackGroup = new THREE.Group();
      for (let c = 0; c < 3; c++) {
        const cz = (c - 1) * 18;
        const crack1 = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.025, 0.24), this.fissureMat);
        crack1.position.set((c % 2 === 0 ? -1 : 1) * 2.1, 0.02, cz);
        crack1.rotation.y = (c % 2 === 0 ? 1 : -1) * 0.42;
        const crack2 = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.025, 0.18), this.fissureMat);
        crack2.position.set((c % 2 === 0 ? 1 : -1) * 0.4, 0.02, cz + 1.2);
        crack2.rotation.y = (c % 2 === 0 ? -1 : 1) * 0.55;
        roadCrackGroup.add(crack1, crack2);
      }
      groundBaseGroup.add(roadCrackGroup);

      // Ground Biomes
      const groundBiomes = this.createBiomeRecord();
      this.populateGroundBiomes(i, len, groundBiomes);
      for (const b of ALL_BIOMES) groundBaseGroup.add(groundBiomes[b]);

      // --- SKY BASE GROUP ---
      const skyBaseGroup = new THREE.Group();
      group.add(skyBaseGroup);

      for (const lx of LANE_POSITIONS) {
        const ribbon = new THREE.Mesh(ribbonGeo, this.skyRibbonMat);
        ribbon.position.set(lx, ALTITUDE_HEIGHTS.SKY - 0.65, 0);
        skyBaseGroup.add(ribbon);
      }

      // Soft muted twilight cloud puffs (no bright white glare!)
      for (let c = 0; c < 4; c++) {
        const cloud = new THREE.Group();
        for (let k = 0; k < 5; k++) {
          const puff = new THREE.Mesh(new THREE.IcosahedronGeometry(3.0 - Math.abs(k - 2) * 0.42, 1), this.cloudMat);
          puff.scale.set(1.55, 0.58, 1.25);
          puff.position.set((k - 2) * 2.1, Math.abs(k - 2) * -0.32, (k % 2) * 1.1);
          cloud.add(puff);
        }
        cloud.position.set(
          (c - 1.5) * 17 + (i % 2) * 4,
          ALTITUDE_HEIGHTS.SKY - 8.5 + (c % 2) * 3.0,
          (c - 1.5) * 14
        );
        skyBaseGroup.add(cloud);
      }

      const skyBiomes = this.createBiomeRecord();
      this.populateSkyBiomes(i, skyBiomes);
      for (const b of ALL_BIOMES) skyBaseGroup.add(skyBiomes[b]);

      // --- SPACE BASE GROUP ---
      const spaceBaseGroup = new THREE.Group();
      group.add(spaceBaseGroup);

      for (const lx of LANE_POSITIONS) {
        const rail = new THREE.Mesh(railGeo, this.spaceRailMat);
        rail.position.set(lx, ALTITUDE_HEIGHTS.SPACE - 0.65, 0);
        spaceBaseGroup.add(rail);
      }

      const spaceBiomes = this.createBiomeRecord();
      this.populateSpaceBiomes(spaceBiomes);
      for (const b of ALL_BIOMES) spaceBaseGroup.add(spaceBiomes[b]);

      this.scene.add(group);
      this.chunks.push({
        group,
        zCenter,
        groundBaseGroup,
        roadCrackGroup,
        groundBiomes,
        skyBaseGroup,
        skyBiomes,
        spaceBaseGroup,
        spaceBiomes,
      });
    }
  }

  private createMountainRidgeGeometry(width: number, maxHeight: number, seed: number): THREE.BufferGeometry {
    const shape = new THREE.Shape();
    shape.moveTo(-width * 0.5, 0);
    const steps = 38;
    for (let i = 0; i <= steps; i++) {
      const u = i / steps;
      const x = (u - 0.5) * width;
      const valleyDip = 0.22 + 0.78 * Math.min(1, Math.pow(Math.abs(x) / 68, 1.5));
      const h =
        (0.35 +
          0.35 * Math.abs(Math.sin(u * 10.0 + seed)) +
          0.3 * Math.abs(Math.cos(u * 21.0 + seed * 1.7))) *
        maxHeight *
        valleyDip;
      shape.lineTo(x, i === 0 || i === steps ? 0 : h);
    }
    shape.closePath();
    return new THREE.ExtrudeGeometry(shape, { depth: 8, bevelEnabled: false });
  }

  private initBackdrop(): void {
    this.skylineGroup = new THREE.Group();
    const skylineMat = new THREE.MeshStandardMaterial({
      color: 0x162236,
      roughness: 0.88,
      metalness: 0.2,
    });
    for (let i = -9; i <= 9; i++) {
      if (Math.abs(i) < 1) continue;
      const w = 8 + (Math.abs(i * 3) % 5) * 2.2;
      const h = 24 + (Math.abs(i * 7) % 28);
      const tower = new THREE.Mesh(new THREE.BoxGeometry(w, h, 8), skylineMat);
      tower.position.set(i * 15, h * 0.5 - 2, -195 - (Math.abs(i) % 3) * 12);
      this.skylineGroup.add(tower);
    }
    this.scene.add(this.skylineGroup);

    this.backdropRidgeNearMat = new THREE.MeshStandardMaterial({
      color: 0x122034,
      roughness: 0.94,
      metalness: 0.08,
    });
    this.backdropRidgeFarMat = new THREE.MeshStandardMaterial({
      color: 0x192d4a,
      roughness: 0.96,
      metalness: 0.05,
    });

    const nearRidge = new THREE.Mesh(this.createMountainRidgeGeometry(340, 38, 1.2), this.backdropRidgeNearMat);
    nearRidge.position.set(0, -2, -235);

    const farRidge = new THREE.Mesh(this.createMountainRidgeGeometry(420, 56, 3.7), this.backdropRidgeFarMat);
    farRidge.position.set(12, -2, -275);

    this.scene.add(nearRidge, farRidge);
  }

  private buildObstacleVariants(mesh: THREE.Group, shadowTex: THREE.CanvasTexture): THREE.MeshStandardMaterial[] {
    const flashMaterials: THREE.MeshStandardMaterial[] = [];

    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(2.8, 2.8),
      new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, opacity: 0.5, depthWrite: false })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.03;
    mesh.add(shadow);

    // 1. Armored Energy Cargo Pod
    const crateGrp = new THREE.Group();
    crateGrp.name = 'var_crate';
    const crateBodyMat = new THREE.MeshStandardMaterial({ color: 0x263347, roughness: 0.42, metalness: 0.68 });
    const crateTrimMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.35, metalness: 0.8 });
    const crateGlowMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x38bdf8,
      emissiveIntensity: 0.72,
    });
    flashMaterials.push(crateBodyMat);
    const cMain = new THREE.Mesh(new THREE.BoxGeometry(1.85, 1.65, 1.6), crateBodyMat);
    cMain.position.y = 0.85;
    cMain.castShadow = true;
    const cRibs = new THREE.Mesh(new THREE.BoxGeometry(1.94, 0.22, 1.68), crateTrimMat);
    cRibs.position.y = 1.48;
    const cCore = new THREE.Mesh(new THREE.BoxGeometry(1.94, 0.2, 1.66), crateGlowMat);
    cCore.name = 'crateGlow';
    cCore.position.y = 0.88;
    const cTop = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.2, 1.15), crateTrimMat);
    cTop.position.y = 1.76;
    crateGrp.add(cMain, cRibs, cCore, cTop);
    mesh.add(crateGrp);

    // 2. Sculpted Traffic Car / Enemy Craft
    const craftGrp = new THREE.Group();
    craftGrp.name = 'var_craft';
    const craftMat = new THREE.MeshPhysicalMaterial({
      color: 0x1d4ed8,
      roughness: 0.24,
      metalness: 0.72,
      clearcoat: 0.9,
      clearcoatRoughness: 0.1,
    });
    const craftDarkMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.7, metalness: 0.2 });
    const craftGlassMat = new THREE.MeshStandardMaterial({ color: 0x0b1220, roughness: 0.08, metalness: 0.35 });
    const craftTailMat = new THREE.MeshStandardMaterial({
      color: 0xdc2626,
      emissive: 0xe11d48,
      emissiveIntensity: 0.9,
    });
    flashMaterials.push(craftMat);

    const hull = new THREE.Mesh(new THREE.BoxGeometry(1.72, 0.56, 3.15), craftMat);
    hull.position.y = 0.56;
    hull.castShadow = true;
    const bumper = new THREE.Mesh(new THREE.BoxGeometry(1.76, 0.18, 3.24), craftDarkMat);
    bumper.position.y = 0.28;
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.32, 0.45, 1.55), craftGlassMat);
    cabin.position.set(0, 0.98, 0.05);
    const tail = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.1, 0.08), craftTailMat);
    tail.position.set(0, 0.66, 1.58);
    const wGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.22, 14);
    wGeo.rotateZ(Math.PI / 2);
    for (const [wx, wz] of [
      [-0.86, -0.95],
      [0.86, -0.95],
      [-0.86, 0.95],
      [0.86, 0.95],
    ]) {
      const tw = new THREE.Mesh(wGeo, craftDarkMat);
      tw.position.set(wx, 0.3, wz);
      craftGrp.add(tw);
    }
    const wing = new THREE.Mesh(new THREE.BoxGeometry(2.75, 0.1, 0.65), craftMat);
    wing.name = 'craftWing';
    wing.position.set(0, 0.64, 0.25);
    craftGrp.add(hull, bumper, cabin, tail, wing);
    mesh.add(craftGrp);

    // 3. Detailed Concrete & Caution-Striped Jersey Road Barrier
    const barrierGrp = new THREE.Group();
    barrierGrp.name = 'var_barrier';
    const barMat = new THREE.MeshStandardMaterial({ color: 0xc2410c, roughness: 0.62, metalness: 0.25 });
    const barBaseMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.85, metalness: 0.15 });
    const barGlowMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xd97706,
      emissiveIntensity: 0.85,
    });
    flashMaterials.push(barMat);
    const barBase = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.68, 2.2, 4), barBaseMat);
    barBase.rotation.z = Math.PI / 2;
    barBase.rotation.x = Math.PI / 4;
    barBase.position.y = 0.44;
    barBase.castShadow = true;
    const barTop = new THREE.Mesh(new THREE.BoxGeometry(2.18, 0.28, 0.54), barMat);
    barTop.position.y = 0.72;
    const barStripe = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.12, 0.56), barGlowMat);
    barStripe.position.y = 0.72;
    const beaconL = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 6), barGlowMat);
    beaconL.position.set(-0.88, 0.94, 0);
    const beaconR = beaconL.clone();
    beaconR.position.x = 0.88;
    barrierGrp.add(barBase, barTop, barStripe, beaconL, beaconR);
    mesh.add(barrierGrp);

    // 4. Overhead Steel Laser Gate
    const laserGrp = new THREE.Group();
    laserGrp.name = 'var_laser';
    const pylonMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.42, metalness: 0.8 });
    const laserBeamMat = new THREE.MeshStandardMaterial({
      color: 0xf43f5e,
      emissive: 0xe11d48,
      emissiveIntensity: 1.35,
      transparent: true,
      opacity: 0.88,
    });
    const pyL = new THREE.Mesh(new THREE.BoxGeometry(0.28, 3.1, 0.44), pylonMat);
    pyL.position.set(-1.38, 1.55, 0);
    const pyR = pyL.clone();
    pyR.position.x = 1.38;
    const beamTop = new THREE.Mesh(new THREE.BoxGeometry(2.96, 0.34, 0.48), pylonMat);
    beamTop.position.set(0, 2.86, 0);
    const beamLaser = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 2.65, 10), laserBeamMat);
    beamLaser.rotation.z = Math.PI / 2;
    beamLaser.position.set(0, 2.24, 0);
    laserGrp.add(pyL, pyR, beamTop, beamLaser);
    mesh.add(laserGrp);

    // 5. Space Cratered Asteroid
    const astGrp = new THREE.Group();
    astGrp.name = 'var_asteroid';
    const astMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.88, metalness: 0.16 });
    const astVeinMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.68,
    });
    flashMaterials.push(astMat);
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(1.18, 1), astMat);
    rock.position.y = 1.05;
    rock.castShadow = true;
    const vein = new THREE.Mesh(new THREE.OctahedronGeometry(0.92, 0), astVeinMat);
    vein.position.y = 1.05;
    astGrp.add(rock, vein);
    mesh.add(astGrp);

    // 6. Volcanic Erupting Magma Boulder (arcing down onto target lane)
    const volcGrp = new THREE.Group();
    volcGrp.name = 'var_volcanic';
    const vShellMat = new THREE.MeshStandardMaterial({ color: 0x261d1c, roughness: 0.9, metalness: 0.12 });
    const vMagmaMat = new THREE.MeshStandardMaterial({
      color: 0xf97316,
      emissive: 0xea580c,
      emissiveIntensity: 1.05,
    });
    flashMaterials.push(vShellMat);
    const boulder = new THREE.Group();
    boulder.name = 'volcBoulder';
    const bCrust = new THREE.Mesh(new THREE.DodecahedronGeometry(1.15, 1), vShellMat);
    bCrust.position.y = 1.05;
    bCrust.castShadow = true;
    const bCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.98, 0), vMagmaMat);
    bCore.position.y = 1.05;
    boulder.add(bCrust, bCore);

    const warnRing = new THREE.Mesh(
      new THREE.RingGeometry(0.95, 1.32, 24),
      new THREE.MeshBasicMaterial({ color: 0xf97316, transparent: true, opacity: 0.65, side: THREE.DoubleSide })
    );
    warnRing.name = 'volcWarnRing';
    warnRing.rotation.x = -Math.PI / 2;
    warnRing.position.y = 0.05;

    volcGrp.add(boulder, warnRing);
    mesh.add(volcGrp);

    // 7. Quantum Rift Fracture Barrier
    const quantGrp = new THREE.Group();
    quantGrp.name = 'var_quantum';
    const qFrameMat = new THREE.MeshStandardMaterial({ color: 0x1e1b4b, roughness: 0.35, metalness: 0.85 });
    const qSlashMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x7c3aed,
      emissiveIntensity: 1.0,
    });
    flashMaterials.push(qFrameMat);
    const qCore = new THREE.Mesh(new THREE.OctahedronGeometry(1.05, 0), qSlashMat);
    qCore.name = 'quantSpinner';
    qCore.scale.set(1.2, 1.35, 0.42);
    qCore.position.y = 1.25;
    const qRing = new THREE.Mesh(new THREE.TorusGeometry(1.28, 0.1, 8, 16), qFrameMat);
    qRing.name = 'quantRing';
    qRing.position.y = 1.25;
    quantGrp.add(qCore, qRing);
    mesh.add(quantGrp);

    return flashMaterials;
  }

  private buildHeartPickupModel(): THREE.Group {
    const grp = new THREE.Group();
    const s = new THREE.Shape();
    s.moveTo(0, -0.5);
    s.bezierCurveTo(0.18, -0.34, 0.6, -0.04, 0.56, 0.28);
    s.bezierCurveTo(0.53, 0.54, 0.18, 0.58, 0, 0.32);
    s.bezierCurveTo(-0.18, 0.58, -0.53, 0.54, -0.56, 0.28);
    s.bezierCurveTo(-0.6, -0.04, -0.18, -0.34, 0, -0.5);
    s.closePath();

    const geo = new THREE.ExtrudeGeometry(s, {
      depth: 0.22,
      bevelEnabled: true,
      bevelThickness: 0.12,
      bevelSize: 0.08,
      bevelSegments: 5,
      curveSegments: 22,
    });
    geo.center();

    const heartMat = new THREE.MeshPhysicalMaterial({
      color: 0xe11d48,
      emissive: 0xbe123c,
      emissiveIntensity: 0.42,
      roughness: 0.18,
      metalness: 0.22,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
    });
    const heartMesh = new THREE.Mesh(geo, heartMat);
    heartMesh.scale.setScalar(1.22);
    heartMesh.position.y = 0.08;

    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(0.74, 0.035, 8, 28),
      new THREE.MeshStandardMaterial({
        color: 0xfde047,
        emissive: 0xf59e0b,
        emissiveIntensity: 0.45,
      })
    );
    halo.rotation.x = Math.PI / 2;
    halo.position.y = -0.62;

    grp.add(heartMesh, halo);
    return grp;
  }

  private buildShieldPickupModel(): THREE.Group {
    const grp = new THREE.Group();
    const sh = new THREE.Shape();
    sh.moveTo(0, -0.6);
    sh.quadraticCurveTo(0.45, -0.34, 0.48, 0.24);
    sh.lineTo(0.48, 0.48);
    sh.quadraticCurveTo(0.22, 0.56, 0, 0.52);
    sh.quadraticCurveTo(-0.22, 0.56, -0.48, 0.48);
    sh.lineTo(-0.48, 0.24);
    sh.quadraticCurveTo(-0.45, -0.34, 0, -0.6);
    sh.closePath();

    const outerGeo = new THREE.ExtrudeGeometry(sh, {
      depth: 0.14,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.05,
      bevelSegments: 3,
      curveSegments: 16,
    });
    outerGeo.center();

    const silverMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.88,
      roughness: 0.2,
    });
    const azureMat = new THREE.MeshPhysicalMaterial({
      color: 0x0284c7,
      emissive: 0x0369a1,
      emissiveIntensity: 0.4,
      roughness: 0.22,
      metalness: 0.45,
      clearcoat: 0.9,
    });
    const crestMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      emissive: 0x7dd3fc,
      emissiveIntensity: 0.45,
      metalness: 0.65,
      roughness: 0.2,
    });

    const frame = new THREE.Mesh(outerGeo, silverMat);
    frame.scale.set(1.25, 1.25, 0.95);

    const face = new THREE.Mesh(outerGeo, azureMat);
    face.scale.set(1.06, 1.06, 1.25);

    const vBar = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.78, 0.34), crestMat);
    const hBar = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.14, 0.34), crestMat);
    hBar.position.y = 0.14;
    const boss = new THREE.Mesh(new THREE.OctahedronGeometry(0.17, 0), crestMat);
    boss.scale.set(1, 1, 1.3);
    boss.position.y = 0.14;

    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(0.74, 0.035, 8, 28),
      new THREE.MeshStandardMaterial({
        color: 0x7dd3fc,
        emissive: 0x0ea5e9,
        emissiveIntensity: 0.45,
      })
    );
    halo.rotation.x = Math.PI / 2;
    halo.position.y = -0.68;

    grp.add(frame, face, vBar, hBar, boss, halo);
    return grp;
  }

  private buildMagnetPickupModel(): THREE.Group {
    const grp = new THREE.Group();

    const redMat = new THREE.MeshPhysicalMaterial({
      color: 0xdc2626,
      emissive: 0x991b1b,
      emissiveIntensity: 0.35,
      roughness: 0.24,
      metalness: 0.25,
      clearcoat: 0.9,
    });
    const poleMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      metalness: 0.92,
      roughness: 0.16,
    });
    const bandMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.8,
      roughness: 0.35,
    });
    const arcMat = new THREE.MeshBasicMaterial({
      color: 0x7dd3fc,
      transparent: true,
      opacity: 0.65,
    });

    const uBend = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.135, 14, 24, Math.PI), redMat);
    uBend.rotation.z = Math.PI;
    uBend.position.y = 0.02;

    const armGeo = new THREE.CylinderGeometry(0.135, 0.135, 0.32, 16);
    const armL = new THREE.Mesh(armGeo, redMat);
    armL.position.set(-0.36, 0.18, 0);
    const armR = armL.clone();
    armR.position.x = 0.36;

    const collarGeo = new THREE.CylinderGeometry(0.142, 0.142, 0.04, 16);
    const colL = new THREE.Mesh(collarGeo, bandMat);
    colL.position.set(-0.36, 0.35, 0);
    const colR = colL.clone();
    colR.position.x = 0.36;

    const tipGeo = new THREE.CylinderGeometry(0.138, 0.138, 0.24, 16);
    const tipL = new THREE.Mesh(tipGeo, poleMat);
    tipL.position.set(-0.36, 0.48, 0);
    const tipR = tipL.clone();
    tipR.position.x = 0.36;

    const wave1 = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.022, 8, 18, Math.PI), arcMat);
    wave1.position.y = 0.56;
    const wave2 = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.018, 8, 16, Math.PI), arcMat);
    wave2.position.y = 0.56;

    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(0.74, 0.035, 8, 28),
      new THREE.MeshStandardMaterial({
        color: 0xc084fc,
        emissive: 0x9333ea,
        emissiveIntensity: 0.42,
      })
    );
    halo.rotation.x = Math.PI / 2;
    halo.position.y = -0.62;

    grp.add(uBend, armL, armR, colL, colR, tipL, tipR, wave1, wave2, halo);
    return grp;
  }

  private initPools(): void {
    const shadowTex = getContactShadowTexture();

    // Pool 28 Obstacles
    for (let i = 0; i < 28; i++) {
      const mesh = new THREE.Group();
      const flashMaterials = this.buildObstacleVariants(mesh, shadowTex);

      const hpBarBg = new THREE.Mesh(
        new THREE.PlaneGeometry(2.1, 0.22),
        new THREE.MeshBasicMaterial({ color: 0x090d16 })
      );
      hpBarBg.position.set(0, 2.65, 0);
      const hpBarFill = new THREE.Mesh(
        new THREE.PlaneGeometry(2.0, 0.14),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
      );
      hpBarFill.position.set(0, 2.65, 0.02);
      mesh.add(hpBarBg, hpBarFill);

      mesh.visible = false;
      this.scene.add(mesh);

      this.obstacles.push({
        active: false,
        kind: 'ENERGY_CRATE',
        altitude: 'GROUND',
        lane: 1,
        x: 0,
        y: 0,
        z: 0,
        hp: 100,
        maxHp: 100,
        destructible: true,
        requiresCrouch: false,
        requiresJump: false,
        moveDir: 1,
        movePhase: 0,
        hitFlashTimer: 0,
        rewardCoins: 25,
        eruptProgress: 1,
        eruptStartX: 0,
        eruptStartY: 0,
        eruptTargetX: 0,
        eruptTargetY: 0,
        mesh,
        flashMaterials,
        hpBarBg,
        hpBarFill,
        halfWidth: 1.05,
        halfHeight: 0.95,
        halfDepth: 0.9,
      });
    }

    // Pool 70 Coins & Gems
    const coinRimGeo = new THREE.TorusGeometry(0.4, 0.06, 10, 20);
    const coinCoreGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.08, 18);
    coinCoreGeo.rotateX(Math.PI / 2);
    const coinBarGeo = new THREE.BoxGeometry(0.11, 0.42, 0.12);
    const gemGeo = new THREE.OctahedronGeometry(0.46, 0);
    gemGeo.scale(0.85, 1.3, 0.85);

    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      emissive: 0xd97706,
      emissiveIntensity: 0.42,
      metalness: 0.88,
      roughness: 0.18,
    });
    const gemMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.45,
      metalness: 0.35,
      roughness: 0.12,
      clearcoat: 1.0,
    });

    for (let i = 0; i < 70; i++) {
      const grp = new THREE.Group();
      const coinSub = new THREE.Group();
      coinSub.name = 'coinToken';
      const rim = new THREE.Mesh(coinRimGeo, goldMat);
      const disc = new THREE.Mesh(coinCoreGeo, goldMat);
      const crest = new THREE.Mesh(coinBarGeo, goldMat);
      coinSub.add(rim, disc, crest);

      const gemSub = new THREE.Mesh(gemGeo, gemMat);
      gemSub.name = 'gemPrism';
      gemSub.visible = false;

      grp.add(coinSub, gemSub);
      grp.visible = false;
      this.scene.add(grp);
      this.coins.push({
        active: false,
        isGem: false,
        x: 0,
        y: 0,
        z: 0,
        value: 10,
        mesh: grp,
      });
    }

    // Pool 8 Power-ups
    for (let i = 0; i < 8; i++) {
      const group = new THREE.Group();

      const heartModel = this.buildHeartPickupModel();
      heartModel.name = 'pu_HEART';
      const shieldModel = this.buildShieldPickupModel();
      shieldModel.name = 'pu_SHIELD';
      const magnetModel = this.buildMagnetPickupModel();
      magnetModel.name = 'pu_MAGNET';

      const puShadow = new THREE.Mesh(
        new THREE.PlaneGeometry(1.7, 1.7),
        new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, opacity: 0.42, depthWrite: false })
      );
      puShadow.rotation.x = -Math.PI / 2;
      puShadow.position.y = -0.95;

      group.add(heartModel, shieldModel, magnetModel, puShadow);
      group.visible = false;
      this.scene.add(group);
      this.powerUps.push({
        active: false,
        kind: 'HEART',
        x: 0,
        y: 0,
        z: 0,
        mesh: group,
      });
    }

    // Pool 50 Projectiles
    const projGeo = new THREE.CylinderGeometry(0.09, 0.09, 1.35, 8);
    projGeo.rotateX(Math.PI / 2);
    for (let i = 0; i < 50; i++) {
      const mesh = new THREE.Mesh(projGeo, new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
      mesh.visible = false;
      this.scene.add(mesh);
      this.projectiles.push({
        active: false,
        fromBoss: false,
        x: 0,
        y: 0,
        z: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        damage: 20,
        pierce: false,
        homing: false,
        life: 0,
        mesh,
      });
    }
  }

  private syncBiomeAndLayerVisibility(): void {
    const showGround = this.activeAltitude === 'GROUND' || this.activeIsGarage;
    const showSky = !this.activeIsGarage && this.activeAltitude === 'SKY';
    const showSpace = !this.activeIsGarage && this.activeAltitude === 'SPACE';
    const showCracks =
      this.activeBiome === 'volcanic' ||
      this.activeBiome === 'quantum' ||
      this.activeBiome === 'crystal' ||
      this.activeBiome === 'ancient';

    for (const ch of this.chunks) {
      ch.groundBaseGroup.visible = showGround;
      ch.skyBaseGroup.visible = showSky;
      ch.spaceBaseGroup.visible = showSpace;
      ch.roadCrackGroup.visible = showGround && showCracks;

      for (const b of ALL_BIOMES) {
        ch.groundBiomes[b].visible = showGround && b === this.activeBiome;
        ch.skyBiomes[b].visible = showSky && b === this.activeBiome;
        ch.spaceBiomes[b].visible = showSpace && b === this.activeBiome;
      }
    }
    this.starField.visible = showSpace;
    this.skyBackdropPlanet.visible = showSpace;
    if (this.skylineGroup) {
      this.skylineGroup.visible = showGround && (this.activeBiome === 'urban' || this.activeBiome === 'industrial');
    }
  }

  applyDimension(dim: DimensionConfig): void {
    this.activeBiome = getBiomeForTheme(dim.propTheme);

    this.accentBeaconMat.color.setHex(dim.curbEmissive);
    this.accentBeaconMat.emissive.setHex(dim.curbEmissive);
    this.skyRibbonMat.color.setHex(dim.accentColor);
    this.spaceRailMat.color.setHex(dim.spaceNebulaColor);
    this.propMat.color.setHex(dim.roadColor);
    this.terrainMat.color.setHex(dim.hemiGroundColor).lerp(new THREE.Color(0x1e293b), 0.18);

    // Muted atmospheric clouds synced to dimension horizon/sky (NEVER blinding white)
    this.cloudMat.color
      .setHex(dim.horizonColor)
      .lerp(new THREE.Color(dim.skyColor), 0.38)
      .lerp(new THREE.Color(0x334155), 0.25);

    // Road fissure / crack coloration per biome
    if (this.activeBiome === 'volcanic') {
      this.fissureMat.color.setHex(0xf97316);
      this.fissureMat.emissive.setHex(0xc2410c);
      this.fissureMat.emissiveIntensity = 0.72;
    } else if (this.activeBiome === 'quantum') {
      this.fissureMat.color.setHex(0x38bdf8);
      this.fissureMat.emissive.setHex(0x7c3aed);
      this.fissureMat.emissiveIntensity = 0.76;
    } else if (this.activeBiome === 'crystal') {
      this.fissureMat.color.setHex(0x7dd3fc);
      this.fissureMat.emissive.setHex(0x0284c7);
      this.fissureMat.emissiveIntensity = 0.52;
    } else {
      this.fissureMat.color.setHex(dim.accentColor);
      this.fissureMat.emissive.setHex(dim.curbEmissive);
      this.fissureMat.emissiveIntensity = 0.45;
    }

    // Dynamic tinting for biome accents (crystal/nature/quantum/volcanic)
    this.magmaMat.color.setHex(dim.accentColor).lerp(new THREE.Color(0xf97316), 0.65);
    this.magmaMat.emissive.setHex(0xd9480f);
    this.quantumGlowMat.color.setHex(dim.accentColor);
    this.quantumGlowMat.emissive.setHex(dim.spaceNebulaColor).lerp(new THREE.Color(dim.curbEmissive), 0.55);
    this.crystalMat.color.setHex(dim.keyLightColor).lerp(new THREE.Color(dim.accentColor), 0.45);
    this.crystalMat.emissive.setHex(dim.spaceNebulaColor);
    this.natureBlossomMat.color.setHex(dim.hemiSkyColor).lerp(new THREE.Color(dim.accentColor), 0.35);

    this.backdropRidgeNearMat.color.setHex(dim.hemiGroundColor).lerp(new THREE.Color(dim.horizonColor), 0.28);
    this.backdropRidgeFarMat.color.setHex(dim.horizonColor).lerp(new THREE.Color(dim.skyColor), 0.42);

    this.skyDomeMat.uniforms.uSkyColor.value.setHex(dim.skyColor);
    this.skyDomeMat.uniforms.uHorizonColor.value.setHex(dim.horizonColor);
    // Soften sun color toward horizon so it never burns eyes
    this.skyDomeMat.uniforms.uSunColor.value
      .setHex(dim.keyLightColor)
      .lerp(new THREE.Color(dim.horizonColor), 0.45);

    this.skyBackdropPlanet.children.forEach((ch, idx) => {
      const m = (ch as THREE.Mesh).material as THREE.MeshStandardMaterial;
      if (idx === 0) m.color.setHex(dim.spaceNebulaColor);
      else m.color.setHex(dim.accentColor);
    });

    this.syncBiomeAndLayerVisibility();
  }

  setLayerVisibility(altitude: AltitudeLayer, isGarage: boolean): void {
    this.activeAltitude = altitude;
    this.activeIsGarage = isGarage;
    this.syncBiomeAndLayerVisibility();
  }

  resetRun(): void {
    this.nextSpawnZ = -65;
    this.waveIndex = 0;
    for (let i = 0; i < this.chunks.length; i++) {
      this.chunks[i].zCenter = -i * PHYSICS_CONFIG.chunkLength + PHYSICS_CONFIG.chunkLength * 0.2;
      this.chunks[i].group.position.z = this.chunks[i].zCenter;
    }
    for (const o of this.obstacles) {
      o.active = false;
      o.mesh.visible = false;
    }
    for (const c of this.coins) {
      c.active = false;
      c.mesh.visible = false;
    }
    for (const p of this.powerUps) {
      p.active = false;
      p.mesh.visible = false;
    }
    for (const pr of this.projectiles) {
      pr.active = false;
      pr.mesh.visible = false;
    }
  }

  spawnExplosion(x: number, y: number, z: number, colorHex: number, count: number): void {
    for (let i = 0; i < count; i++) {
      const idx = this.particleCursor;
      this.particleCursor = (this.particleCursor + 1) % this.maxParticles;
      const p = this.particles[idx];
      p.active = true;
      p.x = x + (Math.random() - 0.5) * 0.8;
      p.y = y + (Math.random() - 0.5) * 0.8;
      p.z = z + (Math.random() - 0.5) * 0.8;
      p.vx = (Math.random() - 0.5) * 18;
      p.vy = 2 + Math.random() * 14;
      p.vz = (Math.random() - 0.5) * 18;
      p.maxLife = 0.35 + Math.random() * 0.35;
      p.life = p.maxLife;
      p.size = 0.7 + Math.random() * 1.1;
      p.color.setHex(colorHex);
      this.particleMesh.setColorAt(idx, p.color);
    }
    if (this.particleMesh.instanceColor) {
      this.particleMesh.instanceColor.needsUpdate = true;
    }
  }

  spawnTrailParticle(x: number, y: number, z: number, colorHex: number): void {
    const idx = this.particleCursor;
    this.particleCursor = (this.particleCursor + 1) % this.maxParticles;
    const p = this.particles[idx];
    p.active = true;
    p.x = x + (Math.random() - 0.5) * 0.4;
    p.y = y + (Math.random() - 0.5) * 0.2;
    p.z = z + 1.85;
    p.vx = (Math.random() - 0.5) * 2.0;
    p.vy = (Math.random() - 0.5) * 1.0;
    p.vz = 8.2;
    p.maxLife = 0.24;
    p.life = 0.24;
    p.size = 0.44;
    p.color.setHex(colorHex);
    this.particleMesh.setColorAt(idx, p.color);
    if (this.particleMesh.instanceColor) {
      this.particleMesh.instanceColor.needsUpdate = true;
    }
  }

  spawnProjectile(
    x: number,
    y: number,
    z: number,
    vx: number,
    vy: number,
    vz: number,
    damage: number,
    colorHex: number,
    fromBoss = false,
    pierce = false,
    homing = false,
    scale = 1
  ): void {
    const slot = this.projectiles.find((p) => !p.active);
    if (!slot) return;
    slot.active = true;
    slot.fromBoss = fromBoss;
    slot.x = x;
    slot.y = y;
    slot.z = z;
    slot.vx = vx;
    slot.vy = vy;
    slot.vz = vz;
    slot.damage = damage;
    slot.pierce = pierce;
    slot.homing = homing;
    slot.life = fromBoss ? 3.5 : 2.2;
    slot.mesh.position.set(x, y, z);
    slot.mesh.scale.set(scale, scale, scale);
    (slot.mesh.material as THREE.MeshBasicMaterial).color.setHex(colorHex);
    slot.mesh.visible = true;
  }

  private configureObstacleVisual(obs: PooledObstacle, kind: ObstacleKind, dim: DimensionConfig): void {
    const vCrate = obs.mesh.getObjectByName('var_crate')!;
    const vCraft = obs.mesh.getObjectByName('var_craft')!;
    const vBarrier = obs.mesh.getObjectByName('var_barrier')!;
    const vLaser = obs.mesh.getObjectByName('var_laser')!;
    const vAst = obs.mesh.getObjectByName('var_asteroid')!;
    const vVolc = obs.mesh.getObjectByName('var_volcanic')!;
    const vQuant = obs.mesh.getObjectByName('var_quantum')!;

    vCrate.visible = false;
    vCraft.visible = false;
    vBarrier.visible = false;
    vLaser.visible = false;
    vAst.visible = false;
    vVolc.visible = false;
    vQuant.visible = false;

    obs.requiresCrouch = false;
    obs.requiresJump = false;
    obs.destructible = true;

    if (kind === 'LASER_GATE') {
      vLaser.visible = true;
      obs.requiresCrouch = true;
      obs.destructible = false;
      obs.halfWidth = 1.45;
      obs.halfHeight = 0.5;
      obs.halfDepth = 0.4;
    } else if (kind === 'ROAD_BARRIER') {
      vBarrier.visible = true;
      obs.requiresJump = true;
      obs.halfWidth = 1.1;
      obs.halfHeight = 0.55;
      obs.halfDepth = 0.5;
    } else if (kind === 'TRAFFIC_VEHICLE' || kind === 'ENEMY_AIRCRAFT') {
      vCraft.visible = true;
      const wing = vCraft.getObjectByName('craftWing')!;
      wing.visible = kind === 'ENEMY_AIRCRAFT';
      obs.halfWidth = 0.98;
      obs.halfHeight = 0.75;
      obs.halfDepth = 1.55;
    } else if (kind === 'ASTEROID') {
      vAst.visible = true;
      obs.halfWidth = 1.1;
      obs.halfHeight = 1.05;
      obs.halfDepth = 1.1;
    } else if (kind === 'VOLCANIC_ROCK') {
      vVolc.visible = true;
      const boulder = vVolc.getObjectByName('volcBoulder')!;
      boulder.position.set(0, 0, 0);
      const warn = vVolc.getObjectByName('volcWarnRing')!;
      warn.position.set(0, 0.05, 0);
      obs.halfWidth = 1.08;
      obs.halfHeight = 1.05;
      obs.halfDepth = 1.08;
    } else if (kind === 'QUANTUM_RIFT') {
      vQuant.visible = true;
      obs.halfWidth = 1.15;
      obs.halfHeight = 1.25;
      obs.halfDepth = 0.7;
    } else {
      vCrate.visible = true;
      const s = kind === 'HEAVY_BLOCK' ? 1.25 : 1.0;
      vCrate.scale.set(s, kind === 'HEAVY_BLOCK' ? 1.38 : 1.0, s);
      const glow = vCrate.getObjectByName('crateGlow') as THREE.Mesh;
      const gMat = glow.material as THREE.MeshStandardMaterial;
      const col = kind === 'MOVING_OBSTACLE' ? 0xe11d48 : dim.curbEmissive;
      gMat.color.setHex(col);
      gMat.emissive.setHex(col);
      obs.halfWidth = 1.02 * s;
      obs.halfHeight = 0.95 * (kind === 'HEAVY_BLOCK' ? 1.38 : 1.0);
      obs.halfDepth = 0.95 * s;
    }

    obs.hpBarBg.visible = obs.destructible;
    obs.hpBarFill.visible = obs.destructible;
  }

  private spawnWaveAtZ(
    z: number,
    altitude: AltitudeLayer,
    distanceMeters: number,
    dim: DimensionConfig,
    bossActive: boolean
  ): void {
    const baseY = ALTITUDE_HEIGHTS[altitude];
    const biome = getBiomeForTheme(dim.propTheme);

    const openLane = Math.floor(Math.random() * 3);
    const coinLane = (openLane + (Math.random() > 0.5 ? 1 : 0)) % 3;

    const isArc = Math.random() > 0.65;
    for (let i = 0; i < 4; i++) {
      const coin = this.coins.find((c) => !c.active);
      if (!coin) break;
      coin.active = true;
      coin.isGem = i === 3 && Math.random() > 0.7;
      coin.value = coin.isGem ? 50 : 10;
      coin.x = LANE_POSITIONS[coinLane];
      coin.y = baseY + 0.95 + (isArc ? Math.sin((i / 3) * Math.PI) * 2.6 : 0);
      coin.z = z - i * 3.5;
      coin.mesh.position.set(coin.x, coin.y, coin.z);
      coin.mesh.scale.setScalar(coin.isGem ? 1.2 : 1.0);
      const coinSub = coin.mesh.getObjectByName('coinToken')!;
      const gemSub = coin.mesh.getObjectByName('gemPrism')!;
      coinSub.visible = !coin.isGem;
      gemSub.visible = coin.isGem;
      coin.mesh.visible = true;
    }

    const wIdx = this.waveIndex++;
    if (wIdx < 3 || Math.random() > 0.65) {
      const pu = this.powerUps.find((p) => !p.active);
      if (pu) {
        const kinds: PowerUpKind[] = ['MAGNET', 'SHIELD', 'HEART'];
        const kind = wIdx < 3 ? kinds[wIdx] : kinds[Math.floor(Math.random() * kinds.length)];
        pu.active = true;
        pu.kind = kind;
        pu.x = wIdx === 0 ? LANE_POSITIONS[1] : LANE_POSITIONS[openLane];
        pu.y = baseY + 1.15;
        pu.z = wIdx === 0 ? z + 26 : z - 8;

        pu.mesh.getObjectByName('pu_HEART')!.visible = kind === 'HEART';
        pu.mesh.getObjectByName('pu_SHIELD')!.visible = kind === 'SHIELD';
        pu.mesh.getObjectByName('pu_MAGNET')!.visible = kind === 'MAGNET';

        pu.mesh.position.set(pu.x, pu.y, pu.z);
        pu.mesh.visible = true;
      }
    }

    if (bossActive) return;

    const kindsByAlt: Record<AltitudeLayer, ObstacleKind[]> = {
      GROUND: ['ROAD_BARRIER', 'ENERGY_CRATE', 'TRAFFIC_VEHICLE', 'LASER_GATE', 'HEAVY_BLOCK', 'MOVING_OBSTACLE'],
      SKY: ['ENERGY_CRATE', 'ENEMY_AIRCRAFT', 'MOVING_OBSTACLE', 'LASER_GATE'],
      SPACE: ['ASTEROID', 'ENERGY_CRATE', 'MOVING_OBSTACLE', 'HEAVY_BLOCK'],
    };

    for (let lane = 0; lane < 3; lane++) {
      if (lane === openLane) continue;
      if (Math.random() > 0.66) continue;

      const obs = this.obstacles.find((o) => !o.active);
      if (!obs) break;

      let kind: ObstacleKind;
      if (biome === 'volcanic' && (lane === 0 || Math.random() > 0.42)) {
        kind = 'VOLCANIC_ROCK';
      } else if (biome === 'quantum' && (lane === 0 || Math.random() > 0.42)) {
        kind = 'QUANTUM_RIFT';
      } else {
        const poolKinds = kindsByAlt[altitude];
        kind = poolKinds[Math.floor(Math.random() * poolKinds.length)];
      }

      const baseHp =
        kind === 'HEAVY_BLOCK'
          ? 140
          : kind === 'TRAFFIC_VEHICLE' || kind === 'ENEMY_AIRCRAFT' || kind === 'VOLCANIC_ROCK'
            ? 90
            : 55;
      const hp = calculateObstacleHP(baseHp, distanceMeters);

      obs.active = true;
      obs.kind = kind;
      obs.altitude = altitude;
      obs.lane = lane;
      obs.eruptTargetX = LANE_POSITIONS[lane];
      obs.eruptTargetY = baseY;
      obs.x = obs.eruptTargetX;
      obs.y = obs.eruptTargetY;
      obs.z = z;
      obs.hp = hp;
      obs.maxHp = hp;
      obs.hitFlashTimer = 0;
      obs.moveDir = lane === 0 ? 1 : -1;
      obs.movePhase = Math.random() * Math.PI * 2;
      obs.rewardCoins = kind === 'HEAVY_BLOCK' || kind === 'VOLCANIC_ROCK' ? 45 : 25;

      // Setup volcano crater eruption parabolic arc for VOLCANIC_ROCK
      if (kind === 'VOLCANIC_ROCK') {
        const eruptSide = lane === 0 ? -1 : lane === 2 ? 1 : Math.random() > 0.5 ? 1 : -1;
        obs.eruptStartX = eruptSide * 15.5;
        obs.eruptStartY = altitude === 'GROUND' ? 11.5 : baseY - 6;
        obs.eruptProgress = 0;
      } else {
        obs.eruptProgress = 1;
      }

      this.configureObstacleVisual(obs, kind, dim);
      obs.hpBarFill.scale.x = 1;
      obs.hpBarFill.position.x = 0;
      obs.mesh.position.set(obs.x, obs.y, obs.z);
      obs.mesh.visible = true;
    }
  }

  update(
    dt: number,
    forwardStep: number,
    playerX: number,
    playerY: number,
    altitude: AltitudeLayer,
    distanceMeters: number,
    dim: DimensionConfig,
    magnetActive: boolean,
    bossActive: boolean,
    isPlaying: boolean
  ): void {
    this.skyDomeMat.uniforms.uTime.value += dt;

    const chunkLen = PHYSICS_CONFIG.chunkLength;
    const totalLen = chunkLen * this.chunks.length;

    for (const ch of this.chunks) {
      ch.zCenter += forwardStep;
      if (ch.zCenter > chunkLen * 0.9) {
        ch.zCenter -= totalLen;
      }
      ch.group.position.z = ch.zCenter;
    }

    this.starField.position.z += forwardStep * 0.08;
    if (this.starField.position.z > 120) this.starField.position.z -= 120;

    if (isPlaying) {
      this.nextSpawnZ += forwardStep;
      while (this.nextSpawnZ > -200) {
        this.spawnWaveAtZ(this.nextSpawnZ - 26, altitude, distanceMeters, dim, bossActive);
        const spacing = Math.max(20, 34 - Math.min(12, distanceMeters / 900));
        this.nextSpawnZ -= spacing;
      }
    }

    for (const obs of this.obstacles) {
      if (!obs.active) continue;
      obs.z += forwardStep;
      if (obs.kind === 'TRAFFIC_VEHICLE' || obs.kind === 'ENEMY_AIRCRAFT') {
        obs.z += dt * 7.5;
      }
      if (obs.kind === 'MOVING_OBSTACLE') {
        obs.movePhase += dt * 2.4;
        obs.x = Math.sin(obs.movePhase) * 3.4;
      }
      if (obs.kind === 'VOLCANIC_ROCK') {
        const vVolc = obs.mesh.getObjectByName('var_volcanic')!;
        const boulder = vVolc.getObjectByName('volcBoulder')!;
        if (obs.eruptProgress < 1) {
          // Erupt from volcano crater up into sky and arc onto the target road lane!
          obs.eruptProgress = Math.min(1, obs.eruptProgress + dt * 0.65);
          const u = obs.eruptProgress;
          const arcY = Math.sin(u * Math.PI) * 14.5;
          const curX = THREE.MathUtils.lerp(obs.eruptStartX, obs.eruptTargetX, u);
          const curY = THREE.MathUtils.lerp(obs.eruptStartY, obs.eruptTargetY, u) + arcY;
          boulder.position.set(curX - obs.eruptTargetX, curY - obs.eruptTargetY, 0);
          boulder.rotation.x += dt * 3.5;
          boulder.rotation.z += dt * 2.4;
        } else {
          boulder.position.set(0, 0, 0);
        }
      }
      if (obs.kind === 'QUANTUM_RIFT') {
        const vQuant = obs.mesh.getObjectByName('var_quantum')!;
        const spinner = vQuant.getObjectByName('quantSpinner');
        const qRing = vQuant.getObjectByName('quantRing');
        if (spinner) spinner.rotation.y += dt * 4.0;
        if (qRing) qRing.rotation.z -= dt * 2.6;
      }
      if (obs.hitFlashTimer > 0) {
        obs.hitFlashTimer -= dt;
        const flashHex = obs.hitFlashTimer > 0 ? 0xffffff : 0x000000;
        for (const fm of obs.flashMaterials) {
          fm.emissive.setHex(flashHex);
        }
      }

      obs.mesh.position.set(obs.x, obs.y, obs.z);
      if (obs.z > 20) {
        obs.active = false;
        obs.mesh.visible = false;
      }
    }

    for (const coin of this.coins) {
      if (!coin.active) continue;
      coin.z += forwardStep;
      if (magnetActive && coin.z > -45 && coin.z < 6) {
        coin.x += (playerX - coin.x) * Math.min(1, dt * 11);
        coin.y += (playerY + 0.8 - coin.y) * Math.min(1, dt * 11);
      }
      coin.mesh.position.set(coin.x, coin.y, coin.z);
      coin.mesh.rotation.y += dt * 3.4;
      if (coin.z > 18) {
        coin.active = false;
        coin.mesh.visible = false;
      }
    }

    for (const pu of this.powerUps) {
      if (!pu.active) continue;
      pu.z += forwardStep;
      pu.mesh.position.set(pu.x, pu.y + Math.sin(performance.now() * 0.0045) * 0.16, pu.z);
      pu.mesh.rotation.y += dt * 2.1;
      if (pu.z > 18) {
        pu.active = false;
        pu.mesh.visible = false;
      }
    }

    for (const pr of this.projectiles) {
      if (!pr.active) continue;
      pr.life -= dt;

      if (pr.homing && !pr.fromBoss) {
        let nearest: PooledObstacle | null = null;
        let bestDist = 45;
        for (const o of this.obstacles) {
          if (!o.active || !o.destructible || o.z > pr.z) continue;
          const d = Math.hypot(o.x - pr.x, o.z - pr.z);
          if (d < bestDist) {
            bestDist = d;
            nearest = o;
          }
        }
        if (nearest) {
          pr.vx += ((nearest.x - pr.x) * 9 - pr.vx) * Math.min(1, dt * 8);
          pr.vy += ((nearest.y + 0.9 - pr.y) * 6 - pr.vy) * Math.min(1, dt * 8);
        }
      }

      pr.x += pr.vx * dt;
      pr.y += pr.vy * dt;
      pr.z += pr.vz * dt;
      pr.mesh.position.set(pr.x, pr.y, pr.z);

      if (pr.life <= 0 || pr.z < -210 || pr.z > 25) {
        pr.active = false;
        pr.mesh.visible = false;
      }
    }

    let dirty = false;
    for (let i = 0; i < this.maxParticles; i++) {
      const p = this.particles[i];
      if (!p.active) continue;
      dirty = true;
      p.life -= dt;
      if (p.life <= 0) {
        p.active = false;
        this.dummy.position.set(0, -999, 0);
        this.dummy.scale.setScalar(0.001);
      } else {
        p.vy -= 18 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.z += (p.vz + forwardStep * 0.4) * dt;
        const s = p.size * (p.life / p.maxLife);
        this.dummy.position.set(p.x, p.y, p.z);
        this.dummy.scale.setScalar(Math.max(0.01, s));
      }
      this.dummy.updateMatrix();
      this.particleMesh.setMatrixAt(i, this.dummy.matrix);
    }
    if (dirty) {
      this.particleMesh.instanceMatrix.needsUpdate = true;
    }
  }

  getObstacles(): PooledObstacle[] {
    return this.obstacles;
  }

  getCoins(): PooledCoin[] {
    return this.coins;
  }

  getPowerUps(): PooledPowerUp[] {
    return this.powerUps;
  }

  getProjectiles(): PooledProjectile[] {
    return this.projectiles;
  }
}
