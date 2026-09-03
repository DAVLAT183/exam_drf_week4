import * as THREE from 'three';
import {
  GameState,
  PlayerState,
  Inventory,
  InventorySlot,
  Item,
  Objective,
  LevelData,
  EnemyState,
  WeaponState,
  WeaponStats,
  EnemyStats,
  Vector3,
  InteractionTarget,
  RaycastResult,
  ParticleEffect,
  Decal,
  LightSource,
  GameEvent,
  GameEventType,
  SaveData,
  LevelState,
  GameSettings,
  Difficulty,
  GameMode,
  EnvironmentType,
  DoorType,
  PuzzleType,
  ItemType,
  ItemRarity,
  EnemyType,
  AIType,
  DamageType,
  EnemyAIState,
  ObjectiveType,
  InteractionType,
  ParticleType,
  ITEM_RARITY_COLORS,
  DOOR_TYPE_NAMES,
  INTERACTION_PROMPTS,
  WEAPON_CATEGORIES,
} from './types';
import { EventEmitter } from './EventEmitter';
import { InputManager } from './InputManager';
import { SceneManager } from './SceneManager';
import { PlayerController } from './PlayerController';
import { WeaponSystem } from '../weapons/WeaponSystem';
import { EnemySystem } from '../enemies/EnemySystem';
import { LevelSystem } from '../levels/LevelSystem';
import { ObjectiveSystem } from '../systems/ObjectiveSystem';
import { InteractionSystem } from '../systems/InteractionSystem';
import { InventorySystem } from '../systems/InventorySystem';
import { AudioSystem } from '../audio/AudioSystem';
import { EffectsSystem } from '../effects/EffectsSystem';
import { UISystem } from '../ui/UISystem';
import { SaveSystem } from '../systems/SaveSystem';
import { PuzzleSystem } from '../systems/PuzzleSystem';
import { DoorSystem } from '../systems/DoorSystem';
import { LightingSystem } from '../systems/LightingSystem';
import { SecretSystem } from '../systems/SecretSystem';

export class GameEngine extends EventEmitter {
  private renderer: THREE.WebGLRenderer | null = null;
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private clock: THREE.Clock;
  private container: HTMLElement | null = null;
  private animationId: number = 0;
  private isRunning: boolean = false;
  private isInitialized: boolean = false;
  private lastTime: number = 0;
  private fixedTimeStep: number = 1 / 60;
  private maxSubSteps: number = 3;

  private state: GameState;
  private callbacks: GameEngineCallbacks = {};

  private inputManager: InputManager;
  private sceneManager: SceneManager;
  private playerController: PlayerController;
  private weaponSystem: WeaponSystem;
  private enemySystem: EnemySystem;
  private levelSystem: LevelSystem;
  private objectiveSystem: ObjectiveSystem;
  private interactionSystem: InteractionSystem;
  private inventorySystem: InventorySystem;
  private audioSystem: AudioSystem;
  private effectsSystem: EffectsSystem;
  private uiSystem: UISystem;
  private saveSystem: SaveSystem;
  private puzzleSystem: PuzzleSystem;
  private doorSystem: DoorSystem;
  private lightingSystem: LightingSystem;
  private secretSystem: SecretSystem;

  private pendingEvents: GameEvent[] = [];
  private eventProcessInterval: number = 0;

  constructor() {
    super();
    this.clock = new THREE.Clock();
    this.state = this.createInitialState();

    this.inputManager = new InputManager();
    this.sceneManager = new SceneManager();
    this.playerController = new PlayerController();
    this.weaponSystem = new WeaponSystem();
    this.enemySystem = new EnemySystem();
    this.levelSystem = new LevelSystem();
    this.objectiveSystem = new ObjectiveSystem();
    this.interactionSystem = new InteractionSystem();
    this.inventorySystem = new InventorySystem();
    this.audioSystem = new AudioSystem();
    this.effectsSystem = new EffectsSystem();
    this.uiSystem = new UISystem();
    this.saveSystem = new SaveSystem();
    this.puzzleSystem = new PuzzleSystem();
    this.doorSystem = new DoorSystem();
    this.lightingSystem = new LightingSystem();
    this.secretSystem = new SecretSystem();

    this.setupEventListeners();
  }

  private createInitialState(): GameState {
    return {
      player: this.createInitialPlayerState(),
      inventory: this.createInitialInventory(),
      currentLevel: 'level_1',
      objectives: [],
      currentObjectiveIndex: 0,
      discoveredSecrets: [],
      completedLevels: [],
      gameTime: 0,
      score: 0,
      kills: 0,
      headshots: 0,
      accuracy: 0,
      difficulty: 'normal',
      gameMode: 'campaign',
      isPaused: false,
      isGameOver: false,
      isLoading: false,
      message: '',
      messageTimer: 0,
    };
  }

  private createInitialPlayerState(): PlayerState {
    return {
      health: 100,
      maxHealth: 100,
      armor: 0,
      maxArmor: 100,
      stamina: 100,
      maxStamina: 100,
      position: { x: 0, y: 1.8, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      velocity: { x: 0, y: 0, z: 0 },
      onGround: true,
      isSprinting: false,
      isCrouching: false,
      isAiming: false,
      flashlightOn: false,
      currentWeapon: 'pistol_standard',
      experience: 0,
      level: 1,
      skillPoints: 0,
      stats: {
        damage: 1.0,
        fireRate: 1.0,
        reloadSpeed: 1.0,
        magazineSize: 1.0,
        accuracy: 1.0,
        armor: 1.0,
        health: 1.0,
        movementSpeed: 1.0,
        staminaRegen: 1.0,
        criticalChance: 0.05,
        lootLuck: 1.0,
      },
    };
  }

  private createInitialInventory(): Inventory {
    return {
      slots: Array(24).fill(null).map(() => ({ item: null, quantity: 0 })),
      maxSlots: 24,
      weapons: [],
      currentWeaponIndex: 0,
      quickSlots: Array(4).fill(null),
    };
  }

  private setupEventListeners(): void {
    this.inputManager.on('shoot', () => this.handleShoot());
    this.inputManager.on('reload', () => this.handleReload());
    this.inputManager.on('interact', () => this.handleInteract());
    this.inputManager.on('flashlight', () => this.toggleFlashlight());
    this.inputManager.on('weaponSwitch', (index: number) => this.switchWeapon(index));
    this.inputManager.on('pause', () => this.togglePause());
    this.inputManager.on('jump', () => this.playerController.jump());
    this.inputManager.on('sprint', (active: boolean) => this.playerController.setSprinting(active));
    this.inputManager.on('crouch', (active: boolean) => this.playerController.setCrouching(active));
    this.inputManager.on('aim', (active: boolean) => this.playerController.setAiming(active));
  }

  public initialize(container: HTMLElement, callbacks: GameEngineCallbacks = {}): void {
    if (this.isInitialized) return;

    this.container = container;
    this.callbacks = callbacks;

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
      preserveDrawingBuffer: false,
    });

    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 500);

    this.sceneManager.initialize(this.scene, this.camera, this.renderer);
    this.playerController.initialize(this.camera, this.scene, this.inputManager);
    this.weaponSystem.initialize(this.scene, this.camera, this.audioSystem, this.effectsSystem);
    this.enemySystem.initialize(this.scene, this.audioSystem, this.effectsSystem);
    this.levelSystem.initialize(this.scene, this.audioSystem, this.effectsSystem);
    this.objectiveSystem.initialize(this.state);
    this.interactionSystem.initialize(this.scene, this.camera, this.playerController);
    this.inventorySystem.initialize(this.state.inventory);
    this.audioSystem.initialize(this.camera);
    this.effectsSystem.initialize(this.scene);
    this.uiSystem.initialize(this.renderer.domElement);
    this.saveSystem.initialize();
    this.puzzleSystem.initialize(this.scene, this.audioSystem, this.effectsSystem);
    this.doorSystem.initialize(this.scene, this.audioSystem, this.effectsSystem);
    this.lightingSystem.initialize(this.scene, this.camera);
    this.secretSystem.initialize(this.scene, this.audioSystem, this.effectsSystem);

    this.setupResizeHandler();
    this.setupPointerLock();

    this.isInitialized = true;
    this.loadGame();
    this.start();
  }

  private setupResizeHandler(): void {
    const handleResize = () => {
      if (!this.renderer || !this.camera || !this.container) return;
      const width = this.container.clientWidth;
      const height = this.container.clientHeight;
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height, false);
      this.uiSystem.onResize(width, height);
    };

    window.addEventListener('resize', handleResize);
    this.on('destroy', () => window.removeEventListener('resize', handleResize));
  }

  private setupPointerLock(): void {
    if (!this.renderer) return;

    const onPointerLockChange = () => {
      const isLocked = document.pointerLockElement === this.renderer?.domElement;
      this.inputManager.setPointerLock(isLocked);
      if (!isLocked && !this.state.isGameOver) {
        this.setPaused(true);
      } else if (isLocked && this.state.isPaused && !this.state.isGameOver) {
        this.setPaused(false);
      }
    };

    document.addEventListener('pointerlockchange', onPointerLockChange);
    this.on('destroy', () => document.removeEventListener('pointerlockchange', onPointerLockChange));

    this.renderer.domElement.addEventListener('click', () => {
      if (!this.inputManager.isPointerLocked() && !this.state.isGameOver) {
        this.renderer?.domElement.requestPointerLock();
      }
    });
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.clock.start();
    this.lastTime = performance.now();
    this.gameLoop();
  }

  public stop(): void {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = 0;
    }
    this.cleanup();
  }

  public restart(): void {
    this.stop();
    this.state = this.createInitialState();
    this.sceneManager.clear();
    this.enemySystem.clear();
    this.weaponSystem.clear();
    this.levelSystem.clear();
    this.effectsSystem.clear();
    this.puzzleSystem.clear();
    this.doorSystem.clear();
    this.secretSystem.clear();
    this.start();
    this.emit('restart');
  }

  public setPaused(paused: boolean): void {
    this.state.isPaused = paused;
    this.uiSystem.setPaused(paused);
    this.emit('pause', paused);
    if (this.callbacks.onStateChange) {
      this.callbacks.onStateChange({ ...this.state });
    }
  }

  public loadLevel(levelId: string): void {
    this.state.isLoading = true;
    this.emit('levelLoadStart', levelId);

    this.levelSystem.loadLevel(levelId, (levelData: LevelData) => {
      this.state.currentLevel = levelId;
      this.state.objectives = [...levelData.objectives];
      this.state.currentObjectiveIndex = 0;
      this.objectiveSystem.setObjectives(levelData.objectives);
      this.enemySystem.spawnEnemies(levelData.enemies);
      this.doorSystem.createDoors(levelData.doors);
      this.puzzleSystem.createPuzzles(levelData.puzzles);
      this.secretSystem.createSecrets(levelData.secrets);
      this.lightingSystem.setupLevelLighting(levelData.environment);
      this.audioSystem.playAmbient(levelData.ambientSound);
      this.audioSystem.playMusic(levelData.musicTrack);

      this.playerController.setPosition(
        new THREE.Vector3(0, 1.8, 0)
      );

      this.state.isLoading = false;
      this.setPaused(false);
      this.showMessage(`Уровень: ${levelData.name}`);
      this.emit('levelLoaded', levelData);
      this.updateObjectiveDisplay();
    });
  }

  public nextLevel(): void {
    const currentLevelData = this.levelSystem.getCurrentLevelData();
    if (currentLevelData && currentLevelData.nextLevelId) {
      this.state.completedLevels.push(this.state.currentLevel);
      this.saveGame();
      this.loadLevel(currentLevelData.nextLevelId);
      if (this.callbacks.onLevelComplete) {
        this.callbacks.onLevelComplete(this.state.currentLevel, this.state.score);
      }
    }
  }

  public showMessage(message: string, duration: number = 3): void {
    this.state.message = message;
    this.state.messageTimer = duration;
    this.uiSystem.showMessage(message, duration);
  }

  public addScore(amount: number): void {
    this.state.score += amount;
    this.emit('scoreChange', this.state.score);
  }

  public addKill(headshot: boolean = false): void {
    this.state.kills++;
    if (headshot) this.state.headshots++;
    this.updateAccuracy();
    this.emit('kill', { headshot });
  }

  private updateAccuracy(): void {
    // Simplified accuracy calculation
    this.state.accuracy = this.state.kills > 0 ? (this.state.headshots / this.state.kills) * 100 : 0;
  }

  private handleShoot(): void {
    if (this.state.isPaused || this.state.isGameOver || this.state.isLoading) return;
    const currentWeapon = this.inventorySystem.getCurrentWeapon();
    if (currentWeapon && this.weaponSystem.canFire(currentWeapon)) {
      const result = this.weaponSystem.fire(currentWeapon, this.playerController.getCameraPosition(), this.playerController.getCameraDirection());
      if (result) {
        this.addScore(10);
        this.enemySystem.checkHits(result.raycastResults, currentWeapon.id);
        this.audioSystem.playWeaponSound(currentWeapon.id, 'fire', this.playerController.getCameraPosition());
        this.effectsSystem.createMuzzleFlash(result.muzzlePosition, currentWeapon.muzzleFlashColor);
        this.effectsSystem.createShellCasing(result.ejectPosition, result.ejectDirection);
      }
    }
  }

  private handleReload(): void {
    if (this.state.isPaused || this.state.isGameOver || this.state.isLoading) return;
    const currentWeapon = this.inventorySystem.getCurrentWeapon();
    if (currentWeapon && this.weaponSystem.canReload(currentWeapon)) {
      this.weaponSystem.startReload(currentWeapon);
      this.audioSystem.playWeaponSound(currentWeapon.id, 'reload', this.playerController.getCameraPosition());
    }
  }

  private handleInteract(): void {
    if (this.state.isPaused || this.state.isGameOver || this.state.isLoading) return;
    const target = this.interactionSystem.getTarget();
    if (target) {
      this.interactionSystem.interact(target);
    }
  }

  private toggleFlashlight(): void {
    this.state.player.flashlightOn = !this.state.player.flashlightOn;
    this.lightingSystem.toggleFlashlight(this.state.player.flashlightOn);
    this.audioSystem.playSound('flashlight_toggle', this.playerController.getCameraPosition());
  }

  private switchWeapon(index: number): void {
    if (this.state.isPaused || this.state.isGameOver || this.state.isLoading) return;
    const weapon = this.inventorySystem.getWeaponAtIndex(index);
    if (weapon && weapon.id !== this.state.player.currentWeapon) {
      this.weaponSystem.holsterCurrentWeapon();
      this.inventorySystem.setCurrentWeaponIndex(index);
      this.state.player.currentWeapon = weapon.id;
      this.weaponSystem.equipWeapon(weapon);
      this.audioSystem.playWeaponSound(weapon.id, 'equip', this.playerController.getCameraPosition());
      this.updateWeaponDisplay();
    }
  }

  private togglePause(): void {
    if (this.state.isGameOver || this.state.isLoading) return;
    this.setPaused(!this.state.isPaused);
  }

  private updateObjectiveDisplay(): void {
    if (this.state.objectives.length > 0 && this.state.currentObjectiveIndex < this.state.objectives.length) {
      const objective = this.state.objectives[this.state.currentObjectiveIndex];
      this.showMessage(`ЗАДАНИЕ: ${objective.title}`, 5);
      this.uiSystem.setObjective(objective);
    }
  }

  private updateWeaponDisplay(): void {
    const weapon = this.inventorySystem.getCurrentWeapon();
    if (weapon) {
      this.uiSystem.updateWeaponInfo(weapon);
    }
  }

  private gameLoop(): void {
    if (!this.isRunning) return;

    const currentTime = performance.now();
    const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;

    this.update(deltaTime);
    this.render();

    this.animationId = requestAnimationFrame(() => this.gameLoop());
  }

  private update(deltaTime: number): void {
    if (this.state.isPaused || this.state.isGameOver || this.state.isLoading) return;

    this.state.gameTime += deltaTime;

    this.updateMessageTimer(deltaTime);
    this.playerController.update(deltaTime);
    this.weaponSystem.update(deltaTime);
    this.enemySystem.update(deltaTime, this.playerController.getCameraPosition());
    this.levelSystem.update(deltaTime);
    this.objectiveSystem.update(deltaTime);
    this.interactionSystem.update(deltaTime);
    this.inventorySystem.update(deltaTime);
    this.audioSystem.update(deltaTime);
    this.effectsSystem.update(deltaTime);
    this.puzzleSystem.update(deltaTime);
    this.doorSystem.update(deltaTime);
    this.lightingSystem.update(deltaTime);
    this.secretSystem.update(deltaTime, this.playerController.getCameraPosition());

    this.processEvents();
    this.checkGameOver();
    this.checkObjectives();

    if (this.callbacks.onStateChange) {
      this.callbacks.onStateChange({ ...this.state });
    }
  }

  private updateMessageTimer(deltaTime: number): void {
    if (this.state.messageTimer > 0) {
      this.state.messageTimer -= deltaTime;
      if (this.state.messageTimer <= 0) {
        this.state.message = '';
      }
    }
  }

  private processEvents(): void {
    while (this.pendingEvents.length > 0) {
      const event = this.pendingEvents.shift()!;
      this.handleEvent(event);
    }
  }

  private handleEvent(event: GameEvent): void {
    switch (event.type) {
      case 'enemy_death':
        this.addKill(event.data.headshot === true);
        this.addScore(event.data.score || 100);
        if (event.data.loot) {
          this.inventorySystem.addItem(event.data.loot.itemId, event.data.loot.quantity || 1);
        }
        break;
      case 'objective_complete':
        this.completeObjective(event.data.objectiveId);
        break;
      case 'secret_found':
        this.discoverSecret(event.data.secretId);
        break;
      case 'player_damage':
        this.applyDamage(event.data.amount);
        break;
      case 'player_heal':
        this.healPlayer(event.data.amount);
        break;
      case 'item_pickup':
        this.inventorySystem.addItem(event.data.itemId, event.data.quantity || 1);
        break;
      case 'weapon_upgrade':
        this.weaponSystem.upgradeWeapon(event.data.weaponId, event.data.upgradeId);
        break;
      case 'level_complete':
        this.nextLevel();
        break;
    }
    this.emit('gameEvent', event);
  }

  public emitGameEvent(type: GameEventType, data: Record<string, unknown>): void {
    this.pendingEvents.push({
      type,
      data,
      timestamp: Date.now(),
    });
  }

  private checkGameOver(): void {
    if (this.state.player.health <= 0 && !this.state.isGameOver) {
      this.state.isGameOver = true;
      this.setPaused(true);
      this.uiSystem.showGameOver(this.state.score, this.state.kills, this.state.wave || 0);
      if (this.callbacks.onGameOver) {
        this.callbacks.onGameOver(this.state.score);
      }
      this.emit('gameOver', this.state.score);
    }
  }

  private checkObjectives(): void {
    if (this.state.currentObjectiveIndex >= this.state.objectives.length) return;

    const currentObjective = this.state.objectives[this.state.currentObjectiveIndex];
    if (this.objectiveSystem.isObjectiveComplete(currentObjective.id)) {
      this.completeObjective(currentObjective.id);
    }
  }

  private completeObjective(objectiveId: string): void {
    const objective = this.state.objectives.find(o => o.id === objectiveId);
    if (!objective || objective.completed) return;

    objective.completed = true;
    this.state.currentObjectiveIndex++;
    this.addScore(500);
    this.showMessage('ЗАДАНИЕ ВЫПОЛНЕНО', 3);

    if (objective.reward) {
      this.inventorySystem.addItem(objective.reward.id, 1);
      this.showMessage(`Получено: ${objective.reward.name}`, 3);
    }

    if (this.callbacks.onObjectiveComplete) {
      this.callbacks.onObjectiveComplete(objectiveId);
    }

    this.emit('objectiveComplete', objectiveId);

    if (this.state.currentObjectiveIndex < this.state.objectives.length) {
      this.updateObjectiveDisplay();
    } else {
      this.showMessage('Все задания выполнены!', 3);
    }
  }

  private discoverSecret(secretId: string): void {
    if (this.state.discoveredSecrets.includes(secretId)) return;
    this.state.discoveredSecrets.push(secretId);
    this.addScore(1000);
    this.showMessage('СЕКРЕТ НАЙДЕН!', 4);
    if (this.callbacks.onSecretFound) {
      this.callbacks.onSecretFound(secretId);
    }
    this.emit('secretFound', secretId);
  }

  public applyDamage(amount: number): void {
    if (this.state.isGameOver) return;
    let damage = amount;
    if (this.state.player.armor > 0) {
      const armorDamage = Math.min(damage, this.state.player.armor);
      this.state.player.armor -= armorDamage;
      damage -= armorDamage;
    }
    this.state.player.health = Math.max(0, this.state.player.health - damage);
    this.audioSystem.playSound('player_hurt', this.playerController.getCameraPosition());
    this.effectsSystem.createDamageEffect();
    this.emit('playerDamage', { amount: damage, health: this.state.player.health });
  }

  public healPlayer(amount: number): void {
    this.state.player.health = Math.min(this.state.player.maxHealth, this.state.player.health + amount);
    this.emit('playerHeal', { amount, health: this.state.player.health });
  }

  public addArmor(amount: number): void {
    this.state.player.armor = Math.min(this.state.player.maxArmor, this.state.player.armor + amount);
  }

  public addAmmo(weaponId: string, amount: number): void {
    this.weaponSystem.addAmmo(weaponId, amount);
  }

  public giveWeapon(weaponStats: WeaponStats): void {
    const weaponState = this.weaponSystem.createWeaponState(weaponStats);
    this.inventorySystem.addWeapon(weaponState);
    this.showMessage(`Получено оружие: ${weaponStats.name}`, 3);
  }

  public giveItem(itemId: string, quantity: number = 1): void {
    this.inventorySystem.addItem(itemId, quantity);
  }

  public saveGame(): void {
    const saveData: SaveData = {
      version: 1,
      timestamp: Date.now(),
      gameState: { ...this.state },
      levelStates: this.levelSystem.getLevelStates(),
    };
    this.saveSystem.save(saveData);
    this.showMessage('Игра сохранена', 2);
    this.emit('saveGame', saveData);
  }

  public loadGame(): void {
    const saveData = this.saveSystem.load();
    if (saveData) {
      this.state = saveData.gameState;
      this.levelSystem.setLevelStates(saveData.levelStates);
      this.inventorySystem.setInventory(this.state.inventory);
      this.weaponSystem.setWeapons(this.state.inventory.weapons);
      this.loadLevel(this.state.currentLevel);
      this.emit('loadGame', saveData);
    } else {
      this.loadLevel('level_1');
    }
  }

  public newGame(): void {
    this.saveSystem.clear();
    this.restart();
  }

  public setDifficulty(difficulty: Difficulty): void {
    this.state.difficulty = difficulty;
    this.enemySystem.setDifficulty(difficulty);
    this.saveSystem.saveSetting('difficulty', difficulty);
  }

  public setSettings(settings: Partial<GameSettings>): void {
    this.saveSystem.saveSettings(settings);
    this.audioSystem.setVolume(settings.masterVolume ?? 1, settings.musicVolume ?? 1, settings.sfxVolume ?? 1);
    this.inputManager.setSensitivity(settings.sensitivity ?? 0.002);
    this.renderer?.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    if (settings.shadows !== undefined) {
      this.renderer!.shadowMap.enabled = settings.shadows;
    }
    if (settings.fov !== undefined && this.camera) {
      this.camera.fov = settings.fov;
      this.camera.updateProjectionMatrix();
    }
  }

  private render(): void {
    if (!this.renderer || !this.scene || !this.camera) return;

    this.renderer.render(this.scene, this.camera);
    this.uiSystem.render(this.state);
  }

  private cleanup(): void {
    this.inputManager.dispose();
    this.sceneManager.dispose();
    this.playerController.dispose();
    this.weaponSystem.dispose();
    this.enemySystem.dispose();
    this.levelSystem.dispose();
    this.objectiveSystem.dispose();
    this.interactionSystem.dispose();
    this.inventorySystem.dispose();
    this.audioSystem.dispose();
    this.effectsSystem.dispose();
    this.uiSystem.dispose();
    this.saveSystem.dispose();
    this.puzzleSystem.dispose();
    this.doorSystem.dispose();
    this.lightingSystem.dispose();
    this.secretSystem.dispose();

    if (this.renderer) {
      this.renderer.dispose();
      this.renderer = null;
    }
    this.scene = null;
    this.camera = null;
    this.container = null;
    this.isInitialized = false;
    this.emit('destroy');
  }

  public getState(): GameState {
    return { ...this.state };
  }

  public getRenderer(): THREE.WebGLRenderer | null {
    return this.renderer;
  }

  public getScene(): THREE.Scene | null {
    return this.scene;
  }

  public getCamera(): THREE.PerspectiveCamera | null {
    return this.camera;
  }

  public getWeaponSystem(): WeaponSystem {
    return this.weaponSystem;
  }

  public getEnemySystem(): EnemySystem {
    return this.enemySystem;
  }

  public getLevelSystem(): LevelSystem {
    return this.levelSystem;
  }

  public getInventorySystem(): InventorySystem {
    return this.inventorySystem;
  }

  public getAudioSystem(): AudioSystem {
    return this.audioSystem;
  }

  public getEffectsSystem(): EffectsSystem {
    return this.effectsSystem;
  }

  public getUISystem(): UISystem {
    return this.uiSystem;
  }

  public isGameRunning(): boolean {
    return this.isRunning;
  }

  public isGameLoaded(): boolean {
    return this.isInitialized;
  }
}

export interface GameEngineCallbacks {
  onStateChange?: (state: GameState) => void;
  onLevelComplete?: (levelId: string, score: number) => void;
  onGameOver?: (score: number) => void;
  onObjectiveComplete?: (objectiveId: string) => void;
  onSecretFound?: (secretId: string) => void;
  onAchievementUnlock?: (achievementId: string) => void;
  onError?: (error: Error) => void;
}