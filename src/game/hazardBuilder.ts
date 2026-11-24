import * as THREE from 'three';
import { AltitudeLayer, ObstacleKind } from './types';

export interface HazardVisualState {
  visualX: number;
  visualY: number;
  eruptProgress: number;
  eruptStartX: number;
  eruptStartY: number;
  eruptTargetX: number;
  eruptTargetY: number;
  movePhase: number;
  altitude: AltitudeLayer;
  kind: ObstacleKind;
  mesh: THREE.Group;
  hazardGroups: Map<ObstacleKind, THREE.Group>;
}

class HazardAssetBank {
  readonly katanaArcGeo: THREE.ExtrudeGeometry;
  readonly gearSawGeo: THREE.ExtrudeGeometry;
  readonly tidalWaveGeo: THREE.ExtrudeGeometry;
  readonly lightningGeo: THREE.TubeGeometry;

  // Shared PBR hazard materials (calibrated roughness/metalness)
  readonly goldMat = new THREE.MeshStandardMaterial({ color: 0xeab308, metalness: 0.85, roughness: 0.25 });
  readonly marbleDarkMat = new THREE.MeshStandardMaterial({ color: 0x332d40, roughness: 0.55, metalness: 0.35 });
  readonly cyberBodyMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.78, roughness: 0.3 });
  readonly cyberNeonMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.95 });
  readonly cyberVisorMat = new THREE.MeshStandardMaterial({ color: 0xf43f5e, emissive: 0xe11d48, emissiveIntensity: 0.9 });

  readonly crystalMat = new THREE.MeshPhysicalMaterial({ color: 0xc084fc, emissive: 0x7e22ce, emissiveIntensity: 0.55, roughness: 0.16, clearcoat: 0.9 });
  readonly iceMat = new THREE.MeshPhysicalMaterial({ color: 0x67e8f9, emissive: 0x0e7490, emissiveIntensity: 0.35, roughness: 0.18, clearcoat: 0.95 });
  readonly sandstoneMat = new THREE.MeshStandardMaterial({ color: 0xb4864b, roughness: 0.88, metalness: 0.05 });

  readonly katanaBladeMat = new THREE.MeshStandardMaterial({ color: 0xf472b6, emissive: 0xe11d48, emissiveIntensity: 0.9, metalness: 0.65, roughness: 0.2 });
  readonly katanaHiltMat = new THREE.MeshStandardMaterial({ color: 0x2a181e, roughness: 0.85 });
  readonly sakuraPetalMat = new THREE.MeshStandardMaterial({ color: 0xf9a8d4, emissive: 0xdb2777, emissiveIntensity: 0.45, roughness: 0.6 });

  readonly barkMat = new THREE.MeshStandardMaterial({ color: 0x4a2e1b, roughness: 0.92, metalness: 0.03 });
  readonly pineMat = new THREE.MeshStandardMaterial({ color: 0x155e42, roughness: 0.85, metalness: 0.04 });

  readonly waveBodyMat = new THREE.MeshPhysicalMaterial({ color: 0x0284c7, emissive: 0x0369a1, emissiveIntensity: 0.4, roughness: 0.15, transparent: true, opacity: 0.84, clearcoat: 0.9 });
  readonly seafoamMat = new THREE.MeshStandardMaterial({ color: 0xe0f2fe, emissive: 0x38bdf8, emissiveIntensity: 0.65, roughness: 0.4 });

  readonly lightningMat = new THREE.MeshStandardMaterial({ color: 0xbfdbfe, emissive: 0x3b82f6, emissiveIntensity: 1.15, roughness: 0.18 });
  readonly marbleStatMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.62, metalness: 0.12 });
  readonly statGoldMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, emissive: 0xd97706, emissiveIntensity: 0.5, metalness: 0.86, roughness: 0.22 });

  readonly magnetRedMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.38, metalness: 0.48 });
  readonly magnetSilverMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.22, metalness: 0.88 });
  readonly fluxRoseMat = new THREE.MeshStandardMaterial({ color: 0xfb7185, emissive: 0xe11d48, emissiveIntensity: 0.82 });

  readonly nebulaCrimsonMat = new THREE.MeshStandardMaterial({ color: 0xbe123c, emissive: 0x9f1239, emissiveIntensity: 0.78, roughness: 0.4 });
  readonly lunarRockMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.9, metalness: 0.12 });
  readonly lunarVeinMat = new THREE.MeshStandardMaterial({ color: 0x7dd3fc, emissive: 0x0ea5e9, emissiveIntensity: 0.75 });

  readonly citadelIceMat = new THREE.MeshStandardMaterial({ color: 0x1e3a5f, roughness: 0.5, metalness: 0.35 });
  readonly brassMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.88, roughness: 0.24 });

  readonly toxicLiquidMat = new THREE.MeshStandardMaterial({ color: 0x84cc16, emissive: 0x65a30d, emissiveIntensity: 0.88, roughness: 0.22 });
  readonly toxicSludgeMat = new THREE.MeshStandardMaterial({ color: 0x365314, roughness: 0.75, metalness: 0.1 });

  readonly solarCoreMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xf59e0b, emissiveIntensity: 1.05, roughness: 0.2 });
  readonly eternalGoldMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, metalness: 0.85, roughness: 0.18 });
  readonly eternalCyanMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.75 });

  constructor() {
    // 1. Curved Katana Energy Crescent
    const kShape = new THREE.Shape();
    kShape.moveTo(-1.35, 0.08);
    kShape.quadraticCurveTo(0, 0.72, 1.45, 0.14);
    kShape.quadraticCurveTo(0.05, 0.34, -1.35, 0.08);
    kShape.closePath();
    this.katanaArcGeo = new THREE.ExtrudeGeometry(kShape, { depth: 0.1, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 1 });
    this.katanaArcGeo.center();

    // 2. Clockwork Toothed Gear Saw
    const gShape = new THREE.Shape();
    const teeth = 12;
    for (let i = 0; i < teeth * 2; i++) {
      const a0 = (i / (teeth * 2)) * Math.PI * 2;
      const a1 = ((i + 0.55) / (teeth * 2)) * Math.PI * 2;
      const r = i % 2 === 0 ? 1.32 : 1.02;
      const x0 = Math.cos(a0) * r;
      const y0 = Math.sin(a0) * r;
      if (i === 0) gShape.moveTo(x0, y0);
      else gShape.lineTo(x0, y0);
      gShape.lineTo(Math.cos(a1) * r, Math.sin(a1) * r);
    }
    gShape.closePath();
    this.gearSawGeo = new THREE.ExtrudeGeometry(gShape, { depth: 0.3, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 1 });
    this.gearSawGeo.center();

    // 3. Curling Ocean Tidal Wave Profile (extruded horizontally across lane width)
    const wShape = new THREE.Shape();
    wShape.moveTo(-1.1, 0);
    wShape.lineTo(1.1, 0);
    wShape.quadraticCurveTo(0.8, 1.05, 0.15, 1.45);
    wShape.quadraticCurveTo(-0.55, 1.72, -0.78, 1.15);
    wShape.quadraticCurveTo(-0.35, 1.1, -0.35, 0.55);
    wShape.quadraticCurveTo(-0.7, 0.25, -1.1, 0);
    wShape.closePath();
    this.tidalWaveGeo = new THREE.ExtrudeGeometry(wShape, { depth: 2.35, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.05, bevelSegments: 2 });
    this.tidalWaveGeo.center();
    this.tidalWaveGeo.rotateY(Math.PI / 2);

    // 4. Jagged Lightning Strike Bolt
    this.lightningGeo = new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0.38, 1.5, 0.15),
        new THREE.Vector3(-0.42, 3.0, -0.18),
        new THREE.Vector3(0.32, 4.6, 0.14),
        new THREE.Vector3(-0.22, 6.2, 0),
      ]),
      14,
      0.16,
      6,
      false
    );
  }
}

let cachedBank: HazardAssetBank | null = null;
function getBank(): HazardAssetBank {
  if (!cachedBank) cachedBank = new HazardAssetBank();
  return cachedBank;
}

function makeTelegraphRing(colorHex: number): THREE.Mesh {
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.95, 1.38, 24),
    new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.72, side: THREE.DoubleSide })
  );
  ring.name = 'warnRing';
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.05;
  return ring;
}

export function getOrBuildSignatureHazardGroup(
  kind: ObstacleKind,
  parentMesh: THREE.Group,
  cache: Map<ObstacleKind, THREE.Group>
): THREE.Group | null {
  const existing = cache.get(kind);
  if (existing) return existing;

  const bank = getBank();
  const root = new THREE.Group();
  root.name = `sig_${kind}`;

  const body = new THREE.Group();
  body.name = 'animBody';
  root.add(body);

  switch (kind) {
    case 'GOLD_TOWER_FALL': {
      const spire = new THREE.Mesh(new THREE.BoxGeometry(1.45, 3.4, 1.45), bank.marbleDarkMat);
      spire.position.y = 1.7;
      const trim = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.32, 1.55), bank.goldMat);
      trim.position.y = 2.6;
      const cap = new THREE.Mesh(new THREE.ConeGeometry(0.9, 1.1, 4), bank.goldMat);
      cap.rotation.y = Math.PI / 4;
      cap.position.y = 3.95;
      body.add(spire, trim, cap);
      root.add(makeTelegraphRing(0xfbbf24));
      break;
    }

    case 'CYBER_BOT_CROSS': {
      // Twin Neon Cyber Drone Sentinels linked by plasma beam
      for (const sx of [-0.72, 0.72]) {
        const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 1.25, 8), bank.cyberBodyMat);
        torso.position.set(sx, 1.0, 0);
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), bank.cyberBodyMat);
        head.position.set(sx, 1.8, 0);
        const visor = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.12, 0.28), bank.cyberVisorMat);
        visor.position.set(sx, 1.82, 0.16);
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.05, 6, 14), bank.cyberNeonMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.set(sx, 0.42, 0);
        body.add(torso, head, visor, ring);
      }
      const laserLink = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.5, 8), bank.cyberVisorMat);
      laserLink.rotation.z = Math.PI / 2;
      laserLink.position.y = 1.15;
      body.add(laserLink);
      break;
    }

    case 'FALLING_CRYSTAL': {
      const c1 = new THREE.Mesh(new THREE.ConeGeometry(0.85, 2.7, 6), bank.crystalMat);
      c1.rotation.x = Math.PI;
      c1.position.y = 1.55;
      const c2 = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.9, 6), bank.crystalMat);
      c2.rotation.set(Math.PI, 0, 0.35);
      c2.position.set(-0.62, 1.4, 0.25);
      const c3 = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.8, 6), bank.crystalMat);
      c3.rotation.set(Math.PI, 0, -0.32);
      c3.position.set(0.6, 1.4, -0.2);
      body.add(c1, c2, c3);
      root.add(makeTelegraphRing(0xc084fc));
      break;
    }

    case 'SLIDING_ICEBERG': {
      const berg1 = new THREE.Mesh(new THREE.ConeGeometry(1.15, 2.5, 5), bank.iceMat);
      berg1.position.y = 1.25;
      const berg2 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.95, 0), bank.iceMat);
      berg2.scale.set(1.25, 0.85, 1.1);
      berg2.position.set(0.45, 0.85, 0.2);
      body.add(berg1, berg2);
      root.add(makeTelegraphRing(0x67e8f9));
      break;
    }

    case 'RISING_PYRAMID': {
      const s1 = new THREE.Mesh(new THREE.BoxGeometry(2.25, 0.6, 2.25), bank.sandstoneMat);
      s1.position.y = 0.3;
      const s2 = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.55, 1.65), bank.sandstoneMat);
      s2.position.y = 0.88;
      const top = new THREE.Mesh(new THREE.ConeGeometry(1.1, 1.35, 4), bank.sandstoneMat);
      top.rotation.y = Math.PI / 4;
      top.position.y = 1.82;
      const cap = new THREE.Mesh(new THREE.ConeGeometry(0.38, 0.45, 4), bank.goldMat);
      cap.rotation.y = Math.PI / 4;
      cap.position.y = 2.38;
      body.add(s1, s2, top, cap);
      root.add(makeTelegraphRing(0xf59e0b));
      break;
    }

    case 'SAKURA_KATANA': {
      const spinner = new THREE.Group();
      spinner.name = 'spinner';
      spinner.position.y = 1.25;
      for (const rotY of [0, Math.PI]) {
        const blade = new THREE.Mesh(bank.katanaArcGeo, bank.katanaBladeMat);
        blade.rotation.x = Math.PI / 2;
        blade.rotation.z = rotY;
        blade.scale.set(1.05, 1.15, 1.2);
        spinner.add(blade);
      }
      const hilt = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 1.1, 8), bank.katanaHiltMat);
      spinner.add(hilt);
      for (let p = 0; p < 4; p++) {
        const a = (p / 4) * Math.PI * 2;
        const petal = new THREE.Mesh(new THREE.OctahedronGeometry(0.24, 0), bank.sakuraPetalMat);
        petal.scale.set(1.2, 0.35, 0.8);
        petal.position.set(Math.cos(a) * 1.15, (p % 2 === 0 ? 1 : -1) * 0.35, Math.sin(a) * 1.15);
        spinner.add(petal);
      }
      body.add(spinner);
      break;
    }

    case 'FALLING_TREE': {
      // Tipping conifer pivoted near base beside lane
      const pivot = new THREE.Group();
      pivot.name = 'treePivot';
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.34, 3.3, 8), bank.barkMat);
      trunk.position.y = 1.65;
      const tier1 = new THREE.Mesh(new THREE.ConeGeometry(1.15, 1.5, 8), bank.pineMat);
      tier1.position.y = 2.1;
      const tier2 = new THREE.Mesh(new THREE.ConeGeometry(0.88, 1.35, 8), bank.pineMat);
      tier2.position.y = 2.95;
      const tier3 = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.1, 8), bank.pineMat);
      tier3.position.y = 3.65;
      pivot.add(trunk, tier1, tier2, tier3);
      body.add(pivot);
      root.add(makeTelegraphRing(0x34d399));
      break;
    }

    case 'OCEAN_WAVE': {
      const wave = new THREE.Mesh(bank.tidalWaveGeo, bank.waveBodyMat);
      wave.position.y = 0.05;
      const crest = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 2.38, 10), bank.seafoamMat);
      crest.rotation.z = Math.PI / 2;
      crest.position.set(0, 1.36, -0.52);
      body.add(wave, crest);
      break;
    }

    case 'LIGHTNING_STRIKE': {
      const bolt1 = new THREE.Mesh(bank.lightningGeo, bank.lightningMat);
      const bolt2 = new THREE.Mesh(bank.lightningGeo, bank.lightningMat);
      bolt2.rotation.y = Math.PI * 0.65;
      bolt2.scale.setScalar(0.85);
      const orb = new THREE.Mesh(new THREE.OctahedronGeometry(0.75, 0), bank.lightningMat);
      orb.position.y = 1.2;
      body.add(bolt1, bolt2, orb);
      root.add(makeTelegraphRing(0x60a5fa));
      break;
    }

    case 'RUINS_STATUE': {
      // Sculpted Greco-Roman Guardian Statue
      const plinth = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.45, 1.5), bank.marbleStatMat);
      plinth.position.y = 0.22;
      const robe = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.66, 1.35, 10), bank.marbleStatMat);
      robe.position.y = 1.1;
      const chest = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.72, 0.55), bank.marbleStatMat);
      chest.position.y = 2.0;
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 8), bank.marbleStatMat);
      head.position.y = 2.62;
      const crest = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.28, 0.52), bank.statGoldMat);
      crest.position.y = 2.94;
      const spear = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.9, 6), bank.statGoldMat);
      spear.position.set(0.68, 1.65, 0);
      const shield = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.12, 14), bank.statGoldMat);
      shield.rotation.x = Math.PI / 2;
      shield.position.set(-0.62, 1.65, 0.28);
      body.add(plinth, robe, chest, head, crest, spear, shield);
      root.add(makeTelegraphRing(0xfde047));
      break;
    }

    case 'MAGNETIC_CORE': {
      const spinner = new THREE.Group();
      spinner.name = 'spinner';
      spinner.position.y = 1.35;
      const u = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.22, 10, 18, Math.PI), bank.magnetRedMat);
      u.rotation.z = Math.PI;
      const tipL = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.65, 10), bank.magnetSilverMat);
      tipL.position.set(-0.7, 0.35, 0);
      const tipR = tipL.clone();
      tipR.position.x = 0.7;
      const flux = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.08, 8, 22), bank.fluxRoseMat);
      spinner.add(u, tipL, tipR, flux);
      body.add(spinner);
      break;
    }

    case 'NEBULA_VORTEX': {
      const spinner = new THREE.Group();
      spinner.name = 'spinner';
      spinner.position.y = 1.35;
      const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.65, 1), bank.nebulaCrimsonMat);
      const r1 = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.14, 8, 22), bank.nebulaCrimsonMat);
      r1.rotation.x = 0.7;
      const r2 = new THREE.Mesh(new THREE.TorusGeometry(1.32, 0.1, 8, 22), bank.fluxRoseMat);
      r2.rotation.y = 0.8;
      spinner.add(core, r1, r2);
      body.add(spinner);
      break;
    }

    case 'LUNAR_METEOR': {
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(1.15, 1), bank.lunarRockMat);
      rock.position.y = 1.15;
      const vein = new THREE.Mesh(new THREE.OctahedronGeometry(0.95, 0), bank.lunarVeinMat);
      vein.position.y = 1.15;
      body.add(rock, vein);
      root.add(makeTelegraphRing(0x7dd3fc));
      break;
    }

    case 'FROST_SPIKE': {
      for (const [sx, h, rz] of [
        [0, 2.8, 0],
        [-0.65, 2.1, 0.22],
        [0.65, 2.1, -0.22],
      ] as [number, number, number][]) {
        const sp = new THREE.Mesh(new THREE.ConeGeometry(0.55, h, 5), bank.citadelIceMat);
        sp.position.set(sx, h * 0.5, 0);
        sp.rotation.z = rz;
        const tip = new THREE.Mesh(new THREE.ConeGeometry(0.32, h * 0.45, 5), bank.iceMat);
        tip.position.set(sx - Math.sin(rz) * h * 0.25, h * 0.8, 0);
        tip.rotation.z = rz;
        body.add(sp, tip);
      }
      root.add(makeTelegraphRing(0x38bdf8));
      break;
    }

    case 'CLOCKWORK_GEAR': {
      const spinner = new THREE.Group();
      spinner.name = 'spinner';
      spinner.position.y = 1.32;
      const gear = new THREE.Mesh(bank.gearSawGeo, bank.brassMat);
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.55, 10), bank.marbleDarkMat);
      hub.rotation.x = Math.PI / 2;
      spinner.add(gear, hub);
      body.add(spinner);
      break;
    }

    case 'TOXIC_POOL': {
      const puddle = new THREE.Mesh(new THREE.CylinderGeometry(1.22, 1.32, 0.16, 16), bank.toxicLiquidMat);
      puddle.position.y = 0.08;
      const rim = new THREE.Mesh(new THREE.TorusGeometry(1.24, 0.12, 8, 18), bank.toxicSludgeMat);
      rim.rotation.x = Math.PI / 2;
      rim.position.y = 0.12;
      body.add(puddle, rim);
      for (let b = 0; b < 4; b++) {
        const bubble = new THREE.Mesh(new THREE.SphereGeometry(0.24 + (b % 2) * 0.1, 8, 6), bank.toxicLiquidMat);
        bubble.name = `bubble_${b}`;
        bubble.position.set((b - 1.5) * 0.48, 0.35 + (b % 2) * 0.35, (b % 2 === 0 ? 1 : -1) * 0.35);
        body.add(bubble);
      }
      break;
    }

    case 'SOLAR_FLARE': {
      const spinner = new THREE.Group();
      spinner.name = 'spinner';
      spinner.position.y = 1.35;
      const sun = new THREE.Mesh(new THREE.SphereGeometry(0.86, 14, 10), bank.solarCoreMat);
      const c1 = new THREE.Mesh(new THREE.TorusGeometry(1.18, 0.1, 8, 22), bank.goldMat);
      c1.rotation.x = 0.6;
      const c2 = new THREE.Mesh(new THREE.TorusGeometry(1.36, 0.08, 8, 22), bank.solarCoreMat);
      c2.rotation.y = 0.7;
      spinner.add(sun, c1, c2);
      body.add(spinner);
      root.add(makeTelegraphRing(0xfbbf24));
      break;
    }

    case 'ETERNAL_RING': {
      const spinner = new THREE.Group();
      spinner.name = 'spinner';
      spinner.position.y = 1.4;
      const outer = new THREE.Mesh(new THREE.TorusGeometry(1.3, 0.12, 8, 24), bank.eternalGoldMat);
      const inner = new THREE.Mesh(new THREE.TorusGeometry(0.92, 0.1, 8, 20), bank.eternalCyanMat);
      inner.rotation.y = Math.PI / 3;
      const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.45, 0), bank.eternalCyanMat);
      spinner.add(outer, inner, gem);
      body.add(spinner);
      break;
    }

    default:
      return null;
  }

  root.visible = false;
  cache.set(kind, root);
  parentMesh.add(root);
  return root;
}

export function updateSignatureHazardAnimation(obs: HazardVisualState, dt: number): void {
  const sigRoot = obs.hazardGroups.get(obs.kind);
  if (!sigRoot) return;

  const animBody = sigRoot.getObjectByName('animBody');
  const spinner = sigRoot.getObjectByName('spinner');
  const warnRing = sigRoot.getObjectByName('warnRing');
  if (!animBody) return;

  const speed =
    obs.kind === 'LIGHTNING_STRIKE'
      ? 1.15
      : obs.kind === 'FALLING_CRYSTAL' || obs.kind === 'LUNAR_METEOR'
        ? 0.82
        : 0.72;

  if (obs.eruptProgress < 1) {
    obs.eruptProgress = Math.min(1, obs.eruptProgress + dt * speed);
  }
  const u = obs.eruptProgress;
  const easeOut = 1 - Math.pow(1 - u, 2);

  let dx = 0;
  let dy = 0;

  switch (obs.kind) {
    case 'LIGHTNING_STRIKE': {
      dy = (1 - easeOut) * 16.0;
      if (spinner) spinner.rotation.y += dt * 5;
      animBody.rotation.y += dt * 7;
      break;
    }
    case 'FALLING_CRYSTAL':
    case 'RUINS_STATUE':
    case 'SOLAR_FLARE': {
      dy = (1 - easeOut) * 13.5;
      break;
    }
    case 'LUNAR_METEOR': {
      const curX = THREE.MathUtils.lerp(obs.eruptStartX, obs.eruptTargetX, u);
      dx = curX - obs.eruptTargetX;
      dy = (1 - easeOut) * 14.0;
      animBody.rotation.x += dt * 2.5;
      break;
    }
    case 'RISING_PYRAMID':
    case 'FROST_SPIKE': {
      dy = -(1 - easeOut) * 3.8;
      break;
    }
    case 'SLIDING_ICEBERG':
    case 'OCEAN_WAVE': {
      const curX = THREE.MathUtils.lerp(obs.eruptStartX, obs.eruptTargetX, easeOut);
      dx = curX - obs.eruptTargetX;
      break;
    }
    case 'FALLING_TREE':
    case 'GOLD_TOWER_FALL': {
      const pivot = animBody.getObjectByName('treePivot') || animBody;
      const sideSign = obs.eruptStartX >= obs.eruptTargetX ? 1 : -1;
      const startOffset = sideSign * 1.85;
      pivot.position.x = startOffset;
      pivot.rotation.z = sideSign * (easeOut * 1.44);
      dx = startOffset * (1 - easeOut);
      break;
    }
    case 'CYBER_BOT_CROSS': {
      obs.movePhase += dt * 2.4;
      dx = Math.sin(obs.movePhase) * 2.2;
      break;
    }
    case 'TOXIC_POOL': {
      for (let b = 0; b < 4; b++) {
        const bub = animBody.getObjectByName(`bubble_${b}`);
        if (bub) {
          bub.position.y = 0.28 + Math.abs(Math.sin(obs.movePhase * 3 + b * 1.4)) * (obs.altitude === 'GROUND' ? 0.55 : 1.4);
        }
      }
      obs.movePhase += dt;
      break;
    }
    default:
      break;
  }

  if (spinner) {
    if (obs.kind === 'CLOCKWORK_GEAR') {
      spinner.rotation.z -= dt * 4.5;
    } else if (obs.kind === 'SAKURA_KATANA') {
      spinner.rotation.y += dt * 7.5;
    } else {
      spinner.rotation.y += dt * 3.2;
      spinner.rotation.x += dt * 1.6;
    }
  }

  if (warnRing) {
    const pulse = 0.88 + Math.sin(performance.now() * 0.012) * 0.14;
    warnRing.scale.setScalar(pulse);
    warnRing.visible = u < 0.98;
  }

  animBody.position.set(dx, dy, 0);
  obs.visualX = obs.eruptTargetX + dx;
  obs.visualY = obs.eruptTargetY + dy;
}
