import { useSyncExternalStore } from 'react';
import { CONFIG } from '../config';

export type Phase = 'boot' | 'login' | 'desktop' | 'sleep' | 'interlude' | 'ending';
export type AppId =
  | 'explorer'
  | 'notepad'
  | 'photos'
  | 'music'
  | 'meromero'
  | 'homework'
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
  likedBy?: string[];
}

export interface Profile {
  nick: string;
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
  mayuTyping: boolean;
  windows: WindowState[];
  nextWindowId: number;
  nextMessageId: number;
  wallpaper: 'day' | 'dusk' | 'night';
  /** school performance, grows with finished homework */
  school: number;
  /** homework tasks finished today (ids) */
  homeworkDone: string[];
  ending: string | null;
  toasts: Toast[];
  thought: { id: number; text: string; ms: number } | null;
  sleepPrompt: boolean;
  muted: boolean;
  effects: boolean;
  startOpen: boolean;
  sleepCount: number;
}

export interface ToastAction {
  app: AppId;
  props?: Record<string, unknown>;
}

export interface Toast {
  id: number;
  title: string;
  text: string;
  icon?: string;
  action?: ToastAction;
}

const SAVE_KEY = 'nana-net-save-v3';

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
    profile: { nick: '', avatar: 0, status: '', song: '', theme: 'sakura' },
    unread: { ren: 0, mayu: 0 },
    renOnline: false,
    mayuOnline: true,
    renTyping: false,
    mayuTyping: false,
    windows: [],
    nextWindowId: 1,
    nextMessageId: 1,
    wallpaper: 'day',
    school: 0,
    homeworkDone: [],
    ending: null,
    toasts: [],
    thought: null,
    sleepPrompt: false,
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
        thought: null,
        sleepPrompt: false,
        renTyping: false,
        mayuTyping: false,
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
    const { windows: _w, toasts: _t, thought: _th, sleepPrompt: _sp, ...rest } = state;
    void _w;
    void _t;
    void _th;
    void _sp;
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

/** afternoon (before Mayu & co. come online) */
export function isAfternoon(s: GameState) {
  return s.clock < CONFIG.eveningMinutes;
}

export function stage(s: GameState): 0 | 1 | 2 | 3 {
  // 0 = cosy start, 1 = ren appears, 2 = dependence, 3 = late
  const score = s.day + s.ren / 5;
  if (s.day <= 2) return 0;
  if (score < 5) return 1;
  if (score < 7) return 2;
  return 3;
}

let toastId = 1;
export function toast(title: string, text: string, icon?: string, action?: ToastAction) {
  const id = toastId++;
  const same = (t: Toast) => t.title === title && JSON.stringify(t.action ?? null) === JSON.stringify(action ?? null);
  setState((s) => ({ toasts: [...s.toasts.filter((t) => !same(t)).slice(-3), { id, title, text, icon, action }] }));
  setTimeout(() => dismissToast(id), 7000);
}

export function dismissToast(id: number) {
  setState((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
}

let thoughtId = 1;
let thoughtTimer: ReturnType<typeof setTimeout> | null = null;
/** Nana's inner voice — a handwritten line in the corner of the screen */
export function think(text: string, ms = 6500) {
  const id = thoughtId++;
  if (thoughtTimer) clearTimeout(thoughtTimer);
  setState({ thought: { id, text, ms } });
  thoughtTimer = setTimeout(() => setState((s) => (s.thought?.id === id ? { thought: null } : {})), ms);
}

/** run once per flag: returns true the first time */
export function once(flag: string) {
  if (state.flags[flag]) return false;
  setFlag(flag);
  return true;
}

export function setFlag(flag: string, value = true) {
  setState((s) => ({ flags: { ...s.flags, [flag]: value } }));
}

export function hasFlag(flag: string) {
  return !!state.flags[flag];
}
