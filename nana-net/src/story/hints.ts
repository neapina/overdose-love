import { CONFIG } from '../config';
import { stage, type GameState, type ToastAction } from '../state/store';
import { homeworkFor } from './school';
import { TOUCH } from '../os/viewport';

export interface Hint {
  flag: string;
  text: string;
  toast?: { title: string; text: string; icon?: string; action?: ToastAction };
}

const HW_TOAST = (s: GameState) => ({
  title: 'Уроки',
  text: `Домашнее задание на ${s.day === 1 ? 'сегодня' : 'завтра'}: ${homeworkFor(s).length} задания`,
  icon: '/assets/mm/book.png',
  action: { app: 'homework' as const },
});
const REG_TOAST = { title: 'meromero', text: 'Создай страницу — Маю найдёт тебя по нику.', icon: '/assets/icons/meromero.png', action: { app: 'meromero' as const } };
const SLEEP_TOAST = { title: 'Seven', text: 'Закончить день: Пуск → Спать', icon: '/assets/mm/moon.png' };

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
          text: 'дома. маю на перемене сказала: «зарегайся на meromero сегодня, я тебя найду». и ещё домашка. ладно.',
          toast: { title: 'Рабочий стол', text: TOUCH ? 'Нажми на значок — откроется программа. Пуск — внизу слева.' : 'Двойной клик по значку открывает программу. Пуск — внизу слева.', icon: '/assets/icons/computer.png' },
        }
      : null,
    d >= 2 && c >= CONFIG.dayStartMinutes + 1
      ? {
          flag: `hint_start_d${d}`,
          text:
            st >= 2
              ? 'дома. на уроках смотрела в окно и думала о том, что он написал. домашка подождёт. или нет.'
              : st === 1
                ? 'дома. сначала уроки, потом meromero. ну или наоборот.'
                : 'дома. до вечера — уроки. вечером все выползут в сеть.',
        }
      : null,
    hwLeft && c >= 17 * 60 + 10 && c < CONFIG.eveningMinutes
      ? { flag: `hint_hw_d${d}`, text: st >= 2 ? 'домашка. какая домашка.' : 'домашка. лучше сейчас, пока голова работает.', toast: HW_TOAST(s) }
      : null,
    !s.flags.mm_registered && !hwLeft && c >= CONFIG.dayStartMinutes + 5
      ? {
          flag: `hint_register_hw_d${d}`,
          text: d === 1 ? 'уроки — всё. теперь meromero. маю сказала «сегодня», а её «сегодня» — это приказ.' : 'уроки — всё. meromero так и не сделала. маю сегодня смотрела с укором.',
          toast: REG_TOAST,
        }
      : null,
    !s.flags.mm_registered && c >= 18 * 60 + 20
      ? {
          flag: `hint_register_d${d}`,
          text: d === 1 ? 'маю спросит, зарегалась ли я. лучше сделать сейчас, чтобы она не пилила.' : 'маю опять про meromero. ладно. пять минут, честно.',
          toast: REG_TOAST,
        }
      : null,
    !s.flags.mm_registered && c >= 21 * 60
      ? {
          flag: `hint_register_late_d${d}`,
          text: 'все уже в сети, а у меня даже страницы нет. значок meromero — на рабочем столе.',
          toast: REG_TOAST,
        }
      : null,
    d >= 2 && c >= CONFIG.eveningMinutes && c < CONFIG.eveningMinutes + 30
      ? {
          flag: `hint_eve_d${d}`,
          text: st >= 2 ? 'вечер. он обычно появляется позже. ещё рано смотреть. я смотрю.' : 'вечер. сейчас все выползают в сеть.',
        }
      : null,
    hwLeft && c >= 21 * 60 && c < 23 * 60
      ? { flag: `hint_hw_late_d${d}`, text: st >= 2 ? 'домашку не сделала. ну и что.' : 'домашку так и не сделала. завтра будет весело.' }
      : null,
    remaining === 0 && c >= 23 * 60 && c < 24 * 60
      ? {
          flag: `hint_done_d${d}`,
          text: st >= 2 ? 'все разошлись. кроме него, наверное. ещё чуть-чуть.' : 'на сегодня, кажется, всё. можно лечь — Пуск → Спать.',
          toast: st >= 2 ? undefined : SLEEP_TOAST,
        }
      : null,
    c >= 24 * 60 + 40 && c < 26 * 60
      ? {
          flag: `hint_midnight_d${d}`,
          text: st >= 2 ? 'за полночь. он ещё online. ещё немного.' : 'за полночь. завтра в школу. глаза уже щиплет.',
          toast: st >= 2 ? undefined : SLEEP_TOAST,
        }
      : null,
    c >= 26 * 60 && c < 27 * 60 + 30
      ? {
          flag: `hint_two_d${d}`,
          text: st >= 2 ? 'два часа. в комнате только свет монитора. мне нравится.' : 'два часа ночи. пуск → спать. или ещё чуть-чуть.',
          toast: SLEEP_TOAST,
        }
      : null,
    c >= 27 * 60 + 30
      ? {
          flag: `hint_pass_d${d}`,
          text: 'если не лечь сейчас — усну прямо здесь.',
          toast: { title: 'Seven', text: 'Монитор погаснет сам в 04:10.', icon: '/assets/mm/moon.png' },
        }
      : null,
  ];
  return list.find((h): h is Hint => !!h && !s.flags[h.flag]) ?? null;
}
