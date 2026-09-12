import { useRef, type ReactNode } from 'react';
import type { WindowState } from '../state/store';
import { APP_META, closeWindow, focusWindow, minimizeWindow, moveWindow, resizeWindow, toggleMaximize } from '../state/windows';
import { toLogical, viewport } from './viewport';
import { px } from './pixel';

interface Props {
  win: WindowState;
  active: boolean;
  children: ReactNode;
}

export function Window({ win, active, children }: Props) {
  const drag = useRef<{ dx: number; dy: number } | null>(null);
  const rs = useRef<{ x: number; y: number; w: number; h: number } | null>(null);
  const meta = APP_META[win.app];

  function onTitleDown(e: React.PointerEvent) {
    if ((e.target as HTMLElement).closest('.win-btn')) return;
    if (win.maximized) return;
    focusWindow(win.id);
    drag.current = { dx: toLogical(e.clientX) - win.x, dy: toLogical(e.clientY) - win.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }
  function onTitleMove(e: React.PointerEvent) {
    if (!drag.current) return;
    const vp = viewport();
    const x = Math.max(-win.w + 80, Math.min(vp.w - 60, toLogical(e.clientX) - drag.current.dx));
    const y = Math.max(0, Math.min(vp.h - 70, toLogical(e.clientY) - drag.current.dy));
    moveWindow(win.id, x, y);
  }
  function onTitleUp() {
    drag.current = null;
  }

  function onResizeDown(e: React.PointerEvent) {
    e.stopPropagation();
    focusWindow(win.id);
    rs.current = { x: toLogical(e.clientX), y: toLogical(e.clientY), w: win.w, h: win.h };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }
  function onResizeMove(e: React.PointerEvent) {
    if (!rs.current) return;
    resizeWindow(win.id, rs.current.w + (toLogical(e.clientX) - rs.current.x), rs.current.h + (toLogical(e.clientY) - rs.current.y));
  }

  const style = win.maximized
    ? { left: 0, top: 0, width: '100%', height: 'calc(100% - var(--taskbar-h))', zIndex: win.z }
    : { left: win.x, top: win.y, width: win.w, height: win.h, zIndex: win.z };

  return (
    <div
      className={`win ${active ? '' : 'inactive'} ${win.maximized ? 'maximized' : ''}`}
      style={{ ...style, display: win.minimized ? 'none' : undefined }}
      onPointerDown={() => {
        if (!active) focusWindow(win.id);
      }}
    >
      <div className="win-title" onPointerDown={onTitleDown} onPointerMove={onTitleMove} onPointerUp={onTitleUp} onDoubleClick={() => toggleMaximize(win.id)}>
        <img src={px(meta.icon)} alt="" />
        <span className="t">{win.title}</span>
        <div className="win-btns">
          <button className="win-btn" onClick={() => minimizeWindow(win.id)} title="Свернуть">
            ▁
          </button>
          <button className="win-btn" onClick={() => toggleMaximize(win.id)} title="Развернуть">
            {win.maximized ? '❐' : '☐'}
          </button>
          <button className="win-btn close" onClick={() => closeWindow(win.id)} title="Закрыть">
            ✕
          </button>
        </div>
      </div>
      <div className="win-body">{children}</div>
      {!win.maximized && <div className="win-resize" onPointerDown={onResizeDown} onPointerMove={onResizeMove} onPointerUp={() => (rs.current = null)} />}
    </div>
  );
}
