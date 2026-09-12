import { useEffect, useState } from 'react';

/**
 * The game is laid out for a desktop monitor. On small screens (phones in landscape) the whole
 * OS is rendered at a fixed logical width and scaled down to fit, so windows and apps keep
 * their proportions instead of collapsing.
 */
export interface Viewport {
  /** logical (unscaled) screen size in CSS px */
  w: number;
  h: number;
  /** css scale applied to the logical screen */
  scale: number;
  portrait: boolean;
}

const LOGICAL_W = 1000;
const SMALL_BREAKPOINT = 1100;

export const TOUCH = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;

let current: Viewport = measure();

function measure(): Viewport {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const portrait = vh > vw;
  if (vw >= SMALL_BREAKPOINT) return { w: vw, h: vh, scale: 1, portrait };
  const scale = vw / LOGICAL_W;
  return { w: LOGICAL_W, h: Math.round(vh / scale), scale, portrait };
}

export function viewport(): Viewport {
  return current;
}

/** convert a pointer coordinate in real CSS px to logical screen px */
export function toLogical(v: number): number {
  return v / current.scale;
}

export function useViewport(): Viewport {
  const [vp, setVp] = useState(current);
  useEffect(() => {
    const onResize = () => {
      current = measure();
      setVp(current);
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    window.visualViewport?.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      window.visualViewport?.removeEventListener('resize', onResize);
    };
  }, []);
  return vp;
}

/** "open" gesture: double-click with a mouse, single tap on touch screens */
export function openOn(fn: () => void): { onClick?: () => void; onDoubleClick?: () => void } {
  return TOUCH ? { onClick: fn } : { onDoubleClick: fn };
}

export function useFullscreen(): boolean {
  const [fs, setFs] = useState(() => typeof document !== 'undefined' && !!document.fullscreenElement);
  useEffect(() => {
    const onFs = () => setFs(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);
  return fs;
}

export function canFullscreen(): boolean {
  return typeof document !== 'undefined' && !!document.documentElement.requestFullscreen;
}

export function requestFullscreen() {
  if (document.fullscreenElement || !canFullscreen()) return;
  void document.documentElement.requestFullscreen({ navigationUI: 'hide' }).catch(() => undefined);
  const so = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> };
  so.lock?.('landscape').catch(() => undefined);
}
