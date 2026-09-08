import { useEffect, useState } from 'react';
import { resetGame, useGameState } from '../state/store';
import { ENDINGS } from '../story/content';
import { stopMusic } from './sounds';

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
