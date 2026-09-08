import type { GameState, Contact } from '../state/store';

export type Speaker = Contact | 'nana' | 'system';

export type Step =
  | { type: 'msg'; from: Speaker; text: string; photo?: string; delay?: number }
  | {
      type: 'choice';
      options: { text: string; ren?: number; mayu?: number; flags?: string[]; then?: Step[] }[];
    }
  | { type: 'set'; flags?: string[]; ren?: number; mayu?: number }
  | { type: 'status'; contact: Contact; online: boolean }
  | { type: 'pause'; ms: number }
  | { type: 'toast'; title: string; text: string; icon?: string }
  | { type: 'unlock'; what: 'messenger' }
  | { type: 'comment'; author: string; text: string }
  | { type: 'post'; author: string; text: string; photo?: string }
  | { type: 'wallpaper'; value: 'day' | 'dusk' | 'night' }
  | { type: 'end'; ending: string };

export interface Conversation {
  id: string;
  contact: Contact;
  channel: 'meromero' | 'messenger';
  day: number;
  /** in-game minutes since 00:00 of the day (may be >= 1440 for after-midnight) */
  at: number;
  when?: (s: GameState) => boolean;
  steps: Step[];
}

export interface Ending {
  title: string;
  lines: string[];
}
