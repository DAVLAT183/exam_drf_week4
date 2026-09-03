import * as THREE from 'three';

export interface GameState {
  health: number;
  maxHealth: number;
  score: number;
  wave: number;
  zombiesAlive: number;
  zombiesKilled: number;
  zombiesInWave: number;
  currentAmmo: number;
  maxAmmo: number;
  totalAmmo: number;
  currentWeapon: string;
  weapons: WeaponState[];
  isReloading: boolean;
  gameOver: boolean;
  isPaused: boolean;
  waveActive: boolean;
  message: string;
  messageTimer: number;
}

export interface WeaponState {
  name: string;
  damage: number;
  fireRate: number;
  reloadTime: number;
  ammoPerClip: number;
  spread: number;
  soundFreq: number;
  color: number;
}

interface Zombie {
  mesh: THREE.Group;
  health: number;
  maxHealth: number;
  speed: number;
  damage: number;
  attackCooldown: number;
  isAttacking: boolean;
  type: 'normal' | 'fast' | 'tank';
  hitFlash: number;
}

interface Bullet {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
  damage: number;
}

interface Pickup {
  mesh: THREE.Group;
  type: 'health' | 'ammo';
  respawnTimer: number;
}

export type GameEventCallback = (state: GameState) => void;

export class GameEngine {
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private clock!: THREE.Clock;

  private container!: HTMLElement;
  private animationId = 0;
  private gameLoop: (() => void) | null = null;
  private isRunning = false;
  private startClickHandler: (() => void) | null = null;
  private reloadTimeout: ReturnType<typeof setTimeout> | null = null;

  private state!: GameState;
  private onStateChange: GameEventCallback | null = null;

  private zombies: Zombie[] = [];
  private bullets: Bullet[] = [];
  private pickups: Pickup[] = [];
  private obstacles: THREE.Mesh[] = [];
  private arenaRoot: THREE.Group | null = null;

  private keys: { [key: string]: boolean } = {};
  private mouseMovement: { x: number; y: number } = { x: 0, y: 0 };
  private isPointerLocked = false;
  private mouseHeld = false;

  private playerVelocity: THREE.Vector3 = new THREE.Vector3();
  private playerOnGround: boolean = true;
  private playerHeight: number = 1.8;
  private moveSpeed: number = 8;
  private jumpForce: number = 7;
  private gravity: number = -20;

  private yaw: number = 0;
  private pitch: number = 0;
  private sensitivity: number = 0.002;

  private weaponBobTimer = 0;
  private lastShotAt = 0;
  private ammoByWeapon: Record<string, { current: number; reserve: number }> = {};
  private weaponBobIntensity: number = 0;
  private recoilTimer: number = 0;

  private muzzleFlash!: THREE.PointLight;
  private weaponModel: THREE.Group | null = null;
  private muzzleFlashTimer: number = 0;

  private crosshairElement: HTMLElement | null = null;
  private hitMarkerTimer: number = 0;

  private waveTimer: number = 0;
  private zombiesToSpawn: number = 0;
  private spawnTimer: number = 0;

  private audioCtx: AudioContext | null = null;

  private raycaster = new THREE.Raycaster();
  private readonly worldUp = new THREE.Vector3(0, 1, 0);
  private readonly playerCenter = new THREE.Vector3();
  private readonly tempVector = new THREE.Vector3();

  constructor() {
    this.init();
  }

  private init() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a0a0a);
    this.scene.fog = new THREE.FogExp2(0x1a0a0a, 0.025);

    this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 200);
    this.camera.position.set(0, this.playerHeight, 0);

    this.clock = new THREE.Clock();

    this.state = this.createInitialState();
    this.syncAmmoCacheFromState();

    this.setupLights();
    this.createArena();
    this.createWeaponModel();
    this.createCrosshair();

    this.muzzleFlash = new THREE.PointLight(0xff8800, 0, 8);
    this.muzzleFlash.position.set(0.3, -0.2, -1);
    this.camera.add(this.muzzleFlash);
    this.scene.add(this.camera);

    // AudioContext may be blocked until the first user gesture.
    this.audioCtx = null;
  }

  private createInitialState(): GameState {
    return {
      health: 100,
      maxHealth: 100,
      score: 0,
      wave: 0,
      zombiesAlive: 0,
      zombiesKilled: 0,
      zombiesInWave: 0,
      currentAmmo: 12,
      maxAmmo: 12,
      totalAmmo: 60,
      currentWeapon: 'Pistol',
      weapons: [
        { name: 'Pistol', damage: 25, fireRate: 400, reloadTime: 1500, ammoPerClip: 12, spread: 0.02, soundFreq: 800, color: 0x4F7CFF },
        { name: 'Shotgun', damage: 60, fireRate: 900, reloadTime: 2500, ammoPerClip: 6, spread: 0.12, soundFreq: 200, color: 0xff4444 },
        { name: 'Rifle', damage: 35, fireRate: 120, reloadTime: 2000, ammoPerClip: 30, spread: 0.04, soundFreq: 600, color: 0x44ff44 },
      ],
      isReloading: false,
      gameOver: false,
      isPaused: false,
      waveActive: false,
      message: '',
      messageTimer: 0,
    };
  }

  private setupLights() {
    const ambient = new THREE.AmbientLight(0x331111, 0.6);
    this.scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xff6644, 0.8);
    dirLight.position.set(20, 30, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 100;
    dirLight.shadow.camera.left = -40;
    dirLight.shadow.camera.right = 40;
    dirLight.shadow.camera.top = 40;
    dirLight.shadow.camera.bottom = -40;
    this.scene.add(dirLight);

    const moonLight = new THREE.DirectionalLight(0x4466ff, 0.3);
    moonLight.position.set(-10, 20, -10);
    this.scene.add(moonLight);
  }

  private createArena() {
    const ARENA_SIZE = 50;

    const floorGeo = new THREE.PlaneGeometry(ARENA_SIZE * 2, ARENA_SIZE * 2);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x2a1a1a,
      roughness: 0.9,
      metalness: 0.1,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    const gridHelper = new THREE.GridHelper(ARENA_SIZE * 2, 40, 0x331111, 0x221111);
    gridHelper.position.y = 0.01;
    this.scene.add(gridHelper);

    this.createWalls(ARENA_SIZE);
    this.createCrates();
    this.createBarrels();
    this.createLightPosts();
    this.createSkybox();
  }

  private createWalls(size: number) {
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x3a2a2a,
      roughness: 0.8,
      metalness: 0.2,
    });
    const wallHeight = 4;
    const wallThickness = 0.5;

    const walls = [
      { pos: [0, wallHeight / 2, -size], rot: [0, 0, 0], w: size * 2, h: wallHeight },
      { pos: [0, wallHeight / 2, size], rot: [0, 0, 0], w: size * 2, h: wallHeight },
      { pos: [-size, wallHeight / 2, 0], rot: [0, Math.PI / 2, 0], w: size * 2, h: wallHeight },
      { pos: [size, wallHeight / 2, 0], rot: [0, Math.PI / 2, 0], w: size * 2, h: wallHeight },
    ];

    walls.forEach((w) => {
      const geo = new THREE.BoxGeometry(w.w, w.h, wallThickness);
      const mesh = new THREE.Mesh(geo, wallMat);
      mesh.position.set(w.pos[0], w.pos[1], w.pos[2]);
      mesh.rotation.set(w.rot[0], w.rot[1], w.rot[2]);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.scene.add(mesh);
      this.obstacles.push(mesh);
    });
  }

  private createCrates() {
    const crateMat = new THREE.MeshStandardMaterial({
      color: 0x8B5E3C,
      roughness: 0.9,
      metalness: 0.0,
    });
    const edgeMat = new THREE.MeshStandardMaterial({
      color: 0x654321,
      roughness: 0.8,
      metalness: 0.1,
    });

    const positions: [number, number, number][] = [
      [8, 1, 8],
      [-10, 1, -10],
      [12, 1, -15],
      [-8, 1, 15],
      [20, 1, 5],
      [-20, 1, -5],
      [0, 1, 20],
      [0, 1, -20],
      [15, 1, 15],
      [-15, 1, -15],
    ];

    positions.forEach((pos) => {
      const group = new THREE.Group();
      const size = 1.5 + Math.random() * 1;
      const boxGeo = new THREE.BoxGeometry(size, size, size);
      const box = new THREE.Mesh(boxGeo, crateMat);
      box.castShadow = true;
      box.receiveShadow = true;
      group.add(box);

      const edgeGeo = new THREE.EdgesGeometry(boxGeo);
      const edgeLine = new THREE.LineSegments(edgeGeo, new THREE.LineBasicMaterial({ color: 0x443322 }));
      group.add(edgeLine);

      group.position.set(pos[0], pos[1], pos[2]);
      group.rotation.y = Math.random() * Math.PI * 2;
      this.scene.add(group);

      const hitBox = new THREE.Mesh(
        new THREE.BoxGeometry(size, size, size),
        new THREE.MeshStandardMaterial({ visible: false })
      );
      hitBox.position.copy(group.position);
      this.scene.add(hitBox);
      this.obstacles.push(hitBox);
    });
  }

  private createBarrels() {
    const barrelMat = new THREE.MeshStandardMaterial({
      color: 0x444444,
      roughness: 0.6,
      metalness: 0.4,
    });

    const positions: [number, number, number][] = [
      [5, 0.75, -8],
      [-12, 0.75, 8],
      [18, 0.75, -12],
      [-5, 0.75, -18],
      [10, 0.75, 18],
    ];

    positions.forEach((pos) => {
      const geo = new THREE.CylinderGeometry(0.5, 0.5, 1.5, 12);
      const barrel = new THREE.Mesh(geo, barrelMat);
      barrel.position.set(pos[0], pos[1], pos[2]);
      barrel.castShadow = true;
      barrel.receiveShadow = true;
      this.scene.add(barrel);

      const ringGeo = new THREE.TorusGeometry(0.52, 0.04, 8, 16);
      const ringMat = new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.7 });
      const ring1 = new THREE.Mesh(ringGeo, ringMat);
      ring1.position.y = 0.4;
      ring1.rotation.x = Math.PI / 2;
      barrel.add(ring1);

      const ring2 = ring1.clone();
      ring2.position.y = -0.4;
      barrel.add(ring2);

      this.obstacles.push(barrel);
    });
  }

  private createLightPosts() {
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.6 });
    const lightMat = new THREE.MeshStandardMaterial({ color: 0xffaa44, emissive: 0xffaa44, emissiveIntensity: 2 });

    const positions: [number, number][] = [
      [20, 20],
      [-20, 20],
      [20, -20],
      [-20, -20],
    ];

    positions.forEach(([x, z]) => {
      const poleGeo = new THREE.CylinderGeometry(0.1, 0.1, 5, 8);
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.set(x, 2.5, z);
      pole.castShadow = true;
      this.scene.add(pole);

      const lightGeo = new THREE.SphereGeometry(0.3, 8, 8);
      const light = new THREE.Mesh(lightGeo, lightMat);
      light.position.set(x, 5.2, z);
      this.scene.add(light);

      const pointLight = new THREE.PointLight(0xffaa44, 1.5, 25);
      pointLight.position.set(x, 5, z);
      this.scene.add(pointLight);
    });
  }

  private createSkybox() {
    const starCount = 200;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      starPositions[i * 3] = (Math.random() - 0.5) * 200;
      starPositions[i * 3 + 1] = 20 + Math.random() * 50;
      starPositions[i * 3 + 2] = (Math.random() - 0.5) * 200;
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffaa, size: 0.3, transparent: true, opacity: 0.8 });
    const stars = new THREE.Points(starGeo, starMat);
    this.scene.add(stars);

    const moonGeo = new THREE.SphereGeometry(3, 16, 16);
    const moonMat = new THREE.MeshBasicMaterial({ color: 0xffffee });
    const moon = new THREE.Mesh(moonGeo, moonMat);
    moon.position.set(30, 40, -30);
    this.scene.add(moon);

    const moonLight = new THREE.PointLight(0xffffdd, 0.5, 100);
    moonLight.position.copy(moon.position);
    this.scene.add(moonLight);
  }

  private createWeaponModel() {
    const weaponGroup = new THREE.Group();

    const brushedSteel = new THREE.MeshStandardMaterial({
      color: 0x4a4a4a,
      metalness: 0.85,
      roughness: 0.25,
    });

    const darkSteel = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      metalness: 0.9,
      roughness: 0.2,
    });

    const carbonFiber = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      metalness: 0.3,
      roughness: 0.4,
    });

    const matteBlack = new THREE.MeshStandardMaterial({
      color: 0x111111,
      metalness: 0.5,
      roughness: 0.6,
    });

    const gripTexture = new THREE.MeshStandardMaterial({
      color: 0x151515,
      metalness: 0.2,
      roughness: 0.9,
    });

    const lensMat = new THREE.MeshStandardMaterial({
      color: 0x112244,
      metalness: 0.1,
      roughness: 0.05,
      transparent: true,
      opacity: 0.6,
    });

    const glowMat = new THREE.MeshStandardMaterial({
      color: 0x4F7CFF,
      emissive: 0x4F7CFF,
      emissiveIntensity: 1.5,
    });

    const receiverGeo = new THREE.BoxGeometry(0.045, 0.045, 0.22);
    const receiver = new THREE.Mesh(receiverGeo, brushedSteel);
    receiver.position.set(0, 0, -0.18);
    weaponGroup.add(receiver);

    const receiverTopGeo = new THREE.BoxGeometry(0.048, 0.008, 0.22);
    const receiverTop = new THREE.Mesh(receiverTopGeo, darkSteel);
    receiverTop.position.set(0, 0.026, -0.18);
    weaponGroup.add(receiverTop);

    const railGeo = new THREE.BoxGeometry(0.03, 0.005, 0.2);
    const rail = new THREE.Mesh(railGeo, matteBlack);
    rail.position.set(0, 0.033, -0.18);
    weaponGroup.add(rail);

    for (let i = 0; i < 8; i++) {
      const slotGeo = new THREE.BoxGeometry(0.028, 0.006, 0.004);
      const slot = new THREE.Mesh(slotGeo, darkSteel);
      slot.position.set(0, 0.033, -0.1 + i * -0.025);
      weaponGroup.add(slot);
    }

    const barrelOuterGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.42, 12);
    const barrelOuter = new THREE.Mesh(barrelOuterGeo, darkSteel);
    barrelOuter.rotation.x = Math.PI / 2;
    barrelOuter.position.set(0, 0.005, -0.5);
    weaponGroup.add(barrelOuter);

    const barrelInnerGeo = new THREE.CylinderGeometry(0.009, 0.009, 0.44, 12);
    const barrelInner = new THREE.Mesh(barrelInnerGeo, matteBlack);
    barrelInner.rotation.x = Math.PI / 2;
    barrelInner.position.set(0, 0.005, -0.5);
    weaponGroup.add(barrelInner);

    const muzzleBrakeGeo = new THREE.CylinderGeometry(0.016, 0.014, 0.06, 12);
    const muzzleBrake = new THREE.Mesh(muzzleBrakeGeo, brushedSteel);
    muzzleBrake.rotation.x = Math.PI / 2;
    muzzleBrake.position.set(0, 0.005, -0.73);
    weaponGroup.add(muzzleBrake);

    for (let i = 0; i < 4; i++) {
      const portGeo = new THREE.CylinderGeometry(0.004, 0.004, 0.032, 6);
      const port = new THREE.Mesh(portGeo, matteBlack);
      port.rotation.z = Math.PI / 2;
      port.position.set(0.014, 0.005, -0.7 + i * 0.012);
      weaponGroup.add(port);
      const port2 = port.clone();
      port2.position.x = -0.014;
      weaponGroup.add(port2);
    }

    const scopeTubeGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.14, 16);
    const scopeTube = new THREE.Mesh(scopeTubeGeo, darkSteel);
    scopeTube.rotation.x = Math.PI / 2;
    scopeTube.position.set(0, 0.055, -0.2);
    weaponGroup.add(scopeTube);

    const scopeFrontGeo = new THREE.CylinderGeometry(0.022, 0.018, 0.03, 16);
    const scopeFront = new THREE.Mesh(scopeFrontGeo, brushedSteel);
    scopeFront.rotation.x = Math.PI / 2;
    scopeFront.position.set(0, 0.055, -0.28);
    weaponGroup.add(scopeFront);

    const scopeRearGeo = new THREE.CylinderGeometry(0.02, 0.018, 0.025, 16);
    const scopeRear = new THREE.Mesh(scopeRearGeo, brushedSteel);
    scopeRear.rotation.x = Math.PI / 2;
    scopeRear.position.set(0, 0.055, -0.12);
    weaponGroup.add(scopeRear);

    const lensFrontGeo = new THREE.CircleGeometry(0.02, 16);
    const lensFront = new THREE.Mesh(lensFrontGeo, lensMat);
    lensFront.position.set(0, 0.055, -0.296);
    weaponGroup.add(lensFront);

    const lensRearGeo = new THREE.CircleGeometry(0.016, 16);
    const lensRear = new THREE.Mesh(lensRearGeo, lensMat);
    lensRear.rotation.y = Math.PI;
    lensRear.position.set(0, 0.055, -0.107);
    weaponGroup.add(lensRear);

    const lensGlowGeo = new THREE.CircleGeometry(0.012, 16);
    const lensGlow = new THREE.Mesh(lensGlowGeo, glowMat);
    lensGlow.position.set(0, 0.055, -0.297);
    weaponGroup.add(lensGlow);

    const mountGeo = new THREE.BoxGeometry(0.012, 0.015, 0.03);
    const mount1 = new THREE.Mesh(mountGeo, matteBlack);
    mount1.position.set(0, 0.043, -0.17);
    weaponGroup.add(mount1);
    const mount2 = mount1.clone();
    mount2.position.z = -0.23;
    weaponGroup.add(mount2);

    const turretGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.015, 8);
    const turret1 = new THREE.Mesh(turretGeo, brushedSteel);
    turret1.rotation.z = Math.PI / 2;
    turret1.position.set(0.018, 0.06, -0.13);
    weaponGroup.add(turret1);
    const turret2 = turret1.clone();
    turret2.position.set(0.018, 0.05, -0.13);
    weaponGroup.add(turret2);

    const stockBaseGeo = new THREE.BoxGeometry(0.035, 0.04, 0.12);
    const stockBase = new THREE.Mesh(stockBaseGeo, carbonFiber);
    stockBase.position.set(0, -0.005, -0.04);
    weaponGroup.add(stockBase);

    const stockTopGeo = new THREE.BoxGeometry(0.03, 0.02, 0.08);
    const stockTop = new THREE.Mesh(stockTopGeo, carbonFiber);
    stockTop.position.set(0, 0.01, -0.02);
    weaponGroup.add(stockTop);

    const stockPadGeo = new THREE.BoxGeometry(0.038, 0.045, 0.015);
    const stockPad = new THREE.Mesh(stockPadGeo, gripTexture);
    stockPad.position.set(0, -0.005, 0.025);
    weaponGroup.add(stockPad);

    const cheekRestGeo = new THREE.BoxGeometry(0.04, 0.012, 0.06);
    const cheekRest = new THREE.Mesh(cheekRestGeo, gripTexture);
    cheekRest.position.set(0, 0.025, -0.02);
    weaponGroup.add(cheekRest);

    const gripGeo = new THREE.BoxGeometry(0.03, 0.08, 0.035);
    const grip = new THREE.Mesh(gripGeo, gripTexture);
    grip.position.set(0, -0.06, -0.13);
    grip.rotation.x = 0.25;
    weaponGroup.add(grip);

    const gripFingerGeo = new THREE.BoxGeometry(0.028, 0.02, 0.03);
    const gripFinger = new THREE.Mesh(gripFingerGeo, gripTexture);
    gripFinger.position.set(0, -0.095, -0.12);
    gripFinger.rotation.x = 0.15;
    weaponGroup.add(gripFinger);

    for (let i = 0; i < 4; i++) {
      const grooveGeo = new THREE.BoxGeometry(0.032, 0.003, 0.02);
      const groove = new THREE.Mesh(grooveGeo, matteBlack);
      groove.position.set(0, -0.05 - i * 0.015, -0.13);
      groove.rotation.x = 0.25;
      weaponGroup.add(groove);
    }

    const magGeo = new THREE.BoxGeometry(0.028, 0.07, 0.04);
    const mag = new THREE.Mesh(magGeo, darkSteel);
    mag.position.set(0, -0.055, -0.2);
    mag.rotation.x = 0.08;
    weaponGroup.add(mag);

    const magBaseGeo = new THREE.BoxGeometry(0.03, 0.008, 0.042);
    const magBase = new THREE.Mesh(magBaseGeo, matteBlack);
    magBase.position.set(0, -0.092, -0.2);
    weaponGroup.add(magBase);

    const magFloorGeo = new THREE.BoxGeometry(0.025, 0.005, 0.035);
    const magFloor = new THREE.Mesh(magFloorGeo, gripTexture);
    magFloor.position.set(0, -0.098, -0.2);
    weaponGroup.add(magFloor);

    const triggerGuardGeo = new THREE.TorusGeometry(0.02, 0.003, 8, 12, Math.PI);
    const triggerGuard = new THREE.Mesh(triggerGuardGeo, darkSteel);
    triggerGuard.position.set(0, -0.035, -0.14);
    triggerGuard.rotation.y = Math.PI / 2;
    weaponGroup.add(triggerGuard);

    const triggerGeo = new THREE.BoxGeometry(0.005, 0.015, 0.003);
    const trigger = new THREE.Mesh(triggerGeo, brushedSteel);
    trigger.position.set(0, -0.038, -0.14);
    trigger.rotation.x = 0.3;
    weaponGroup.add(trigger);

    const boltGeo = new THREE.CylinderGeometry(0.006, 0.006, 0.04, 8);
    const bolt = new THREE.Mesh(boltGeo, brushedSteel);
    bolt.rotation.z = Math.PI / 2;
    bolt.position.set(0.028, 0.01, -0.16);
    weaponGroup.add(bolt);

    const boltHandleGeo = new THREE.CylinderGeometry(0.004, 0.004, 0.025, 6);
    const boltHandle = new THREE.Mesh(boltHandleGeo, matteBlack);
    boltHandle.position.set(0.04, 0.01, -0.16);
    weaponGroup.add(boltHandle);

    const boltKnobGeo = new THREE.SphereGeometry(0.007, 8, 8);
    const boltKnob = new THREE.Mesh(boltKnobGeo, gripTexture);
    boltKnob.position.set(0.053, 0.01, -0.16);
    weaponGroup.add(boltKnob);

    const safetyGeo = new THREE.CylinderGeometry(0.004, 0.004, 0.02, 6);
    const safety = new THREE.Mesh(safetyGeo, new THREE.MeshStandardMaterial({
      color: 0x880000,
      metalness: 0.6,
      roughness: 0.4,
    }));
    safety.rotation.z = Math.PI / 2;
    safety.position.set(0.028, 0.02, -0.12);
    weaponGroup.add(safety);

    const foregripGeo = new THREE.BoxGeometry(0.038, 0.025, 0.06);
    const foregrip = new THREE.Mesh(foregripGeo, carbonFiber);
    foregrip.position.set(0, -0.02, -0.35);
    weaponGroup.add(foregrip);

    const bipodLegGeo = new THREE.CylinderGeometry(0.003, 0.003, 0.06, 6);
    const bipodMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.7, roughness: 0.3 });
    const bipodLeft = new THREE.Mesh(bipodLegGeo, bipodMat);
    bipodLeft.position.set(-0.02, -0.05, -0.38);
    bipodLeft.rotation.x = 0.3;
    weaponGroup.add(bipodLeft);
    const bipodRight = bipodLeft.clone();
    bipodRight.position.x = 0.02;
    weaponGroup.add(bipodRight);

    const bipodFootGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.01, 6);
    const bipodFoot = new THREE.Mesh(bipodFootGeo, gripTexture);
    bipodFoot.position.set(-0.02, -0.08, -0.395);
    weaponGroup.add(bipodFoot);
    const bipodFoot2 = bipodFoot.clone();
    bipodFoot2.position.x = 0.02;
    weaponGroup.add(bipodFoot2);

    const magReleaseGeo = new THREE.BoxGeometry(0.015, 0.008, 0.008);
    const magRelease = new THREE.Mesh(magReleaseGeo, brushedSteel);
    magRelease.position.set(0, -0.028, -0.19);
    weaponGroup.add(magRelease);

    weaponGroup.position.set(0.3, -0.3, -0.5);
    this.camera.add(weaponGroup);
  }

  private createCrosshair() {
    const crosshair = document.createElement('div');
    crosshair.style.cssText = `
      position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
      pointer-events: none; z-index: 100;
    `;
    const size = 20;
    const gap = 6;
    const thickness = 2;

    const directions = [
      { top: '0', left: '50%', width: `${thickness}px`, height: `${size - gap}px`, transform: 'translateX(-50%)' },
      { bottom: '0', left: '50%', width: `${thickness}px`, height: `${size - gap}px`, transform: 'translateX(-50%)' },
      { left: '0', top: '50%', width: `${size - gap}px`, height: `${thickness}px`, transform: 'translateY(-50%)' },
      { right: '0', top: '50%', width: `${size - gap}px`, height: `${thickness}px`, transform: 'translateY(-50%)' },
    ];

    directions.forEach((d) => {
      const line = document.createElement('div');
      line.style.cssText = `
        position: absolute; background: rgba(255,255,255,0.8);
        border-radius: 1px; transition: all 0.1s;
        ${Object.entries(d)
          .map(([k, v]) => `${k}: ${v}`)
          .join('; ')};
      `;
      crosshair.appendChild(line);
    });

    const dot = document.createElement('div');
    dot.style.cssText = `
      position: absolute; width: 4px; height: 4px; background: rgba(255,255,255,0.6);
      border-radius: 50%; top: 50%; left: 50%; transform: translate(-50%, -50%);
    `;
    crosshair.appendChild(dot);

    document.body.appendChild(crosshair);
    this.crosshairElement = crosshair;
  }

  private playSound(freq: number, duration = 0.1, type: OscillatorType = 'square') {
    try {
      if (!this.audioCtx) {
        const AudioContextCtor = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AudioContextCtor) return;
        this.audioCtx = new AudioContextCtor();
      }
      if (this.audioCtx.state === 'suspended') void this.audioCtx.resume();
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.5, this.audioCtx.currentTime + duration);
      gain.gain.setValueAtTime(0.15, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);
      osc.start();
      osc.stop(this.audioCtx.currentTime + duration);
    } catch {}
  }

  private playShootSound(weapon: WeaponState) {
    this.playSound(weapon.soundFreq, 0.15, 'sawtooth');
    setTimeout(() => this.playSound(weapon.soundFreq * 0.3, 0.1, 'sine'), 50);
  }

  private playHitSound() {
    this.playSound(1200, 0.05, 'sine');
  }

  private playZombieDeathSound() {
    this.playSound(150, 0.3, 'sawtooth');
    setTimeout(() => this.playSound(100, 0.2, 'sine'), 100);
  }

  private playZombieHitSound() {
    this.playSound(300, 0.1, 'square');
  }

  private playPickupSound() {
    this.playSound(800, 0.1, 'sine');
    setTimeout(() => this.playSound(1200, 0.1, 'sine'), 80);
    setTimeout(() => this.playSound(1600, 0.1, 'sine'), 160);
  }

  private playDamageSound() {
    this.playSound(200, 0.2, 'sawtooth');
  }

  private spawnZombie(type: 'normal' | 'fast' | 'tank' = 'normal') {
    const zombie = new THREE.Group();

    const bodyMat = new THREE.MeshStandardMaterial({
      color: type === 'tank' ? 0x2d5a1e : type === 'fast' ? 0x4a3728 : 0x3a5a2e,
      roughness: 0.8,
    });

    const bodyGeo = new THREE.BoxGeometry(0.6, 1.0, 0.4);
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 1.0;
    body.castShadow = true;
    zombie.add(body);

    const headGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
    const headMat = new THREE.MeshStandardMaterial({
      color: type === 'tank' ? 0x3a6a2e : 0x4a6a3e,
      roughness: 0.7,
    });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.7;
    head.castShadow = true;
    zombie.add(head);

    const eyeGeo = new THREE.SphereGeometry(0.06, 8, 8);
    const eyeMat = new THREE.MeshStandardMaterial({
      color: type === 'fast' ? 0xff0000 : 0xffff00,
      emissive: type === 'fast' ? 0xff0000 : 0xffff00,
      emissiveIntensity: 2,
    });
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.1, 1.75, 0.2);
    zombie.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.1, 1.75, 0.2);
    zombie.add(rightEye);

    const armGeo = new THREE.BoxGeometry(0.15, 0.7, 0.15);
    const leftArm = new THREE.Mesh(armGeo, bodyMat);
    leftArm.position.set(-0.45, 1.1, 0.15);
    leftArm.rotation.x = -0.5;
    zombie.add(leftArm);

    const rightArm = new THREE.Mesh(armGeo, bodyMat);
    rightArm.position.set(0.45, 1.1, 0.15);
    rightArm.rotation.x = -0.5;
    zombie.add(rightArm);

    const legGeo = new THREE.BoxGeometry(0.2, 0.6, 0.2);
    const leftLeg = new THREE.Mesh(legGeo, bodyMat);
    leftLeg.position.set(-0.15, 0.3, 0);
    zombie.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeo, bodyMat);
    rightLeg.position.set(0.15, 0.3, 0);
    zombie.add(rightLeg);

    const angle = Math.random() * Math.PI * 2;
    const dist = 30 + Math.random() * 15;
    zombie.position.set(Math.cos(angle) * dist, 0, Math.sin(angle) * dist);
    zombie.lookAt(this.camera.position.x, 0, this.camera.position.z);

    this.scene.add(zombie);

    const configs = {
      normal: { health: 60, speed: 3, damage: 10 },
      fast: { health: 30, speed: 6, damage: 8 },
      tank: { health: 150, speed: 2, damage: 20 },
    };

    const cfg = configs[type];
    this.zombies.push({
      mesh: zombie,
      health: cfg.health,
      maxHealth: cfg.health,
      speed: cfg.speed,
      damage: cfg.damage,
      attackCooldown: 0,
      isAttacking: false,
      type,
      hitFlash: 0,
    });
  }

  private spawnPickup(type: 'health' | 'ammo', position: THREE.Vector3) {
    const group = new THREE.Group();

    if (type === 'health') {
      const crossGeo = new THREE.BoxGeometry(0.3, 0.08, 0.08);
      const crossMat = new THREE.MeshStandardMaterial({
        color: 0xff3333,
        emissive: 0xff3333,
        emissiveIntensity: 0.5,
      });
      const h1 = new THREE.Mesh(crossGeo, crossMat);
      h1.position.y = 1.5;
      group.add(h1);

      const h2 = new THREE.Mesh(crossGeo.clone(), crossMat);
      h2.rotation.z = Math.PI / 2;
      h2.position.y = 1.5;
      group.add(h2);
    } else {
      const boxGeo = new THREE.BoxGeometry(0.25, 0.15, 0.35);
      const boxMat = new THREE.MeshStandardMaterial({
        color: 0xddaa22,
        emissive: 0xddaa22,
        emissiveIntensity: 0.3,
        metalness: 0.5,
      });
      const box = new THREE.Mesh(boxGeo, boxMat);
      box.position.y = 1.5;
      group.add(box);

      const bulletGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.12, 6);
      const bulletMat = new THREE.MeshStandardMaterial({ color: 0xcc8800, metalness: 0.8 });
      for (let i = 0; i < 3; i++) {
        const bullet = new THREE.Mesh(bulletGeo, bulletMat);
        bullet.position.set(-0.08 + i * 0.08, 1.5, 0.2);
        bullet.rotation.x = Math.PI / 2;
        group.add(bullet);
      }
    }

    const pointLight = new THREE.PointLight(type === 'health' ? 0xff4444 : 0xffaa00, 0.5, 5);
    pointLight.position.y = 1.5;
    group.add(pointLight);

    group.position.copy(position);
    this.scene.add(group);

    this.pickups.push({ mesh: group, type, respawnTimer: 0 });
  }

  private spawnWave() {
    this.state.wave++;
    const zombieCount = Math.min(5 + this.state.wave * 2, 30);
    this.state.zombiesInWave = zombieCount;
    this.state.zombiesKilled = 0;
    this.state.waveActive = true;
    this.zombiesToSpawn = zombieCount;
    this.spawnTimer = 0;

    this.showMessage(`Волна ${this.state.wave}! Врагов: ${zombieCount}`);

    if (this.state.wave % 3 === 0) {
      this.spawnPickup('health', new THREE.Vector3((Math.random() - 0.5) * 30, 0, (Math.random() - 0.5) * 30));
      this.spawnPickup('ammo', new THREE.Vector3((Math.random() - 0.5) * 30, 0, (Math.random() - 0.5) * 30));
    }
  }

  private showMessage(text: string) {
    this.state.message = text;
    this.state.messageTimer = 3;
  }

  private shoot() {
    if (this.state.isReloading || this.state.gameOver || this.state.isPaused) return;

    const weapon = this.state.weapons.find((w) => w.name === this.state.currentWeapon);
    if (!weapon) return;

    const now = performance.now();
    if (now - this.lastShotAt < weapon.fireRate) return;
    this.lastShotAt = now;

    if (this.state.currentAmmo <= 0) {
      this.reload();
      return;
    }

    this.state.currentAmmo--;

    this.playShootSound(weapon);

    this.recoilTimer = 0.15;
    this.weaponBobIntensity = 1;

    this.muzzleFlash.intensity = 3;
    this.muzzleFlashTimer = 0.05;

    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyQuaternion(this.camera.quaternion);

    const spread = weapon.spread;
    direction.x += (Math.random() - 0.5) * spread;
    direction.y += (Math.random() - 0.5) * spread;
    direction.z += (Math.random() - 0.5) * spread;
    direction.normalize();

    const bulletGeo = new THREE.SphereGeometry(0.03, 4, 4);
    const bulletMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const bulletMesh = new THREE.Mesh(bulletGeo, bulletMat);
    bulletMesh.position.copy(this.camera.position);
    bulletMesh.position.add(direction.clone().multiplyScalar(0.5));
    this.scene.add(bulletMesh);

    this.bullets.push({
      mesh: bulletMesh,
      velocity: direction.multiplyScalar(80),
      life: 1.5,
      damage: weapon.damage,
    });

    this.raycaster.set(this.camera.position, direction.clone().normalize());
    const zombieMeshes = this.zombies.map((z) => z.mesh);
    const intersects = this.raycaster.intersectObjects(zombieMeshes, true);

    if (intersects.length > 0) {
      const hitObject = intersects[0].object;
      let zombieGroup: THREE.Object3D | null = hitObject;
      while (zombieGroup && !this.zombies.find((z) => z.mesh === zombieGroup)) {
        zombieGroup = zombieGroup.parent;
      }
      if (zombieGroup) {
        const zombie = this.zombies.find((z) => z.mesh === zombieGroup);
        if (zombie) {
          zombie.health -= weapon.damage;
          zombie.hitFlash = 0.2;
          this.playZombieHitSound();
          this.showHitMarker();

          if (zombie.health <= 0) {
            this.killZombie(zombie);
          }
        }
      }
    }

    this.notifyStateChange();
  }

  private showHitMarker() {
    this.hitMarkerTimer = 0.2;
  }

  private reload() {
    if (this.state.isReloading || this.state.gameOver) return;

    const weapon = this.state.weapons.find((w) => w.name === this.state.currentWeapon);
    if (!weapon || this.state.currentAmmo >= weapon.ammoPerClip || this.state.totalAmmo <= 0) return;

    this.state.isReloading = true;
    this.playSound(400, 0.3, 'sine');
    this.notifyStateChange();

    if (this.reloadTimeout) clearTimeout(this.reloadTimeout);

    this.reloadTimeout = setTimeout(() => {
      if (this.state.gameOver) {
        this.state.isReloading = false;
        return;
      }

      const currentWeapon = this.state.weapons.find((w) => w.name === this.state.currentWeapon);
      if (!currentWeapon) {
        this.state.isReloading = false;
        return;
      }

      const needed = currentWeapon.ammoPerClip - this.state.currentAmmo;
      const available = Math.min(needed, this.state.totalAmmo);
      this.state.currentAmmo += available;
      this.state.totalAmmo -= available;
      this.state.isReloading = false;
      this.reloadTimeout = null;
      this.notifyStateChange();
    }, weapon.reloadTime);
  }

  private killZombie(zombie: Zombie) {
    const index = this.zombies.indexOf(zombie);
    if (index === -1) return;

    this.zombies.splice(index, 1);
    this.state.score += zombie.type === 'tank' ? 300 : zombie.type === 'fast' ? 150 : 100;
    this.state.zombiesKilled++;
    this.state.zombiesAlive--;

    this.playZombieDeathSound();

    const deathAnimation = zombie.mesh.scale;
    const animate = () => {
      if (deathAnimation.y > 0.01) {
        deathAnimation.y *= 0.85;
        deathAnimation.x *= 1.05;
        deathAnimation.z *= 1.05;
        zombie.mesh.position.y = Math.max(0, zombie.mesh.position.y - 0.05);
        requestAnimationFrame(animate);
      } else {
        this.scene.remove(zombie.mesh);
      }
    };
    animate();

    if (this.state.zombiesAlive <= 0 && this.zombiesToSpawn <= 0) {
      this.state.waveActive = false;
      this.waveTimer = 5;
    }

    if (Math.random() < 0.15) {
      const pickupType: 'health' | 'ammo' = Math.random() > 0.5 ? 'health' : 'ammo';
      this.spawnPickup(pickupType, zombie.mesh.position.clone());
    }

    this.notifyStateChange();
  }

  private syncAmmoCacheFromState() {
    this.ammoByWeapon = {};
    for (const weapon of this.state.weapons) {
      this.ammoByWeapon[weapon.name] = {
        current: weapon.name === this.state.currentWeapon ? this.state.currentAmmo : weapon.ammoPerClip,
        reserve: weapon.name === this.state.currentWeapon ? this.state.totalAmmo : weapon.ammoPerClip * 3,
      };
    }
  }

  private saveCurrentAmmo() {
    const current = this.ammoByWeapon[this.state.currentWeapon];
    if (current) {
      current.current = this.state.currentAmmo;
      current.reserve = this.state.totalAmmo;
    }
  }

  private switchWeapon(index: number) {
    if (index < 0 || index >= this.state.weapons.length || this.state.isReloading) return;

    const weapon = this.state.weapons[index];
    if (weapon.name === this.state.currentWeapon) return;

    this.saveCurrentAmmo();

    const ammo = this.ammoByWeapon[weapon.name] ?? {
      current: weapon.ammoPerClip,
      reserve: weapon.ammoPerClip * 3,
    };

    this.state.currentWeapon = weapon.name;
    this.state.currentAmmo = Math.min(ammo.current, weapon.ammoPerClip);
    this.state.totalAmmo = ammo.reserve;
    this.lastShotAt = 0;
    this.notifyStateChange();
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    this.keys[e.code] = true;

    if (e.code === 'KeyR') this.reload();
    if (e.code === 'Digit1') this.switchWeapon(0);
    if (e.code === 'Digit2') this.switchWeapon(1);
    if (e.code === 'Digit3') this.switchWeapon(2);
    if (e.code === 'Escape') {
      if (this.isPointerLocked) {
        document.exitPointerLock();
      }
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    this.keys[e.code] = false;
  };

  private handleMouseMove = (e: MouseEvent) => {
    if (!this.isPointerLocked) return;
    this.mouseMovement.x += e.movementX;
    this.mouseMovement.y += e.movementY;
  };

  private handleMouseDown = (e: MouseEvent) => {
    if (e.button === 0 && this.isPointerLocked) {
      this.mouseHeld = true;
      this.shoot();
    }
  };

  private handleMouseUp = (e: MouseEvent) => {
    if (e.button === 0) this.mouseHeld = false;
  };

  requestPointerLock() {
    if (this.renderer && this.renderer.domElement) {
      this.renderer.domElement.requestPointerLock();
    }
  }

  private handlePointerLockChange = () => {
    this.isPointerLocked = !!this.renderer && document.pointerLockElement === this.renderer.domElement;
    if (!this.isPointerLocked && !this.state.gameOver) {
      this.mouseHeld = false;
      this.state.isPaused = true;
      this.notifyStateChange();
    }
    if (this.isPointerLocked && this.state.isPaused) {
      this.state.isPaused = false;
      this.notifyStateChange();
    }
  };

  private updatePlayer(dt: number) {
    const moveDir = new THREE.Vector3();

    if (this.keys['KeyW']) moveDir.z -= 1;
    if (this.keys['KeyS']) moveDir.z += 1;
    if (this.keys['KeyA']) moveDir.x -= 1;
    if (this.keys['KeyD']) moveDir.x += 1;

    moveDir.normalize();

    const forward = new THREE.Vector3(0, 0, -1);
    forward.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
    const right = new THREE.Vector3(1, 0, 0);
    right.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);

    const worldMove = new THREE.Vector3();
    worldMove.addScaledVector(forward, -moveDir.z);
    worldMove.addScaledVector(right, moveDir.x);
    worldMove.normalize();

    this.playerVelocity.x = worldMove.x * this.moveSpeed;
    this.playerVelocity.z = worldMove.z * this.moveSpeed;

    if (this.keys['Space'] && this.playerOnGround) {
      this.playerVelocity.y = this.jumpForce;
      this.playerOnGround = false;
    }

    this.playerVelocity.y += this.gravity * dt;

    const newPos = this.camera.position.clone();
    newPos.x += this.playerVelocity.x * dt;
    newPos.z += this.playerVelocity.z * dt;
    newPos.y += this.playerVelocity.y * dt;

    const ARENA_SIZE = 49;
    newPos.x = Math.max(-ARENA_SIZE, Math.min(ARENA_SIZE, newPos.x));
    newPos.z = Math.max(-ARENA_SIZE, Math.min(ARENA_SIZE, newPos.z));

    for (const obstacle of this.obstacles) {
      const box = new THREE.Box3().setFromObject(obstacle);
      box.expandByScalar(0.5);
      if (box.containsPoint(new THREE.Vector3(newPos.x, this.playerHeight, newPos.z))) {
        const center = new THREE.Vector3();
        box.getCenter(center);
        const diff = newPos.clone().sub(center);
        diff.y = 0;
        if (Math.abs(diff.x) > Math.abs(diff.z)) {
          newPos.x = diff.x > 0 ? box.max.x + 0.5 : box.min.x - 0.5;
        } else {
          newPos.z = diff.z > 0 ? box.max.z + 0.5 : box.min.z - 0.5;
        }
      }
    }

    if (newPos.y <= this.playerHeight) {
      newPos.y = this.playerHeight;
      this.playerVelocity.y = 0;
      this.playerOnGround = true;
    }

    this.camera.position.copy(newPos);

    this.yaw -= this.mouseMovement.x * this.sensitivity;
    this.pitch -= this.mouseMovement.y * this.sensitivity;
    this.pitch = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, this.pitch));
    this.mouseMovement.x = 0;
    this.mouseMovement.y = 0;

    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;

    if (this.recoilTimer > 0) {
      this.recoilTimer -= dt;
    }

    const isMoving = moveDir.length() > 0;
    if (isMoving) {
      this.weaponBobTimer += dt * 10;
      this.weaponBobIntensity = Math.min(this.weaponBobIntensity + dt * 5, 1);
    } else {
      this.weaponBobIntensity = Math.max(this.weaponBobIntensity - dt * 3, 0);
    }

    const weaponObj = this.camera.children.find((c) => c.type === 'Group');
    if (weaponObj) {
      const bobX = Math.sin(this.weaponBobTimer) * 0.01 * this.weaponBobIntensity;
      const bobY = Math.abs(Math.cos(this.weaponBobTimer)) * 0.01 * this.weaponBobIntensity;
      const recoilZ = this.recoilTimer > 0 ? this.recoilTimer * 0.08 : 0;
      weaponObj.position.set(0.3 + bobX, -0.3 + bobY, -0.5 + recoilZ);
    }
  }

  private updateZombies(dt: number) {
    for (let i = this.zombies.length - 1; i >= 0; i--) {
      const zombie = this.zombies[i];

      if (zombie.hitFlash > 0) {
        zombie.hitFlash -= dt;
        zombie.mesh.children.forEach((child) => {
          if (child instanceof THREE.Mesh) {
            (child.material as THREE.MeshStandardMaterial).emissive = new THREE.Color(0xff0000);
            (child.material as THREE.MeshStandardMaterial).emissiveIntensity = zombie.hitFlash * 5;
          }
        });
      } else {
        zombie.mesh.children.forEach((child) => {
          if (child instanceof THREE.Mesh) {
            (child.material as THREE.MeshStandardMaterial).emissive = new THREE.Color(0x000000);
            (child.material as THREE.MeshStandardMaterial).emissiveIntensity = 0;
          }
        });
      }

      const toPlayer = new THREE.Vector3();
      toPlayer.subVectors(this.camera.position, zombie.mesh.position);
      toPlayer.y = 0;
      const dist = toPlayer.length();

      if (dist > 1.5) {
        toPlayer.normalize();
        zombie.mesh.position.x += toPlayer.x * zombie.speed * dt;
        zombie.mesh.position.z += toPlayer.z * zombie.speed * dt;
      }

      zombie.mesh.lookAt(
        this.camera.position.x,
        zombie.mesh.position.y,
        this.camera.position.z
      );

      const walkAnim = Math.sin(Date.now() * 0.005 * zombie.speed + i) * 0.3;
      zombie.mesh.children.forEach((child) => {
        if (child instanceof THREE.Mesh) {
          if (child.position.y < 0.5) {
            child.rotation.x = walkAnim;
          } else if (child.position.y > 0.8 && child.position.y < 1.3) {
            child.rotation.x = -Math.abs(walkAnim) - 0.5;
          }
        }
      });

      zombie.attackCooldown -= dt;
      if (dist < 2.5 && zombie.attackCooldown <= 0) {
        zombie.attackCooldown = 1;
        this.state.health -= zombie.damage;
        this.playDamageSound();

        if (this.state.health <= 0) {
          this.state.health = 0;
          this.state.gameOver = true;
          this.showMessage('ИГРА ОКОНЧЕНА');
        }
        this.notifyStateChange();
      }
    }
  }

  private updateBullets(dt: number) {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];
      bullet.life -= dt;
      bullet.mesh.position.addScaledVector(bullet.velocity, dt);

      if (bullet.life <= 0) {
        this.scene.remove(bullet.mesh);
        bullet.mesh.geometry.dispose();
        (bullet.mesh.material as THREE.Material).dispose();
        this.bullets.splice(i, 1);
      }
    }
  }

  private updatePickups(dt: number) {
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const pickup = this.pickups[i];
      pickup.mesh.rotation.y += dt * 2;
      const bob = 1.5 + Math.sin(performance.now() * 0.003) * 0.2;
      pickup.mesh.children.forEach((child) => {
        if (child instanceof THREE.Mesh && child.position.y > 1) child.position.y = bob;
      });

      const dist = this.camera.position.distanceTo(pickup.mesh.position);
      if (dist < 2) {
        if (pickup.type === 'health' && this.state.health < this.state.maxHealth) {
          this.state.health = Math.min(this.state.maxHealth, this.state.health + 30);
          this.playPickupSound();
          this.showMessage('+30 HP');
          this.scene.remove(pickup.mesh);
          this.pickups.splice(i, 1);
          this.notifyStateChange();
        } else if (pickup.type === 'ammo') {
          this.state.totalAmmo += 30;
          this.playPickupSound();
          this.showMessage('+30 патронов');
          this.scene.remove(pickup.mesh);
          this.pickups.splice(i, 1);
          this.notifyStateChange();
        }
      }
    }
  }

  private updateWaves(dt: number) {
    if (!this.state.waveActive) {
      this.waveTimer -= dt;
      if (this.waveTimer <= 0) {
        this.spawnWave();
      }
      return;
    }

    if (this.zombiesToSpawn > 0) {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) {
        const types: ('normal' | 'fast' | 'tank')[] = ['normal'];
        if (this.state.wave >= 2) types.push('fast');
        if (this.state.wave >= 3) types.push('tank');

        const type = types[Math.floor(Math.random() * types.length)];
        this.spawnZombie(type);
        this.state.zombiesAlive++;
        this.zombiesToSpawn--;
        this.spawnTimer = 0.8 - Math.min(this.state.wave * 0.05, 0.5);
      }
    }
  }

  private updateMuzzleFlash(dt: number) {
    if (this.muzzleFlashTimer > 0) {
      this.muzzleFlashTimer -= dt;
      if (this.muzzleFlashTimer <= 0) {
        this.muzzleFlash.intensity = 0;
      }
    }
  }

  private notifyStateChange() {
    if (this.onStateChange) {
      this.onStateChange({ ...this.state });
    }
  }

  update(dt: number) {
    if (this.state.gameOver || this.state.isPaused) return;

    this.state.messageTimer -= dt;

    this.updatePlayer(dt);
    if (this.mouseHeld) this.shoot();
    this.updateZombies(dt);
    this.updateBullets(dt);
    this.updatePickups(dt);
    this.updateWaves(dt);
    this.updateMuzzleFlash(dt);

    this.notifyStateChange();
  }

  render() {
    if (this.renderer) this.renderer.render(this.scene, this.camera);
  }

  private handleResize = () => {
    if (!this.renderer) return;
    const width = Math.max(1, this.container?.clientWidth || window.innerWidth);
    const height = Math.max(1, this.container?.clientHeight || window.innerHeight);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  };

  private clearCameraAttachments() {
    for (const child of [...this.camera.children]) {
      this.camera.remove(child);
      child.traverse((object) => {
        const mesh = object as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) {
          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          materials.forEach((material) => material.dispose());
        }
      });
    }
    this.weaponModel = null;
    this.muzzleFlash = undefined as unknown as THREE.PointLight;
  }

  private clearWorld() {
    for (const child of [...this.scene.children]) {
      if (child !== this.camera) {
        this.scene.remove(child);
        child.traverse((object) => {
          const mesh = object as THREE.Mesh;
          if (mesh.geometry) mesh.geometry.dispose();
          if (mesh.material) {
            const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            materials.forEach((material) => material.dispose());
          }
        });
      }
    }
  }

  start(container: HTMLElement, onStateChange: GameEventCallback) {
    if (this.isRunning) return;

    this.container = container;
    this.onStateChange = onStateChange;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.8;
    container.appendChild(this.renderer.domElement);
    this.handleResize();

    this.startClickHandler = () => {
      if (!this.isPointerLocked && !this.state.gameOver) {
        void this.renderer.domElement.requestPointerLock();
      }
    };
    this.renderer.domElement.addEventListener('click', this.startClickHandler);

    window.addEventListener('resize', this.handleResize);
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('mousemove', this.handleMouseMove);
    window.addEventListener('mousedown', this.handleMouseDown);
    window.addEventListener('mouseup', this.handleMouseUp);
    document.addEventListener('pointerlockchange', this.handlePointerLockChange);

    this.state.isPaused = true;
    this.notifyStateChange();

    this.isRunning = true;
    this.waveTimer = 3;
    this.clock.start();

    const gameLoop = () => {
      if (!this.isRunning) return;
      const dt = Math.min(this.clock.getDelta(), 0.05);
      this.update(dt);
      this.render();
      this.animationId = requestAnimationFrame(gameLoop);
    };

    this.gameLoop = gameLoop;
    gameLoop();
  }

  restart() {
    if (!this.renderer) return;

    if (this.reloadTimeout) {
      clearTimeout(this.reloadTimeout);
      this.reloadTimeout = null;
    }

    this.zombies = [];
    this.bullets = [];
    this.pickups = [];
    this.obstacles = [];
    this.mouseHeld = false;

    this.clearCameraAttachments();
    this.clearWorld();

    this.state = this.createInitialState();
    this.syncAmmoCacheFromState();
    this.playerVelocity.set(0, 0, 0);
    this.playerOnGround = true;
    this.camera.position.set(0, this.playerHeight, 0);
    this.yaw = 0;
    this.pitch = 0;
    this.mouseMovement.x = 0;
    this.mouseMovement.y = 0;
    this.weaponBobTimer = 0;
    this.weaponBobIntensity = 0;
    this.recoilTimer = 0;
    this.lastShotAt = 0;

    this.setupLights();
    this.createArena();
    this.createWeaponModel();

    this.muzzleFlash = new THREE.PointLight(0xff8800, 0, 8);
    this.muzzleFlash.position.set(0.3, -0.2, -1);
    this.camera.add(this.muzzleFlash);

    this.waveTimer = 3;
    this.state.isPaused = true;
    this.isPointerLocked = false;
    this.notifyStateChange();
  }

  stop() {
    this.isRunning = false;
    if (this.animationId) cancelAnimationFrame(this.animationId);
    this.animationId = 0;

    if (this.reloadTimeout) {
      clearTimeout(this.reloadTimeout);
      this.reloadTimeout = null;
    }

    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('mousedown', this.handleMouseDown);
    window.removeEventListener('mouseup', this.handleMouseUp);
    document.removeEventListener('pointerlockchange', this.handlePointerLockChange);

    if (this.startClickHandler && this.renderer) {
      this.renderer.domElement.removeEventListener('click', this.startClickHandler);
      this.startClickHandler = null;
    }

    if (document.pointerLockElement === this.renderer?.domElement) {
      void document.exitPointerLock();
    }

    if (this.crosshairElement) {
      this.crosshairElement.remove();
      this.crosshairElement = null;
    }

    if (this.renderer) {
      this.renderer.dispose();
      if (this.container && this.renderer.domElement.parentNode === this.container) {
        this.container.removeChild(this.renderer.domElement);
      }
    }

    if (this.audioCtx) {
      void this.audioCtx.close();
      this.audioCtx = null;
    }

    this.clearCameraAttachments();
    this.clearWorld();
    this.onStateChange = null;
  }

  getState(): GameState {
    return { ...this.state };
  }
}