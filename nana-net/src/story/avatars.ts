const cache = new Map<string, string>();

// Real avatars dropped into src/assets/avatars/<id>.(jpg|png|webp) replace the placeholder (ids: nana, ren, mayu).
const CUSTOM = import.meta.glob<string>('../assets/avatars/*.{jpg,jpeg,png,webp}', {
  eager: true,
  query: '?url',
  import: 'default',
});

function customAvatar(id: string): string | null {
  for (const [path, url] of Object.entries(CUSTOM)) {
    if (path.split('/').pop()!.replace(/\.[^.]+$/, '') === id) return url;
  }
  return null;
}

export type AvatarId = 'nana' | 'nana2' | 'nana3' | 'mayu' | 'ren' | 'yuki' | 'kaori' | 'unknown';

const PALETTE: Record<AvatarId, { bg: [string, string]; skin: string; hair: string; hairStyle: 'long' | 'short' | 'bob' | 'none'; glasses?: boolean; blur?: boolean }> = {
  nana: { bg: ['#f6d7e4', '#c99bb8'], skin: '#f1d8cb', hair: '#3a2b2e', hairStyle: 'bob' },
  nana2: { bg: ['#c9dcf3', '#7d9dc9'], skin: '#efd6c9', hair: '#3a2b2e', hairStyle: 'bob' },
  nana3: { bg: ['#34313d', '#141219'], skin: '#b7a3a5', hair: '#2a1f22', hairStyle: 'bob', blur: true },
  mayu: { bg: ['#ffe7a8', '#f3a5c6'], skin: '#f4dccd', hair: '#5a3b2a', hairStyle: 'long' },
  ren: { bg: ['#1b2536', '#0b0f17'], skin: '#e6d6cf', hair: '#111', hairStyle: 'short', glasses: true, blur: true },
  yuki: { bg: ['#d8f0e4', '#8ccbb0'], skin: '#f1d8cb', hair: '#2b2b2b', hairStyle: 'long' },
  kaori: { bg: ['#e8e0ff', '#a695e0'], skin: '#f1d8cb', hair: '#4a3a2a', hairStyle: 'bob' },
  unknown: { bg: ['#d0d5dc', '#8d97a3'], skin: '#c8ccd2', hair: '#aab', hairStyle: 'none' },
};

export function avatar(id: AvatarId | string, size = 64): string {
  const custom = customAvatar(id);
  if (custom) return custom;
  const key = `${id}_${size}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const p = PALETTE[(id as AvatarId) in PALETTE ? (id as AvatarId) : 'unknown'];
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d')!;
  const g = ctx.createLinearGradient(0, 0, size, size);
  g.addColorStop(0, p.bg[0]);
  g.addColorStop(1, p.bg[1]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const s = size / 64;
  // body
  ctx.fillStyle = p.hairStyle === 'long' ? '#f4f0f6' : id === 'ren' ? '#2a3140' : '#8d94a6';
  ctx.beginPath();
  ctx.moveTo(8 * s, 64 * s);
  ctx.quadraticCurveTo(32 * s, 34 * s, 56 * s, 64 * s);
  ctx.fill();
  // head
  ctx.fillStyle = p.skin;
  ctx.beginPath();
  ctx.ellipse(32 * s, 28 * s, 12 * s, 14 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  // hair
  ctx.fillStyle = p.hair;
  if (p.hairStyle !== 'none') {
    ctx.beginPath();
    ctx.ellipse(32 * s, 22 * s, 13 * s, 11 * s, 0, Math.PI, Math.PI * 2);
    ctx.fill();
  }
  if (p.hairStyle === 'long') {
    ctx.fillRect(19 * s, 22 * s, 5 * s, 34 * s);
    ctx.fillRect(40 * s, 22 * s, 5 * s, 34 * s);
  }
  if (p.hairStyle === 'bob') {
    ctx.fillRect(19 * s, 22 * s, 4 * s, 18 * s);
    ctx.fillRect(41 * s, 22 * s, 4 * s, 18 * s);
  }
  if (p.glasses) {
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 1.2 * s;
    ctx.strokeRect(22 * s, 26 * s, 8 * s, 5 * s);
    ctx.strokeRect(34 * s, 26 * s, 8 * s, 5 * s);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(22 * s, 26 * s, 8 * s, 5 * s);
    ctx.fillRect(34 * s, 26 * s, 8 * s, 5 * s);
  }
  // eyes/mouth
  if (p.hairStyle !== 'none') {
    ctx.fillStyle = '#2a2024';
    ctx.fillRect(26 * s, 28 * s, 2 * s, 2 * s);
    ctx.fillRect(36 * s, 28 * s, 2 * s, 2 * s);
    if (id === 'mayu') {
      ctx.strokeStyle = '#8a3a4a';
      ctx.lineWidth = 1 * s;
      ctx.beginPath();
      ctx.arc(32 * s, 34 * s, 3 * s, 0.2, Math.PI - 0.2);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,120,150,0.35)';
      ctx.fillRect(23 * s, 32 * s, 4 * s, 2 * s);
      ctx.fillRect(37 * s, 32 * s, 4 * s, 2 * s);
    } else {
      ctx.fillStyle = '#7a4a55';
      ctx.fillRect(30 * s, 35 * s, 4 * s, 1 * s);
    }
  } else {
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = `${30 * s}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('?', 32 * s, 40 * s);
  }
  // noise / low-quality feel
  const img = ctx.getImageData(0, 0, size, size);
  const d = img.data;
  let seed = 7;
  for (let i = 0; i < d.length; i += 4) {
    seed = (seed * 9301 + 49297) % 233280;
    const nz = (seed / 233280 - 0.5) * (p.blur ? 40 : 14);
    d[i] = Math.max(0, Math.min(255, Math.round((d[i] + nz) / 8) * 8));
    d[i + 1] = Math.max(0, Math.min(255, Math.round((d[i + 1] + nz) / 8) * 8));
    d[i + 2] = Math.max(0, Math.min(255, Math.round((d[i + 2] + nz) / 8) * 8));
  }
  ctx.putImageData(img, 0, 0);
  if (p.blur) {
    // cheap blur: draw scaled down and back up
    const t = document.createElement('canvas');
    t.width = Math.max(8, size / 5);
    t.height = t.width;
    t.getContext('2d')!.drawImage(c, 0, 0, t.width, t.height);
    ctx.imageSmoothingEnabled = true;
    ctx.globalAlpha = 0.6;
    ctx.drawImage(t, 0, 0, size, size);
    ctx.globalAlpha = 1;
  }
  const url = c.toDataURL('image/png');
  cache.set(key, url);
  return url;
}
