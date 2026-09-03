import * as THREE from 'three';

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface Color {
  r: number;
  g: number;
  b: number;
}

export type WeaponCategory = 'pistol' | 'smg' | 'shotgun' | 'rifle' | 'sniper' | 'special';

export interface WeaponStats {
  id: string;
  name: string;
  category: WeaponCategory;
  damage: number;
  headshotMultiplier: number;
  fireRate: number;
  magazineSize: number;
  reloadTime: number;
  range: number;
  spread: number;
  recoil: number;
  weight: number;
  movementPenalty: number;
  criticalChance: number;
  automatic: boolean;
  burst: boolean;
  burstCount?: number;
  semiAutomatic: boolean;
  modelPath?: string;
  soundPath?: string;
  muzzleFlashColor: number;
  shellEject: boolean;
}

export interface WeaponState {
  id: string;
  currentAmmo: number;
  reserveAmmo: number;
  totalAmmo: number;
  isReloading: boolean;
  reloadProgress: number;
  lastFired: number;
  recoilOffset: THREE.Vector3;
  upgradeLevel: number;
  upgrades: WeaponUpgrade[];
}

export interface WeaponUpgrade {
  id: string;
  name: string;
  description: string;
  statModifiers: Partial<WeaponStats>;
  cost: number;
  requiredLevel: number;
}

export interface EnemyStats {
  id: string;
  name: string;
  type: EnemyType;
  health: number;
  maxHealth: number;
  speed: number;
  damage: number;
  attackRange: number;
  detectionRange: number;
  attackCooldown: number;
  xpReward: number;
  lootTable: LootDrop[];
  weaknesses: DamageType[];
  resistances: DamageType[];
  aiType: AIType;
  modelPath?: string;
  soundPaths: Record<string, string>;
}

export type EnemyType = 'walker' | 'fast' | 'heavy' | 'mutant' | 'soldier' | 'hunter' | 'invisible' | 'boss';
export type AIType = 'melee' | 'ranged' | 'flanker' | 'tank' | 'stealth' | 'boss';
export type DamageType = 'bullet' | 'explosive' | 'energy' | 'fire' | 'electric' | 'melee';

export interface EnemyState {
  id: string;
  stats: EnemyStats;
  health: number;
  position: THREE.Vector3;
  rotation: THREE.Euler;
  velocity: THREE.Vector3;
  state: EnemyAIState;
  target: THREE.Vector3 | null;
  lastAttack: number;
  patrolPoints: THREE.Vector3[];
  currentPatrolIndex: number;
  alertLevel: number;
  lastSeenPlayer: number;
  hitFlash: number;
  isDead: boolean;
  deathAnimationProgress: number;
}

export type EnemyAIState = 'idle' | 'patrol' | 'investigate' | 'chase' | 'attack' | 'search' | 'flee' | 'dead';

export interface LootDrop {
  itemId: string;
  chance: number;
  minQuantity: number;
  maxQuantity: number;
}

export interface Item {
  id: string;
  name: string;
  description: string;
  type: ItemType;
  rarity: ItemRarity;
  icon: string;
  stackable: boolean;
  maxStack: number;
  value: number;
  useEffect?: ItemEffect;
}

export type ItemType = 'ammo' | 'health' | 'armor' | 'grenade' | 'weapon' | 'keycard' | 'battery' | 'document' | 'code' | 'upgrade' | 'special';
export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface ItemEffect {
  type: 'heal' | 'armor' | 'ammo' | 'weapon' | 'upgrade' | 'unlock' | 'custom';
  value: number;
  data?: Record<string, unknown>;
}

export interface InventorySlot {
  item: Item | null;
  quantity: number;
}

export interface Inventory {
  slots: InventorySlot[];
  maxSlots: number;
  weapons: WeaponState[];
  currentWeaponIndex: number;
  quickSlots: (Item | null)[];
}

export interface Objective {
  id: string;
  title: string;
  description: string;
  type: ObjectiveType;
  target: string;
  currentProgress: number;
  requiredProgress: number;
  completed: boolean;
  optional: boolean;
  reward?: Item;
  onComplete?: () => void;
}

export type ObjectiveType = 'find' | 'kill' | 'activate' | 'reach' | 'survive' | 'collect' | 'hack' | 'repair' | 'escort';

export interface LevelData {
  id: string;
  name: string;
  description: string;
  environment: EnvironmentType;
  objectives: Objective[];
  enemies: EnemySpawnData[];
  pickups: PickupData[];
  doors: DoorData[];
  puzzles: PuzzleData[];
  secrets: SecretData[];
  boss?: BossData;
  nextLevelId?: string;
  skybox?: string;
  ambientSound?: string;
  musicTrack?: string;
}

export type EnvironmentType = 'lab' | 'underground' | 'armory' | 'power' | 'medical' | 'research' | 'tunnels' | 'military' | 'server' | 'final';

export interface EnemySpawnData {
  enemyId: string;
  position: Vector3;
  rotation?: Vector3;
  patrolRoute?: Vector3[];
  triggerType: 'immediate' | 'proximity' | 'objective' | 'wave';
  triggerData?: Record<string, unknown>;
}

export interface PickupData {
  itemId: string;
  position: Vector3;
  rotation?: Vector3;
  respawnTime?: number;
  hidden?: boolean;
  requiresItem?: string;
}

export interface DoorData {
  id: string;
  position: Vector3;
  rotation: Vector3;
  type: DoorType;
  locked: boolean;
  requiredKey?: string;
  requiredCode?: string;
  requiredPower?: string;
  requiredObjective?: string;
  connectedLevel?: string;
  connectedDoorId?: string;
}

export type DoorType = 'normal' | 'locked' | 'keycard' | 'code' | 'power' | 'security' | 'boss' | 'level_transition';

export interface PuzzleData {
  id: string;
  type: PuzzleType;
  position: Vector3;
  rotation?: Vector3;
  data: Record<string, unknown>;
  reward?: Item;
  requiredItems?: string[];
  objectiveId?: string;
}

export type PuzzleType = 'terminal' | 'keypad' | 'switch' | 'breaker' | 'generator' | 'cable' | 'valve' | 'laser' | 'magnet' | 'sequence' | 'battery' | 'combination';

export interface SecretData {
  id: string;
  name: string;
  position: Vector3;
  triggerType: 'switch' | 'code' | 'destruction' | 'puzzle' | 'exploration';
  triggerData: Record<string, unknown>;
  reward: Item;
  discovered: boolean;
}

export interface BossData {
  id: string;
  name: string;
  stats: EnemyStats;
  phases: BossPhase[];
  arena: ArenaData;
  reward: Item;
}

export interface BossPhase {
  healthThreshold: number;
  behaviorChanges: Record<string, unknown>;
  newAbilities: string[];
  spawnEnemies?: EnemySpawnData[];
  environmentChanges?: EnvironmentChange[];
}

export interface EnvironmentChange {
  type: 'lights' | 'doors' | 'hazards' | 'spawn' | 'music';
  data: Record<string, unknown>;
}

export interface ArenaData {
  bounds: { min: Vector3; max: Vector3 };
  coverPositions: Vector3[];
  hazardZones: HazardZone[];
}

export interface HazardZone {
  position: Vector3;
  radius: number;
  type: 'fire' | 'electric' | 'gas' | 'radiation';
  damage: number;
  interval: number;
}

export interface PlayerState {
  health: number;
  maxHealth: number;
  armor: number;
  maxArmor: number;
  stamina: number;
  maxStamina: number;
  position: Vector3;
  rotation: Vector3;
  velocity: Vector3;
  onGround: boolean;
  isSprinting: boolean;
  isCrouching: boolean;
  isAiming: boolean;
  flashlightOn: boolean;
  currentWeapon: string;
  experience: number;
  level: number;
  skillPoints: number;
  stats: PlayerStats;
}

export interface PlayerStats {
  damage: number;
  fireRate: number;
  reloadSpeed: number;
  magazineSize: number;
  accuracy: number;
  armor: number;
  health: number;
  movementSpeed: number;
  staminaRegen: number;
  criticalChance: number;
  lootLuck: number;
}

export interface GameState {
  player: PlayerState;
  inventory: Inventory;
  currentLevel: string;
  objectives: Objective[];
  currentObjectiveIndex: number;
  discoveredSecrets: string[];
  completedLevels: string[];
  gameTime: number;
  score: number;
  kills: number;
  headshots: number;
  accuracy: number;
  difficulty: Difficulty;
  gameMode: GameMode;
  isPaused: boolean;
  isGameOver: boolean;
  isLoading: boolean;
  message: string;
  messageTimer: number;
}

export type Difficulty = 'easy' | 'normal' | 'hard' | 'nightmare';
export type GameMode = 'campaign' | 'survival' | 'new_game_plus';

export interface SaveData {
  version: number;
  timestamp: number;
  gameState: GameState;
  levelStates: Record<string, LevelState>;
}

export interface LevelState {
  completedObjectives: string[];
  killedEnemies: string[];
  collectedPickups: string[];
  openedDoors: string[];
  solvedPuzzles: string[];
  discoveredSecrets: string[];
  playerPosition: Vector3;
  playerRotation: Vector3;
}

export interface GameSettings {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  sensitivity: number;
  graphicsQuality: GraphicsQuality;
  shadows: boolean;
  resolution: string;
  fullscreen: boolean;
  fov: number;
  invertedMouse: boolean;
  showDamageNumbers: boolean;
  showHitMarkers: boolean;
  crosshairStyle: string;
  hudScale: number;
}

export type GraphicsQuality = 'low' | 'medium' | 'high' | 'ultra';

export interface AudioConfig {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  spatialAudio: boolean;
}

export interface RaycastResult {
  hit: boolean;
  point: THREE.Vector3;
  normal: THREE.Vector3;
  distance: number;
  object: THREE.Object3D | null;
  face: THREE.Face | null;
}

export interface InteractionTarget {
  object: THREE.Object3D;
  type: InteractionType;
  prompt: string;
  distance: number;
  data: Record<string, unknown>;
}

export type InteractionType = 'door' | 'terminal' | 'pickup' | 'weapon' | 'switch' | 'generator' | 'elevator' | 'computer' | 'button' | 'valve' | 'keypad' | 'breaker' | 'cable' | 'laser' | 'battery' | 'vent' | 'custom';

export interface ParticleEffect {
  id: string;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  size: number;
  color: THREE.Color;
  type: ParticleType;
  data: Record<string, unknown>;
}

export type ParticleType = 'muzzle_flash' | 'smoke' | 'spark' | 'blood' | 'fire' | 'electric' | 'dust' | 'debris' | 'shell_casing' | 'impact' | 'explosion';

export interface Decal {
  position: THREE.Vector3;
  normal: THREE.Vector3;
  size: number;
  rotation: number;
  texture: string;
  life: number;
  maxLife: number;
}

export interface LightSource {
  id: string;
  type: 'point' | 'spot' | 'directional' | 'flashlight';
  position: THREE.Vector3;
  target: THREE.Vector3;
  color: THREE.Color;
  intensity: number;
  range: number;
  angle: number;
  penumbra: number;
  decay: number;
  castShadow: boolean;
  flicker: boolean;
  flickerSpeed: number;
  flickerIntensity: number;
  enabled: boolean;
}

export interface GameEvent {
  type: GameEventType;
  data: Record<string, unknown>;
  timestamp: number;
}

export type GameEventType = 
  | 'player_damage' | 'player_death' | 'player_heal'
  | 'enemy_spawn' | 'enemy_death' | 'enemy_damage'
  | 'weapon_fire' | 'weapon_reload' | 'weapon_switch' | 'weapon_upgrade'
  | 'item_pickup' | 'item_use' | 'item_drop'
  | 'objective_start' | 'objective_update' | 'objective_complete'
  | 'door_open' | 'door_close' | 'door_lock' | 'door_unlock'
  | 'puzzle_start' | 'puzzle_solve' | 'puzzle_fail'
  | 'secret_found' | 'level_start' | 'level_complete' | 'level_transition'
  | 'boss_spawn' | 'boss_phase_change' | 'boss_defeat'
  | 'save_game' | 'load_game' | 'settings_change'
  | 'achievement_unlock';

export const WEAPON_CATEGORIES: Record<WeaponCategory, string> = {
  pistol: 'Pistol',
  smg: 'SMG',
  shotgun: 'Shotgun',
  rifle: 'Rifle',
  sniper: 'Sniper',
  special: 'Special',
};

export const ITEM_RARITY_COLORS: Record<ItemRarity, number> = {
  common: 0x9e9e9e,
  uncommon: 0x4caf50,
  rare: 0x2196f3,
  epic: 0x9c27b0,
  legendary: 0xff9800,
};

export const ITEM_RARITY_NAMES: Record<ItemRarity, string> = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
};

export const DOOR_TYPE_NAMES: Record<DoorType, string> = {
  normal: 'Door',
  locked: 'Locked Door',
  keycard: 'Keycard Door',
  code: 'Code Door',
  power: 'Power Door',
  security: 'Security Door',
  boss: 'Boss Door',
  level_transition: 'Level Transition',
};

export const INTERACTION_PROMPTS: Record<InteractionType, string> = {
  door: 'OPEN',
  terminal: 'USE TERMINAL',
  pickup: 'PICK UP',
  weapon: 'TAKE WEAPON',
  switch: 'FLIP SWITCH',
  generator: 'ACTIVATE GENERATOR',
  elevator: 'USE ELEVATOR',
  computer: 'USE COMPUTER',
  button: 'PRESS BUTTON',
  valve: 'TURN VALVE',
  keypad: 'ENTER CODE',
  breaker: 'FLIP BREAKER',
  cable: 'CONNECT CABLE',
  laser: 'ALIGN LASER',
  battery: 'INSERT BATTERY',
  vent: 'ENTER VENT',
  custom: 'INTERACT',
};