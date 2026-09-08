import type { GameState } from '../state/store';

export type Scene = 'room' | 'webcam' | 'city' | 'cafe' | 'river' | 'ren_portrait' | 'ren_roof' | 'sky' | 'school' | 'mayu_selfie' | 'sea';

export interface PhotoDef {
  file: string;
  title: string;
  scene: Scene;
  seed: number;
  folder: 'photos' | 'mayu' | 'ren' | 'webcam';
  when?: (s: GameState) => boolean;
  caption?: string;
}

export const PHOTOS: Record<string, PhotoDef> = {
  sky_1: { file: 'DSC_0031.jpg', title: 'после дождя', scene: 'sky', seed: 3, folder: 'photos', caption: 'после дождя красиво' },
  room_1: { file: 'DSC_0044.jpg', title: 'комната', scene: 'room', seed: 5, folder: 'photos' },
  school_1: { file: 'DSC_0052.jpg', title: 'школа, окно', scene: 'school', seed: 8, folder: 'photos' },
  city_1: { file: 'IMG_0107.jpg', title: 'город вечером', scene: 'city', seed: 11, folder: 'photos' },
  mayu_1: { file: 'mayu_002.jpg', title: 'маю ✌', scene: 'mayu_selfie', seed: 21, folder: 'mayu' },
  mayu_2: { file: 'mayu_015.jpg', title: 'маю и автомат с напитками', scene: 'mayu_selfie', seed: 22, folder: 'mayu' },
  cafe_mayu: { file: 'P1010233.jpg', title: 'кафе. крем на носу', scene: 'cafe', seed: 31, folder: 'mayu', when: (s) => !!s.flags.photo_cafe },
  cafe_alone: { file: 'P1010240.jpg', title: 'кафе', scene: 'cafe', seed: 32, folder: 'mayu', when: (s) => s.day >= 2 && !s.flags.d1_cafe_yes },
  river_nana: { file: 'P1010301.jpg', title: 'река, фонари', scene: 'river', seed: 41, folder: 'mayu', when: (s) => !!s.flags.photo_river },
  ren_1: { file: 'ren.jpg', title: 'ren', scene: 'ren_portrait', seed: 51, folder: 'ren', when: (s) => !!s.flags.ren_photo1 },
  ren_2: { file: 'ren2.jpg', title: 'ren (крыша)', scene: 'ren_roof', seed: 52, folder: 'ren', when: (s) => !!s.flags.ren_photo2 },
  sea_1: { file: 'P1010422.jpg', title: 'море', scene: 'sea', seed: 61, folder: 'mayu', when: (s) => !!s.flags.sea_plan && s.day >= 7 },
};

export function availablePhotos(s: GameState): string[] {
  const list = Object.keys(PHOTOS).filter((k) => !PHOTOS[k].when || PHOTOS[k].when!(s));
  for (let i = 1; i <= s.photosTaken; i++) list.push(`webcam_${i}`);
  return list;
}

export function photoDef(id: string): PhotoDef {
  if (PHOTOS[id]) return PHOTOS[id];
  const n = parseInt(id.replace('webcam_', ''), 10) || 1;
  return { file: `WIN_2011_${String(n).padStart(3, '0')}.jpg`, title: 'вебка', scene: 'webcam', seed: 100 + n, folder: 'webcam' };
}

// ───────────────────────── procedural renderer ─────────────────────────

function rng(seed: number) {
  let s = seed * 9301 + 49297;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const cache = new Map<string, string>();

// Real images dropped into src/assets/photos/<id>.(jpg|png|webp) replace the placeholder with the same id.
const CUSTOM = import.meta.glob<string>('../assets/photos/*.{jpg,jpeg,png,webp}', {
  eager: true,
  query: '?url',
  import: 'default',
});

export function customPhoto(id: string): string | null {
  for (const [path, url] of Object.entries(CUSTOM)) {
    const name = path.split('/').pop()!.replace(/\.[^.]+$/, '');
    if (name === id) return url;
  }
  return null;
}

export function renderPhoto(id: string, w = 320, h = 240): string {
  const custom = customPhoto(id);
  if (custom) return custom;
  const key = `${id}_${w}x${h}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const def = photoDef(id);
  const lowW = 128;
  const lowH = Math.round((lowW * h) / w);
  const c = document.createElement('canvas');
  c.width = lowW;
  c.height = lowH;
  const ctx = c.getContext('2d')!;
  const rand = rng(def.seed);
  drawScene(ctx, def.scene, lowW, lowH, rand);
  postProcess(ctx, lowW, lowH, rand, def.scene);
  const out = document.createElement('canvas');
  out.width = w;
  out.height = h;
  const octx = out.getContext('2d')!;
  octx.imageSmoothingEnabled = true;
  octx.drawImage(c, 0, 0, w, h);
  // slight blur pass via re-scaling
  octx.globalAlpha = 0.35;
  octx.drawImage(c, 1, 0, w, h);
  octx.globalAlpha = 1;
  const url = out.toDataURL('image/jpeg', 0.55);
  cache.set(key, url);
  return url;
}

function grad(ctx: CanvasRenderingContext2D, w: number, h: number, stops: [number, string][], vertical = true) {
  const g = vertical ? ctx.createLinearGradient(0, 0, 0, h) : ctx.createLinearGradient(0, 0, w, 0);
  stops.forEach(([o, col]) => g.addColorStop(o, col));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function skyline(ctx: CanvasRenderingContext2D, w: number, h: number, rand: () => number, base: number, color: string) {
  ctx.fillStyle = color;
  let x = 0;
  while (x < w) {
    const bw = 4 + Math.floor(rand() * 14);
    const bh = 8 + Math.floor(rand() * (h * 0.35));
    ctx.fillRect(x, base - bh, bw, bh + h);
    x += bw + Math.floor(rand() * 3);
  }
}

function lights(ctx: CanvasRenderingContext2D, w: number, _h: number, rand: () => number, count: number, y0: number, y1: number, colors: string[]) {
  for (let i = 0; i < count; i++) {
    ctx.fillStyle = colors[Math.floor(rand() * colors.length)];
    const x = rand() * w;
    const y = y0 + rand() * (y1 - y0);
    const r = 1 + rand() * 1.6;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function figure(ctx: CanvasRenderingContext2D, cx: number, baseY: number, scale: number, color: string, hair: 'short' | 'long' | 'glasses') {
  // head
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(cx, baseY - 26 * scale, 9 * scale, 11 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
  // hair
  ctx.fillStyle = hair === 'long' ? '#5a4632' : '#1e1a1f';
  ctx.beginPath();
  ctx.ellipse(cx, baseY - 30 * scale, 10 * scale, 9 * scale, 0, Math.PI, Math.PI * 2);
  ctx.fill();
  if (hair === 'long') {
    ctx.fillRect(cx - 10 * scale, baseY - 30 * scale, 4 * scale, 28 * scale);
    ctx.fillRect(cx + 6 * scale, baseY - 30 * scale, 4 * scale, 28 * scale);
  }
  if (hair === 'short') {
    ctx.fillRect(cx - 10 * scale, baseY - 30 * scale, 3 * scale, 12 * scale);
    ctx.fillRect(cx + 7 * scale, baseY - 30 * scale, 3 * scale, 12 * scale);
  }
  if (hair === 'glasses') {
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 1;
    ctx.strokeRect(cx - 7 * scale, baseY - 27 * scale, 6 * scale, 4 * scale);
    ctx.strokeRect(cx + 1 * scale, baseY - 27 * scale, 6 * scale, 4 * scale);
  }
  // body
  ctx.fillStyle = hair === 'long' ? '#c9b7c6' : '#6b6f7e';
  ctx.beginPath();
  ctx.moveTo(cx - 14 * scale, baseY);
  ctx.lineTo(cx - 9 * scale, baseY - 16 * scale);
  ctx.lineTo(cx + 9 * scale, baseY - 16 * scale);
  ctx.lineTo(cx + 14 * scale, baseY);
  ctx.fill();
}

function drawScene(ctx: CanvasRenderingContext2D, scene: Scene, w: number, h: number, rand: () => number) {
  switch (scene) {
    case 'sky':
      grad(ctx, w, h, [
        [0, '#7d86a8'],
        [0.5, '#b9a7bd'],
        [0.8, '#d8b7b4'],
        [1, '#6c6273'],
      ]);
      skyline(ctx, w, h, rand, h * 0.78, '#3a3541');
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      for (let i = 0; i < 6; i++) ctx.fillRect(rand() * w, h * 0.15 + rand() * h * 0.3, 20 + rand() * 30, 3 + rand() * 4);
      break;
    case 'city':
      grad(ctx, w, h, [
        [0, '#1a2033'],
        [0.55, '#4a4b6e'],
        [0.75, '#8b6a86'],
        [1, '#141420'],
      ]);
      skyline(ctx, w, h, rand, h * 0.72, '#12111a');
      lights(ctx, w, h, rand, 60, h * 0.5, h, ['#ffd27a', '#fff3c4', '#ffb46b', '#c8e4ff']);
      break;
    case 'room':
      grad(ctx, w, h, [
        [0, '#14131a'],
        [1, '#221d2a'],
      ]);
      // monitor glow
      ctx.fillStyle = '#6f8ec9';
      ctx.fillRect(w * 0.35, h * 0.3, w * 0.3, h * 0.25);
      ctx.fillStyle = 'rgba(120,150,220,0.25)';
      ctx.fillRect(w * 0.2, h * 0.15, w * 0.6, h * 0.6);
      // desk
      ctx.fillStyle = '#2e2731';
      ctx.fillRect(0, h * 0.62, w, h * 0.4);
      figure(ctx, w * 0.5, h * 0.95, 1.6, '#8d7c8a', 'short');
      break;
    case 'school':
      grad(ctx, w, h, [
        [0, '#c9d6e6'],
        [1, '#8a97a9'],
      ]);
      ctx.fillStyle = '#5c6470';
      ctx.fillRect(0, 0, w, 6);
      ctx.fillRect(0, 0, 6, h);
      ctx.fillRect(w * 0.48, 0, 4, h);
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fillRect(8, h * 0.6, w * 0.4, h * 0.05);
      ctx.fillStyle = '#7d8896';
      ctx.fillRect(0, h * 0.8, w, h * 0.2);
      break;
    case 'cafe':
      grad(ctx, w, h, [
        [0, '#c8a98f'],
        [0.5, '#e6cdb2'],
        [1, '#6d4f3f'],
      ]);
      ctx.fillStyle = '#f3ebe0';
      ctx.beginPath();
      ctx.ellipse(w * 0.5, h * 0.72, w * 0.32, h * 0.13, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#d9a25c';
      ctx.beginPath();
      ctx.ellipse(w * 0.5, h * 0.68, w * 0.2, h * 0.08, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff5ea';
      ctx.beginPath();
      ctx.ellipse(w * 0.5, h * 0.62, w * 0.1, h * 0.05, 0, 0, Math.PI * 2);
      ctx.fill();
      figure(ctx, w * 0.3, h * 0.55, 1.4, '#e8cfc4', 'short');
      figure(ctx, w * 0.72, h * 0.55, 1.4, '#efd6c8', 'long');
      break;
    case 'river':
      grad(ctx, w, h, [
        [0, '#0d1526'],
        [0.5, '#1c2b4a'],
        [0.55, '#243a63'],
        [1, '#0a0f1c'],
      ]);
      lights(ctx, w, h, rand, 14, h * 0.4, h * 0.5, ['#ffd98a', '#fff1c9']);
      for (let i = 0; i < 14; i++) {
        ctx.fillStyle = 'rgba(255,220,140,0.35)';
        ctx.fillRect(rand() * w, h * 0.6 + rand() * h * 0.35, 2, 6 + rand() * 12);
      }
      figure(ctx, w * 0.4, h * 0.95, 1.5, '#7f7784', 'short');
      figure(ctx, w * 0.6, h * 0.95, 1.5, '#8a7f86', 'long');
      break;
    case 'mayu_selfie':
      grad(ctx, w, h, [
        [0, '#e9d3dd'],
        [1, '#a48aa0'],
      ]);
      figure(ctx, w * 0.5, h * 1.1, 3.2, '#f0d6c8', 'long');
      // peace sign
      ctx.fillStyle = '#f0d6c8';
      ctx.fillRect(w * 0.7, h * 0.5, 6, 20);
      ctx.fillRect(w * 0.7 + 8, h * 0.48, 6, 22);
      // flash
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillRect(0, 0, w, h);
      break;
    case 'webcam':
      grad(ctx, w, h, [
        [0, '#5f5a6a'],
        [1, '#3a3542'],
      ]);
      ctx.fillStyle = 'rgba(110,140,210,0.35)';
      ctx.fillRect(0, 0, w, h);
      figure(ctx, w * 0.5, h * 1.15, 3.4, '#c9b6b9', 'short');
      ctx.fillStyle = 'rgba(200,200,255,0.12)';
      ctx.fillRect(0, 0, w, h * 0.5);
      break;
    case 'ren_portrait':
      grad(ctx, w, h, [
        [0, '#17161d'],
        [1, '#2a2530'],
      ]);
      // face lit from the wrong side (cut-out feel)
      figure(ctx, w * 0.5, h * 1.15, 3.2, '#e8d6cc', 'glasses');
      ctx.fillStyle = 'rgba(255,255,255,0.22)';
      ctx.fillRect(w * 0.42, h * 0.1, w * 0.2, h * 0.45);
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(0, h * 0.75, w, h * 0.25);
      break;
    case 'ren_roof':
      grad(ctx, w, h, [
        [0, '#f0b07a'],
        [0.5, '#d97f7f'],
        [0.7, '#6f4f7a'],
        [1, '#251c2c'],
      ]);
      skyline(ctx, w, h, rand, h * 0.8, '#2a2030');
      // figure lit from the front although sun is behind
      figure(ctx, w * 0.5, h * 0.98, 1.9, '#f4e2d6', 'short');
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fillRect(w * 0.4, h * 0.4, w * 0.2, h * 0.5);
      break;
    case 'sea':
      grad(ctx, w, h, [
        [0, '#dbe6ee'],
        [0.5, '#9fb9c9'],
        [0.52, '#5f8aa3'],
        [1, '#3a5f78'],
      ]);
      figure(ctx, w * 0.35, h * 0.95, 1.7, '#e7d3c9', 'long');
      figure(ctx, w * 0.55, h * 0.95, 1.7, '#dccbc9', 'short');
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.fillRect(0, 0, w, h);
      break;
  }
}

function postProcess(ctx: CanvasRenderingContext2D, w: number, h: number, rand: () => number, scene: Scene) {
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  const noise = scene === 'webcam' || scene === 'room' ? 34 : 18;
  for (let i = 0; i < d.length; i += 4) {
    const nz = (rand() - 0.5) * noise;
    // purple-grey tint & posterize
    d[i] = clamp(Math.round((d[i] * 0.92 + 10 + nz) / 12) * 12);
    d[i + 1] = clamp(Math.round((d[i + 1] * 0.88 + 4 + nz) / 12) * 12);
    d[i + 2] = clamp(Math.round((d[i + 2] * 0.98 + 14 + nz) / 12) * 12);
  }
  ctx.putImageData(img, 0, 0);
  // vignette
  const g = ctx.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, h * 0.9);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.45)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  // date stamp
  ctx.fillStyle = 'rgba(255,170,60,0.8)';
  ctx.font = '6px monospace';
  ctx.fillText(`'11 ${String(3 + Math.floor(rand() * 8)).padStart(2, '0')}.${String(1 + Math.floor(rand() * 28)).padStart(2, '0')}`, w - 40, h - 4);
}

function clamp(v: number) {
  return v < 0 ? 0 : v > 255 ? 255 : v;
}
