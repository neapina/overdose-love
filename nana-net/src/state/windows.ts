import { getState, setState, type AppId, type WindowState } from './store';
import { playSound } from '../os/sounds';

export const APP_META: Record<AppId, { title: string; icon: string; w: number; h: number; single?: boolean }> = {
  explorer: { title: 'Проводник', icon: '/assets/icons/folder-documents.png', w: 720, h: 460 },
  notepad: { title: 'Блокнот', icon: '/assets/icons/notepad.png', w: 520, h: 380 },
  photos: { title: 'Фотографии', icon: '/assets/icons/folder-pictures.png', w: 700, h: 480, single: true },
  music: { title: 'Музыка', icon: '/assets/icons/media-player.png', w: 420, h: 340, single: true },
  camera: { title: 'Камера', icon: '/assets/icons/snipping.png', w: 520, h: 440, single: true },
  browser: { title: 'Браузер', icon: '/assets/icons/browser.png', w: 900, h: 600, single: true },
  messenger: { title: 'M Messenger', icon: '/assets/icons/meromero.png', w: 380, h: 560, single: true },
  paint: { title: 'Paint', icon: '/assets/icons/paint.png', w: 640, h: 480, single: true },
  personalize: { title: 'Персонализация', icon: '/assets/icons/control-panel.png', w: 560, h: 420, single: true },
  imageview: { title: 'Просмотр фотографий', icon: '/assets/icons/folder-pics.png', w: 640, h: 500 },
};

export function openWindow(app: AppId, props?: Record<string, unknown>, titleOverride?: string) {
  const s = getState();
  const meta = APP_META[app];
  if (meta.single) {
    const existing = s.windows.find((w) => w.app === app);
    if (existing) {
      focusWindow(existing.id);
      if (props) {
        setState((st) => ({
          windows: st.windows.map((w) => (w.id === existing.id ? { ...w, props: { ...w.props, ...props }, minimized: false } : w)),
        }));
      }
      return existing.id;
    }
  }
  const id = s.nextWindowId;
  const z = Math.max(0, ...s.windows.map((w) => w.z)) + 1;
  const vw = window.innerWidth;
  const vh = window.innerHeight - 40;
  const w = Math.min(meta.w, vw - 40);
  const h = Math.min(meta.h, vh - 40);
  const offset = (s.windows.length % 6) * 24;
  const win: WindowState = {
    id,
    app,
    title: titleOverride ?? meta.title,
    x: Math.max(10, (vw - w) / 2 + offset - 60),
    y: Math.max(10, (vh - h) / 2 + offset - 40),
    w,
    h,
    z,
    minimized: false,
    maximized: false,
    props,
  };
  setState({ windows: [...s.windows, win], nextWindowId: id + 1, startOpen: false });
  playSound('open');
  return id;
}

export function closeWindow(id: number) {
  setState((s) => ({ windows: s.windows.filter((w) => w.id !== id) }));
  playSound('close');
}

export function focusWindow(id: number) {
  setState((s) => {
    const z = Math.max(0, ...s.windows.map((w) => w.z)) + 1;
    return { windows: s.windows.map((w) => (w.id === id ? { ...w, z, minimized: false } : w)), startOpen: false };
  });
}

export function minimizeWindow(id: number) {
  setState((s) => ({ windows: s.windows.map((w) => (w.id === id ? { ...w, minimized: true } : w)) }));
  playSound('minimize');
}

export function toggleMaximize(id: number) {
  setState((s) => ({ windows: s.windows.map((w) => (w.id === id ? { ...w, maximized: !w.maximized } : w)) }));
}

export function moveWindow(id: number, x: number, y: number) {
  setState((s) => ({ windows: s.windows.map((w) => (w.id === id ? { ...w, x, y } : w)) }));
}

export function resizeWindow(id: number, w: number, h: number) {
  setState((s) => ({ windows: s.windows.map((win) => (win.id === id ? { ...win, w: Math.max(260, w), h: Math.max(160, h) } : win)) }));
}

export function setWindowTitle(id: number, title: string) {
  setState((s) => ({ windows: s.windows.map((w) => (w.id === id ? { ...w, title } : w)) }));
}

export function topWindowId(): number | null {
  const s = getState();
  const visible = s.windows.filter((w) => !w.minimized);
  if (!visible.length) return null;
  return visible.reduce((a, b) => (a.z > b.z ? a : b)).id;
}
