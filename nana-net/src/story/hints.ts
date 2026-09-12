import { CONFIG } from '../config';
import { stage, type GameState, type ToastAction } from '../state/store';
import { homeworkFor } from './school';

export interface Hint {
  flag: string;
  text: string;
  toast?: { title: string; text: string; icon?: string; action?: ToastAction };
}

const HW_TOAST = (s: GameState) => ({
  title: 'уроки',
  text: homeworkFor(s)
    .filter((t) => !s.homeworkDone.includes(t.id))
    .map((t) => t.subject.toLowerCase())
    .join(' · '),
  icon: '/assets/mm/book.png',
  action: { app: 'homework' as const },
});
const REG_TOAST = { title: 'meromero', text: 'маю: «я тебя по нику найду!!»', icon: '/assets/icons/meromero.png', action: { app: 'meromero' as const } };
// Nana's own reminder, set weeks ago in the scheduler and never turned off
const SLEEP_TOAST = (text: string) => ({ title: 'напоминание', text, icon: '/assets/mm/moon.png' });

/**
 * Nana's timed inner voice: returns the first hint that applies right now and hasn't been shown yet.
 * The caller marks `flag` so every hint fires at most once.
 */
export function dayHints(s: GameState, remaining: number): Hint | null {
  const c = s.clock;
  const d = s.day;
  const st = stage(s);
  const hwLeft = homeworkFor(s).some((t) => !s.homeworkDone.includes(t.id));
  const list: (Hint | null)[] = [
    d === 1 && c >= CONFIG.dayStartMinutes + 1
      ? {
          flag: 'hint_d1_start',
          text: 'дома. сумку на кровать. маю на перемене опять: «зарегайся сегодня, я тебя найду». и англ до завтра.',
        }
      : null,
    d >= 2 && c >= CONFIG.dayStartMinutes + 1
      ? {
          flag: `hint_start_d${d}`,
          text: st >= 2 ? 'дома. весь день в окно смотрела. не про уроки думала.' : st === 1 ? 'дома. в наушниках всю дорогу. сначала уроки, наверное. или нет.' : 'дома. тихо. мама до девяти. в сети всё равно ещё никого.',
        }
      : null,
    hwLeft && c >= 17 * 60 + 10 && c < CONFIG.eveningMinutes
      ? { flag: `hint_hw_d${d}`, text: st >= 2 ? 'домашка. слово как из прошлого года.' : 'уроки. пока голова хоть что-то соображает.', toast: HW_TOAST(s) }
      : null,
    !s.flags.mm_registered && !hwLeft && c >= CONFIG.dayStartMinutes + 5
      ? {
          flag: `hint_register_hw_d${d}`,
          text: d === 1 ? 'всё. теперь meromero, пока маю не начала звонить.' : 'уроки всё. страницу так и не сделала. маю сегодня так посмотрела.',
          toast: REG_TOAST,
        }
      : null,
    !s.flags.mm_registered && c >= 18 * 60 + 20
      ? {
          flag: `hint_register_d${d}`,
          text: d === 1 ? 'маю спросит. сто процентов спросит.' : 'маю опять про meromero. ок. пять минут.',
          toast: REG_TOAST,
        }
      : null,
    !s.flags.mm_registered && c >= 21 * 60
      ? {
          flag: `hint_register_late_d${d}`,
          text: 'все уже там сидят. а у меня даже страницы нет.',
          toast: REG_TOAST,
        }
      : null,
    d >= 2 && c >= CONFIG.eveningMinutes && c < CONFIG.eveningMinutes + 30
      ? {
          flag: `hint_eve_d${d}`,
          text: st >= 2 ? 'вечер. он появляется позже. рано ещё смотреть. смотрю.' : 'вечер. сейчас все выползают.',
        }
      : null,
    hwLeft && c >= 21 * 60 && c < 23 * 60
      ? { flag: `hint_hw_late_d${d}`, text: st >= 2 ? 'домашку не сделала. и ладно.' : 'учебник так и лежит. завтра будет весело.' }
      : null,
    remaining === 0 && c >= 23 * 60 && c < 24 * 60
      ? {
          flag: `hint_done_d${d}`,
          text: st >= 2 ? 'все разошлись. кроме него, наверное.' : 'вроде всё. глаза щиплет.',
          toast: st >= 2 ? undefined : SLEEP_TOAST('спать до 1!!! (ты сама написала)'),
        }
      : null,
    c >= 24 * 60 + 40 && c < 26 * 60
      ? {
          flag: `hint_midnight_d${d}`,
          text: st >= 2 ? 'за полночь. он ещё online.' : 'за полночь. в школу к восьми. ну и что.',
          toast: st >= 2 ? undefined : SLEEP_TOAST('спать до 1!!! (ты сама написала)'),
        }
      : null,
    c >= 26 * 60 && c < 27 * 60 + 30
      ? {
          flag: `hint_two_d${d}`,
          text: st >= 2 ? 'два. в комнате только монитор светится. нормально.' : 'два часа. пуск, спать. или ещё одну песню.',
          toast: SLEEP_TOAST('СПАТЬ. серьёзно.'),
        }
      : null,
    c >= 27 * 60 + 30
      ? {
          flag: `hint_pass_d${d}`,
          text: 'если сейчас не лечь — усну прямо тут.',
          toast: SLEEP_TOAST('04:10 — всё, монитор выключится'),
        }
      : null,
  ];
  return list.find((h): h is Hint => !!h && !s.flags[h.flag]) ?? null;
}
