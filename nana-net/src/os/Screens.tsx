import { useEffect, useState } from 'react';
import { resetGame, setState, stage, useGameState } from '../state/store';
import { ENDINGS } from '../story/content';
import { schoolDay } from '../story/interlude';
import { playSound, stopMusic } from './sounds';

export function Sleep() {
  const s = useGameState();
  const forced = s.flags.forced_sleep;
  return (
    <div className="sleep">
      <h1>{forced ? '04:10' : 'Выход из системы…'}</h1>
      <div>{forced ? 'Монитор гаснет сам. Нана засыпает за столом.' : `День ${s.day} закончился.`}</div>
      <div style={{ fontSize: 11, opacity: 0.5, marginTop: 20 }}>NANA-PC · сохранение…</div>
    </div>
  );
}

const WEEKDAYS = ['четверг', 'пятница', 'суббота', 'воскресенье', 'понедельник', 'вторник', 'среда'];

/** the school day between two evenings — text only, Nana is away from the computer */
export function Interlude() {
  const s = useGameState();
  const lines = schoolDay(s);
  const [shown, setShown] = useState(0);
  const st = stage(s);

  useEffect(() => {
    if (shown >= lines.length) return;
    const t = setTimeout(() => setShown((n) => n + 1), shown === 0 ? 900 : 1500);
    return () => clearTimeout(t);
  }, [shown, lines.length]);

  return (
    <div className={`interlude st${st}`}>
      <div className="interlude-head">
        день {s.day} · {WEEKDAYS[(s.day - 1) % 7]}
      </div>
      <div className="interlude-lines">
        {lines.slice(0, shown).map((l, i) => (
          <p key={i} className={l.startsWith('—') ? 'quote' : ''}>
            {l}
          </p>
        ))}
      </div>
      {shown >= lines.length && (
        <button
          className="btn interlude-go"
          onClick={() => {
            playSound('click');
            setState({ phase: 'login' });
          }}
        >
          16:40 — дома. включить компьютер →
        </button>
      )}
      {shown < lines.length && (
        <button className="interlude-skip" onClick={() => setShown(lines.length)}>
          пропустить
        </button>
      )}
    </div>
  );
}

export function Ending() {
  const s = useGameState();
  const e = ENDINGS[s.ending ?? 'log_off'] ?? ENDINGS.log_off;
  const [shown, setShown] = useState(0);

  useEffect(() => {
    stopMusic();
    if (shown >= e.lines.length) return;
    const t = setTimeout(() => setShown((n) => n + 1), shown === 0 ? 1500 : 2200);
    return () => clearTimeout(t);
  }, [shown, e.lines.length]);

  return (
    <div className="ending">
      <div style={{ fontSize: 11, letterSpacing: 3, color: '#556' }}>NANA.NET — КОНЦОВКА</div>
      <h1>{e.title}</h1>
      {e.lines.slice(0, shown).map((l, i) => (
        <p key={i} style={{ animationDelay: '0s' }}>
          {l || '\u00a0'}
        </p>
      ))}
      {shown >= e.lines.length && (
        <>
          <div className="stats">
            REN {Math.round(s.ren)} · MAYU {Math.round(s.mayu)} · дней {s.day} · ночей за монитором {s.sleepCount}
          </div>
          <button className="btn" onClick={() => resetGame()}>
            Начать заново
          </button>
        </>
      )}
    </div>
  );
}
