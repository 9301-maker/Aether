import * as THREE from 'three';
import { ALTITUDE_HEIGHTS } from './config';
import { DimensionConfig } from './types';

export type PropTheme = DimensionConfig['propTheme'];

export interface BiomeSharedMaterials {
  propMat: THREE.MeshStandardMaterial;
  steelMat: THREE.MeshStandardMaterial;
  buildingMat: THREE.MeshStandardMaterial;
  curbMat: THREE.MeshStandardMaterial;
  accentBeaconMat: THREE.MeshStandardMaterial;
  fissureMat: THREE.MeshStandardMaterial;
}

export interface BuiltThemeChunk {
  ground: THREE.Group;
  sky: THREE.Group;
  space: THREE.Group;
  roadOverlay: THREE.Group;
  useUrbanGuardrails: boolean;
  showRoadFissures: boolean;
}

// ---------- Cached Procedural Geometries & Theme Materials ----------

class BiomeAssetBank {
  // Custom extruded / lathed / tube geometries created once and shared
  readonly gearGeo: THREE.ExtrudeGeometry;
  readonly sakuraTrunkGeo: THREE.TubeGeometry;
  readonly toriiTopBeamGeo: THREE.ExtrudeGeometry;
  readonly duneGeo: THREE.ExtrudeGeometry;
  readonly craterGeo: THREE.LatheGeometry;
  readonly mushroomStemGeo: THREE.LatheGeometry;
  readonly mushroomCapGeo: THREE.LatheGeometry;
  readonly coralBranchGeo: THREE.TubeGeometry;
  readonly lightningBoltGeo: THREE.TubeGeometry;
  readonly auroraRibbonGeo: THREE.TubeGeometry;
  readonly eternalRibbonGeo: THREE.TubeGeometry;
  readonly toxicVineGeo: THREE.TubeGeometry;

  // Theme-distinct calibrated PBR materials (varied roughness/metalness, zero glare)
  readonly basaltMat = new THREE.MeshStandardMaterial({ color: 0x261d1c, roughness: 0.92, metalness: 0.08 });
  readonly magmaMat = new THREE.MeshStandardMaterial({ color: 0xf97316, emissive: 0xc2410c, emissiveIntensity: 0.85, roughness: 0.35 });
  readonly ashMat = new THREE.MeshStandardMaterial({ color: 0x3f2e2b, roughness: 0.96, metalness: 0.02, transparent: true, opacity: 0.78 });

  readonly goldMat = new THREE.MeshStandardMaterial({ color: 0xd4a024, metalness: 0.88, roughness: 0.24 });
  readonly gildedMarbleMat = new THREE.MeshStandardMaterial({ color: 0x3b354a, roughness: 0.52, metalness: 0.38 });

  readonly crystalMat = new THREE.MeshPhysicalMaterial({ color: 0xc084fc, emissive: 0x6b21a8, emissiveIntensity: 0.28, roughness: 0.14, metalness: 0.22, clearcoat: 0.9 });
  readonly geodeMat = new THREE.MeshStandardMaterial({ color: 0x292140, roughness: 0.88, metalness: 0.1 });

  readonly iceMat = new THREE.MeshPhysicalMaterial({ color: 0x67e8f9, emissive: 0x0e7490, emissiveIntensity: 0.22, roughness: 0.16, metalness: 0.15, clearcoat: 0.95 });
  readonly snowMat = new THREE.MeshStandardMaterial({ color: 0x94b8c9, roughness: 0.85, metalness: 0.04 });
  readonly auroraMat = new THREE.MeshBasicMaterial({ color: 0x34d399, transparent: true, opacity: 0.42, side: THREE.DoubleSide });

  readonly sandstoneMat = new THREE.MeshStandardMaterial({ color: 0xa17946, roughness: 0.9, metalness: 0.05 });
  readonly sandDuneMat = new THREE.MeshStandardMaterial({ color: 0x8f6636, roughness: 0.95, metalness: 0.02 });

  readonly toriiRedMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.56, metalness: 0.08 });
  readonly darkWoodMat = new THREE.MeshStandardMaterial({ color: 0x3b2620, roughness: 0.88, metalness: 0.04 });
  readonly sakuraBlossomMat = new THREE.MeshStandardMaterial({ color: 0xe879a8, roughness: 0.76, metalness: 0.04 });
  readonly stoneLanternMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.86, metalness: 0.08 });
  readonly warmPaperMat = new THREE.MeshStandardMaterial({ color: 0xfde68a, emissive: 0xf59e0b, emissiveIntensity: 0.65, roughness: 0.4 });

  readonly pineBarkMat = new THREE.MeshStandardMaterial({ color: 0x452b1c, roughness: 0.92, metalness: 0.03 });
  readonly pineNeedleMat = new THREE.MeshStandardMaterial({ color: 0x134e38, roughness: 0.86, metalness: 0.04 });
  readonly mossMat = new THREE.MeshStandardMaterial({ color: 0x2b6b45, roughness: 0.9, metalness: 0.02 });

  readonly coralOrangeMat = new THREE.MeshStandardMaterial({ color: 0xea6a47, roughness: 0.72, metalness: 0.06 });
  readonly coralTealMat = new THREE.MeshStandardMaterial({ color: 0x14b8a6, roughness: 0.68, metalness: 0.08 });
  readonly waterMat = new THREE.MeshPhysicalMaterial({ color: 0x0369a1, emissive: 0x062d47, emissiveIntensity: 0.28, roughness: 0.16, metalness: 0.14, transparent: true, opacity: 0.78, clearcoat: 0.85 });
  readonly pearlMat = new THREE.MeshPhysicalMaterial({ color: 0xe2e8f0, emissive: 0x38bdf8, emissiveIntensity: 0.32, roughness: 0.18, metalness: 0.35, clearcoat: 0.9 });

  readonly copperMat = new THREE.MeshStandardMaterial({ color: 0xb45309, metalness: 0.86, roughness: 0.28 });
  readonly lightningMat = new THREE.MeshStandardMaterial({ color: 0x93c5fd, emissive: 0x3b82f6, emissiveIntensity: 0.95, roughness: 0.2 });

  readonly marbleMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.68, metalness: 0.08 });
  readonly marbleTrimMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.78, metalness: 0.12 });

  readonly magnetRedMat = new THREE.MeshStandardMaterial({ color: 0xbe123c, roughness: 0.42, metalness: 0.52 });
  readonly magnetSilverMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.26, metalness: 0.86 });
  readonly fluxMat = new THREE.MeshStandardMaterial({ color: 0xfb7185, emissive: 0xe11d48, emissiveIntensity: 0.75, roughness: 0.3 });

  readonly nebulaCrimsonMat = new THREE.MeshStandardMaterial({ color: 0x9f1239, emissive: 0x881337, emissiveIntensity: 0.45, roughness: 0.5, transparent: true, opacity: 0.8 });
  readonly nebulaRockMat = new THREE.MeshStandardMaterial({ color: 0x26121b, roughness: 0.9, metalness: 0.14 });

  readonly lunarRegolithMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.95, metalness: 0.04 });
  readonly lunarDomeMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.38, metalness: 0.45 });

  readonly citadelIceStoneMat = new THREE.MeshStandardMaterial({ color: 0x1e3a5f, roughness: 0.56, metalness: 0.32 });
  readonly citadelFrostMat = new THREE.MeshStandardMaterial({ color: 0x7dd3fc, emissive: 0x0284c7, emissiveIntensity: 0.45, roughness: 0.22 });

  readonly brassMat = new THREE.MeshStandardMaterial({ color: 0xb8862d, metalness: 0.86, roughness: 0.28 });
  readonly ironPipeMat = new THREE.MeshStandardMaterial({ color: 0x374151, metalness: 0.75, roughness: 0.45 });

  readonly toxicCapMat = new THREE.MeshStandardMaterial({ color: 0x365314, roughness: 0.68, metalness: 0.08 });
  readonly toxicGlowMat = new THREE.MeshStandardMaterial({ color: 0xa3e635, emissive: 0x65a30d, emissiveIntensity: 0.8, roughness: 0.3 });
  readonly drumHazardMat = new THREE.MeshStandardMaterial({ color: 0xca8a04, roughness: 0.52, metalness: 0.45 });

  readonly solarMirrorMat = new THREE.MeshPhysicalMaterial({ color: 0xfbbf24, metalness: 0.92, roughness: 0.14, clearcoat: 0.8 });
  readonly solarCoreMat = new THREE.MeshStandardMaterial({ color: 0xfde047, emissive: 0xd97706, emissiveIntensity: 0.82, roughness: 0.25 });

  readonly quantumGlowMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x7c3aed, emissiveIntensity: 0.82, roughness: 0.25 });
  readonly quantumCubeMat = new THREE.MeshStandardMaterial({ color: 0x1e1b4b, metalness: 0.78, roughness: 0.3 });

  readonly eternalWhiteGoldMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.82, roughness: 0.2 });
  readonly eternalCyanMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.65, roughness: 0.25 });

  constructor() {
    // 1. Extruded toothed clockwork gear
    const gearShape = new THREE.Shape();
    const teeth = 12;
    const rIn = 1.65;
    const rOut = 2.1;
    for (let i = 0; i < teeth * 2; i++) {
      const a0 = (i / (teeth * 2)) * Math.PI * 2;
      const a1 = ((i + 0.55) / (teeth * 2)) * Math.PI * 2;
      const r = i % 2 === 0 ? rOut : rIn;
      const x0 = Math.cos(a0) * r;
      const y0 = Math.sin(a0) * r;
      const x1 = Math.cos(a1) * r;
      const y1 = Math.sin(a1) * r;
      if (i === 0) gearShape.moveTo(x0, y0);
      else gearShape.lineTo(x0, y0);
      gearShape.lineTo(x1, y1);
    }
    gearShape.closePath();
    const hole = new THREE.Path();
    hole.absarc(0, 0, 0.7, 0, Math.PI * 2, true);
    gearShape.holes.push(hole);
    this.gearGeo = new THREE.ExtrudeGeometry(gearShape, { depth: 0.42, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.04, bevelSegments: 2 });
    this.gearGeo.center();

    // 2. Curved organic sakura trunk
    this.sakuraTrunkGeo = new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(-0.35, 1.5, 0.15),
        new THREE.Vector3(0.25, 3.0, -0.1),
        new THREE.Vector3(0.55, 4.3, 0.18),
      ]),
      14,
      0.32,
      8,
      false
    );

    // 3. Curved Shinto Torii top kasagi beam (distinct upturned ends!)
    const kasagi = new THREE.Shape();
    kasagi.moveTo(-8.8, 0.45);
    kasagi.quadraticCurveTo(0, -0.15, 8.8, 0.45);
    kasagi.lineTo(8.5, 0.95);
    kasagi.quadraticCurveTo(0, 0.42, -8.5, 0.95);
    kasagi.closePath();
    this.toriiTopBeamGeo = new THREE.ExtrudeGeometry(kasagi, { depth: 0.72, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 2 });
    this.toriiTopBeamGeo.center();

    // 4. Rolling desert sand dune ridge
    const dune = new THREE.Shape();
    dune.moveTo(-7, 0);
    dune.quadraticCurveTo(-2.5, 3.8, 0.5, 2.4);
    dune.quadraticCurveTo(3.8, 1.0, 7, 0);
    dune.closePath();
    this.duneGeo = new THREE.ExtrudeGeometry(dune, { depth: 11, bevelEnabled: false });
    this.duneGeo.center();

    // 5. Realistic lunar impact crater basin (LatheGeometry)
    this.craterGeo = new THREE.LatheGeometry(
      [
        new THREE.Vector2(0.01, 0.05),
        new THREE.Vector2(2.6, 0.1),
        new THREE.Vector2(4.2, 0.65),
        new THREE.Vector2(4.9, 1.45),
        new THREE.Vector2(5.6, 1.25),
        new THREE.Vector2(6.9, 0.0),
      ],
      18
    );

    // 6. Giant mushroom stem & bulbous spotted cap (LatheGeometry)
    this.mushroomStemGeo = new THREE.LatheGeometry(
      [
        new THREE.Vector2(0.65, 0),
        new THREE.Vector2(0.45, 1.5),
        new THREE.Vector2(0.32, 3.2),
        new THREE.Vector2(0.48, 4.1),
      ],
      12
    );
    this.mushroomCapGeo = new THREE.LatheGeometry(
      [
        new THREE.Vector2(0.01, 2.1),
        new THREE.Vector2(1.4, 1.85),
        new THREE.Vector2(2.6, 1.0),
        new THREE.Vector2(2.85, 0.15),
        new THREE.Vector2(2.4, -0.05),
        new THREE.Vector2(0.45, 0.05),
      ],
      14
    );

    // 7. Branching coral antler
    this.coralBranchGeo = new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0.4, 1.8, 0.2),
        new THREE.Vector3(-0.3, 3.6, -0.2),
        new THREE.Vector3(0.5, 5.2, 0.3),
      ]),
      14,
      0.34,
      7,
      false
    );

    // 8. Jagged electric lightning arc
    this.lightningBoltGeo = new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(-0.9, 1.6, 0.4),
        new THREE.Vector3(0.8, 2.9, -0.3),
        new THREE.Vector3(-0.5, 4.4, 0.2),
        new THREE.Vector3(0.2, 5.8, 0),
      ]),
      10,
      0.11,
      5,
      false
    );

    // 9. Aurora curved sky ribbon
    this.auroraRibbonGeo = new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-18, 0, -6),
        new THREE.Vector3(-6, 4.5, 2),
        new THREE.Vector3(6, -1.5, -4),
        new THREE.Vector3(18, 3.5, 4),
      ]),
      24,
      0.85,
      4,
      false
    );

    // 10. Eternal Horizon sweeping arch ribbon
    this.eternalRibbonGeo = new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-9.5, 0, 0),
        new THREE.Vector3(-6.5, 7.2, -1.5),
        new THREE.Vector3(0, 9.6, 0),
        new THREE.Vector3(6.5, 7.2, 1.5),
        new THREE.Vector3(9.5, 0, 0),
      ]),
      28,
      0.28,
      8,
      false
    );

    // 11. Twisted thorny toxic vine
    this.toxicVineGeo = new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-8.5, 0, 0),
        new THREE.Vector3(-5.2, 5.2, 1.4),
        new THREE.Vector3(0, 8.2, -0.8),
        new THREE.Vector3(5.2, 5.4, -1.2),
        new THREE.Vector3(8.5, 0, 0),
      ]),
      24,
      0.26,
      7,
      false
    );
  }
}

let cachedBank: BiomeAssetBank | null = null;
function getBank(): BiomeAssetBank {
  if (!cachedBank) cachedBank = new BiomeAssetBank();
  return cachedBank;
}

// ---------- Builder Entry ----------

export function buildThemeChunkProps(
  theme: PropTheme,
  chunkIdx: number,
  len: number,
  mats: BiomeSharedMaterials
): BuiltThemeChunk {
  const bank = getBank();
  const ground = new THREE.Group();
  const sky = new THREE.Group();
  const space = new THREE.Group();
  const roadOverlay = new THREE.Group();

  const skyY = ALTITUDE_HEIGHTS.SKY;
  const spY = ALTITUDE_HEIGHTS.SPACE;

  let useUrbanGuardrails = false;
  let showRoadFissures = false;

  switch (theme) {
    // 1. VOLCANIC CALDERA: Sculpted cones, craters, hugging lava rivers, obsidian vents + magma road cracks
    case 'volcanic': {
      showRoadFissures = true;
      for (let v = 0; v < 2; v++) {
        const side = v === 0 ? -1 : 1;
        const vx = side * (17.5 + ((chunkIdx + v) % 2) * 3.5);
        const vz = (v - 0.5) * 26;
        const vh = 13 + ((chunkIdx * 5 + v * 7) % 8);
        const vRad = 9.5 + (v % 2) * 2.2;

        const cone = new THREE.Mesh(new THREE.CylinderGeometry(2.6, vRad, vh, 11), bank.basaltMat);
        cone.position.set(vx, vh * 0.5 - 0.2, vz);
        const rim = new THREE.Mesh(new THREE.TorusGeometry(2.45, 0.55, 8, 14), bank.basaltMat);
        rim.rotation.x = Math.PI / 2;
        rim.position.set(vx, vh - 0.1, vz);
        const pool = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.1, 0.3, 12), bank.magmaMat);
        pool.position.set(vx, vh - 0.25, vz);

        const xTop = vx - side * 2.3;
        const yTop = vh - 0.35;
        const xBot = vx - side * (vRad * 0.94);
        const yBot = 0.2;
        const ldx = xTop - xBot;
        const ldy = yTop - yBot;
        const river = new THREE.Mesh(new THREE.BoxGeometry(0.42, Math.hypot(ldx, ldy) * 0.92, 0.9), bank.magmaMat);
        river.position.set((xTop + xBot) * 0.5, (yTop + yBot) * 0.5, vz + 0.15);
        river.rotation.z = -Math.atan2(ldx, ldy);
        ground.add(cone, rim, pool, river);
      }
      // Jagged basalt curb boulders instead of modern metal rails
      for (let z = -len * 0.4; z <= len * 0.4; z += 12) {
        for (const side of [-1, 1]) {
          const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.75, 0), bank.basaltMat);
          rock.scale.set(1.2, 0.85, 1.5);
          rock.position.set(side * 7.5, 0.32, z);
          const ember = new THREE.Mesh(new THREE.SphereGeometry(0.18, 6, 5), bank.magmaMat);
          ember.position.set(side * 6.95, 0.22, z);
          roadOverlay.add(rock, ember);
        }
      }
      // Sky: Rising ash plumes & floating lava bombs
      for (let i = 0; i < 3; i++) {
        const side = i % 2 === 0 ? -1 : 1;
        const col = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 2.6, 16, 10), bank.ashMat);
        col.position.set(side * 13.5, skyY - 3, (i - 1) * 18);
        const ember = new THREE.Mesh(new THREE.DodecahedronGeometry(1.9, 1), bank.magmaMat);
        ember.position.set(side * 12, skyY + 3.2, (i - 1) * 18);
        sky.add(col, ember);
      }
      // Space: Molten cracked asteroids
      for (let s = 0; s < 3; s++) {
        const side = s % 2 === 0 ? -1 : 1;
        const mRock = new THREE.Mesh(new THREE.DodecahedronGeometry(2.6, 1), bank.basaltMat);
        mRock.position.set(side * (14 + s * 2), spY + (s - 1) * 3, (s - 1) * 18);
        const mCore = new THREE.Mesh(new THREE.OctahedronGeometry(2.2, 0), bank.magmaMat);
        mCore.position.copy(mRock.position);
        space.add(mRock, mCore);
      }
      break;
    }

    // 2. GOLDEN SKY METROPOLIS: Art-Deco gilded towers & arch viaducts (NO trees!)
    case 'metropolis': {
      useUrbanGuardrails = true;
      for (let p = 0; p < 6; p++) {
        const side = p % 2 === 0 ? -1 : 1;
        const row = Math.floor(p / 2);
        const bx = side * (row === 2 ? 23 : 13.8 + (p % 2) * 2.5);
        const bz = (row - 1) * 17;
        const h = 15 + ((chunkIdx * 5 + p * 6) % 20);
        const base = new THREE.Mesh(new THREE.BoxGeometry(5.2, 3.2, 5.2), bank.gildedMarbleMat);
        base.position.set(bx, 1.6, bz);
        const shaft = new THREE.Mesh(new THREE.BoxGeometry(4.0, h, 4.0), mats.buildingMat);
        shaft.position.set(bx, 3.2 + h * 0.5, bz);
        const crown = new THREE.Mesh(new THREE.BoxGeometry(3.0, 2.8, 3.0), bank.goldMat);
        crown.position.set(bx, 3.2 + h + 1.4, bz);
        const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.2, 4.5, 8), bank.goldMat);
        spire.position.set(bx, 3.2 + h + 5.0, bz);
        ground.add(base, shaft, crown, spire);
      }
      if (chunkIdx % 2 === 0) {
        const arch = new THREE.Mesh(new THREE.TorusGeometry(7.9, 0.34, 8, 24, Math.PI), bank.goldMat);
        arch.position.set(0, 0.2, -len * 0.25);
        ground.add(arch);
      }
      // Sky: Golden luxury dirigibles
      for (let i = 0; i < 2; i++) {
        const side = i === 0 ? -1 : 1;
        const hull = new THREE.Mesh(new THREE.SphereGeometry(1.6, 14, 10), bank.goldMat);
        hull.scale.set(1, 0.75, 2.8);
        hull.position.set(side * 12.5, skyY + 2.2, (i - 0.5) * 26);
        const gondola = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.5, 2.0), bank.gildedMarbleMat);
        gondola.position.set(side * 12.5, skyY + 0.8, (i - 0.5) * 26);
        sky.add(hull, gondola);
      }
      // Space: Gilded orbital docking rings
      for (let s = 0; s < 2; s++) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(8.2, 0.35, 8, 24), bank.goldMat);
        ring.position.set(0, spY + 1.5, (s - 0.5) * 28);
        space.add(ring);
      }
      break;
    }

    // 3. CYBER NEON DISTRICT: Futuristic neon towers + overhead cyber highway gantries (NO trees!)
    case 'cyber': {
      useUrbanGuardrails = true;
      for (let p = 0; p < 6; p++) {
        const side = p % 2 === 0 ? -1 : 1;
        const row = Math.floor(p / 2);
        const bx = side * (row === 2 ? 24 : 13.8 + (p % 2) * 2.5);
        const bz = (row - 1) * 17;
        const h = 14 + ((chunkIdx * 7 + p * 5) % 22);
        const bldg = new THREE.Mesh(new THREE.BoxGeometry(4.2, h, 4.4), mats.buildingMat);
        bldg.position.set(bx, h * 0.5, bz);
        const holoBand = new THREE.Mesh(new THREE.BoxGeometry(4.35, 0.35, 4.55), mats.accentBeaconMat);
        holoBand.position.set(bx, h * 0.72, bz);
        const sign = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3.6, 2.4), mats.accentBeaconMat);
        sign.position.set(bx - side * 2.3, 6.2, bz);
        ground.add(bldg, holoBand, sign);
      }
      if (chunkIdx % 2 === 0) {
        const colL = new THREE.Mesh(new THREE.BoxGeometry(0.32, 7.2, 0.42), mats.steelMat);
        colL.position.set(-7.7, 3.6, -len * 0.25);
        const colR = colL.clone();
        colR.position.x = 7.7;
        const truss = new THREE.Mesh(new THREE.BoxGeometry(15.8, 0.48, 0.52), mats.steelMat);
        truss.position.set(0, 7.1, -len * 0.25);
        const signTrim = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.14, 0.22), mats.accentBeaconMat);
        signTrim.position.set(0, 6.65, -len * 0.25 + 0.31);
        ground.add(colL, colR, truss, signTrim);
      }
      // Sky: Cyber skyway hover pylons
      for (let i = 0; i < 2; i++) {
        const side = i === 0 ? -1 : 1;
        const buoy = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.55, 4.2, 8), mats.steelMat);
        buoy.position.set(side * 9.8, skyY + 1.5, (i - 0.5) * 26);
        const cap = new THREE.Mesh(new THREE.OctahedronGeometry(0.65, 0), mats.accentBeaconMat);
        cap.position.set(side * 9.8, skyY + 4.0, (i - 0.5) * 26);
        sky.add(buoy, cap);
      }
      // Space: Cyber cube-satellites
      for (let s = 0; s < 2; s++) {
        const side = s === 0 ? -1 : 1;
        const sat = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.8, 2.4), mats.steelMat);
        sat.position.set(side * 13.5, spY + 2.5, (s - 0.5) * 24);
        const panel = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.12, 1.5), mats.accentBeaconMat);
        panel.position.copy(sat.position);
        space.add(sat, panel);
      }
      break;
    }

    // 4. CRYSTAL SANCTUARY: Hexagonal crystal geode clusters + crystal road fissures
    case 'crystal': {
      showRoadFissures = true;
      for (let c = 0; c < 6; c++) {
        const side = c % 2 === 0 ? -1 : 1;
        const cx = side * (11.5 + (c % 3) * 3.0);
        const cz = (c - 2.5) * 10;
        const ch = 6.5 + ((chunkIdx + c * 3) % 9);
        const geode = new THREE.Mesh(new THREE.DodecahedronGeometry(2.1, 0), bank.geodeMat);
        geode.scale.set(1.2, 0.65, 1.2);
        geode.position.set(cx, 0.5, cz);
        const shard1 = new THREE.Mesh(new THREE.ConeGeometry(1.2, ch, 6), bank.crystalMat);
        shard1.position.set(cx, ch * 0.48, cz);
        shard1.rotation.z = side * 0.16;
        const shard2 = new THREE.Mesh(new THREE.ConeGeometry(0.85, ch * 0.62, 6), bank.crystalMat);
        shard2.position.set(cx - side * 1.1, ch * 0.28, cz + 0.9);
        shard2.rotation.z = side * 0.36;
        ground.add(geode, shard1, shard2);
      }
      for (let z = -len * 0.35; z <= len * 0.35; z += 14) {
        for (const side of [-1, 1]) {
          const bollard = new THREE.Mesh(new THREE.OctahedronGeometry(0.45, 0), bank.crystalMat);
          bollard.scale.set(0.7, 2.2, 0.7);
          bollard.position.set(side * 7.2, 0.85, z);
          roadOverlay.add(bollard);
        }
      }
      for (let i = 0; i < 3; i++) {
        const side = i % 2 === 0 ? -1 : 1;
        const sp = new THREE.Mesh(new THREE.OctahedronGeometry(2.1, 0), bank.crystalMat);
        sp.scale.set(0.75, 2.3, 0.75);
        sp.position.set(side * 12.2, skyY + 1.2, (i - 1) * 18);
        sky.add(sp);
        const ast = sp.clone();
        ast.position.set(side * 14, spY + (i - 1) * 3, (i - 1) * 18);
        space.add(ast);
      }
      break;
    }

    // 5. AURORA GLACIER: Massive jagged icebergs, snowbanks & overhead Aurora Borealis sky curtains
    case 'glacier': {
      for (let g = 0; g < 4; g++) {
        const side = g % 2 === 0 ? -1 : 1;
        const gx = side * (13.8 + (g % 2) * 4.5);
        const gz = (g - 1.5) * 15;
        const berg = new THREE.Mesh(new THREE.ConeGeometry(4.5, 11 + (g % 3) * 3, 5), bank.iceMat);
        berg.position.set(gx, 4.8, gz);
        berg.rotation.y = g * 0.8;
        const drift = new THREE.Mesh(new THREE.DodecahedronGeometry(2.8, 0), bank.snowMat);
        drift.scale.set(1.6, 0.55, 2.2);
        drift.position.set(gx - side * 3.8, 0.6, gz);
        ground.add(berg, drift);
      }
      // Shimmering Aurora ribbons arching overhead
      const aur = new THREE.Mesh(bank.auroraRibbonGeo, bank.auroraMat);
      aur.position.set(0, 15.5, -len * 0.2);
      ground.add(aur);
      for (let z = -len * 0.4; z <= len * 0.4; z += 15) {
        for (const side of [-1, 1]) {
          const snowCurb = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.45, 5.2), bank.snowMat);
          snowCurb.position.set(side * 7.3, 0.22, z);
          roadOverlay.add(snowCurb);
        }
      }
      for (let i = 0; i < 3; i++) {
        const side = i % 2 === 0 ? -1 : 1;
        const shelf = new THREE.Mesh(new THREE.DodecahedronGeometry(2.6, 0), bank.iceMat);
        shelf.scale.set(1.5, 0.6, 1.5);
        shelf.position.set(side * 12.5, skyY + (i - 1) * 2.5, (i - 1) * 18);
        sky.add(shelf);
        const comet = new THREE.Mesh(new THREE.IcosahedronGeometry(2.2, 0), bank.iceMat);
        comet.position.set(side * 14, spY + (i - 1) * 3, (i - 1) * 18);
        space.add(comet);
      }
      break;
    }

    // 6. PYRAMID DESERT: Stepped sandstone pyramids, golden capstones, sand dunes & desert braziers (ONLY here!)
    case 'pyramid': {
      showRoadFissures = true;
      for (let a = 0; a < 2; a++) {
        const side = a === 0 ? -1 : 1;
        const ax = side * 20.5;
        const az = (a - 0.5) * 28;
        const step1 = new THREE.Mesh(new THREE.BoxGeometry(14, 3.2, 14), bank.sandstoneMat);
        step1.position.set(ax, 1.6, az);
        const step2 = new THREE.Mesh(new THREE.BoxGeometry(10.5, 3.0, 10.5), bank.sandstoneMat);
        step2.position.set(ax, 4.7, az);
        const pyrTop = new THREE.Mesh(new THREE.ConeGeometry(6.8, 7.6, 4), bank.sandstoneMat);
        pyrTop.rotation.y = Math.PI / 4;
        pyrTop.position.set(ax, 10.0, az);
        const capstone = new THREE.Mesh(new THREE.ConeGeometry(1.6, 1.8, 4), bank.goldMat);
        capstone.rotation.y = Math.PI / 4;
        capstone.position.set(ax, 13.0, az);
        ground.add(step1, step2, pyrTop, capstone);
      }
      // Sweeping low-profile desert sand dunes along shoulders
      for (let d = 0; d < 3; d++) {
        const side = d % 2 === 0 ? -1 : 1;
        const dune = new THREE.Mesh(new THREE.SphereGeometry(7.2, 16, 10), bank.sandDuneMat);
        dune.scale.set(1.75, 0.26, 1.45);
        dune.position.set(side * (16.5 + (d % 2) * 3.5), -0.45, (d - 1) * 18);
        ground.add(dune);
      }
      for (let z = -len * 0.35; z <= len * 0.35; z += 14) {
        for (const side of [-1, 1]) {
          const brazier = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.55, 1.4, 6), bank.sandstoneMat);
          brazier.position.set(side * 7.4, 0.7, z);
          const flame = new THREE.Mesh(new THREE.OctahedronGeometry(0.32, 0), bank.magmaMat);
          flame.position.set(side * 7.4, 1.55, z);
          roadOverlay.add(brazier, flame);
        }
      }
      for (let i = 0; i < 2; i++) {
        const side = i === 0 ? -1 : 1;
        const sunRing = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.25, 8, 20), bank.goldMat);
        sunRing.position.set(side * 12, skyY + 1.5, (i - 0.5) * 24);
        sky.add(sunRing);
        const orb = new THREE.Mesh(new THREE.OctahedronGeometry(2.4, 0), bank.goldMat);
        orb.position.set(side * 13.5, spY + 1.5, (i - 0.5) * 24);
        space.add(orb);
      }
      break;
    }

    // 7. SAKURA TORII: Curved sakura trees, upturned vermilion Torii gates, stone Toro lanterns & wood shrine rails (ONLY here!)
    case 'sakura': {
      for (let n = 0; n < 4; n++) {
        const side = n % 2 === 0 ? -1 : 1;
        const nx = side * (11.2 + (n % 2) * 3.4);
        const nz = (n - 1.5) * 14;
        const trunk = new THREE.Mesh(bank.sakuraTrunkGeo, bank.darkWoodMat);
        trunk.position.set(nx, 0, nz);
        trunk.rotation.y = side * 0.6;
        const puff1 = new THREE.Mesh(new THREE.DodecahedronGeometry(2.3, 1), bank.sakuraBlossomMat);
        puff1.scale.set(1.4, 0.68, 1.4);
        puff1.position.set(nx + side * 0.4, 4.5, nz);
        const puff2 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.7, 1), bank.sakuraBlossomMat);
        puff2.scale.set(1.3, 0.65, 1.3);
        puff2.position.set(nx - side * 0.9, 5.4, nz + 0.6);
        ground.add(trunk, puff1, puff2);
      }
      if (chunkIdx % 2 === 0) {
        // Authentic Shinto Torii raised high enough to frame cleanly above the elevated chase camera
        const tz = -len * 0.22;
        const postL = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.42, 9.6, 10), bank.toriiRedMat);
        postL.position.set(-7.8, 4.8, tz);
        const postR = postL.clone();
        postR.position.x = 7.8;
        const baseL = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.58, 1.0, 10), bank.darkWoodMat);
        baseL.position.set(-7.8, 0.5, tz);
        const baseR = baseL.clone();
        baseR.position.x = 7.8;
        const kasagi = new THREE.Mesh(bank.toriiTopBeamGeo, bank.toriiRedMat);
        kasagi.position.set(0, 9.9, tz);
        const nuki = new THREE.Mesh(new THREE.BoxGeometry(16.6, 0.34, 0.42), bank.toriiRedMat);
        nuki.position.set(0, 8.3, tz);
        const plaque = new THREE.Mesh(new THREE.BoxGeometry(0.76, 1.05, 0.44), bank.darkWoodMat);
        plaque.position.set(0, 9.05, tz);
        ground.add(postL, postR, baseL, baseR, kasagi, nuki, plaque);
      }
      // Stone Toro lanterns & fallen pink sakura petal drifts along shoulders
      for (let z = -len * 0.38; z <= len * 0.38; z += 14) {
        for (const side of [-1, 1]) {
          const post = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.26, 1.4, 6), bank.stoneLanternMat);
          post.position.set(side * 7.3, 0.7, z);
          const box = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.55, 0.55), bank.warmPaperMat);
          box.position.set(side * 7.3, 1.65, z);
          const roof = new THREE.Mesh(new THREE.ConeGeometry(0.68, 0.48, 4), bank.stoneLanternMat);
          roof.rotation.y = Math.PI / 4;
          roof.position.set(side * 7.3, 2.15, z);
          const petalPatch = new THREE.Mesh(new THREE.CircleGeometry(1.4, 8), bank.sakuraBlossomMat);
          petalPatch.rotation.x = -Math.PI / 2;
          petalPatch.position.set(side * 9.5, 0.03, z + 3.5);
          roadOverlay.add(post, box, roof, petalPatch);
        }
      }
      // Sky: Floating shrine islands with miniature Torii & warm sky lanterns
      for (let i = 0; i < 2; i++) {
        const side = i === 0 ? -1 : 1;
        const ix = side * 13.5;
        const iz = (i - 0.5) * 25;
        const island = new THREE.Mesh(new THREE.ConeGeometry(3.4, 4.2, 7), bank.stoneLanternMat);
        island.rotation.x = Math.PI;
        island.position.set(ix, skyY - 2.2, iz);
        const tree = new THREE.Mesh(new THREE.DodecahedronGeometry(2.1, 1), bank.sakuraBlossomMat);
        tree.scale.set(1.3, 0.75, 1.3);
        tree.position.set(ix, skyY + 0.8, iz);
        const lantern = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.85, 8), bank.warmPaperMat);
        lantern.position.set(ix - side * 2.5, skyY + 2.8, iz);
        sky.add(island, tree, lantern);
        const petalRing = new THREE.Mesh(new THREE.TorusGeometry(2.4, 0.25, 8, 18), bank.sakuraBlossomMat);
        petalRing.position.set(ix, spY + 1.5, iz);
        space.add(petalRing);
      }
      break;
    }

    // 8. EMERALD FOREST: Towering tiered redwood conifers, mossy boulders, hollow logs & timber fences (NO blossom trees or Torii!)
    case 'forest': {
      for (let f = 0; f < 5; f++) {
        const side = f % 2 === 0 ? -1 : 1;
        const fx = side * (11.2 + (f % 3) * 3.0);
        const fz = (f - 2) * 11;
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.55, 4.4, 8), bank.pineBarkMat);
        trunk.position.set(fx, 2.2, fz);
        const b1 = new THREE.Mesh(new THREE.ConeGeometry(2.4, 3.2, 9), bank.pineNeedleMat);
        b1.position.set(fx, 4.6, fz);
        const b2 = new THREE.Mesh(new THREE.ConeGeometry(1.9, 2.8, 9), bank.pineNeedleMat);
        b2.position.set(fx, 6.4, fz);
        const b3 = new THREE.Mesh(new THREE.ConeGeometry(1.3, 2.4, 9), bank.pineNeedleMat);
        b3.position.set(fx, 8.0, fz);
        const boulder = new THREE.Mesh(new THREE.DodecahedronGeometry(1.1, 0), bank.mossMat);
        boulder.scale.set(1.3, 0.65, 1.1);
        boulder.position.set(fx - side * 1.4, 0.45, fz + 1.1);
        ground.add(trunk, b1, b2, b3, boulder);
      }
      // Wooden timber log fence rails along the road
      const railL = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, len, 7), bank.pineBarkMat);
      railL.rotation.x = Math.PI / 2;
      railL.position.set(-7.15, 0.72, 0);
      const railR = railL.clone();
      railR.position.x = 7.15;
      roadOverlay.add(railL, railR);
      for (let z = -len * 0.4; z <= len * 0.4; z += 14) {
        for (const side of [-1, 1]) {
          const post = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 1.1, 7), bank.pineBarkMat);
          post.position.set(side * 7.15, 0.55, z);
          roadOverlay.add(post);
        }
      }
      for (let i = 0; i < 3; i++) {
        const side = i % 2 === 0 ? -1 : 1;
        const orb = new THREE.Mesh(new THREE.SphereGeometry(1.8, 10, 8), bank.mossMat);
        orb.position.set(side * 12.8, skyY + (i - 1) * 2.5, (i - 1) * 18);
        sky.add(orb);
        const pod = orb.clone();
        pod.position.set(side * 14, spY + (i - 1) * 3, (i - 1) * 18);
        space.add(pod);
      }
      break;
    }

    // 9. ABYSSAL OCEAN: Coral reefs, giant pearl clamshells, sunken arches, water flanks + Sky Jellyfish (ZERO trees!)
    case 'ocean': {
      // Translucent ocean flanks beside the causeway
      const waterL = new THREE.Mesh(new THREE.PlaneGeometry(80, len), bank.waterMat);
      waterL.rotation.x = -Math.PI / 2;
      waterL.position.set(-48, 0.14, 0);
      const waterR = waterL.clone();
      waterR.position.x = 48;
      ground.add(waterL, waterR);

      for (let o = 0; o < 4; o++) {
        const side = o % 2 === 0 ? -1 : 1;
        const ox = side * (11.5 + (o % 2) * 4.2);
        const oz = (o - 1.5) * 14;
        const coralMat = o % 2 === 0 ? bank.coralOrangeMat : bank.coralTealMat;
        const reefBase = new THREE.Mesh(new THREE.DodecahedronGeometry(1.5, 0), bank.stoneLanternMat);
        reefBase.scale.set(1.4, 0.45, 1.3);
        reefBase.position.set(ox, 0.25, oz);
        const c1 = new THREE.Mesh(bank.coralBranchGeo, coralMat);
        c1.position.set(ox, 0.2, oz);
        c1.rotation.set(0.12, o * 1.1, 0.18);
        const c2 = new THREE.Mesh(bank.coralBranchGeo, coralMat);
        c2.scale.setScalar(0.78);
        c2.position.set(ox - side * 0.6, 0.2, oz + 0.5);
        c2.rotation.set(-0.2, o * 1.1 + 1.8, -0.32);
        const c3 = new THREE.Mesh(bank.coralBranchGeo, o % 2 === 0 ? bank.coralTealMat : bank.coralOrangeMat);
        c3.scale.setScalar(0.65);
        c3.position.set(ox + side * 0.7, 0.2, oz - 0.4);
        c3.rotation.set(0.24, o * 1.1 + 3.4, 0.28);

        const shellLow = new THREE.Mesh(
          new THREE.SphereGeometry(1.35, 12, 8, 0, Math.PI * 2, Math.PI * 0.5, Math.PI * 0.5),
          bank.stoneLanternMat
        );
        shellLow.position.set(ox - side * 2.4, 0.95, oz + 2.5);
        const shellTop = new THREE.Mesh(
          new THREE.SphereGeometry(1.32, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.5),
          bank.stoneLanternMat
        );
        shellTop.rotation.x = -0.78;
        shellTop.position.set(ox - side * 2.4, 0.95, oz + 1.7);
        const pearl = new THREE.Mesh(new THREE.SphereGeometry(0.44, 10, 8), bank.pearlMat);
        pearl.position.set(ox - side * 2.4, 0.75, oz + 2.5);
        ground.add(reefBase, c1, c2, c3, shellLow, shellTop, pearl);
      }
      for (let z = -len * 0.38; z <= len * 0.38; z += 14) {
        for (const side of [-1, 1]) {
          const anemone = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.42, 0.9, 8), bank.coralTealMat);
          anemone.position.set(side * 7.2, 0.45, z);
          const glow = new THREE.Mesh(new THREE.SphereGeometry(0.32, 8, 6), bank.pearlMat);
          glow.position.set(side * 7.2, 1.05, z);
          roadOverlay.add(anemone, glow);
        }
      }
      // Sky: Bioluminescent jellyfish domes
      for (let i = 0; i < 3; i++) {
        const side = i % 2 === 0 ? -1 : 1;
        const jx = side * 12.2;
        const jz = (i - 1) * 18;
        const bell = new THREE.Mesh(new THREE.SphereGeometry(2.1, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), bank.pearlMat);
        bell.position.set(jx, skyY + 2.0, jz);
        const tent = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.05, 4.2, 6), bank.coralTealMat);
        tent.position.set(jx, skyY - 0.5, jz);
        sky.add(bell, tent);
        const bubble = new THREE.Mesh(new THREE.SphereGeometry(2.4, 14, 10), bank.waterMat);
        bubble.position.set(side * 14, spY + (i - 1) * 3, jz);
        space.add(bubble);
      }
      break;
    }

    // 10. THUNDERSTORM REALM: Copper Tesla coils, jagged lightning arcs & storm-rod pylons
    case 'storm': {
      showRoadFissures = true;
      for (let t = 0; t < 4; t++) {
        const side = t % 2 === 0 ? -1 : 1;
        const tx = side * (12.0 + (t % 2) * 3.5);
        const tz = (t - 1.5) * 14;
        const base = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 2.0, 2.0, 8), mats.steelMat);
        base.position.set(tx, 1.0, tz);
        const coil = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.95, 6.4, 12), bank.copperMat);
        coil.position.set(tx, 5.2, tz);
        const toroid = new THREE.Mesh(new THREE.TorusGeometry(1.85, 0.45, 10, 20), mats.steelMat);
        toroid.rotation.x = Math.PI / 2;
        toroid.position.set(tx, 8.7, tz);
        const arc = new THREE.Mesh(bank.lightningBoltGeo, bank.lightningMat);
        arc.position.set(tx, 8.8, tz);
        ground.add(base, coil, toroid, arc);
      }
      for (let z = -len * 0.38; z <= len * 0.38; z += 14) {
        for (const side of [-1, 1]) {
          const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 2.4, 8), mats.steelMat);
          rod.position.set(side * 7.3, 1.2, z);
          const tip = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 6), bank.lightningMat);
          tip.position.set(side * 7.3, 2.5, z);
          roadOverlay.add(rod, tip);
        }
      }
      for (let i = 0; i < 3; i++) {
        const side = i % 2 === 0 ? -1 : 1;
        const cap = new THREE.Mesh(new THREE.TorusGeometry(2.8, 0.3, 8, 18), bank.copperMat);
        cap.position.set(side * 12, skyY + 1.5, (i - 1) * 18);
        const bolt = new THREE.Mesh(bank.lightningBoltGeo, bank.lightningMat);
        bolt.position.set(side * 12, skyY - 1.5, (i - 1) * 18);
        sky.add(cap, bolt);
        const ring = cap.clone();
        ring.position.set(side * 14, spY + (i - 1) * 3, (i - 1) * 18);
        space.add(ring);
      }
      break;
    }

    // 11. CELESTIAL RUINS: Broken fluted marble temple columns & ruined aqueduct arches (NO pyramids!)
    case 'ruins': {
      showRoadFissures = true;
      for (let r = 0; r < 4; r++) {
        const side = r % 2 === 0 ? -1 : 1;
        const rx = side * 11.5;
        const rz = (r - 1.5) * 14;
        const plinth = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.7, 2.2), bank.marbleTrimMat);
        plinth.position.set(rx, 0.35, rz);
        const colH = r % 2 === 0 ? 7.2 : 4.5;
        const col = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.76, colH, 12), bank.marbleMat);
        col.position.set(rx, 0.7 + colH * 0.5, rz);
        ground.add(plinth, col);
        if (r % 2 === 0) {
          const cap = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.55, 2.1), bank.marbleTrimMat);
          cap.position.set(rx, 0.7 + colH + 0.25, rz);
          ground.add(cap);
        }
      }
      if (chunkIdx % 2 === 0) {
        const arch = new THREE.Mesh(new THREE.TorusGeometry(8.1, 0.48, 8, 22, Math.PI), bank.marbleMat);
        arch.position.set(0, 0.4, -len * 0.2);
        ground.add(arch);
      }
      for (let z = -len * 0.38; z <= len * 0.38; z += 14) {
        for (const side of [-1, 1]) {
          const stone = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.35, 0.55), bank.marbleMat);
          stone.position.set(side * 7.2, 0.68, z);
          const rune = new THREE.Mesh(new THREE.OctahedronGeometry(0.24, 0), mats.accentBeaconMat);
          rune.position.set(side * 7.2, 1.65, z);
          roadOverlay.add(stone, rune);
        }
      }
      for (let i = 0; i < 2; i++) {
        const side = i === 0 ? -1 : 1;
        const ob = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.95, 7.0, 12), bank.marbleMat);
        ob.position.set(side * 11.5, skyY + 1.0, (i - 0.5) * 24);
        sky.add(ob);
        const ring = new THREE.Mesh(new THREE.TorusGeometry(7.2, 0.35, 8, 24), bank.marbleMat);
        ring.position.set(0, spY + 1.5, (i - 0.5) * 26);
        space.add(ring);
      }
      break;
    }

    // 12. MAGNETIC WASTELAND: Giant U-shaped electromagnets & floating magnetized ore
    case 'magnetic': {
      showRoadFissures = true;
      for (let m = 0; m < 4; m++) {
        const side = m % 2 === 0 ? -1 : 1;
        const mx = side * (12.8 + (m % 2) * 3.5);
        const mz = (m - 1.5) * 14;
        const arch = new THREE.Mesh(new THREE.TorusGeometry(2.4, 0.68, 10, 20, Math.PI), bank.magnetRedMat);
        arch.position.set(mx, 4.8, mz);
        const leg1 = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.68, 4.8, 12), bank.magnetSilverMat);
        leg1.position.set(mx - 2.4, 2.4, mz);
        const leg2 = leg1.clone();
        leg2.position.x = mx + 2.4;
        const floatOre = new THREE.Mesh(new THREE.DodecahedronGeometry(1.15, 0), bank.fluxMat);
        floatOre.position.set(mx, 9.2, mz);
        ground.add(arch, leg1, leg2, floatOre);
      }
      for (let i = 0; i < 3; i++) {
        const side = i % 2 === 0 ? -1 : 1;
        const mag = new THREE.Mesh(new THREE.TorusGeometry(2.5, 0.45, 8, 18, Math.PI), bank.magnetRedMat);
        mag.position.set(side * 12, skyY + 1.8, (i - 1) * 18);
        sky.add(mag);
        const coil = new THREE.Mesh(new THREE.TorusGeometry(3.2, 0.35, 8, 20), bank.magnetSilverMat);
        coil.position.set(side * 14, spY + (i - 1) * 3, (i - 1) * 18);
        space.add(coil);
      }
      break;
    }

    // 13. CRIMSON NEBULA: Crimson spire-reefs & swirling glowing gas rings (NO gears!)
    case 'nebula': {
      for (let n = 0; n < 4; n++) {
        const side = n % 2 === 0 ? -1 : 1;
        const nx = side * (13.0 + (n % 2) * 4.0);
        const nz = (n - 1.5) * 14;
        const spire = new THREE.Mesh(new THREE.ConeGeometry(2.2, 9.5, 7), bank.nebulaRockMat);
        spire.position.set(nx, 4.5, nz);
        const halo = new THREE.Mesh(new THREE.TorusGeometry(2.8, 0.35, 8, 22), bank.nebulaCrimsonMat);
        halo.rotation.x = Math.PI * 0.35;
        halo.position.set(nx, 8.0, nz);
        ground.add(spire, halo);
      }
      for (let i = 0; i < 3; i++) {
        const side = i % 2 === 0 ? -1 : 1;
        const gas = new THREE.Mesh(new THREE.DodecahedronGeometry(2.8, 1), bank.nebulaCrimsonMat);
        gas.position.set(side * 13, skyY + (i - 1) * 2.4, (i - 1) * 18);
        sky.add(gas);
        const disk = new THREE.Mesh(new THREE.TorusGeometry(4.2, 0.45, 8, 24), bank.nebulaCrimsonMat);
        disk.position.set(side * 14, spY + (i - 1) * 3, (i - 1) * 18);
        space.add(disk);
      }
      break;
    }

    // 14. LUNAR FRONTIER: Impact craters, Apollo geodesic habitat domes & radar dishes (NO gears!)
    case 'lunar': {
      for (let l = 0; l < 3; l++) {
        const side = l % 2 === 0 ? -1 : 1;
        const lx = side * (16.5 + (l % 2) * 4.0);
        const lz = (l - 1) * 18;
        const crater = new THREE.Mesh(bank.craterGeo, bank.lunarRegolithMat);
        crater.position.set(lx, 0, lz);
        ground.add(crater);
        if (l === 1) {
          const dome = new THREE.Mesh(new THREE.SphereGeometry(3.2, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.5), bank.lunarDomeMat);
          dome.position.set(-side * 13.5, 0, lz);
          const airlock = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.4, 2.2), mats.steelMat);
          airlock.position.set(-side * 10.6, 0.7, lz);
          const dish = new THREE.Mesh(new THREE.SphereGeometry(1.6, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.45), bank.lunarDomeMat);
          dish.rotation.z = side * 0.6;
          dish.position.set(-side * 13.5, 4.2, lz);
          ground.add(dome, airlock, dish);
        }
      }
      for (let z = -len * 0.38; z <= len * 0.38; z += 14) {
        for (const side of [-1, 1]) {
          const pylon = new THREE.Mesh(new THREE.ConeGeometry(0.25, 1.2, 8), bank.lunarDomeMat);
          pylon.position.set(side * 7.2, 0.6, z);
          const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.16, 6, 5), mats.accentBeaconMat);
          beacon.position.set(side * 7.2, 1.3, z);
          roadOverlay.add(pylon, beacon);
        }
      }
      for (let i = 0; i < 2; i++) {
        const side = i === 0 ? -1 : 1;
        const mod = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 4.5, 12), bank.lunarDomeMat);
        mod.rotation.z = Math.PI / 2;
        mod.position.set(side * 12, skyY + 1.5, (i - 0.5) * 24);
        sky.add(mod);
        const moon = new THREE.Mesh(bank.craterGeo, bank.lunarRegolithMat);
        moon.scale.setScalar(0.75);
        moon.position.set(side * 15, spY + 1.0, (i - 0.5) * 24);
        space.add(moon);
      }
      break;
    }

    // 15. FROZEN CITADEL: Gothic ice-fortress crenellated battlements & pointed frost arches
    case 'citadel': {
      for (let c = 0; c < 4; c++) {
        const side = c % 2 === 0 ? -1 : 1;
        const cx = side * 12.2;
        const cz = (c - 1.5) * 14;
        const keep = new THREE.Mesh(new THREE.BoxGeometry(3.4, 10.5, 3.4), bank.citadelIceStoneMat);
        keep.position.set(cx, 5.25, cz);
        const spire = new THREE.Mesh(new THREE.ConeGeometry(2.5, 4.2, 4), bank.citadelFrostMat);
        spire.rotation.y = Math.PI / 4;
        spire.position.set(cx, 12.6, cz);
        const slit = new THREE.Mesh(new THREE.BoxGeometry(0.24, 3.2, 0.6), bank.citadelFrostMat);
        slit.position.set(cx - side * 1.72, 6.2, cz);
        ground.add(keep, spire, slit);
      }
      if (chunkIdx % 2 === 0) {
        const wallL = new THREE.Mesh(new THREE.BoxGeometry(1.4, 8.2, 1.6), bank.citadelIceStoneMat);
        wallL.position.set(-7.7, 4.1, -len * 0.2);
        const wallR = wallL.clone();
        wallR.position.x = 7.7;
        const bridge = new THREE.Mesh(new THREE.BoxGeometry(16.8, 1.4, 1.6), bank.citadelIceStoneMat);
        bridge.position.set(0, 7.9, -len * 0.2);
        const trim = new THREE.Mesh(new THREE.BoxGeometry(16.9, 0.25, 1.7), bank.citadelFrostMat);
        trim.position.set(0, 8.65, -len * 0.2);
        ground.add(wallL, wallR, bridge, trim);
      }
      for (let i = 0; i < 2; i++) {
        const side = i === 0 ? -1 : 1;
        const bastion = new THREE.Mesh(new THREE.BoxGeometry(2.6, 4.5, 2.6), bank.citadelIceStoneMat);
        bastion.position.set(side * 12, skyY + 1.5, (i - 0.5) * 24);
        sky.add(bastion);
        const turret = bastion.clone();
        turret.position.set(side * 14, spY + 1.5, (i - 0.5) * 24);
        space.add(turret);
      }
      break;
    }

    // 16. ANCIENT MACHINE WORLD: Extruded toothed brass clockwork gears & piston smokestacks
    case 'machine': {
      for (let m = 0; m < 4; m++) {
        const side = m % 2 === 0 ? -1 : 1;
        const mx = side * (12.8 + (m % 2) * 3.8);
        const mz = (m - 1.5) * 14;
        const frame = new THREE.Mesh(new THREE.BoxGeometry(1.6, 8.2, 2.2), bank.ironPipeMat);
        frame.position.set(mx, 4.1, mz);
        const gear = new THREE.Mesh(bank.gearGeo, bank.brassMat);
        gear.scale.setScalar(1.35);
        gear.rotation.y = Math.PI / 2;
        gear.rotation.z = m * 0.35;
        gear.position.set(mx - side * 0.9, 6.2, mz);
        const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.95, 10.5, 10), bank.brassMat);
        stack.position.set(mx + side * 1.4, 5.25, mz + 1.4);
        ground.add(frame, gear, stack);
      }
      // Riveted iron pipe guardrails
      const pipeL = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, len, 8), bank.brassMat);
      pipeL.rotation.x = Math.PI / 2;
      pipeL.position.set(-7.15, 0.65, 0);
      const pipeR = pipeL.clone();
      pipeR.position.x = 7.15;
      roadOverlay.add(pipeL, pipeR);
      for (let i = 0; i < 2; i++) {
        const side = i === 0 ? -1 : 1;
        const skyGear = new THREE.Mesh(bank.gearGeo, bank.brassMat);
        skyGear.scale.setScalar(1.6);
        skyGear.position.set(side * 12, skyY + 1.5, (i - 0.5) * 24);
        sky.add(skyGear);
        const spGear = skyGear.clone();
        spGear.scale.setScalar(2.4);
        spGear.position.set(0, spY + 1.5, (i - 0.5) * 26);
        space.add(spGear);
      }
      break;
    }

    // 17. TOXIC JUNGLE: Giant spotted glowing mushrooms, bubbling lime acid pools & thorny vines (NO trees!)
    case 'toxic': {
      for (let t = 0; t < 4; t++) {
        const side = t % 2 === 0 ? -1 : 1;
        const tx = side * (11.8 + (t % 2) * 3.4);
        const tz = (t - 1.5) * 14;
        const stem = new THREE.Mesh(bank.mushroomStemGeo, bank.stoneLanternMat);
        stem.position.set(tx, 0, tz);
        const cap = new THREE.Mesh(bank.mushroomCapGeo, bank.toxicCapMat);
        cap.position.set(tx, 3.8, tz);
        const spot1 = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 6), bank.toxicGlowMat);
        spot1.position.set(tx - side * 1.2, 5.1, tz + 0.8);
        const spot2 = spot1.clone();
        spot2.position.set(tx + side * 0.8, 5.4, tz - 0.9);
        const pool = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 0.08, 14), bank.toxicGlowMat);
        pool.position.set(tx - side * 1.8, 0.04, tz + 2.5);
        ground.add(stem, cap, spot1, spot2, pool);
      }
      if (chunkIdx % 2 === 0) {
        const vine = new THREE.Mesh(bank.toxicVineGeo, bank.toxicCapMat);
        vine.position.set(0, 0, -len * 0.2);
        ground.add(vine);
      }
      for (let z = -len * 0.35; z <= len * 0.35; z += 14) {
        for (const side of [-1, 1]) {
          const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 1.15, 10), bank.drumHazardMat);
          drum.position.set(side * 7.3, 0.58, z);
          roadOverlay.add(drum);
        }
      }
      for (let i = 0; i < 3; i++) {
        const side = i % 2 === 0 ? -1 : 1;
        const spore = new THREE.Mesh(new THREE.DodecahedronGeometry(2.0, 1), bank.toxicGlowMat);
        spore.position.set(side * 12.5, skyY + (i - 1) * 2.4, (i - 1) * 18);
        sky.add(spore);
        const ast = spore.clone();
        ast.position.set(side * 14, spY + (i - 1) * 3, (i - 1) * 18);
        space.add(ast);
      }
      break;
    }

    // 18. SOLAR KINGDOM: Golden sun-temple obelisks, heliostat wing mirrors & radiant solar rings (NO volcanoes!)
    case 'solar': {
      for (let s = 0; s < 4; s++) {
        const side = s % 2 === 0 ? -1 : 1;
        const sx = side * (12.2 + (s % 2) * 3.5);
        const sz = (s - 1.5) * 14;
        const ob = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 1.3, 9.2, 4), bank.solarMirrorMat);
        ob.rotation.y = Math.PI / 4;
        ob.position.set(sx, 4.6, sz);
        const sunWheel = new THREE.Mesh(new THREE.TorusGeometry(2.1, 0.22, 8, 20), bank.solarCoreMat);
        sunWheel.position.set(sx, 10.6, sz);
        const mirrorL = new THREE.Mesh(new THREE.BoxGeometry(2.6, 3.6, 0.14), bank.solarMirrorMat);
        mirrorL.rotation.y = side * 0.45;
        mirrorL.position.set(sx - side * 2.4, 2.5, sz);
        ground.add(ob, sunWheel, mirrorL);
      }
      if (chunkIdx % 2 === 0) {
        const gate = new THREE.Mesh(new THREE.TorusGeometry(8.2, 0.3, 8, 28, Math.PI), bank.solarCoreMat);
        gate.position.set(0, 0.2, -len * 0.22);
        ground.add(gate);
      }
      for (let i = 0; i < 2; i++) {
        const side = i === 0 ? -1 : 1;
        const sail = new THREE.Mesh(new THREE.BoxGeometry(5.5, 2.8, 0.14), bank.solarMirrorMat);
        sail.rotation.z = side * 0.3;
        sail.position.set(side * 12.5, skyY + 1.5, (i - 0.5) * 24);
        sky.add(sail);
        const dyson = new THREE.Mesh(new THREE.TorusGeometry(8.5, 0.35, 8, 28), bank.solarCoreMat);
        dyson.position.set(0, spY + 1.5, (i - 0.5) * 26);
        space.add(dyson);
      }
      break;
    }

    // 19. QUANTUM RIFT: Fractured spacetime cubes, inner energy cores, hyper-portal rings & glowing quantum road fissures
    case 'quantum': {
      showRoadFissures = true;
      for (let q = 0; q < 4; q++) {
        const side = q % 2 === 0 ? -1 : 1;
        const qx = side * (12.2 + (q % 2) * 3.8);
        const qz = (q - 1.5) * 14;
        const cube1 = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.2, 2.2), bank.quantumCubeMat);
        cube1.rotation.set(0.4, q * 0.6, 0.3);
        cube1.position.set(qx, 3.2, qz);
        const core = new THREE.Mesh(new THREE.OctahedronGeometry(1.25, 0), bank.quantumGlowMat);
        core.position.set(qx, 6.8, qz);
        const ring = new THREE.Mesh(new THREE.TorusGeometry(2.4, 0.15, 8, 20), bank.quantumGlowMat);
        ring.rotation.set(0.4, side * 0.5, 0.2);
        ring.position.set(qx, 6.8, qz);
        const gridStrip = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.04, 8), bank.quantumGlowMat);
        gridStrip.position.set(side * 8.2, 0.03, qz);
        ground.add(cube1, core, ring, gridStrip);
      }
      if (chunkIdx % 2 === 0) {
        const arch1 = new THREE.Mesh(new THREE.TorusGeometry(8.8, 0.26, 8, 28, Math.PI), bank.quantumGlowMat);
        arch1.position.set(0, 0.4, -len * 0.2);
        const arch2 = new THREE.Mesh(new THREE.TorusGeometry(8.1, 0.14, 8, 28, Math.PI), mats.accentBeaconMat);
        arch2.position.set(0, 0.4, -len * 0.2);
        ground.add(arch1, arch2);
      }
      for (let i = 0; i < 3; i++) {
        const side = i % 2 === 0 ? -1 : 1;
        const tFrame = new THREE.Mesh(new THREE.TorusGeometry(3.4, 0.22, 8, 22), bank.quantumGlowMat);
        tFrame.position.set(side * 11.5, skyY + 1.5, (i - 1) * 18);
        tFrame.rotation.set(0.4, side * 0.7, 0.3);
        sky.add(tFrame);
        const warp = new THREE.Mesh(new THREE.TorusGeometry(7.5, 0.28, 8, 28), bank.quantumGlowMat);
        warp.position.set(0, spY + 1.5, (i - 1) * 22);
        warp.rotation.z = i * 0.45;
        space.add(warp);
      }
      break;
    }

    // 20. ETERNAL HORIZON: Sweeping minimalist infinity ribbon arches & giant celestial astrolabe gyroscopes
    case 'eternal': {
      showRoadFissures = true;
      for (let e = 0; e < 2; e++) {
        const side = e === 0 ? -1 : 1;
        const ex = side * 14.5;
        const ez = (e - 0.5) * 26;
        const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 11.5, 12), bank.eternalWhiteGoldMat);
        pillar.position.set(ex, 5.75, ez);
        const astroOuter = new THREE.Mesh(new THREE.TorusGeometry(3.2, 0.16, 8, 28), bank.eternalWhiteGoldMat);
        astroOuter.position.set(ex, 11.8, ez);
        const astroInner = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.14, 8, 24), bank.eternalCyanMat);
        astroInner.rotation.y = Math.PI / 3;
        astroInner.position.set(ex, 11.8, ez);
        ground.add(pillar, astroOuter, astroInner);
      }
      if (chunkIdx % 2 === 0) {
        const ribbon = new THREE.Mesh(bank.eternalRibbonGeo, bank.eternalWhiteGoldMat);
        ribbon.position.set(0, 0, -len * 0.22);
        ground.add(ribbon);
      }
      for (let i = 0; i < 2; i++) {
        const halo = new THREE.Mesh(new THREE.TorusGeometry(7.8, 0.24, 8, 28), bank.eternalCyanMat);
        halo.position.set(0, skyY + 1.5, (i - 0.5) * 28);
        sky.add(halo);
        const grand = new THREE.Mesh(new THREE.TorusGeometry(9.0, 0.3, 8, 32), bank.eternalWhiteGoldMat);
        grand.position.set(0, spY + 1.5, (i - 0.5) * 28);
        space.add(grand);
      }
      break;
    }
  }

  return {
    ground,
    sky,
    space,
    roadOverlay,
    useUrbanGuardrails,
    showRoadFissures,
  };
}
