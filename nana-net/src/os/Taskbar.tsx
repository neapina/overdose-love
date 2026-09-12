import { formatClock, isAfternoon, setState, stage, useGameState } from '../state/store';
import { APP_META, focusWindow, minimizeWindow, openWindow, topWindowId } from '../state/windows';
import { goToSleep, remainingToday } from '../story/engine';
import { homeworkLeft } from '../story/school';
import { playSound } from './sounds';
import { canFullscreen, requestFullscreen, TOUCH, useFullscreen } from './viewport';
import { px } from './pixel';

export function Taskbar() {
  const s = useGameState();
  const top = topWindowId();
  const unread = s.unread.ren + s.unread.mayu;
  const showRen = !!s.flags.ren_known && !s.flags.ren_gone;
  const hwLeft = homeworkLeft(s).length;
  const late = s.clock >= 23 * 60;
  const dayDone = late && remainingToday(s).length === 0 && !s.activeConversation;
  const st = stage(s);
  const fullscreen = useFullscreen();

  return (
    <div className="taskbar">
      <div
        className="start clickable"
        role="button"
        title="Пуск"
        onClick={() => {
          playSound('click');
          setState((st) => ({ startOpen: !st.startOpen }));
        }}
      >
        <div className="orb">⊞</div>
      </div>
      <div className="tasks">
        <div className="task pinned clickable" role="button" title="Проводник" onClick={() => openWindow('explorer')}>
          <img src={px('/assets/icons/folder-documents.png')} alt="" />
        </div>
        <div className="task pinned clickable" role="button" title={s.flags.mm_registered ? 'meromero' : 'meromero · создать страницу'} onClick={() => openWindow('meromero', unread ? { page: 'messages', contact: s.unread.ren > 0 ? 'ren' : 'mayu' } : undefined)}>
          <img src={px('/assets/icons/meromero.png')} alt="" />
          {unread > 0 && <span className="badge">{unread}</span>}
          {!s.flags.mm_registered && <span className="badge soft">!</span>}
        </div>
        <div className="task pinned clickable" role="button" title={hwLeft ? `Уроки · осталось ${hwLeft}` : 'Уроки'} onClick={() => openWindow('homework')}>
          <img src={px('/assets/mm/book.png')} alt="" />
          {hwLeft > 0 && isAfternoon(s) && <span className="badge soft">{hwLeft}</span>}
        </div>
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
            <img src={px(APP_META[w.app].icon)} alt="" />
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
        {late && (
          <span
            className={`sysicon clickable moon ${dayDone ? 'pulse' : ''}`}
            role="button"
            title={dayDone ? 'На сегодня всё. Лечь спать' : 'Лечь спать (день закончится)'}
            onClick={() => {
              playSound('click');
              setState({ sleepPrompt: true });
            }}
          >
            <img src={px('/assets/mm/moon.png')} alt="" />
          </span>
        )}
        {TOUCH && !fullscreen && canFullscreen() && (
          <span className="sysicon clickable" role="button" title="На весь экран" onClick={requestFullscreen}>
            ⛶
          </span>
        )}
        <span className="sysicon clickable" role="button" title={s.muted ? 'Звук выключен' : 'Звук'} onClick={() => setState((st) => ({ muted: !st.muted }))}>
          {s.muted ? '🔇' : '🔊'}
        </span>
        <span className="sysicon" title="Сеть: подключено">
          📶
        </span>
        <div className="clock" title={`день ${s.day} · ${isAfternoon(s) ? 'день' : late ? 'ночь' : 'вечер'}`}>
          {formatClock(s.clock)}
          <small>{dateFor(s.day)}</small>
        </div>
        <div className="show-desktop clickable" role="button" title="Свернуть все окна" onClick={() => s.windows.forEach((w) => !w.minimized && minimizeWindow(w.id))} />
      </div>
      {s.sleepPrompt && (
        <div className="sleep-prompt" onPointerDown={(e) => e.stopPropagation()}>
          <img src={px('/assets/mm/moon.png')} alt="" />
          <div>
            <b>{st >= 2 ? 'Лечь? Он может ещё написать.' : 'Лечь спать?'}</b>
            <span>
              {formatClock(s.clock)} · день {s.day} закончится
              {hwLeft && s.day < 7 ? ` · домашка не сделана (${hwLeft})` : ''}
              {unread ? ` · непрочитанных: ${unread}` : ''}
            </span>
          </div>
          <button
            className="btn primary"
            onClick={() => {
              setState({ sleepPrompt: false });
              goToSleep(false);
            }}
          >
            Спать
          </button>
          <button
            className="btn"
            onClick={() => {
              playSound('click');
              setState({ sleepPrompt: false });
            }}
          >
            {st >= 2 ? 'Ещё чуть-чуть' : 'Ещё немного'}
          </button>
        </div>
      )}
    </div>
  );
}

function dateFor(day: number) {
  const d = new Date(2011, 9, 13 + day - 1);
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.2011`;
}
