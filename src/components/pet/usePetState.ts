import { useState, useEffect, useCallback } from 'react';

export type RoomId = 'living_room' | 'kitchen' | 'bathroom' | 'bedroom' | 'playground';
export type Emotion = 'happy' | 'normal' | 'sad' | 'sleeping' | 'dizzy';

export interface PetState {
  hunger: number;    // 0-100
  mood: number;      // 0-100
  energy: number;    // 0-100
  hygiene: number;   // 0-100
  isSleeping: boolean;
  currentRoom: RoomId;
  lastUpdate: number;
}

const STORAGE_KEY = 'zlcggb-pet-state-v2';
const DECAY_RATE = 0.08; // 较慢的衰减速率

const DEFAULT_STATE: PetState = {
  hunger: 80,
  mood: 80,
  energy: 80,
  hygiene: 80,
  isSleeping: false,
  currentRoom: 'living_room',
  lastUpdate: Date.now(),
};

function loadState(): PetState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const state = JSON.parse(saved) as PetState;
      const elapsed = (Date.now() - state.lastUpdate) / 1000;
      const decay = elapsed * DECAY_RATE;
      return {
        ...state,
        hunger: Math.max(0, state.hunger - decay),
        mood: Math.max(0, state.mood - decay * 0.8),
        hygiene: Math.max(0, state.hygiene - decay * 0.5),
        energy: Math.min(100, state.isSleeping ? state.energy + decay * 1.5 : Math.max(0, state.energy - decay * 0.6)),
        lastUpdate: Date.now(),
      };
    }
  } catch { /* ignore */ }
  return { ...DEFAULT_STATE, lastUpdate: Date.now() };
}

export function usePetState() {
  const [state, setState] = useState<PetState>(loadState);

  // 定时衰减
  useEffect(() => {
    const timer = setInterval(() => {
      setState(prev => {
        const next = {
          ...prev,
          hunger: Math.max(0, prev.hunger - DECAY_RATE),
          mood: Math.max(0, prev.mood - DECAY_RATE * 0.8),
          hygiene: Math.max(0, prev.hygiene - DECAY_RATE * 0.5),
          energy: prev.isSleeping
            ? Math.min(100, prev.energy + DECAY_RATE * 2)
            : Math.max(0, prev.energy - DECAY_RATE * 0.6),
          lastUpdate: Date.now(),
        };
        // 自动苏醒
        if (prev.isSleeping && next.energy >= 100) {
          next.isSleeping = false;
        }
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {/* */}
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 状态修改方法 (支持传递对象或者用先前的 state 计算新状态的函数)
  const updateStats = useCallback((
    updatesOrUpdater: | Partial<Pick<PetState, 'hunger'|'mood'|'energy'|'hygiene'|'isSleeping'>>
                      | ((prev: PetState) => Partial<Pick<PetState, 'hunger'|'mood'|'energy'|'hygiene'|'isSleeping'>>)
  ) => {
    setState(prev => {
      const updates = typeof updatesOrUpdater === 'function' ? updatesOrUpdater(prev) : updatesOrUpdater;
      const next = {
        ...prev,
        ...updates,
        hunger: updates.hunger !== undefined ? Math.max(0, Math.min(100, updates.hunger)) : prev.hunger,
        mood: updates.mood !== undefined ? Math.max(0, Math.min(100, updates.mood)) : prev.mood,
        energy: updates.energy !== undefined ? Math.max(0, Math.min(100, updates.energy)) : prev.energy,
        hygiene: updates.hygiene !== undefined ? Math.max(0, Math.min(100, updates.hygiene)) : prev.hygiene,
        lastUpdate: Date.now()
      };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {/* */}
      return next;
    });
  }, []);

  const changeRoom = useCallback((room: RoomId) => {
    setState(prev => {
      if (prev.currentRoom === room) return prev;
      const next = { ...prev, currentRoom: room };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {/* */}
      return next;
    });
  }, []);

  // 派生状态
  const getEmotion = useCallback((): Emotion => {
    if (state.isSleeping) return 'sleeping';
    if (state.hygiene < 20 || state.hunger < 20) return 'dizzy';
    const avg = (state.hunger + state.mood + state.energy + state.hygiene) / 4;
    return avg > 65 ? 'happy' : avg > 35 ? 'normal' : 'sad';
  }, [state]);

  const emotion = getEmotion();

  return {
    state,
    emotion,
    updateStats,
    changeRoom,
  };
}
