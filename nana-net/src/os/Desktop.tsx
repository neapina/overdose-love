import { useEffect, useMemo, useState } from 'react';
import { isNight, setState, useGameState } from '../state/store';
import { buildFs } from '../story/fs';
import { noteInteraction, startEngine, stopEngine } from '../story/engine';
import { openNode } from './open';
import { Window } from './Window';
import { Taskbar } from './Taskbar';
import { StartMenu } from './StartMenu';
import { Thought, Toasts } from './Toasts';
import { AppView } from '../apps/AppView';
import { topWindowId } from '../state/windows';

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
      <div className="icons">
        {desktopItems.map((n) => (
          <div
            key={n.name}
            className={`icon clickable ${selected === n.name ? 'selected' : ''}`}
            role="button"
            onClick={() => setSelected(n.name)}
            onDoubleClick={() => openNode(n, ['Компьютер', 'Рабочий стол'])}
          >
            <img src={n.icon} alt="" />
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
