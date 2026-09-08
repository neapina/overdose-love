import { useSyncExternalStore } from 'react';
import { CONFIG } from '../config';

export type Phase = 'boot' | 'login' | 'desktop' | 'sleep' | 'ending';
export type AppId =
  | 'explorer'
  | 'notepad'
  | 'photos'
  | 'music'
  | 'camera'
  | 'browser'
  | 'messenger'
  | 'paint'
  | 'personalize'
  | 'imageview';

export interface WindowState {
  id: number;
  app: AppId;
  title: string;
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
  minimized: boolean;
  maximized: boolean;
  props?: Record<string, unknown>;
}

export type Contact = 'ren' | 'mayu';

export interface ChatMessage {
  id: number;
  from: Contact | 'nana' | 'system';
  /** which dialogue this message belongs to */
  contact: Contact;
  text: string;
  day: number;
  time: number; // in-game minutes
  photo?: string; // photo id
  channel: 'meromero' | 'messenger';
}

export interface Post {
  id: string;
  author: 'nana' | 'mayu' | 'ren' | string;
  text: string;
  day: number;
  time: number;
  likes: number;
  photo?: string;
  comments: { author: string; text: string }[];
}

export interface Profile {
  avatar: number;
  status: string;
  song: string;
  theme: 'sakura' | 'city';
}

export interface GameState {
  phase: Phase;
  day: number;
  clock: number; // minutes since 00:00 of the current day (can exceed 24h)
  ren: number; // dependence
  mayu: number; // connection with real life
  flags: Record<string, boolean>;
  seenConversations: string[];
  activeConversation: string | null;
  activeStep: number;
  pendingChoice: { conversation: string; step: number } | null;
  messages: ChatMessage[];
  posts: Post[];
  profile: Profile;
  unread: Record<Contact, number>;
  renOnline: boolean;
  mayuOnline: boolean;
  renTyping: boolean;
  messengerInstalled: boolean;
  windows: WindowState[];
  nextWindowId: number;
  nextMessageId: number;
  wallpaper: 'day' | 'dusk' | 'night';
  photosTaken: number;
  ending: string | null;
  toasts: { id: number; title: string; text: string; icon?: string }[];
  muted: boolean;
  effects: boolean;
  startOpen: boolean;
  sleepCount: number;
}

const SAVE_KEY = 'nana-net-save-v1';

export function initialState(): GameState {
  return {
    phase: 'boot',
    day: 1,
    clock: CONFIG.dayStartMinutes,
    ren: 0,
    mayu: 3,
    flags: {},
    seenConversations: [],
    activeConversation: null,
    activeStep: 0,
    pendingChoice: null,
    messages: [],
    posts: [],
    profile: { avatar: 0, status: '', song: '', theme: 'sakura' },
    unread: { ren: 0, mayu: 0 },
    renOnline: false,
    mayuOnline: true,
    renTyping: false,
    messengerInstalled: false,
    windows: [],
    nextWindowId: 1,
    nextMessageId: 1,
    wallpaper: 'day',
    photosTaken: 0,
    ending: null,
    toasts: [],
    muted: false,
    effects: true,
    startOpen: false,
    sleepCount: 0,
  };
}

let state: GameState = load();
const listeners = new Set<() => void>();

function load(): GameState {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const s = JSON.parse(raw) as GameState;
      // never resume mid-conversation or with windows open
      return {
        ...initialState(),
        ...s,
        phase: s.phase === 'ending' ? 'ending' : 'boot',
        windows: [],
        toasts: [],
        renTyping: false,
        activeConversation: null,
        pendingChoice: null,
        startOpen: false,
      };
    }
  } catch {
    /* ignore */
  }
  return initialState();
}

function persist() {
  try {
    const { windows: _w, toasts: _t, ...rest } = state;
    void _w;
    void _t;
    localStorage.setItem(SAVE_KEY, JSON.stringify(rest));
  } catch {
    /* ignore */
  }
}

export function getState() {
  return state;
}

export function setState(patch: Partial<GameState> | ((s: GameState) => Partial<GameState>)) {
  const p = typeof patch === 'function' ? patch(state) : patch;
  state = { ...state, ...p };
  listeners.forEach((l) => l());
  persist();
}

export function resetGame() {
  localStorage.removeItem(SAVE_KEY);
  state = initialState();
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useGame<T>(selector: (s: GameState) => T): T {
  return useSyncExternalStore(subscribe, () => selector(state), () => selector(state));
}

export function useGameState() {
  return useSyncExternalStore(subscribe, () => state, () => state);
}

// ---- helpers

export function formatClock(minutes: number) {
  const m = ((minutes % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  const mm = Math.floor(m % 60);
  return `${h.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}`;
}

export function isNight(s: GameState) {
  const m = s.clock;
  return m >= 23 * 60 + 30 || m < 6 * 60 || m >= 24 * 60;
}

export function stage(s: GameState): 0 | 1 | 2 | 3 {
  // 0 = cosy start, 1 = ren appears, 2 = dependence, 3 = late
  const score = s.day + s.ren / 4;
  if (s.day <= 1) return 0;
  if (score < 4) return 1;
  if (score < 7) return 2;
  return 3;
}

let toastId = 1;
export function toast(title: string, text: string, icon?: string) {
  const id = toastId++;
  setState((s) => ({ toasts: [...s.toasts, { id, title, text, icon }] }));
  setTimeout(() => setState((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 6000);
}

export function setFlag(flag: string, value = true) {
  setState((s) => ({ flags: { ...s.flags, [flag]: value } }));
}

export function hasFlag(flag: string) {
  return !!state.flags[flag];
}
