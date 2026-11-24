import * as THREE from 'three';
import { BossConfig, VehicleData, WeaponId } from './types';

// Shared procedural textures cached once
let cachedRoadTex: THREE.CanvasTexture | null = null;
let cachedRoadRoughTex: THREE.CanvasTexture | null = null;
let cachedRoadBumpTex: THREE.CanvasTexture | null = null;
let cachedTerrainTex: THREE.CanvasTexture | null = null;
let cachedMetalBumpTex: THREE.CanvasTexture | null = null;
let cachedShadowTex: THREE.CanvasTexture | null = null;
let cachedBuildingTex: THREE.CanvasTexture | null = null;
let cachedBuildingEmissiveTex: THREE.CanvasTexture | null = null;

export function getRoadTexture(maxAnisotropy: number): THREE.CanvasTexture {
  if (cachedRoadTex) return cachedRoadTex;
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Realistic dark slate asphalt gradient across road width
  const baseGrad = ctx.createLinearGradient(0, 0, 512, 0);
  baseGrad.addColorStop(0, '#111722');
  baseGrad.addColorStop(0.15, '#161e2c');
  baseGrad.addColorStop(0.5, '#1b2434');
  baseGrad.addColorStop(0.85, '#161e2c');
  baseGrad.addColorStop(1, '#111722');
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, 512, 512);

  // Subtle tire wear tracks in the 3 lanes
  const laneCenters = [86, 256, 426];
  for (const cx of laneCenters) {
    for (const offset of [-26, 26]) {
      const trackGrad = ctx.createLinearGradient(cx + offset - 18, 0, cx + offset + 18, 0);
      trackGrad.addColorStop(0, 'rgba(6, 9, 15, 0)');
      trackGrad.addColorStop(0.5, 'rgba(6, 9, 15, 0.32)');
      trackGrad.addColorStop(1, 'rgba(6, 9, 15, 0)');
      ctx.fillStyle = trackGrad;
      ctx.fillRect(cx + offset - 18, 0, 36, 512);
    }
  }

  // Fine asphalt mineral aggregate
  for (let i = 0; i < 6500; i++) {
    const x = (i * 73) % 512;
    const y = (i * 197 + Math.floor(i / 7) * 13) % 512;
    const shade = 18 + ((i * 29) % 24);
    ctx.fillStyle = `rgba(${shade},${shade + 4},${shade + 9},0.42)`;
    ctx.fillRect(x, y, 2, 2);
  }

  // Subtle asphalt expansion joints
  ctx.fillStyle = 'rgba(5, 8, 14, 0.45)';
  for (let y = 0; y < 512; y += 128) {
    ctx.fillRect(0, y, 512, 2);
  }

  // Crisp matte-white dashed lane dividers
  ctx.fillStyle = 'rgba(226, 232, 240, 0.72)';
  for (let y = 16; y < 512; y += 128) {
    ctx.fillRect(168, y, 5, 58);
    ctx.fillRect(338, y, 5, 58);
  }

  // Soft shoulder markings (non-glaring)
  ctx.fillStyle = 'rgba(203, 213, 225, 0.34)';
  ctx.fillRect(14, 0, 5, 512);
  ctx.fillRect(493, 0, 5, 512);
  ctx.fillStyle = 'rgba(125, 211, 252, 0.16)';
  ctx.fillRect(24, 0, 2, 512);
  ctx.fillRect(486, 0, 2, 512);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 4);
  tex.anisotropy = Math.max(1, maxAnisotropy);
  cachedRoadTex = tex;
  return tex;
}

export function getRoadRoughnessTexture(maxAnisotropy: number): THREE.CanvasTexture {
  if (cachedRoadRoughTex) return cachedRoadRoughTex;
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Balanced asphalt roughness (not mirror-glare)
  ctx.fillStyle = '#dcdcdc';
  ctx.fillRect(0, 0, 512, 512);

  const laneCenters = [86, 256, 426];
  for (const cx of laneCenters) {
    const g = ctx.createLinearGradient(cx - 44, 0, cx + 44, 0);
    g.addColorStop(0, 'rgba(220,220,220,0)');
    g.addColorStop(0.3, 'rgba(105,105,105,0.72)');
    g.addColorStop(0.7, 'rgba(105,105,105,0.72)');
    g.addColorStop(1, 'rgba(220,220,220,0)');
    ctx.fillStyle = g;
    ctx.fillRect(cx - 44, 0, 88, 512);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 4);
  tex.anisotropy = Math.max(1, maxAnisotropy);
  cachedRoadRoughTex = tex;
  return tex;
}

export function getRoadBumpTexture(maxAnisotropy: number): THREE.CanvasTexture {
  if (cachedRoadBumpTex) return cachedRoadBumpTex;
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 7000; i++) {
    const x = (i * 97) % 512;
    const y = (i * 211 + Math.floor(i / 5) * 19) % 512;
    const v = 108 + ((i * 31) % 42);
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.fillRect(x, y, 2, 2);
  }

  ctx.fillStyle = '#404040';
  for (let y = 0; y < 512; y += 128) {
    ctx.fillRect(0, y, 512, 2);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 4);
  tex.anisotropy = Math.max(1, maxAnisotropy);
  cachedRoadBumpTex = tex;
  return tex;
}

export function getTerrainTexture(maxAnisotropy: number): THREE.CanvasTexture {
  if (cachedTerrainTex) return cachedTerrainTex;
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#cfcfd4';
  ctx.fillRect(0, 0, 512, 512);

  // Soft overlapping organic terrain patches (no sharp square grid)
  for (let i = 0; i < 90; i++) {
    const cx = (i * 137) % 512;
    const cy = (i * 211) % 512;
    const r = 36 + (i % 5) * 16;
    const grad = ctx.createRadialGradient(cx, cy, 4, cx, cy, r);
    const v = 192 + ((i * 19) % 34);
    grad.addColorStop(0, `rgba(${v},${v},${v},0.42)`);
    grad.addColorStop(1, `rgba(${v},${v},${v},0)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }
  // Subtle fine natural grain speckles
  for (let i = 0; i < 900; i++) {
    const sx = (i * 97) % 512;
    const sy = (i * 151) % 512;
    const sw = 2 + (i % 4);
    const tone = i % 2 === 0 ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
    ctx.fillStyle = tone;
    ctx.fillRect(sx, sy, sw, sw);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(14, 5);
  tex.anisotropy = Math.max(1, maxAnisotropy);
  cachedTerrainTex = tex;
  return tex;
}

export function getBuildingWindowTexture(maxAnisotropy: number): THREE.CanvasTexture {
  if (cachedBuildingTex) return cachedBuildingTex;
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#141c2b';
  ctx.fillRect(0, 0, 256, 512);

  // Refined architectural concrete mullions & deep glass curtain-wall bays
  for (let y = 0; y < 512; y += 32) {
    ctx.fillStyle = '#1f293b';
    ctx.fillRect(0, y, 256, 7);
    for (let x = 8; x < 256; x += 28) {
      const hash = (x * 13 + y * 7) % 11;
      ctx.fillStyle = hash > 5 ? '#2b3b52' : hash > 2 ? '#1a2436' : '#0f172a';
      ctx.fillRect(x, y + 9, 20, 17);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = Math.max(1, maxAnisotropy);
  cachedBuildingTex = tex;
  return tex;
}

export function getBuildingEmissiveTexture(maxAnisotropy: number): THREE.CanvasTexture {
  if (cachedBuildingEmissiveTex) return cachedBuildingEmissiveTex;
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, 256, 512);

  // Subtle realistic office lights (mix of warm amber & soft slate-white, low glare)
  for (let y = 0; y < 512; y += 32) {
    for (let x = 8; x < 256; x += 28) {
      const hash = (x * 37 + y * 17) % 29;
      if (hash === 0 || hash === 7) {
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(x + 2, y + 10, 16, 13);
      } else if (hash === 3 || hash === 14) {
        ctx.fillStyle = '#e2c792';
        ctx.fillRect(x + 2, y + 10, 16, 13);
      }
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = Math.max(1, maxAnisotropy);
  cachedBuildingEmissiveTex = tex;
  return tex;
}

export function getMetalBumpTexture(): THREE.CanvasTexture {
  if (cachedMetalBumpTex) return cachedMetalBumpTex;
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 256, 256);

  for (let y = 0; y < 256; y += 2) {
    const v = 122 + ((y * 19) % 14);
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.fillRect(0, y, 256, 1);
  }
  ctx.strokeStyle = '#606060';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(12, 12, 232, 232);
  ctx.beginPath();
  ctx.moveTo(128, 0);
  ctx.lineTo(128, 256);
  ctx.moveTo(0, 128);
  ctx.lineTo(256, 128);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  cachedMetalBumpTex = tex;
  return tex;
}

export function getContactShadowTexture(): THREE.CanvasTexture {
  if (cachedShadowTex) return cachedShadowTex;
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(64, 64, 10, 64, 64, 60);
  grad.addColorStop(0, 'rgba(0,0,0,0.78)');
  grad.addColorStop(0.55, 'rgba(0,0,0,0.3)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);

  const tex = new THREE.CanvasTexture(canvas);
  cachedShadowTex = tex;
  return tex;
}

export interface BuiltVehicleRig {
  root: THREE.Group;
  bodyGroup: THREE.Group;
  wheels: THREE.Object3D[];
  thrusters: THREE.Mesh[];
  weaponGroup: THREE.Group;
  shieldMesh: THREE.Mesh;
  hitFlashMaterials: THREE.MeshStandardMaterial[];
}

function createExtrudedHull(length: number, width: number, height: number, noseSharpness: number): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  const hw = width * 0.5;
  const hl = length * 0.5;

  // Sculpted organic aerodynamic planform with smoothly curved nose, waist, and tapered tail
  shape.moveTo(0, -hl * (1 + noseSharpness));
  shape.bezierCurveTo(hw * 0.38, -hl * (0.94 + noseSharpness * 0.3), hw * 0.82, -hl * 0.65, hw * 0.94, -hl * 0.22);
  shape.bezierCurveTo(hw * 1.02, hl * 0.14, hw * 0.98, hl * 0.68, hw * 0.72, hl * 0.94);
  shape.quadraticCurveTo(0, hl * 1.04, -hw * 0.72, hl * 0.94);
  shape.bezierCurveTo(-hw * 0.98, hl * 0.68, -hw * 1.02, hl * 0.14, -hw * 0.94, -hl * 0.22);
  shape.bezierCurveTo(-hw * 0.82, -hl * 0.65, -hw * 0.38, -hl * (0.94 + noseSharpness * 0.3), 0, -hl * (1 + noseSharpness));
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: height,
    bevelEnabled: true,
    bevelThickness: height * 0.36,
    bevelSize: width * 0.09,
    bevelSegments: 5,
    curveSegments: 22,
  });
  geo.rotateX(Math.PI / 2);
  geo.center();
  return geo;
}

function createAirfoilWingGeometry(
  span: number,
  rootChord: number,
  tipChord: number,
  sweepZ: number,
  side: 1 | -1 = 1
): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  if (side === 1) {
    shape.moveTo(0, -rootChord * 0.5);
    shape.lineTo(span, sweepZ - tipChord * 0.45);
    shape.lineTo(span, sweepZ + tipChord * 0.55);
    shape.lineTo(0, rootChord * 0.5);
  } else {
    shape.moveTo(0, -rootChord * 0.5);
    shape.lineTo(0, rootChord * 0.5);
    shape.lineTo(-span, sweepZ + tipChord * 0.55);
    shape.lineTo(-span, sweepZ - tipChord * 0.45);
  }
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.06,
    bevelEnabled: true,
    bevelThickness: 0.025,
    bevelSize: 0.04,
    bevelSegments: 3,
  });
  geo.rotateX(Math.PI / 2);
  return geo;
}

function buildWeaponTurret(weapon: WeaponId, accentColor: number): THREE.Group {
  const group = new THREE.Group();
  const gunMat = new THREE.MeshStandardMaterial({
    color: 0x2a3548,
    metalness: 0.9,
    roughness: 0.22,
  });
  const glowMat = new THREE.MeshStandardMaterial({
    color: accentColor,
    emissive: accentColor,
    emissiveIntensity: 0.85,
    roughness: 0.2,
  });

  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.28, 0.14, 16), gunMat);
  const shroud = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.12, 0.36), gunMat);
  shroud.position.y = 0.07;
  group.add(base, shroud);

  const barrelCount =
    weapon === 'TWIN_GATLING' ? 2 : weapon === 'QUAD_BARRAGE' ? 4 : weapon === 'PLASMA_WAVE' ? 3 : 1;

  for (let i = 0; i < barrelCount; i++) {
    const offset = (i - (barrelCount - 1) / 2) * 0.13;
    const barrelLen = weapon === 'HEAVY_RAILGUN' || weapon === 'NOVA_CANNON' ? 1.02 : 0.68;
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.055, barrelLen, 12), gunMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(offset, 0.09, -barrelLen * 0.45);
    group.add(barrel);

    const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.07, 12), glowMat);
    tip.rotation.x = Math.PI / 2;
    tip.position.set(offset, 0.09, -barrelLen * 0.92);
    group.add(tip);
  }

  return group;
}

function buildRealisticWheel(caliperColor: number): THREE.Group {
  const pivot = new THREE.Group();

  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x11151d,
    roughness: 0.88,
    metalness: 0.06,
  });
  const rimMat = new THREE.MeshStandardMaterial({
    color: 0xcbd5e1,
    metalness: 0.94,
    roughness: 0.16,
  });
  const darkAlloyMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    metalness: 0.88,
    roughness: 0.32,
  });
  const caliperMat = new THREE.MeshStandardMaterial({
    color: caliperColor,
    metalness: 0.6,
    roughness: 0.3,
  });

  // Main rubber tread + beveled tire shoulder
  const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.27, 24), tireMat);
  tire.rotation.z = Math.PI / 2;
  tire.castShadow = true;
  const shoulderOut = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.045, 10, 24), tireMat);
  shoulderOut.rotation.y = Math.PI / 2;
  shoulderOut.position.x = 0.115;
  const shoulderIn = shoulderOut.clone();
  shoulderIn.position.x = -0.115;
  pivot.add(tire, shoulderOut, shoulderIn);

  // Inner ventilated brake rotor & colored brake caliper
  const rotor = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.29, 20), darkAlloyMat);
  rotor.rotation.z = Math.PI / 2;
  const caliper = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.12, 0.08), caliperMat);
  caliper.position.set(0, 0.14, 0.1);
  pivot.add(rotor, caliper);

  // Machined metallic rim barrel lip (subtle satin metal, zero neon glare)
  const lip = new THREE.Mesh(new THREE.TorusGeometry(0.255, 0.02, 10, 24), rimMat);
  lip.rotation.y = Math.PI / 2;
  lip.position.x = 0.14;
  const lipInner = lip.clone();
  lipInner.position.x = -0.14;
  pivot.add(lip, lipInner);

  // Twin-5-spoke sculpted forged alloy wheel blades
  const spokeGeo = new THREE.BoxGeometry(0.026, 0.44, 0.036);
  for (let s = 0; s < 5; s++) {
    const baseAngle = (s / 5) * Math.PI * 2;
    for (const pair of [-0.09, 0.09]) {
      const spoke = new THREE.Mesh(spokeGeo, rimMat);
      spoke.position.x = 0.145;
      spoke.rotation.x = baseAngle + pair;
      pivot.add(spoke);

      const spokeOther = spoke.clone();
      spokeOther.position.x = -0.145;
      pivot.add(spokeOther);
    }
  }

  // Center-lock alloy hub cap
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.31, 14), rimMat);
  hub.rotation.z = Math.PI / 2;
  pivot.add(hub);

  return pivot;
}

export function buildVehicleRig(
  vehicle: VehicleData,
  engineLevel: number,
  wingLevel: number,
  isSoftwareGl: boolean
): BuiltVehicleRig {
  const root = new THREE.Group();
  const bodyGroup = new THREE.Group();
  root.add(bodyGroup);

  const cfg = vehicle.modelConfig;
  const bump = getMetalBumpTexture();

  // Balanced clearcoat automotive & aerospace paint (rich depth, zero neon burn)
  const hullMat = new THREE.MeshPhysicalMaterial({
    color: cfg.primaryColor,
    metalness: Math.max(0.45, cfg.metalness),
    roughness: Math.min(0.28, cfg.roughness),
    clearcoat: 1.0,
    clearcoatRoughness: 0.08,
    envMapIntensity: 1.35,
    bumpMap: bump,
    bumpScale: 0.008,
  });
  const carbonMat = new THREE.MeshStandardMaterial({
    color: 0x131924,
    metalness: 0.38,
    roughness: 0.46,
    bumpMap: bump,
    bumpScale: 0.012,
  });
  const trimMat = new THREE.MeshStandardMaterial({
    color: cfg.secondaryColor,
    metalness: 0.88,
    roughness: 0.24,
    envMapIntensity: 1.2,
  });
  const canopyMat = new THREE.MeshPhysicalMaterial({
    color: 0x0a1322,
    metalness: 0.22,
    roughness: 0.04,
    clearcoat: 1.0,
    clearcoatRoughness: 0.04,
    envMapIntensity: 1.65,
    transparent: true,
    opacity: isSoftwareGl ? 0.86 : 0.9,
  });
  const accentEmissiveMat = new THREE.MeshStandardMaterial({
    color: cfg.emissiveColor,
    emissive: cfg.emissiveColor,
    emissiveIntensity: 0.78,
    roughness: 0.22,
  });
  const headlightMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    emissive: 0xe0f2fe,
    emissiveIntensity: 1.15,
    roughness: 0.14,
  });
  const taillightMat = new THREE.MeshStandardMaterial({
    color: 0xdc2626,
    emissive: 0xe11d48,
    emissiveIntensity: 1.05,
    roughness: 0.18,
  });

  const baseY = vehicle.category === 'CAR' ? 0.54 : 0.98;

  // 1. Primary Sculpted Chassis + Lower Carbon Splitter + Contoured Upper Hood/Deck
  const hullLen = (vehicle.category === 'SPACESHIP' ? 3.85 : 3.38) * cfg.lengthScale;
  const hullWid = (vehicle.category === 'CAR' ? 1.8 : 1.38) * cfg.widthScale;
  const hullHgt = vehicle.category === 'CAR' ? 0.36 : 0.42;
  const noseSharp = cfg.hullShape === 'needle' || cfg.hullShape === 'interceptor' ? 0.38 : 0.24;

  const hullGeo = createExtrudedHull(hullLen, hullWid, hullHgt, noseSharp);
  const hullMesh = new THREE.Mesh(hullGeo, hullMat);
  hullMesh.position.y = baseY;
  hullMesh.castShadow = true;
  hullMesh.receiveShadow = true;
  bodyGroup.add(hullMesh);

  // Sculpted lower carbon-fiber aero skirt & front chin splitter
  const skirtGeo = createExtrudedHull(hullLen * 1.03, hullWid * 1.04, 0.1, noseSharp * 0.92);
  const skirtMesh = new THREE.Mesh(skirtGeo, carbonMat);
  skirtMesh.position.y = baseY - hullHgt * 0.46;
  bodyGroup.add(skirtMesh);

  // Upper contoured aero hood / rear engine louver spine
  const spineGeo = createExtrudedHull(hullLen * 0.64, hullWid * 0.52, 0.22, 0.24);
  const spineMesh = new THREE.Mesh(spineGeo, trimMat);
  spineMesh.position.set(0, baseY + 0.24, 0.16);
  spineMesh.castShadow = true;
  bodyGroup.add(spineMesh);

  // Rear engine deck cooling louver slats
  for (let lv = 0; lv < 4; lv++) {
    const louver = new THREE.Mesh(new THREE.BoxGeometry(hullWid * 0.34, 0.03, 0.09), carbonMat);
    louver.position.set(0, baseY + 0.36, 0.45 + lv * 0.18);
    louver.rotation.x = 0.25;
    bodyGroup.add(louver);
  }

  // Front recessed grille air intake
  const grille = new THREE.Mesh(new THREE.BoxGeometry(hullWid * 0.48, 0.12, 0.18), carbonMat);
  grille.position.set(0, baseY - 0.08, -hullLen * 0.56);
  bodyGroup.add(grille);

  // 2. Cockpit Canopy with inner Headrest & Halo Frame
  const canopyGeo = new THREE.SphereGeometry(0.45 * cfg.widthScale, 24, 14);
  canopyGeo.scale(0.95, 0.54, 1.92);
  const canopy = new THREE.Mesh(canopyGeo, canopyMat);
  canopy.position.set(0, baseY + 0.35, -0.18);
  bodyGroup.add(canopy);

  const headrest = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.22, 0.16), carbonMat);
  headrest.position.set(0, baseY + 0.32, 0.08);
  bodyGroup.add(headrest);

  const arch = new THREE.Mesh(new THREE.TorusGeometry(0.43 * cfg.widthScale, 0.032, 8, 22, Math.PI), carbonMat);
  arch.position.set(0, baseY + 0.32, -0.05);
  bodyGroup.add(arch);

  // Aerodynamic twin side mirrors
  for (const side of [-1, 1]) {
    const stalk = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.035, 0.05), carbonMat);
    stalk.position.set(side * (hullWid * 0.48), baseY + 0.22, -0.35);
    const mirrorCap = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8), hullMat);
    mirrorCap.scale.set(1.3, 0.65, 1.1);
    mirrorCap.position.set(side * (hullWid * 0.55), baseY + 0.24, -0.32);
    bodyGroup.add(stalk, mirrorCap);
  }

  // 3. Category-specific Propulsion, Curved Fenders & Sculpted Aero Wings
  const wheels: THREE.Object3D[] = [];
  if (vehicle.category === 'CAR') {
    const wheelOffsets: [number, number, number][] = [
      [-hullWid * 0.5, 0.36, -hullLen * 0.31],
      [hullWid * 0.5, 0.36, -hullLen * 0.31],
      [-hullWid * 0.52, 0.38, hullLen * 0.31],
      [hullWid * 0.52, 0.38, hullLen * 0.31],
    ];
    for (const [wx, wy, wz] of wheelOffsets) {
      const wheelPivot = buildRealisticWheel(cfg.accentColor);
      wheelPivot.position.set(wx, wy, wz);
      bodyGroup.add(wheelPivot);
      wheels.push(wheelPivot);

      // Solid sculpted wheel-arch fender shroud wrapping cleanly over the top half of the tire
      const archShape = new THREE.Shape();
      archShape.absarc(0, 0, 0.47, 0.08, Math.PI - 0.08, false);
      archShape.absarc(0, 0, 0.38, Math.PI - 0.08, 0.08, true);
      archShape.closePath();
      const archGeo = new THREE.ExtrudeGeometry(archShape, {
        depth: 0.3,
        bevelEnabled: true,
        bevelThickness: 0.02,
        bevelSize: 0.015,
        bevelSegments: 2,
        curveSegments: 18,
      });
      archGeo.rotateY(Math.PI / 2);
      archGeo.translate(-0.15, 0, 0);
      const archShell = new THREE.Mesh(archGeo, hullMat);
      archShell.position.set(wx * 0.96, wy + 0.02, wz);
      bodyGroup.add(archShell);
    }

    // Swept Airfoil Rear GT Wing on Swan-Neck Carbon Pylons
    const spoilerW = hullWid * (1.02 + wingLevel * 0.05);
    const wingBladeShape = new THREE.Shape();
    wingBladeShape.moveTo(0, 0);
    wingBladeShape.quadraticCurveTo(0.18, 0.06, 0.38, 0.02);
    wingBladeShape.lineTo(0.38, -0.02);
    wingBladeShape.quadraticCurveTo(0.16, 0.01, 0, 0);
    const wingBladeGeo = new THREE.ExtrudeGeometry(wingBladeShape, {
      depth: spoilerW,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.015,
      bevelSegments: 2,
    });
    wingBladeGeo.rotateY(Math.PI / 2);
    wingBladeGeo.center();
    const spoiler = new THREE.Mesh(wingBladeGeo, carbonMat);
    spoiler.position.set(0, baseY + 0.58, hullLen * 0.45);

    const spoilerLip = new THREE.Mesh(new THREE.BoxGeometry(spoilerW * 0.96, 0.025, 0.04), accentEmissiveMat);
    spoilerLip.position.set(0, baseY + 0.6, hullLen * 0.54);

    const endplateL = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.24, 0.46), hullMat);
    endplateL.position.set(-spoilerW * 0.5, baseY + 0.55, hullLen * 0.45);
    const endplateR = endplateL.clone();
    endplateR.position.x = spoilerW * 0.5;

    const strutL = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.34, 0.22), carbonMat);
    strutL.position.set(-spoilerW * 0.26, baseY + 0.39, hullLen * 0.43);
    strutL.rotation.x = 0.22;
    const strutR = strutL.clone();
    strutR.position.x = spoilerW * 0.26;
    bodyGroup.add(spoiler, spoilerLip, endplateL, endplateR, strutL, strutR);

    // Sculpted 5-fin rear aerodynamic diffuser
    for (let f = -2; f <= 2; f++) {
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.16, 0.34), carbonMat);
      fin.position.set(f * 0.18, baseY - 0.18, hullLen * 0.49);
      bodyGroup.add(fin);
    }
  } else {
    // Aircraft, Spaceship, or Hybrid Sculpted Airfoil Wings + Angled Winglets + Nacelles
    const span =
      (vehicle.category === 'AIRCRAFT' ? 2.2 : vehicle.category === 'HYBRID' ? 2.35 : 1.9) *
      cfg.widthScale *
      (1 + (wingLevel - 1) * 0.04);
    const sweepZ = cfg.wingStyle === 'forward' ? -0.65 : 0.85;
    const wingGeoR = createAirfoilWingGeometry(span, 1.22, 0.52, sweepZ, 1);
    const wingGeoL = createAirfoilWingGeometry(span, 1.22, 0.52, sweepZ, -1);

    const wingR = new THREE.Mesh(wingGeoR, hullMat);
    wingR.position.set(0, baseY + 0.02, 0.12);
    wingR.castShadow = true;
    const wingL = new THREE.Mesh(wingGeoL, hullMat);
    wingL.position.set(0, baseY + 0.02, 0.12);
    wingL.castShadow = true;
    bodyGroup.add(wingR, wingL);

    // Angled canted wingtip winglets + subtle nav lights
    const wlGeo = new THREE.BoxGeometry(0.06, 0.34, 0.48);
    const wlR = new THREE.Mesh(wlGeo, trimMat);
    wlR.position.set(span * 0.99, baseY + 0.16, sweepZ + 0.12);
    wlR.rotation.z = -0.35;
    const wlL = wlR.clone();
    wlL.position.x = -wlR.position.x;
    wlL.rotation.z = 0.35;
    bodyGroup.add(wlR, wlL);

    const tipGeo = new THREE.BoxGeometry(0.07, 0.06, 0.52);
    const tipR = new THREE.Mesh(tipGeo, accentEmissiveMat);
    tipR.position.set(span * 0.98, baseY + 0.02, sweepZ + 0.1);
    const tipL = tipR.clone();
    tipL.position.x = -tipR.position.x;
    bodyGroup.add(tipR, tipL);

    if (vehicle.category === 'SPACESHIP' || vehicle.category === 'HYBRID') {
      if (cfg.hullShape === 'ring' || cfg.wingStyle === 'halo') {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.08, 12, 36), trimMat);
        ring.position.set(0, baseY + 0.08, 0.45);
        const coreRing = new THREE.Mesh(new THREE.TorusGeometry(1.06, 0.035, 8, 32), accentEmissiveMat);
        coreRing.position.copy(ring.position);
        bodyGroup.add(ring, coreRing);
      } else {
        const podGeo = new THREE.CylinderGeometry(0.18, 0.24, 1.95, 16);
        podGeo.rotateX(Math.PI / 2);
        const podL = new THREE.Mesh(podGeo, trimMat);
        podL.position.set(-hullWid * 0.74, baseY, 0.22);
        const intakeL = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.32, 12), carbonMat);
        intakeL.rotation.x = -Math.PI / 2;
        intakeL.position.set(-hullWid * 0.74, baseY, -0.84);
        const podR = podL.clone();
        podR.position.x = hullWid * 0.74;
        const intakeR = intakeL.clone();
        intakeR.position.x = hullWid * 0.74;
        bodyGroup.add(podL, intakeL, podR, intakeR);
      }
    }

    // Twin canted vertical tail stabilizers
    const finGeo = new THREE.BoxGeometry(0.065, 0.68, 0.74);
    const finL = new THREE.Mesh(finGeo, carbonMat);
    finL.position.set(-0.56, baseY + 0.38, hullLen * 0.35);
    finL.rotation.z = 0.28;
    const finR = finL.clone();
    finR.position.x = 0.56;
    finR.rotation.z = -0.28;
    bodyGroup.add(finL, finR);
  }

  // 4. Recessed Titanium Exhaust Shrouds & Soft Translucent Plasma Plumes (low glare)
  const thrusters: THREE.Mesh[] = [];
  const outerFlameMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.42,
  });
  const coreFlameMat = new THREE.MeshBasicMaterial({
    color: 0xe0f2fe,
    transparent: true,
    opacity: 0.72,
  });
  const tCount = Math.min(3, cfg.thrusterCount);
  for (let i = 0; i < tCount; i++) {
    const tx = tCount === 1 ? 0 : (i - (tCount - 1) / 2) * 0.42;
    const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.18, 0.26, 16), trimMat);
    nozzle.rotation.x = Math.PI / 2;
    nozzle.position.set(tx, baseY - 0.04, hullLen * 0.48);
    const bore = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.06, 14), carbonMat);
    bore.rotation.x = Math.PI / 2;
    bore.position.set(tx, baseY - 0.04, hullLen * 0.58);
    bodyGroup.add(nozzle, bore);

    const flameLen = 0.52 + engineLevel * 0.14;
    const flameGeo = new THREE.ConeGeometry(0.095 + engineLevel * 0.01, flameLen, 12);
    flameGeo.rotateX(Math.PI / 2);
    flameGeo.translate(0, 0, flameLen * 0.5);
    const flame = new THREE.Mesh(flameGeo, outerFlameMat);
    flame.position.set(tx, baseY - 0.04, hullLen * 0.56);

    const coreGeo = new THREE.ConeGeometry(0.045, flameLen * 0.6, 8);
    coreGeo.rotateX(Math.PI / 2);
    coreGeo.translate(0, 0, flameLen * 0.3);
    const coreFlame = new THREE.Mesh(coreGeo, coreFlameMat);
    flame.add(coreFlame);

    bodyGroup.add(flame);
    thrusters.push(flame);
  }

  // 5. Crisp Headlights, Ruby Taillight Bar & Subtle Side Beltline Trim
  const hlGeo = new THREE.BoxGeometry(0.3, 0.055, 0.09);
  const hlL = new THREE.Mesh(hlGeo, headlightMat);
  hlL.position.set(-hullWid * 0.34, baseY + 0.02, -hullLen * 0.46);
  hlL.rotation.y = 0.24;
  const hlR = hlL.clone();
  hlR.position.x = hullWid * 0.34;
  hlR.rotation.y = -0.24;
  bodyGroup.add(hlL, hlR);

  const tailBar = new THREE.Mesh(new THREE.BoxGeometry(hullWid * 0.64, 0.055, 0.05), taillightMat);
  tailBar.position.set(0, baseY + 0.13, hullLen * 0.51);
  bodyGroup.add(tailBar);

  const stripGeo = new THREE.BoxGeometry(0.035, 0.035, hullLen * 0.44);
  const stripL = new THREE.Mesh(stripGeo, accentEmissiveMat);
  stripL.position.set(-hullWid * 0.47, baseY + 0.03, 0.02);
  const stripR = stripL.clone();
  stripR.position.x = hullWid * 0.47;
  bodyGroup.add(stripL, stripR);

  // 6. Weapon Turret Mount
  const weaponGroup = buildWeaponTurret(vehicle.weaponType, cfg.accentColor);
  weaponGroup.position.set(0, baseY + 0.36, cfg.turretMount === 'nose' ? -hullLen * 0.26 : 0.12);
  bodyGroup.add(weaponGroup);

  // 7. Energy Shield Bubble
  const shieldMesh = new THREE.Mesh(
    new THREE.SphereGeometry(2.15, 22, 16),
    new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.16,
      wireframe: true,
    })
  );
  shieldMesh.position.y = baseY;
  shieldMesh.visible = false;
  root.add(shieldMesh);

  // 8. Soft Ground Contact Shadow Disc
  const shadowPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(3.6, 5.4),
    new THREE.MeshBasicMaterial({
      map: getContactShadowTexture(),
      transparent: true,
      opacity: 0.62,
      depthWrite: false,
    })
  );
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.y = 0.02;
  root.add(shadowPlane);

  return {
    root,
    bodyGroup,
    wheels,
    thrusters,
    weaponGroup,
    shieldMesh,
    hitFlashMaterials: [hullMat, trimMat],
  };
}

export function buildBossMesh(config: BossConfig): {
  root: THREE.Group;
  coreMesh: THREE.Mesh;
  wingsGroup: THREE.Group;
  hitFlashMaterials: THREE.MeshStandardMaterial[];
} {
  const root = new THREE.Group();
  const bodyMat = new THREE.MeshPhysicalMaterial({
    color: config.primaryColor,
    metalness: 0.85,
    roughness: 0.22,
    clearcoat: 0.85,
    clearcoatRoughness: 0.12,
  });
  const armorMat = new THREE.MeshStandardMaterial({
    color: config.accentColor,
    metalness: 0.78,
    roughness: 0.3,
  });
  const coreMat = new THREE.MeshStandardMaterial({
    color: config.coreColor,
    emissive: config.coreColor,
    emissiveIntensity: 1.35,
    roughness: 0.16,
  });

  const mainGeo =
    config.bodyStyle === 'leviathan'
      ? new THREE.CylinderGeometry(1.8, 1.1, 6.2, 14)
      : config.bodyStyle === 'citadel'
        ? new THREE.OctahedronGeometry(2.8, 1)
        : new THREE.DodecahedronGeometry(2.5, 1);
  if (config.bodyStyle === 'leviathan') mainGeo.rotateZ(Math.PI / 2);
  const mainBody = new THREE.Mesh(mainGeo, bodyMat);
  mainBody.castShadow = true;
  root.add(mainBody);

  const coreMesh = new THREE.Mesh(new THREE.SphereGeometry(1.15, 22, 16), coreMat);
  coreMesh.position.set(0, 0, 1.85);
  root.add(coreMesh);

  for (let i = -1; i <= 1; i += 2) {
    const plate = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2.6, 2.2), armorMat);
    plate.position.set(i * 2.1, 0.2, 0.2);
    plate.rotation.z = i * -0.25;
    root.add(plate);
  }

  const wingsGroup = new THREE.Group();
  root.add(wingsGroup);
  if (config.wingStyle === 'halo') {
    const halo = new THREE.Mesh(new THREE.TorusGeometry(4.2, 0.28, 12, 40), armorMat);
    wingsGroup.add(halo);
  } else if (config.wingStyle !== 'none') {
    const wGeoR = createAirfoilWingGeometry(5.0, 2.0, 1.0, 0.6, 1);
    const wGeoL = createAirfoilWingGeometry(5.0, 2.0, 1.0, 0.6, -1);
    const wR = new THREE.Mesh(wGeoR, bodyMat);
    wR.position.set(1.5, 0.4, -0.3);
    wR.rotation.z = -0.14;
    const wL = new THREE.Mesh(wGeoL, bodyMat);
    wL.position.set(-1.5, 0.4, -0.3);
    wL.rotation.z = 0.14;
    wingsGroup.add(wL, wR);
  }

  for (let i = -1; i <= 1; i += 2) {
    const pod = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 2.2, 12), armorMat);
    pod.rotation.x = Math.PI / 2;
    pod.position.set(i * 3.1, -0.7, 1.2);
    root.add(pod);
  }

  return {
    root,
    coreMesh,
    wingsGroup,
    hitFlashMaterials: [bodyMat, armorMat],
  };
}
