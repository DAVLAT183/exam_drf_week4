'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Maximize, Minimize } from 'lucide-react';
import { GameEngine, GameState } from './zombieEngine';

const WEAPON_COLORS: Record<string, string> = {
  Pistol: '#4F7CFF',
  Shotgun: '#ff4444',
  Rifle: '#44ff44',
};

export default function GamePage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleStateChange = useCallback((state: GameState) => {
    setGameState({ ...state });
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let engine: GameEngine | null = null;

    try {
      engine = new GameEngine();
      engineRef.current = engine;
      engine.start(container, (nextState) => {
        handleStateChange(nextState);
        setIsInitialized(true);
      });
      setIsInitialized(true);
    } catch (err) {
      console.error('Failed to initialize game:', err);
      setError(err instanceof Error ? err.message : 'Не удалось запустить игру');
    }

    return () => {
      engine?.stop();
      if (engineRef.current === engine) engineRef.current = null;
    };
  }, [handleStateChange]);

  const handleRestart = () => {
    engineRef.current?.restart();
  };

  const handleStart = () => {
    engineRef.current?.requestPointerLock();
  };

  const toggleFullscreen = () => {
    const el = containerRef.current?.parentElement;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const state = gameState;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black">
      <div ref={containerRef} className="absolute inset-0 z-0" />

      {state && (
        <>
          <div
            className="absolute top-4 left-4 flex gap-3 z-10"
            style={{ pointerEvents: 'none' }}
          >
            <div className="glass-strong px-4 py-2 rounded-lg flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-white font-mono text-lg font-bold">
                {state.health}
              </span>
              <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${(state.health / state.maxHealth) * 100}%`,
                    backgroundColor:
                      state.health > 60
                        ? '#34D399'
                        : state.health > 30
                        ? '#FBBF24'
                        : '#F87171',
                  }}
                />
              </div>
            </div>

            <div className="glass-strong px-4 py-2 rounded-lg flex items-center gap-2">
              <span className="text-yellow-400 font-mono text-lg font-bold">
                ★ {state.score}
              </span>
            </div>

            <div className="glass-strong px-4 py-2 rounded-lg flex items-center gap-2">
              <span className="text-purple-400 font-mono text-lg font-bold">
                Волна {state.wave}
              </span>
            </div>
          </div>

          <div
            className="absolute top-4 right-4 z-10 flex items-start gap-2"
          >
            <div className="glass-strong px-4 py-2 rounded-lg" style={{ pointerEvents: 'none' }}>
              <div className="text-xs text-gray-400 mb-1">
                Зомби убито: {state.zombiesKilled}/{state.zombiesInWave}
              </div>
              <div className="flex gap-1">
                {Array.from({ length: state.zombiesInWave }).map((_, i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full transition-colors"
                    style={{
                      backgroundColor:
                        i < state.zombiesKilled ? '#F87171' : '#374151',
                    }}
                  />
                ))}
              </div>
            </div>
            <button
              onClick={toggleFullscreen}
              className="glass-strong p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title={isFullscreen ? 'Выйти из полного экрана' : 'Полный экран'}
            >
              {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
            </button>
          </div>

          <div
            className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10"
            style={{ pointerEvents: 'none' }}
          >
            <div className="glass-strong px-6 py-3 rounded-xl flex items-center gap-6">
              {state.weapons.map((weapon, i) => (
                <div
                  key={weapon.name}
                  className="flex flex-col items-center gap-1"
                >
                  <div className="text-xs text-gray-400">{i + 1}</div>
                  <div
                    className="px-3 py-1 rounded-md font-mono text-sm font-bold transition-all"
                    style={{
                      backgroundColor:
                        weapon.name === state.currentWeapon
                          ? WEAPON_COLORS[weapon.name] + '33'
                          : 'transparent',
                      color:
                        weapon.name === state.currentWeapon
                          ? WEAPON_COLORS[weapon.name]
                          : '#6B7280',
                      border:
                        weapon.name === state.currentWeapon
                          ? `1px solid ${WEAPON_COLORS[weapon.name]}`
                          : '1px solid transparent',
                    }}
                  >
                    {weapon.name}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            className="absolute bottom-16 left-1/2 -translate-x-1/2 z-10"
            style={{ pointerEvents: 'none' }}
          >
            <div className="glass-strong px-6 py-2 rounded-lg flex items-center gap-4">
              <div className="text-center">
                <div className="text-xs text-gray-400">Патроны</div>
                <div className="font-mono text-xl font-bold text-white">
                  {state.currentAmmo}
                  <span className="text-gray-500 text-sm mx-1">/</span>
                  <span className="text-gray-400 text-sm">{state.totalAmmo}</span>
                </div>
              </div>
              <div className="w-px h-8 bg-gray-600" />
              <div className="text-center">
                <div className="text-xs text-gray-400">Оружие</div>
                <div
                  className="font-mono text-sm font-bold"
                  style={{ color: WEAPON_COLORS[state.currentWeapon] }}
                >
                  {state.currentWeapon}
                </div>
              </div>
              {state.isReloading && (
                <>
                  <div className="w-px h-8 bg-gray-600" />
                  <div className="text-yellow-400 font-bold animate-pulse">
                    ПЕРЕЗАРЯДКА...
                  </div>
                </>
              )}
            </div>
          </div>

          {state.message && state.messageTimer > 0 && (
            <div
              className="absolute top-1/4 left-1/2 -translate-x-1/2 z-20"
              style={{ pointerEvents: 'none' }}
            >
              <div className="text-2xl font-bold text-white text-center drop-shadow-lg animate-pulse">
                {state.message}
              </div>
            </div>
          )}

          {state.isPaused && !state.gameOver && (
            <div
              className="absolute inset-0 z-[5] flex items-center justify-center"
              style={{ pointerEvents: 'none' }}
            >
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
              <div className="glass-strong p-8 rounded-2xl text-center max-w-md relative pointer-events-auto">
                <h2 className="text-3xl font-bold text-white mb-4">ПАУЗА</h2>
                <p className="text-gray-400 mb-6">
                  Кликните за пределами панели, чтобы начать
                </p>
                <div className="space-y-3 text-sm text-gray-400 mb-6">
                  <div className="flex justify-between">
                    <span>WASD</span>
                    <span>Движение</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Мышь</span>
                    <span>Обзор</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ЛКМ</span>
                    <span>Стрелять</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Пробел</span>
                    <span>Прыжок</span>
                  </div>
                  <div className="flex justify-between">
                    <span>R</span>
                    <span>Перезарядка</span>
                  </div>
                  <div className="flex justify-between">
                    <span>1-2-3</span>
                    <span>Смена оружия</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {state.gameOver && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 backdrop-blur-sm">
              <div className="glass-strong p-8 rounded-2xl text-center max-w-md">
                <h2 className="text-4xl font-bold text-red-500 mb-2">
                  ИГРА ОКОНЧЕНА
                </h2>
                <div className="text-gray-400 mb-6 space-y-2">
                  <div className="text-lg">
                    Счёт: <span className="text-yellow-400 font-bold">{state.score}</span>
                  </div>
                  <div>
                    Волна: <span className="text-purple-400 font-bold">{state.wave}</span>
                  </div>
                  <div>
                    Зомби убито:{' '}
                    <span className="text-red-400 font-bold">{state.zombiesKilled}</span>
                  </div>
                </div>
                <button
                  onClick={handleRestart}
                  className="w-full py-3 rounded-lg font-bold text-white transition-all hover:scale-105"
                  style={{
                    background: 'linear-gradient(135deg, #F87171, #ff4444)',
                  }}
                >
                  Играть снова
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {error && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/95 p-6">
          <div className="max-w-lg rounded-2xl border border-red-500/30 bg-gray-950 p-8 text-center shadow-2xl">
            <h2 className="mb-3 text-2xl font-bold text-red-400">Не удалось запустить игру</h2>
            <p className="mb-6 text-sm leading-6 text-gray-400">{error}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-lg bg-red-500 px-6 py-3 font-bold text-white transition hover:bg-red-400"
            >
              Перезагрузить
            </button>
          </div>
        </div>
      )}

      {!isInitialized && !error && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black">
          <div className="text-center">
            <div className="mb-4 text-2xl font-bold text-white">Загрузка...</div>
            <div className="mx-auto h-1 w-48 overflow-hidden rounded-full bg-gray-700">
              <div
                className="h-full w-3/5 animate-pulse"
                style={{ background: 'linear-gradient(90deg, #4F7CFF, #27D3E6)' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
