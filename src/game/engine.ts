import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { audioManager } from './audio';
import {
  ALTITUDE_HEIGHTS,
  LANE_POSITIONS,
  PHYSICS_CONFIG,
  WEAPON_SPECS,
} from './config';
import { crazyGames } from './crazygames';
import { getDimensionById } from './dimensions';
import { haptics } from './haptics';
import { t } from './localization';
import {
  advanceCombo,
  canEnterAltitude,
  decayCombo,
  generateBossConfig,
  getEffectiveStats,
  pickDimensionalRoutes,
} from './rules';
import {
  AltitudeLayer,
  BossConfig,
  DimensionConfig,
  GameState,
  GraphicsQuality,
  HudSnapshot,
  RouteOption,
  RunStats,
  SaveData,
} from './types';
import { buildBossMesh, buildVehicleRig, BuiltVehicleRig } from './vehicleBuilder';
import { getVehicleById } from './vehicles';
import { WorldManager } from './worldManager';

export interface EngineCallbacks {
  onHudUpdate: (hud: HudSnapshot) => void;
  onStateChange: (state: GameState) => void;
  onRunComplete: (stats: RunStats) => void;
  onRoutesReady: (routes: RouteOption[]) => void;
  onWebGLError: (message: string) => void;
}

export class GameEngine {
  private container: HTMLElement;
  private callbacks: EngineCallbacks;
  private saveData: SaveData;

  private renderer!: THREE.WebGLRenderer;
  private composer: EffectComposer | null = null;
  private bloomPass: UnrealBloomPass | null = null;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private dirLight!: THREE.DirectionalLight;
  private hemiLight!: THREE.HemisphereLight;
  private garageSoftbox: THREE.RectAreaLight | null = null;
  private world!: WorldManager;

  private isSoftwareGl = false;
  private resolvedQuality: Exclude<GraphicsQuality, 'AUTO'> = 'HIGH';
  private frameId = 0;
  private isDisposed = false;
  private lastTime = 0;
  private fpsSamples: number[] = [];

  private state: GameState = 'MAIN_MENU';
  private playerRig: BuiltVehicleRig | null = null;
  private garageBaseMesh: THREE.Group | null = null;
  private previewVehicleId: number | null = null;

  // Player Physics & Movement State
  private targetLane = 1; // 0, 1, 2
  private playerX = 0;
  private playerY = 0;
  private vy = 0;
  private jumpCount = 0;
  private isGrounded = true;
  private coyoteTimer = 0;
  private jumpBufferTimer = 0;
  private crouchTimer = 0;
  private invulnTimer = 0;
  private hitstopTimer = 0;
  private cameraTrauma = 0;
  private currentSpeedKmh = 0;
  private altitude: AltitudeLayer = 'GROUND';
  private targetAltitudeY = 0;
  private currentAltitudeY = 0;

  // Squash & stretch / banking
  private squashX = 1;
  private squashY = 1;
  private bankAngle = 0;
  private yawAngle = 0;

  // Garage Turntable State
  private showroomYaw = 2.52;
  private showroomZoom = 7.2;
  private garageDrawerRatio = 0.36;
  private currentGarageLookY = 0.5;

  // Combat & Run State
  private fireCooldown = 0;
  private isFiringHeld = false;
  private distance = 0;
  private score = 0;
  private runCoins = 0;
  private obstaclesDestroyed = 0;
  private bossesDefeated = 0;
  private combo = 1.0;
  private maxCombo = 1.0;
  private comboTimer = 0;
  private hearts = 3;
  private maxHearts = 3;
  private shieldTimer = 0;
  private magnetTimer = 0;
  private overdriveCharge = 0;
  private overdriveTimer = 0;
  private usedReviveThisRun = false;

  // Dimension & Route Selection
  private selectedStartDimensionId = 3;
  private currentDim: DimensionConfig = getDimensionById(3);
  private nextRouteDistance = PHYSICS_CONFIG.routeIntervalMeters;
  private routeCounter = 0;

  // Boss Battle State
  private nextBossDistance = PHYSICS_CONFIG.bossIntervalMeters;
  private bossCount = 0;
  private activeBossConfig: BossConfig | null = null;
  private activeBossRig: ReturnType<typeof buildBossMesh> | null = null;
  private bossHp = 0;
  private bossLane = 1;
  private bossX = 0;
  private bossAttackTimer = 0;
  private bossTelegraphTimer = 0;
  private bossTargetLane = 1;
  private bossWarningText: string | null = null;
  private bossFlashTimer = 0;

  // Alerts / Notifications
  private alertMessage: string | null = null;
  private alertTimer = 0;
  private notifCounter = 0;
  private lastNotif: { id: number; text: string; color: string } | null = null;
  private hudEmitTimer = 0;

  // Scratch vectors to avoid GC
  private readonly _lookTarget = new THREE.Vector3();
  private readonly _camPos = new THREE.Vector3();

  private resizeObserver: ResizeObserver | null = null;

  constructor(container: HTMLElement, initialSave: SaveData, callbacks: EngineCallbacks) {
    this.container = container;
    this.saveData = initialSave;
    this.callbacks = callbacks;
    haptics.setEnabled(initialSave.settings.haptics !== false);
    crazyGames.init();
    this.init();
  }

  private detectSoftwareGl(): boolean {
    try {
      const probe = document.createElement('canvas');
      const gl = probe.getContext('webgl2') || probe.getContext('webgl');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param) || '');
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    } catch {
      return true;
    }
  }

  private init(): void {
    this.isSoftwareGl = this.detectSoftwareGl();
    const pref = this.saveData.settings.graphicsQuality;
    this.resolvedQuality = pref === 'AUTO' ? (this.isSoftwareGl ? 'LOW' : 'HIGH') : pref;

    try {
      this.renderer = new THREE.WebGLRenderer({
        antialias: !this.isSoftwareGl && this.resolvedQuality !== 'LOW',
        powerPreference: 'high-performance',
        preserveDrawingBuffer: this.isSoftwareGl,
      });
    } catch {
      this.callbacks.onWebGLError(t(this.saveData.language, 'webgl_error'));
      return;
    }

    const w = Math.max(1, this.container.clientWidth || window.innerWidth);
    const h = Math.max(1, this.container.clientHeight || window.innerHeight);

    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(
      this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, this.resolvedQuality === 'HIGH' ? 2 : 1.5)
    );
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.shadowMap.enabled = !this.isSoftwareGl && this.resolvedQuality !== 'LOW';
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.container.appendChild(this.renderer.domElement);

    this.renderer.domElement.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      this.pauseLoop();
    });
    this.renderer.domElement.addEventListener('webglcontextrestored', () => {
      this.startLoop();
    });

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(62, w / h, 0.2, 420);

    // Studio & Atmosphere Lighting + PMREM RoomEnvironment
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    this.hemiLight = new THREE.HemisphereLight(0x7dd3fc, 0x1e293b, 0.92);
    this.scene.add(this.hemiLight);

    this.dirLight = new THREE.DirectionalLight(0xfff1db, 1.45);
    this.dirLight.position.set(14, 28, 18);
    if (!this.isSoftwareGl) {
      this.dirLight.castShadow = true;
      this.dirLight.shadow.mapSize.set(1024, 1024);
      this.dirLight.shadow.camera.near = 2;
      this.dirLight.shadow.camera.far = 120;
      const d = 24;
      this.dirLight.shadow.camera.left = -d;
      this.dirLight.shadow.camera.right = d;
      this.dirLight.shadow.camera.top = d;
      this.dirLight.shadow.camera.bottom = -d;
      this.dirLight.shadow.bias = -0.0005;
      this.dirLight.shadow.normalBias = 0.02;
    }
    this.scene.add(this.dirLight);

    // Subtle cool rim light to sculpt silhouettes cleanly without glaring highlights
    const rimLight = new THREE.DirectionalLight(0x60a5fa, 0.62);
    rimLight.position.set(-14, 10, -18);
    this.scene.add(rimLight);

    // Overhead studio softbox in Garage mode on real GPUs
    if (!this.isSoftwareGl) {
      RectAreaLightUniformsLib.init();
      this.garageSoftbox = new THREE.RectAreaLight(0xe0f2fe, 4.2, 8, 4);
      this.garageSoftbox.position.set(0, 6.2, 1.5);
      this.garageSoftbox.lookAt(0, 0.5, 0);
      this.garageSoftbox.visible = false;
      this.scene.add(this.garageSoftbox);
    }

    const maxAniso = this.renderer.capabilities.getMaxAnisotropy();
    this.world = new WorldManager(this.scene, maxAniso, this.resolvedQuality === 'LOW');

    this.buildGaragePedestal();
    this.applyDimension(this.selectedStartDimensionId, false);
    this.world.setLayerVisibility('GROUND', false);
    this.rebuildPlayerVehicle(this.saveData.selectedVehicle);

    if (!this.isSoftwareGl) {
      this.composer = new EffectComposer(this.renderer);
      this.composer.addPass(new RenderPass(this.scene, this.camera));
      this.bloomPass = new UnrealBloomPass(new THREE.Vector2(w, h), 0.12, 0.24, 0.96);
      this.bloomPass.enabled = this.resolvedQuality === 'HIGH';
      this.composer.addPass(this.bloomPass);
      this.composer.addPass(new OutputPass());
      this.renderer.compile(this.scene, this.camera);
    }

    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(this.container);
    window.addEventListener('resize', this.handleResize);

    this.emitHud();
    this.camera.position.set(3.95, 2.15, 6.1);
    this.updateMenuShowcase(0.016);
    this.renderFrame();
    this.startLoop();
  }

  private renderFrame(): void {
    if (this.composer && !this.isSoftwareGl && this.resolvedQuality === 'HIGH') {
      this.composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }

  private buildGaragePedestal(): void {
    const grp = new THREE.Group();
    const outerStep = new THREE.Mesh(
      new THREE.CylinderGeometry(3.65, 3.95, 0.14, 48),
      new THREE.MeshStandardMaterial({ color: 0x0b1220, metalness: 0.88, roughness: 0.28 })
    );
    outerStep.position.y = -0.17;
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(3.25, 3.45, 0.16, 48),
      new THREE.MeshPhysicalMaterial({
        color: 0x0f172a,
        metalness: 0.9,
        roughness: 0.14,
        clearcoat: 0.8,
        clearcoatRoughness: 0.1,
      })
    );
    base.position.y = -0.05;
    base.receiveShadow = true;
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(3.26, 0.04, 10, 64),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.45, roughness: 0.25 })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.03;
    const innerRing = new THREE.Mesh(
      new THREE.RingGeometry(2.1, 2.13, 48),
      new THREE.MeshBasicMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.32, side: THREE.DoubleSide })
    );
    innerRing.rotation.x = -Math.PI / 2;
    innerRing.position.y = 0.032;
    grp.add(outerStep, base, ring, innerRing);
    grp.visible = false;
    this.scene.add(grp);
    this.garageBaseMesh = grp;
  }

  private handleResize = (): void => {
    if (this.isDisposed || !this.renderer || !this.camera) return;
    const w = Math.max(1, this.container.clientWidth || window.innerWidth);
    const h = Math.max(1, this.container.clientHeight || window.innerHeight);
    if (w === 0 || h === 0) return;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.composer?.setSize(w, h);
    this.bloomPass?.resolution.set(w, h);
    this.renderFrame();
  };

  updateSaveData(save: SaveData): void {
    const prevVehicle = this.saveData.selectedVehicle;
    const prevEng = this.saveData.upgrades.engine;
    const prevWing = this.saveData.upgrades.wings;
    this.saveData = save;
    audioManager.updateSettings(save.settings);
    haptics.setEnabled(save.settings.haptics !== false);

    if (
      prevVehicle !== save.selectedVehicle ||
      prevEng !== save.upgrades.engine ||
      prevWing !== save.upgrades.wings
    ) {
      this.rebuildPlayerVehicle(this.previewVehicleId ?? save.selectedVehicle);
    }

    if (save.settings.graphicsQuality !== 'AUTO') {
      this.resolvedQuality = save.settings.graphicsQuality;
      this.renderer.setPixelRatio(
        this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, this.resolvedQuality === 'HIGH' ? 2 : 1.5)
      );
      if (this.bloomPass) {
        this.bloomPass.enabled = !this.isSoftwareGl && this.resolvedQuality === 'HIGH';
      }
    }
  }

  previewVehicle(vehicleId: number | null): void {
    this.previewVehicleId = vehicleId;
    this.rebuildPlayerVehicle(vehicleId ?? this.saveData.selectedVehicle);
  }

  rotateGarage(deltaX: number): void {
    this.showroomYaw += deltaX * 0.012;
  }

  zoomGarage(deltaY: number): void {
    this.showroomZoom = THREE.MathUtils.clamp(this.showroomZoom + deltaY * 0.008, 4.4, 11.5);
  }

  setGarageDrawerRatio(ratio: number): void {
    this.garageDrawerRatio = THREE.MathUtils.clamp(ratio, 0, 1);
  }

  private disposeGroup(grp: THREE.Object3D): void {
    grp.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        mesh.geometry?.dispose();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => m.dispose());
        } else {
          mesh.material?.dispose();
        }
      }
    });
  }

  private rebuildPlayerVehicle(vehicleId: number): void {
    if (this.playerRig) {
      this.scene.remove(this.playerRig.root);
      this.disposeGroup(this.playerRig.root);
      this.playerRig = null;
    }
    const v = getVehicleById(vehicleId);
    this.playerRig = buildVehicleRig(
      v,
      this.saveData.upgrades.engine,
      this.saveData.upgrades.wings,
      this.isSoftwareGl
    );
    this.scene.add(this.playerRig.root);
  }

  setStartDimension(dimId: number): void {
    const dim = getDimensionById(dimId);
    this.selectedStartDimensionId = dim.id;
    this.applyDimension(dim.id, false);
    this.emitHud();
  }

  private applyDimension(dimId: number, playAudio = true): void {
    const dim = getDimensionById(dimId);
    this.currentDim = dim;
    this.scene.background = new THREE.Color(dim.skyColor);
    this.scene.fog = new THREE.FogExp2(dim.fogColor, dim.fogDensity);
    this.hemiLight.color.setHex(dim.hemiSkyColor);
    this.hemiLight.groundColor.setHex(dim.hemiGroundColor);
    this.dirLight.color.setHex(dim.keyLightColor);
    this.world.applyDimension(dim);
    audioManager.setAmbientBaseFreq(dim.ambientFreq);
    if (playAudio) {
      audioManager.playDimensionalShift();
      haptics.trigger('shift');
    }
  }

  setState(next: GameState): void {
    this.state = next;
    if (this.garageBaseMesh) {
      this.garageBaseMesh.visible = next === 'GARAGE';
    }
    if (this.garageSoftbox) {
      this.garageSoftbox.visible = next === 'GARAGE';
    }
    this.world.setLayerVisibility(this.altitude, next === 'GARAGE');
    if (next === 'MAIN_MENU') {
      this.previewVehicleId = null;
      this.rebuildPlayerVehicle(this.saveData.selectedVehicle);
      this.playerX = 0;
      this.playerY = 0;
      this.currentAltitudeY = 0;
      this.targetAltitudeY = 0;
      this.altitude = 'GROUND';
      this.world.setLayerVisibility('GROUND', false);
      this.camera.position.set(3.95, 2.15, 6.1);
      audioManager.stopEngine();
    }
    if (next === 'PAUSED' || next === 'GAME_OVER' || next === 'ROUTE_SELECTION' || next === 'MAIN_MENU') {
      crazyGames.gameplayStop();
    }
    if (next === 'PAUSED' || next === 'GAME_OVER') {
      audioManager.updateEngine(0, this.altitude, false);
    }
    if (next === 'GAMEPLAY' || next === 'BOSS_BATTLE') {
      audioManager.startMusic();
      audioManager.startEngine();
      crazyGames.gameplayStart();
    }
    this.callbacks.onStateChange(next);
    this.emitHud();
  }

  startNewRun(): void {
    this.previewVehicleId = null;
    const v = getVehicleById(this.saveData.selectedVehicle);
    this.rebuildPlayerVehicle(v.id);
    const stats = getEffectiveStats(v, this.saveData.upgrades, false);

    this.targetLane = 1;
    this.playerX = LANE_POSITIONS[1];
    this.playerY = 0;
    this.vy = 0;
    this.jumpCount = 0;
    this.isGrounded = true;
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    this.crouchTimer = 0;
    this.invulnTimer = 0;
    this.hitstopTimer = 0;
    this.cameraTrauma = 0;
    this.currentSpeedKmh = stats.baseMaxSpeedKmh * 0.6;
    this.altitude = 'GROUND';
    this.targetAltitudeY = ALTITUDE_HEIGHTS.GROUND;
    this.currentAltitudeY = ALTITUDE_HEIGHTS.GROUND;
    this.squashX = 1;
    this.squashY = 1;
    this.bankAngle = 0;
    this.yawAngle = 0;

    this.distance = 0;
    this.score = 0;
    this.runCoins = 0;
    this.obstaclesDestroyed = 0;
    this.bossesDefeated = 0;
    this.combo = 1.0;
    this.maxCombo = 1.0;
    this.comboTimer = 0;
    this.maxHearts = stats.maxHearts;
    this.hearts = stats.maxHearts;
    this.shieldTimer = 0;
    this.magnetTimer = 0;
    this.overdriveCharge = 0;
    this.overdriveTimer = 0;
    this.usedReviveThisRun = false;

    this.nextRouteDistance = PHYSICS_CONFIG.routeIntervalMeters;
    this.routeCounter = 0;
    this.nextBossDistance = PHYSICS_CONFIG.bossIntervalMeters;
    this.bossCount = 0;
    this.clearBoss();

    this.alertMessage = null;
    this.alertTimer = 0;

    this.applyDimension(this.selectedStartDimensionId, false);
    this.world.resetRun();
    this.camera.position.set(this.playerX * 0.68, this.currentAltitudeY + 6.4, 9.8);
    this._lookTarget.set(this.playerX * 0.42, this.currentAltitudeY + 0.85, -22);
    this.camera.lookAt(this._lookTarget);
    this.setState('GAMEPLAY');
  }

  hasUsedRevive(): boolean {
    return this.usedReviveThisRun;
  }

  reviveCurrentRun(): boolean {
    if (this.state !== 'GAME_OVER' || this.usedReviveThisRun) return false;
    this.usedReviveThisRun = true;
    this.hearts = Math.max(2, this.maxHearts);
    this.invulnTimer = 3.0;
    this.shieldTimer = Math.max(this.shieldTimer, 5.0);
    this.hitstopTimer = 0;
    this.cameraTrauma = 0;
    this.world.clearDangerZoneObstacles(-52, 18);
    audioManager.playOverdrive();
    haptics.trigger('powerup');
    this.pushNotification(t(this.saveData.language, 'revived_notif'), '#22d3ee');
    this.setState('GAMEPLAY');
    return true;
  }

  private clearBoss(): void {
    if (this.activeBossRig) {
      this.scene.remove(this.activeBossRig.root);
      this.disposeGroup(this.activeBossRig.root);
      this.activeBossRig = null;
    }
    this.activeBossConfig = null;
    this.bossWarningText = null;
  }

  // Controls API
  switchLane(delta: -1 | 1): void {
    if (this.state !== 'GAMEPLAY' && this.state !== 'BOSS_BATTLE') return;
    const next = THREE.MathUtils.clamp(this.targetLane + delta, 0, 2);
    if (next !== this.targetLane) {
      this.targetLane = next;
    }
  }

  triggerJump(): void {
    if (this.state !== 'GAMEPLAY' && this.state !== 'BOSS_BATTLE') return;
    this.jumpBufferTimer = PHYSICS_CONFIG.jumpBufferTime;
    this.crouchTimer = 0;
  }

  triggerCrouchOrFastFall(): void {
    if (this.state !== 'GAMEPLAY' && this.state !== 'BOSS_BATTLE') return;
    if (!this.isGrounded) {
      this.vy = Math.min(this.vy, PHYSICS_CONFIG.fastFallVelocity);
    } else {
      this.crouchTimer = PHYSICS_CONFIG.crouchDuration;
      this.squashX = 1.25;
      this.squashY = 0.62;
    }
  }

  setFiring(held: boolean): void {
    this.isFiringHeld = held;
  }

  fireOnce(): void {
    if (this.state !== 'GAMEPLAY' && this.state !== 'BOSS_BATTLE') return;
    this.attemptFire();
  }

  triggerOverdrive(): void {
    if (this.state !== 'GAMEPLAY' && this.state !== 'BOSS_BATTLE') return;
    if (this.overdriveCharge < 100 || this.overdriveTimer > 0) return;
    this.overdriveCharge = 0;
    this.overdriveTimer = PHYSICS_CONFIG.overdriveDuration;
    this.cameraTrauma = Math.min(1, this.cameraTrauma + 0.4);
    audioManager.playOverdrive();
    haptics.trigger('overdrive');
    this.pushNotification(t(this.saveData.language, 'overdrive_active'), '#00f0ff');
    this.emitHud();
  }

  switchAltitude(target: AltitudeLayer): void {
    if (this.state !== 'GAMEPLAY' && this.state !== 'BOSS_BATTLE') return;
    if (this.altitude === target) return;
    const v = getVehicleById(this.saveData.selectedVehicle);
    if (!canEnterAltitude(v, target)) {
      const reqKey = target === 'SPACE' ? 'requires_spaceship' : 'requires_aircraft';
      this.alertMessage = `${t(this.saveData.language, 'vehicle_not_compatible')} — ${t(this.saveData.language, reqKey)}`;
      this.alertTimer = 2.6;
      audioManager.playHit();
      haptics.trigger('hit');
      this.emitHud();
      return;
    }
    this.altitude = target;
    this.targetAltitudeY = ALTITUDE_HEIGHTS[target];
    this.world.setLayerVisibility(target, false);
    this.world.populateLayerAhead(target, this.distance, this.currentDim, this.activeBossConfig !== null);
    this.vy = Math.max(this.vy, 6);
    this.isGrounded = false;
    audioManager.playDimensionalShift();
    haptics.trigger('shift');
    this.pushNotification(t(this.saveData.language, target.toLowerCase()), '#38bdf8');
    this.emitHud();
  }

  selectRoute(option: RouteOption): void {
    if (this.state !== 'ROUTE_SELECTION') return;
    this.runCoins += option.bonusCoins;
    this.applyDimension(option.dimension.id, true);
    if (canEnterAltitude(getVehicleById(this.saveData.selectedVehicle), option.environmentFocus)) {
      this.altitude = option.environmentFocus;
      this.targetAltitudeY = ALTITUDE_HEIGHTS[option.environmentFocus];
      this.world.setLayerVisibility(option.environmentFocus, false);
      this.world.populateLayerAhead(
        option.environmentFocus,
        this.distance,
        this.currentDim,
        this.activeBossConfig !== null
      );
    }
    this.pushNotification(`+${option.bonusCoins} ${t(this.saveData.language, 'coins')}`, '#facc15');
    this.setState(this.activeBossConfig ? 'BOSS_BATTLE' : 'GAMEPLAY');
  }

  private pushNotification(text: string, color: string): void {
    this.lastNotif = { id: ++this.notifCounter, text, color };
  }

  private attemptFire(): void {
    if (this.fireCooldown > 0) return;
    const v = getVehicleById(this.saveData.selectedVehicle);
    const stats = getEffectiveStats(v, this.saveData.upgrades, this.overdriveTimer > 0);
    const weapon = WEAPON_SPECS[v.weaponType];

    this.fireCooldown = 1 / stats.fireRate;
    const yOrigin = this.currentAltitudeY + this.playerY + 1.1;
    const zOrigin = -2.2;
    const speed = stats.projectileSpeed;
    const dmg = stats.weaponDamage;

    audioManager.playWeapon(v.weaponType);
    const isHeavy = weapon.pattern === 'pierce' || weapon.pattern === 'nova' || weapon.pattern === 'homing';
    haptics.trigger(isHeavy ? 'weapon_heavy' : 'weapon');

    switch (weapon.pattern) {
      case 'single':
        this.world.spawnProjectile(this.playerX, yOrigin, zOrigin, 0, 0, -speed, dmg, weapon.color);
        break;
      case 'twin':
        this.world.spawnProjectile(this.playerX - 0.55, yOrigin, zOrigin, 0, 0, -speed, dmg, weapon.color);
        this.world.spawnProjectile(this.playerX + 0.55, yOrigin, zOrigin, 0, 0, -speed, dmg, weapon.color);
        break;
      case 'pierce':
        this.world.spawnProjectile(this.playerX, yOrigin, zOrigin, 0, 0, -speed, dmg, weapon.color, false, true, false, 1.45);
        break;
      case 'spread3':
        this.world.spawnProjectile(this.playerX, yOrigin, zOrigin, 0, 0, -speed, dmg, weapon.color);
        this.world.spawnProjectile(this.playerX, yOrigin, zOrigin, -11, 0, -speed * 0.96, dmg, weapon.color);
        this.world.spawnProjectile(this.playerX, yOrigin, zOrigin, 11, 0, -speed * 0.96, dmg, weapon.color);
        break;
      case 'quad4':
        for (const ox of [-0.9, -0.35, 0.35, 0.9]) {
          this.world.spawnProjectile(this.playerX + ox, yOrigin, zOrigin, ox * 2.2, 0, -speed, dmg, weapon.color);
        }
        break;
      case 'homing':
        this.world.spawnProjectile(this.playerX - 0.6, yOrigin, zOrigin, -6, 0, -speed, dmg, weapon.color, false, false, true, 1.25);
        this.world.spawnProjectile(this.playerX + 0.6, yOrigin, zOrigin, 6, 0, -speed, dmg, weapon.color, false, false, true, 1.25);
        break;
      case 'wave3':
        for (const ox of [-0.85, 0, 0.85]) {
          this.world.spawnProjectile(this.playerX + ox, yOrigin, zOrigin, 0, 0, -speed, dmg, weapon.color, false, true, false, 1.2);
        }
        break;
      case 'nova':
        this.world.spawnProjectile(this.playerX, yOrigin, zOrigin, 0, 0, -speed, dmg, weapon.color, false, true, true, 1.8);
        this.world.spawnProjectile(this.playerX - 0.8, yOrigin, zOrigin, -8, 0, -speed * 0.95, Math.round(dmg * 0.55), weapon.color);
        this.world.spawnProjectile(this.playerX + 0.8, yOrigin, zOrigin, 8, 0, -speed * 0.95, Math.round(dmg * 0.55), weapon.color);
        break;
    }
  }

  private startLoop(): void {
    this.lastTime = performance.now();
    const tick = () => {
      if (this.isDisposed) return;
      const now = performance.now();
      const rawDt = (now - this.lastTime) / 1000;
      this.lastTime = now;
      const dt = Math.min(Math.max(rawDt, 0.001), 0.05);

      this.update(dt);
      this.renderFrame();

      if (this.isSoftwareGl) {
        this.afterDraw(tick);
      } else {
        this.frameId = requestAnimationFrame(tick);
      }
    };

    if (this.isSoftwareGl) {
      this.frameId = requestAnimationFrame(tick);
    } else {
      this.frameId = requestAnimationFrame(tick);
    }
  }

  private afterDraw(cb: () => void): void {
    try {
      const gl = this.renderer.getContext() as WebGL2RenderingContext;
      if (gl && typeof gl.fenceSync === 'function') {
        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl.flush();
        const poll = () => {
          if (this.isDisposed) return;
          const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
          if (state === gl.UNSIGNALED) {
            this.frameId = window.setTimeout(poll, 5);
          } else {
            if (sync) gl.deleteSync(sync);
            this.frameId = window.setTimeout(() => {
              if (!this.isDisposed) this.frameId = requestAnimationFrame(cb);
            }, 60);
          }
        };
        this.frameId = window.setTimeout(poll, 5);
        return;
      }
    } catch {
      // fallback
    }
    this.frameId = window.setTimeout(cb, 80);
  }

  private pauseLoop(): void {
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);
  }

  private update(dt: number): void {
    // Auto performance scaler check
    if (this.saveData.settings.graphicsQuality === 'AUTO' && !this.isSoftwareGl && dt > 0) {
      this.fpsSamples.push(1 / dt);
      if (this.fpsSamples.length > 90) {
        const avg = this.fpsSamples.reduce((a, b) => a + b, 0) / this.fpsSamples.length;
        this.fpsSamples.length = 0;
        if (avg < 32 && this.resolvedQuality !== 'LOW') {
          this.resolvedQuality = 'LOW';
          this.renderer.setPixelRatio(1);
          this.renderer.shadowMap.enabled = false;
        }
      }
    }

    if (this.state === 'GARAGE') {
      this.updateGarageView(dt);
      return;
    }

    if (this.state === 'MAIN_MENU' || this.state === 'UPGRADES' || this.state === 'COLLECTION' || this.state === 'SETTINGS') {
      this.updateMenuShowcase(dt);
      return;
    }

    if (this.state === 'PAUSED' || this.state === 'GAME_OVER') {
      return;
    }

    // Active Gameplay / Boss Battle / Route Selection (0.1x slow-mo)
    const timeScale = this.state === 'ROUTE_SELECTION' ? 0.1 : 1.0;
    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= dt;
      this.cameraTrauma = Math.max(0, this.cameraTrauma - dt * 2.2);
      this.updateCamera(dt, 0);
      return;
    }

    const simDt = dt * timeScale;
    this.updateGameplay(simDt, dt);
  }

  private updateMenuShowcase(dt: number): void {
    this.world.update(dt, dt * 14, 0, 0, 'GROUND', 0, this.currentDim, false, false, false);
    const tNow = performance.now() * 0.0005;
    if (this.playerRig) {
      this.playerRig.root.position.set(0, 0, 0);
      this.playerRig.root.rotation.set(0, Math.sin(tNow) * 0.14, 0);
      for (const w of this.playerRig.wheels) w.rotation.x -= dt * 8;
    }
    this._camPos.set(Math.sin(tNow * 0.7) * 1.9 + 3.4, 2.05, 5.9);
    this.camera.position.lerp(this._camPos, 1 - Math.exp(-4 * dt));
    this._lookTarget.set(0, 0.82, -0.4);
    this.camera.lookAt(this._lookTarget);
  }

  private updateGarageView(dt: number): void {
    if (this.playerRig) {
      this.playerRig.root.position.set(0, 0.12, 0);
      this.playerRig.root.rotation.set(0, this.showroomYaw, 0);
      this.playerRig.bodyGroup.position.y = Math.sin(performance.now() * 0.0025) * 0.03;
    }
    // Shift lookAt Y downward as the bottom drawer slides upward so the car stays cleanly framed above the drawer
    const targetLookY = 0.85 - this.garageDrawerRatio * 1.35;
    this.currentGarageLookY = THREE.MathUtils.damp(this.currentGarageLookY, targetLookY, 10, dt);
    this.camera.position.set(0, 2.25 - this.garageDrawerRatio * 0.3, this.showroomZoom);
    this._lookTarget.set(0, this.currentGarageLookY, 0);
    this.camera.lookAt(this._lookTarget);
  }

  private updateGameplay(simDt: number, realDt: number): void {
    const v = getVehicleById(this.saveData.selectedVehicle);
    const isOverdrive = this.overdriveTimer > 0;
    const stats = getEffectiveStats(v, this.saveData.upgrades, isOverdrive);

    // Accelerate smoothly toward max speed
    const targetSpeed = stats.maxSpeedKmh;
    this.currentSpeedKmh = THREE.MathUtils.damp(
      this.currentSpeedKmh,
      targetSpeed,
      isOverdrive ? 5.5 : 1.8 + stats.acceleration * 0.02,
      simDt
    );

    const speedRatio = Math.min(1.35, this.currentSpeedKmh / stats.baseMaxSpeedKmh);
    const worldSpeed = 24 + (this.currentSpeedKmh / 1600) * 62;
    const forwardStep = worldSpeed * simDt;

    this.distance += (this.currentSpeedKmh / 3.6) * simDt * 0.25;
    this.score += Math.round(forwardStep * this.combo * 1.4);

    // Audio engine pitch
    audioManager.updateEngine(Math.min(1.2, this.currentSpeedKmh / 1200), this.altitude, this.state !== 'ROUTE_SELECTION');

    // Timers
    if (this.fireCooldown > 0) this.fireCooldown -= simDt;
    if (this.invulnTimer > 0) this.invulnTimer -= simDt;
    if (this.shieldTimer > 0) this.shieldTimer -= simDt;
    if (this.magnetTimer > 0) this.magnetTimer -= simDt;
    if (this.overdriveTimer > 0) this.overdriveTimer = Math.max(0, this.overdriveTimer - simDt);
    if (this.alertTimer > 0) {
      this.alertTimer -= realDt;
      if (this.alertTimer <= 0) this.alertMessage = null;
    }
    if (this.comboTimer > 0) {
      this.comboTimer -= simDt;
      if (this.comboTimer <= 0 && this.combo > 1) {
        this.combo = decayCombo(this.combo);
        this.comboTimer = this.combo > 1 ? 1.5 : 0;
      }
    }

    // Firing
    if (this.state !== 'ROUTE_SELECTION' && (this.isFiringHeld || this.saveData.settings.autoFire)) {
      this.attemptFire();
    }

    // Smooth Altitude Transition
    this.currentAltitudeY = THREE.MathUtils.damp(this.currentAltitudeY, this.targetAltitudeY, 4.5, simDt);

    // Lane Movement + Banking + Yaw
    const desiredX = LANE_POSITIONS[this.targetLane];
    const prevX = this.playerX;
    this.playerX = THREE.MathUtils.damp(this.playerX, desiredX, stats.laneSwitchSpeed, simDt);
    const lateralVel = (this.playerX - prevX) / Math.max(0.0001, simDt);
    this.bankAngle = THREE.MathUtils.damp(this.bankAngle, THREE.MathUtils.clamp(-lateralVel * 0.032, -0.42, 0.42), 12, simDt);
    this.yawAngle = THREE.MathUtils.damp(this.yawAngle, THREE.MathUtils.clamp(-lateralVel * 0.018, -0.25, 0.25), 12, simDt);

    // Jump, Double Jump, Coyote Time, Jump Buffer, Gravity
    if (this.isGrounded) {
      this.coyoteTimer = PHYSICS_CONFIG.coyoteTime;
    } else {
      this.coyoteTimer = Math.max(0, this.coyoteTimer - simDt);
    }

    if (this.jumpBufferTimer > 0) {
      this.jumpBufferTimer -= simDt;
      if (this.isGrounded || this.coyoteTimer > 0) {
        this.vy = PHYSICS_CONFIG.jumpVelocity;
        this.isGrounded = false;
        this.coyoteTimer = 0;
        this.jumpCount = 1;
        this.jumpBufferTimer = 0;
        this.squashX = 0.84;
        this.squashY = 1.22;
        audioManager.playJump(false);
      } else if (this.jumpCount === 1) {
        this.vy = PHYSICS_CONFIG.doubleJumpVelocity;
        this.jumpCount = 2;
        this.jumpBufferTimer = 0;
        this.squashX = 0.86;
        this.squashY = 1.18;
        audioManager.playJump(true);
        this.world.spawnExplosion(this.playerX, this.currentAltitudeY + this.playerY, 0, 0x38bdf8, 8);
      }
    }

    const grav =
      this.altitude === 'SPACE'
        ? PHYSICS_CONFIG.gravitySpace
        : this.altitude === 'SKY'
          ? PHYSICS_CONFIG.gravitySky
          : PHYSICS_CONFIG.gravityGround;

    if (!this.isGrounded) {
      this.vy += grav * simDt;
      this.playerY += this.vy * simDt;
      if (this.playerY <= 0) {
        this.playerY = 0;
        this.vy = 0;
        this.isGrounded = true;
        this.jumpCount = 0;
        this.squashX = 1.22;
        this.squashY = 0.78;
        audioManager.playLand();
        this.world.spawnExplosion(this.playerX, this.currentAltitudeY + 0.2, 0, 0x94a3b8, 6);
      }
    }

    if (this.crouchTimer > 0) {
      this.crouchTimer -= simDt;
    }

    this.squashX = THREE.MathUtils.damp(this.squashX, 1, 14, simDt);
    this.squashY = THREE.MathUtils.damp(this.squashY, this.crouchTimer > 0 ? 0.56 : 1, 14, simDt);

    // Update Player Rig
    if (this.playerRig) {
      const hoverBob = this.altitude === 'GROUND' ? 0 : Math.sin(performance.now() * 0.006) * 0.18;
      this.playerRig.root.position.set(this.playerX, this.currentAltitudeY + this.playerY + hoverBob, 0);
      this.playerRig.bodyGroup.rotation.set(
        THREE.MathUtils.clamp(this.vy * 0.018, -0.35, 0.35),
        this.yawAngle,
        this.bankAngle
      );
      this.playerRig.bodyGroup.scale.set(this.squashX, this.squashY, 1);

      for (const w of this.playerRig.wheels) {
        w.rotation.x -= forwardStep * 1.4;
      }
      const flicker = 0.85 + Math.random() * 0.35 + (isOverdrive ? 0.7 : 0);
      for (const fl of this.playerRig.thrusters) {
        fl.scale.set(1, 1, flicker);
      }
      this.playerRig.shieldMesh.visible = this.shieldTimer > 0 || isOverdrive;
      if (this.playerRig.shieldMesh.visible) {
        this.playerRig.shieldMesh.rotation.y += simDt * 2.5;
      }

      // Invulnerability blink
      this.playerRig.bodyGroup.visible =
        this.invulnTimer <= 0 || Math.floor(this.invulnTimer * 16) % 2 === 0;

      if (isOverdrive || Math.random() > 0.45) {
        this.world.spawnTrailParticle(
          this.playerX,
          this.currentAltitudeY + this.playerY + 0.55,
          0,
          isOverdrive ? 0x00f0ff : v.modelConfig.accentColor
        );
      }
    }

    // Update World Pools
    this.world.update(
      simDt,
      forwardStep,
      this.playerX,
      this.currentAltitudeY + this.playerY,
      this.altitude,
      this.distance,
      this.currentDim,
      this.magnetTimer > 0,
      this.activeBossConfig !== null,
      this.state !== 'ROUTE_SELECTION'
    );

    // Check Collisions (Projectiles, Obstacles, Coins, Power-ups)
    this.resolveCollisions(simDt);

    // Check Boss Battle Trigger (every 5,000m)
    if (!this.activeBossConfig && this.distance >= this.nextBossDistance && this.state === 'GAMEPLAY') {
      this.spawnBoss();
    }
    if (this.activeBossConfig) {
      this.updateBoss(simDt);
    }

    // Check Dimensional Route Selection Trigger (every 1,800m)
    if (this.distance >= this.nextRouteDistance && this.state === 'GAMEPLAY') {
      this.nextRouteDistance += PHYSICS_CONFIG.routeIntervalMeters;
      this.routeCounter++;
      const routes = pickDimensionalRoutes(this.currentDim.id, this.routeCounter);
      this.setState('ROUTE_SELECTION');
      this.callbacks.onRoutesReady(routes);
    }

    // Update Camera
    this.cameraTrauma = Math.max(0, this.cameraTrauma - realDt * 1.8);
    this.updateCamera(realDt, speedRatio);

    // Throttled HUD sync (~15Hz)
    this.hudEmitTimer += realDt;
    if (this.hudEmitTimer >= 0.065) {
      this.hudEmitTimer = 0;
      this.emitHud();
    }
  }

  private resolveCollisions(simDt: number): void {
    const pBottom = this.currentAltitudeY + this.playerY;
    const pTop = pBottom + (this.crouchTimer > 0 ? 0.9 : 1.7);
    const pRadiusX = 0.9;
    const pRadiusZ = 1.5;

    const obstacles = this.world.getObstacles();
    const projectiles = this.world.getProjectiles();

    // 1. Projectiles vs Obstacles & Boss
    for (const pr of projectiles) {
      if (!pr.active) continue;
      if (pr.fromBoss) {
        // Boss projectile vs Player
        if (
          Math.abs(pr.x - this.playerX) < 1.1 &&
          Math.abs(pr.z - 0) < 1.6 &&
          pr.y >= pBottom &&
          pr.y <= pTop + 0.5
        ) {
          pr.active = false;
          pr.mesh.visible = false;
          this.handlePlayerHit();
        }
        continue;
      }

      // Player projectile vs Boss
      if (this.activeBossConfig && this.activeBossRig) {
        const bx = this.bossX;
        const by = this.currentAltitudeY + 3.2;
        const bz = -36;
        if (Math.abs(pr.x - bx) < 4.5 && Math.abs(pr.y - by) < 3.6 && Math.abs(pr.z - bz) < 3.8) {
          pr.active = false;
          pr.mesh.visible = false;
          this.damageBoss(pr.damage);
          this.world.spawnExplosion(pr.x, pr.y, pr.z, 0x00f0ff, 5);
          continue;
        }
      }

      // Player projectile vs Obstacles
      for (const obs of obstacles) {
        if (!obs.active || !obs.destructible) continue;
        const obsWorldX = obs.visualX;
        const obsWorldY = obs.visualY;
        if (
          Math.abs(pr.x - obsWorldX) < obs.halfWidth + 0.5 &&
          Math.abs(pr.z - obs.z) < obs.halfDepth + 0.9 &&
          pr.y >= obsWorldY &&
          pr.y <= obsWorldY + obs.halfHeight * 2.4
        ) {
          if (!pr.pierce) {
            pr.active = false;
            pr.mesh.visible = false;
          }
          obs.hp -= pr.damage;
          obs.hitFlashTimer = 0.06;
          audioManager.playHit();
          haptics.trigger('hit');
          this.world.spawnExplosion(pr.x, pr.y, pr.z, 0xfbbf24, 4);

          const ratio = Math.max(0, obs.hp / obs.maxHp);
          obs.hpBarFill.scale.x = Math.max(0.001, ratio);
          obs.hpBarFill.position.x = -(1 - ratio);

          if (obs.hp <= 0) {
            obs.active = false;
            obs.mesh.visible = false;
            this.obstaclesDestroyed++;
            this.combo = advanceCombo(this.combo, 0.25);
            this.maxCombo = Math.max(this.maxCombo, this.combo);
            this.comboTimer = PHYSICS_CONFIG.comboDuration;
            const gained = Math.round(obs.rewardCoins * this.combo * this.currentDim.coinBonusMult);
            this.runCoins += gained;
            this.score += Math.round(120 * this.combo);
            this.overdriveCharge = Math.min(100, this.overdriveCharge + 14);
            this.hitstopTimer = 0.035;
            this.cameraTrauma = Math.min(1, this.cameraTrauma + 0.25);
            audioManager.playExplosion();
            haptics.trigger('explosion');
            this.world.spawnExplosion(obsWorldX, obsWorldY + 1, obs.z, 0xf97316, 16);
            this.pushNotification(`+${gained}`, '#facc15');
          }
          if (!pr.pierce) break;
        }
      }
    }

    // 2. Player vs Obstacles
    for (const obs of obstacles) {
      if (!obs.active) continue;
      const obsWorldX = obs.visualX;
      const obsWorldY = obs.visualY;
      if (
        Math.abs(obsWorldX - this.playerX) < obs.halfWidth + pRadiusX &&
        Math.abs(obs.z - 0) < obs.halfDepth + pRadiusZ
      ) {
        const obsBottom = obs.requiresCrouch ? obsWorldY + 1.55 : obsWorldY;
        const obsTop = obs.requiresCrouch ? obsWorldY + 3.2 : obsWorldY + obs.halfHeight * 2;
        if (pTop > obsBottom && pBottom < obsTop) {
          if (this.overdriveTimer > 0) {
            // Smash through during Overdrive!
            obs.active = false;
            obs.mesh.visible = false;
            this.obstaclesDestroyed++;
            this.runCoins += 35;
            audioManager.playExplosion();
            haptics.trigger('explosion');
            this.world.spawnExplosion(obsWorldX, obsWorldY + 1, obs.z, 0x00f0ff, 14);
          } else {
            obs.active = false;
            obs.mesh.visible = false;
            this.handlePlayerHit();
          }
        }
      }
    }

    // 3. Player vs Coins
    for (const coin of this.world.getCoins()) {
      if (!coin.active) continue;
      if (
        Math.abs(coin.x - this.playerX) < 1.5 &&
        Math.abs(coin.z - 0) < 1.8 &&
        Math.abs(coin.y - (pBottom + 0.9)) < 1.8
      ) {
        coin.active = false;
        coin.mesh.visible = false;
        this.combo = advanceCombo(this.combo, coin.isGem ? 0.35 : 0.1);
        this.maxCombo = Math.max(this.maxCombo, this.combo);
        this.comboTimer = PHYSICS_CONFIG.comboDuration;
        const gained = Math.round(coin.value * this.combo * this.currentDim.coinBonusMult);
        this.runCoins += gained;
        this.score += gained * 2;
        this.overdriveCharge = Math.min(100, this.overdriveCharge + (coin.isGem ? 12 : 4));
        audioManager.playCoin(this.combo);
        haptics.trigger(coin.isGem ? 'gem' : 'coin');
        this.world.spawnExplosion(coin.x, coin.y, coin.z, coin.isGem ? 0x38bdf8 : 0xfacc15, 5);
      }
    }

    // 4. Player vs PowerUps
    for (const pu of this.world.getPowerUps()) {
      if (!pu.active) continue;
      if (
        Math.abs(pu.x - this.playerX) < 1.7 &&
        Math.abs(pu.z - 0) < 2.0 &&
        Math.abs(pu.y - (pBottom + 0.9)) < 2.0
      ) {
        pu.active = false;
        pu.mesh.visible = false;
        audioManager.playOverdrive();
        haptics.trigger('powerup');
        if (pu.kind === 'HEART') {
          this.hearts = Math.min(this.maxHearts, this.hearts + 1);
          this.pushNotification('+1 HEART', '#f43f5e');
        } else if (pu.kind === 'SHIELD') {
          this.shieldTimer = 8.0;
          this.pushNotification(t(this.saveData.language, 'shield'), '#00f0ff');
        } else {
          this.magnetTimer = 9.0;
          this.pushNotification(t(this.saveData.language, 'magnet'), '#a855f7');
        }
        this.emitHud();
      }
    }
    void simDt;
  }

  private handlePlayerHit(): void {
    if (this.invulnTimer > 0 || this.overdriveTimer > 0) return;

    if (this.shieldTimer > 0) {
      this.shieldTimer = 0;
      this.invulnTimer = 0.8;
      this.cameraTrauma = Math.min(1, this.cameraTrauma + 0.45);
      audioManager.playExplosion();
      haptics.trigger('shield_absorb');
      this.world.spawnExplosion(this.playerX, this.currentAltitudeY + 1, 0, 0x00f0ff, 14);
      this.emitHud();
      return;
    }

    this.hearts = Math.max(0, this.hearts - 1);
    this.invulnTimer = PHYSICS_CONFIG.invulnerabilityDuration;
    this.hitstopTimer = 0.055;
    this.cameraTrauma = Math.min(1, this.cameraTrauma + 0.72);
    this.combo = 1.0;
    this.comboTimer = 0;
    audioManager.playCollision();
    haptics.trigger('collision');
    this.world.spawnExplosion(this.playerX, this.currentAltitudeY + 1, 0, 0xf43f5e, 18);

    if (this.hearts <= 0) {
      this.finishRun();
    } else {
      this.emitHud();
    }
  }

  private spawnBoss(): void {
    this.bossCount++;
    this.nextBossDistance += PHYSICS_CONFIG.bossIntervalMeters;
    const cfg = generateBossConfig(this.bossCount, this.distance);
    this.activeBossConfig = cfg;
    this.bossHp = cfg.maxHp;
    this.bossLane = 1;
    this.bossX = 0;
    this.bossAttackTimer = 2.0;
    this.bossTelegraphTimer = 0;
    this.bossWarningText = t(this.saveData.language, 'boss_warning');

    this.activeBossRig = buildBossMesh(cfg);
    this.activeBossRig.root.position.set(0, this.currentAltitudeY + 3.2, -36);
    this.scene.add(this.activeBossRig.root);

    audioManager.playBossWarning();
    haptics.trigger('boss_warning');
    this.setState('BOSS_BATTLE');
  }

  private updateBoss(simDt: number): void {
    if (!this.activeBossConfig || !this.activeBossRig) return;

    // Hover & strafe
    const targetX = LANE_POSITIONS[this.bossLane];
    this.bossX = THREE.MathUtils.damp(this.bossX, targetX, 3.2, simDt);
    this.activeBossRig.root.position.set(
      this.bossX,
      this.currentAltitudeY + 3.2 + Math.sin(performance.now() * 0.003) * 0.65,
      -36
    );
    this.activeBossRig.wingsGroup.rotation.z = Math.sin(performance.now() * 0.002) * 0.1;

    if (this.bossFlashTimer > 0) {
      this.bossFlashTimer -= simDt;
      for (const m of this.activeBossRig.hitFlashMaterials) {
        m.emissive.setHex(this.bossFlashTimer > 0 ? 0xffffff : 0x000000);
      }
    }

    if (this.bossTelegraphTimer > 0) {
      this.bossTelegraphTimer -= simDt;
      this.activeBossRig.coreMesh.scale.setScalar(1.3 + Math.sin(performance.now() * 0.03) * 0.25);
      if (this.bossTelegraphTimer <= 0) {
        this.activeBossRig.coreMesh.scale.setScalar(1);
        this.bossWarningText = null;
        // Fire boss projectile down the telegraphed lane
        const tx = LANE_POSITIONS[this.bossTargetLane];
        this.world.spawnProjectile(
          tx,
          this.currentAltitudeY + 1.1,
          -34,
          0,
          0,
          44,
          1,
          this.activeBossConfig.coreColor,
          true,
          false,
          false,
          1.7
        );
        audioManager.playBossAttack();
      }
      return;
    }

    this.bossAttackTimer -= simDt;
    if (this.bossAttackTimer <= 0) {
      this.bossAttackTimer = this.activeBossConfig.attackInterval;
      this.bossTargetLane = this.targetLane;
      this.bossLane = this.bossTargetLane;
      this.bossTelegraphTimer = 0.65;
      const laneName = this.bossTargetLane === 0 ? 'LEFT' : this.bossTargetLane === 1 ? 'CENTER' : 'RIGHT';
      this.bossWarningText = `INCOMING STRIKE · ${laneName}`;
    }
  }

  private damageBoss(dmg: number): void {
    if (!this.activeBossConfig) return;
    this.bossHp = Math.max(0, this.bossHp - dmg);
    this.bossFlashTimer = 0.06;
    if (this.bossHp <= 0) {
      const reward = this.activeBossConfig.rewardCoins;
      this.bossesDefeated++;
      this.runCoins += reward;
      this.score += reward * 4;
      this.overdriveCharge = 100;
      this.hitstopTimer = 0.075;
      this.cameraTrauma = 0.9;
      audioManager.playBossDefeat();
      haptics.trigger('boss_defeat');
      crazyGames.happytime();
      this.world.spawnExplosion(this.bossX, this.currentAltitudeY + 3.2, -36, this.activeBossConfig.coreColor, 34);
      this.pushNotification(`${t(this.saveData.language, 'boss_defeated')} +${reward}`, '#facc15');
      this.clearBoss();
      this.setState('GAMEPLAY');
    }
  }

  private finishRun(): void {
    this.clearBoss();
    audioManager.stopEngine();
    crazyGames.gameplayStop();
    if (this.score > this.saveData.highScore && this.score > 0) {
      crazyGames.happytime();
    }
    const finalStats: RunStats = {
      distance: Math.round(this.distance),
      score: Math.round(this.score),
      coinsEarned: this.runCoins,
      obstaclesDestroyed: this.obstaclesDestroyed,
      bossesDefeated: this.bossesDefeated,
      maxCombo: Number(this.maxCombo.toFixed(1)),
    };
    this.setState('GAME_OVER');
    this.callbacks.onRunComplete(finalStats);
  }

  private updateCamera(dt: number, speedRatio: number): void {
    const isPortrait = this.camera.aspect < 1;
    const baseFov = isPortrait ? 68 : 64;
    const targetFov = baseFov + Math.max(0, speedRatio - 0.5) * 11 + (this.overdriveTimer > 0 ? 8 : 0);
    this.camera.fov = THREE.MathUtils.damp(this.camera.fov, targetFov, 6, dt);
    this.camera.updateProjectionMatrix();

    const shake = this.cameraTrauma * this.cameraTrauma;
    const sx = (Math.random() - 0.5) * shake * 0.75;
    const sy = (Math.random() - 0.5) * shake * 0.55;

    const portraitPull = isPortrait ? (1 - this.camera.aspect) * 3.4 : 0;
    const baseCamY = this.currentAltitudeY + 6.4 + portraitPull * 0.45 + this.playerY * 0.48;
    const baseCamZ = 9.8 + portraitPull;
    this._camPos.set(this.playerX * 0.68 + sx, baseCamY + sy, baseCamZ);
    this.camera.position.lerp(this._camPos, 1 - Math.exp(-10 * dt));

    this._lookTarget.set(this.playerX * 0.42, this.currentAltitudeY + 0.85 + this.playerY * 0.35, -22);
    this.camera.lookAt(this._lookTarget);
  }

  private emitHud(): void {
    const v = getVehicleById(this.saveData.selectedVehicle);
    const isOd = this.overdriveTimer > 0;
    const stats = getEffectiveStats(v, this.saveData.upgrades, isOd);

    this.callbacks.onHudUpdate({
      distance: Math.round(this.distance),
      score: Math.round(this.score),
      runCoins: this.runCoins,
      totalCoins: this.saveData.coins + this.runCoins,
      combo: Number(this.combo.toFixed(1)),
      comboTimerRatio: Math.max(0, Math.min(1, this.comboTimer / PHYSICS_CONFIG.comboDuration)),
      hearts: this.hearts,
      maxHearts: this.maxHearts,
      shieldActive: this.shieldTimer > 0,
      shieldTimer: Number(this.shieldTimer.toFixed(1)),
      magnetActive: this.magnetTimer > 0,
      magnetTimer: Number(this.magnetTimer.toFixed(1)),
      overdriveCharge: Math.round(this.overdriveCharge),
      overdriveActive: isOd,
      overdriveTimer: Number(this.overdriveTimer.toFixed(1)),
      currentSpeedKmh: Math.round(this.currentSpeedKmh),
      maxSpeedKmh: stats.maxSpeedKmh,
      isAtMaxSpeed: this.currentSpeedKmh >= stats.maxSpeedKmh - 8,
      altitude: this.altitude,
      dimensionId: this.currentDim.id,
      bossActive: this.activeBossConfig !== null,
      bossName: this.activeBossConfig?.name ?? '',
      bossHp: this.bossHp,
      bossMaxHp: this.activeBossConfig?.maxHp ?? 1,
      bossWarning: this.bossWarningText,
      alertMessage: this.alertMessage,
      floatingNotification: this.lastNotif,
    });
  }

  dispose(): void {
    this.isDisposed = true;
    this.pauseLoop();
    audioManager.stopEngine();
    audioManager.stopMusic();
    this.resizeObserver?.disconnect();
    window.removeEventListener('resize', this.handleResize);
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.domElement.remove();
    }
  }
}
