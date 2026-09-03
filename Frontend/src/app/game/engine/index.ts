import { GameEngine } from './GameEngine';
import { GameState } from './types';

let engineInstance: GameEngine | null = null;

export function getGameEngine(): GameEngine | null {
  return engineInstance;
}

export function setGameEngine(engine: GameEngine): void {
  engineInstance = engine;
}

export function createGameEngine(): GameEngine {
  if (engineInstance) {
    engineInstance.stop();
  }
  engineInstance = new GameEngine();
  return engineInstance;
}

export function destroyGameEngine(): void {
  if (engineInstance) {
    engineInstance.stop();
    engineInstance = null;
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

export const GameEngineContext = {
  getInstance: getGameEngine,
  setInstance: setGameEngine,
  create: createGameEngine,
  destroy: destroyGameEngine,
};

export default GameEngineContext;