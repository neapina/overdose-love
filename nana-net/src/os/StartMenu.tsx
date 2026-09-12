import { useEffect, useState } from 'react';
import { setState, useGameState, type AppId } from '../state/store';
import { APP_META, openWindow } from '../state/windows';
import { avatar } from '../story/avatars';
import { playSound } from './sounds';
import { px } from './pixel';

const APPS: AppId[] = ['meromero', 'homework', 'explorer', 'notepad', 'photos', 'music', 'paint', 'personalize'];

export function StartMenu() {
  const s = useGameState();
  const [q, setQ] = useState('');
  const open_ = s.startOpen;

  useEffect(() => {
    if (!open_) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest('.startmenu') || t.closest('.taskbar .start')) return;
      setState({ startOpen: false });
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setState({ startOpen: false });
    };
    document.addEventListener('pointerdown', onDown, true);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown, true);
      document.removeEventListener('keydown', onKey);
    };
  }, [open_]);

  if (!open_) return null;
  const apps = APPS.filter((a) => !q || APP_META[a].title.toLowerCase().includes(q.toLowerCase()));

  function open(app: AppId, props?: Record<string, unknown>) {
    openWindow(app, props);
    setState({ startOpen: false });
  }

  return (
    <div className="startmenu" onPointerDown={(e) => e.stopPropagation()}>
      <div className="sm-left">
        <div className="sm-apps">
          {apps.map((a) => (
            <div key={a} className="sm-app clickable" role="button" onClick={() => open(a)}>
              <img src={px(APP_META[a].icon)} alt="" />
              {APP_META[a].title}
            </div>
          ))}
          {apps.length === 0 && <div className="sm-app" style={{ color: '#889' }}>Ничего не найдено</div>}
        </div>
        <div className="sm-search">
          <input className="input" placeholder="Найти программы и файлы" value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
        </div>
      </div>
      <div className="sm-right">
        <img className="av" src={avatar(s.day >= 6 ? 'nana3' : s.day >= 3 ? 'nana2' : 'nana', 56)} alt="" />
        <div className="lnk clickable" role="button" onClick={() => open('explorer', { path: [] })}>
          nana
        </div>
        <div className="lnk clickable" role="button" onClick={() => open('explorer', { path: ['Documents'] })}>
          Документы
        </div>
        <div className="lnk clickable" role="button" onClick={() => open('explorer', { path: ['Pictures'] })}>
          Изображения
        </div>
        <div className="lnk clickable" role="button" onClick={() => open('explorer', { path: ['Music'] })}>
          Музыка
        </div>
        <hr />
        <div className="lnk clickable" role="button" onClick={() => open('explorer', { path: [] })}>
          Компьютер
        </div>
        <div className="lnk clickable" role="button" onClick={() => open('personalize')}>
          Панель управления
        </div>
        <div className="sm-shutdown">
          <button
            onClick={() => {
              playSound('click');
              setState({ startOpen: false, sleepPrompt: true });
            }}
            title="Выключить компьютер и лечь спать — день закончится"
          >
            Спать ▸
          </button>
        </div>
      </div>
    </div>
  );
}
