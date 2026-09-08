import { formatClock, setState, useGameState } from '../state/store';
import { APP_META, focusWindow, minimizeWindow, openWindow, topWindowId } from '../state/windows';
import { playSound } from './sounds';

export function Taskbar() {
  const s = useGameState();
  const top = topWindowId();
  const unread = s.unread.ren + s.unread.mayu;
  const showRen = s.messengerInstalled || s.flags.ren_commented;

  return (
    <div className="taskbar">
      <div
        className="start clickable"
        role="button"
        onClick={() => {
          playSound('click');
          setState((st) => ({ startOpen: !st.startOpen }));
        }}
      >
        <div className="orb">⊞</div>
      </div>
      <div className="tasks">
        <div className="task pinned clickable" role="button" title="Проводник" onClick={() => openWindow('explorer')}>
          <img src="/assets/icons/folder-documents.png" alt="" />
        </div>
        <div className="task pinned clickable" role="button" title="Браузер" onClick={() => openWindow('browser')}>
          <img src="/assets/icons/browser.png" alt="" />
          {!s.messengerInstalled && unread > 0 && <span className="badge">{unread}</span>}
        </div>
        {s.messengerInstalled && (
          <div className="task pinned clickable" role="button" title="M Messenger" onClick={() => openWindow('messenger')}>
            <img src="/assets/icons/meromero.png" alt="" />
            {unread > 0 && <span className="badge">{unread}</span>}
          </div>
        )}
        {s.windows.map((w) => (
          <div
            key={w.id}
            className={`task clickable ${w.id === top && !w.minimized ? 'active' : ''}`}
            role="button"
            onClick={() => {
              if (w.id === top && !w.minimized) minimizeWindow(w.id);
              else focusWindow(w.id);
            }}
          >
            <img src={APP_META[w.app].icon} alt="" />
            <span>{w.title}</span>
          </div>
        ))}
      </div>
      <div className="tray">
        {showRen && (
          <div className="ren-status" title={s.renOnline ? 'REN_17 в сети' : 'REN_17 не в сети'}>
            <i className={`dot ${s.renOnline ? 'on' : 'off'}`} /> REN_17
          </div>
        )}
        <span
          className="sysicon clickable"
          role="button"
          title={s.muted ? 'Звук выключен' : 'Звук'}
          onClick={() => setState((st) => ({ muted: !st.muted }))}
        >
          {s.muted ? '🔇' : '🔊'}
        </span>
        <span className="sysicon" title="Сеть: подключено">
          📶
        </span>
        <div className="clock" title={`день ${s.day}`}>
          {formatClock(s.clock)}
          <small>{dateFor(s.day)}</small>
        </div>
        <div className="show-desktop clickable" role="button" title="Свернуть все окна" onClick={() => s.windows.forEach((w) => !w.minimized && minimizeWindow(w.id))} />
      </div>
    </div>
  );
}

function dateFor(day: number) {
  const d = new Date(2011, 9, 13 + day - 1);
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.2011`;
}
