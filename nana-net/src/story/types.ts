import type { GameState, Contact, ToastAction } from '../state/store';

export type Speaker = Contact | 'nana' | 'system';

export interface ChoiceOption {
  text: string;
  ren?: number;
  mayu?: number;
  flags?: string[];
  /** photo id attached to Nana's message */
  photo?: string;
  then?: Step[];
}

export type Step =
  | { type: 'msg'; from: Speaker; text: string; photo?: string; delay?: number }
  | { type: 'choice'; options: ChoiceOption[] }
  | { type: 'set'; flags?: string[]; ren?: number; mayu?: number }
  | { type: 'status'; contact: Contact; online: boolean }
  | { type: 'pause'; ms: number }
  | { type: 'toast'; title: string; text: string; icon?: string; action?: ToastAction }
  /** Nana's inner voice */
  | { type: 'think'; text: string }
  /** comment on Nana's latest post */
  | { type: 'comment'; author: string; text: string }
  /** like on Nana's latest post */
  | { type: 'like'; author: string }
  | { type: 'post'; author: string; text: string; photo?: string }
  | { type: 'wallpaper'; value: 'day' | 'dusk' | 'night' }
  | { type: 'end'; ending: string };

export interface Conversation {
  id: string;
  contact: Contact;
  /** if omitted — can happen on any day (once) */
  day?: number;
  /** in-game minutes since 00:00 of the day (may be >= 1440 for after-midnight); omitted = as soon as `when` holds */
  at?: number;
  when?: (s: GameState) => boolean;
  steps: Step[];
}

export interface Ending {
  title: string;
  lines: string[];
}
