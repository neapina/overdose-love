import { useEffect, useMemo, useState } from 'react';
import { formatClock, isNight, setState, stage, useGameState, type GameState } from '../state/store';
import { homeworkFor } from '../story/school';
import { buildFs } from '../story/fs';
import { noteInteraction, startEngine, stopEngine } from '../story/engine';
import { openNode } from './open';
import { Window } from './Window';
import { Taskbar } from './Taskbar';
import { StartMenu } from './StartMenu';
import { Thought, Toasts } from './Toasts';
import { AppView } from '../apps/AppView';
import { topWindowId } from '../state/windows';
import { TOUCH } from './viewport';
import { px } from './pixel';

export function Desktop() {
  const s = useGameState();
  const [selected, setSelected] = useState<string | null>(null);
  const fs = useMemo(() => buildFs(s), [s]);
  const desktopItems = fs.children!.find((c) => c.name === 'Рабочий стол')!.children!;
  const top = topWindowId();

  useEffect(() => {
    startEngine();
    return () => stopEngine();
  }, []);

  return (
    <div
      className={`desktop wp-${s.wallpaper} ${isNight(s) ? 'night' : ''}`}
      onPointerDownCapture={noteInteraction}
      onKeyDownCapture={noteInteraction}
      onPointerDown={(e) => {
        if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('icons')) {
          setSelected(null);
          if (s.startOpen) setState({ startOpen: false });
        }
      }}
    >
      <Gadgets s={s} />
      <div className="icons">
        {desktopItems.map((n) => (
          <div
            key={n.name}
            className={`icon clickable ${selected === n.name ? 'selected' : ''}`}
            role="button"
            onClick={() => {
              setSelected(n.name);
              if (TOUCH) openNode(n, ['Компьютер', 'Рабочий стол']);
            }}
            onDoubleClick={() => {
              if (!TOUCH) openNode(n, ['Компьютер', 'Рабочий стол']);
            }}
          >
            <img src={px(n.icon)} alt="" />
            <span>{n.name}</span>
          </div>
        ))}
      </div>

      {s.windows.map((w) => (
        <Window key={w.id} win={w} active={w.id === top}>
          <AppView win={w} />
        </Window>
      ))}

      <StartMenu />
      <Toasts />
      <Thought />
      <Taskbar />
    </div>
  );
}

/** Windows 7 desktop gadgets: a clock and Nana's own sticky notes — this is where the day's to-do lives */
function Gadgets({ s }: { s: GameState }) {
  const st = stage(s);
  const hw = homeworkFor(s);
  const hwDone = hw.every((t) => s.homeworkDone.includes(t.id));
  const pink = !s.flags.mm_registered
    ? 'meromero — зарегаться!!\n(маю пилит)'
    : st >= 3
      ? 'не спать\nне спать\nне спать'
      : st >= 2
        ? '22:30\n\nобои → ночь'
        : s.day === 1
          ? s.flags.mayu_friend
            ? 'статус. песня. пост\n(маю)'
            : 'маю ✌ найти в meromero'
          : 'ответить маю\nфотки → папка';
  return (
    <div className="gadgets" aria-hidden>
      <div className="gadget-clock">
        {formatClock(s.clock)}
        <small>{['чт', 'пт', 'сб', 'вс', 'пн', 'вт', 'ср'][(s.day - 1) % 7]} · {12 + s.day}.10.2011</small>
      </div>
      {hw.length > 0 && (
        <div className={`gadget-note ${hwDone ? 'done' : ''}`}>
          {hw.map((t) => `${t.subject.toLowerCase()} — ${t.title.toLowerCase()}`).join('\n')}
        </div>
      )}
      <div className={`gadget-note ${st >= 2 ? 'blue' : 'pink'}`}>{pink}</div>
    </div>
  );
}
