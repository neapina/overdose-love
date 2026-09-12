/* Downsamples raster assets once so the CSS `image-rendering: pixelated` upscale shows real chunky pixels. */

const cache = new Map<string, string>();

const ICONS = [
  'browser', 'calculator', 'computer', 'control-panel', 'folder-2', 'folder-audio', 'folder-blue', 'folder-docs',
  'folder-documents', 'folder-downloads', 'folder-lock', 'folder-music', 'folder-pics', 'folder-pictures', 'folder-star',
  'folder', 'media-player', 'meromero', 'network', 'notepad', 'paint', 'recycle-empty', 'recycle-full', 'snipping',
  'sticky-notes', 'user',
].map((n) => `/assets/icons/${n}.png`);

const MM = [
  'add-friend', 'add-photo', 'avatar-placeholder', 'book', 'bookmark-pink', 'bookmark-purple', 'btn-chat-round',
  'btn-heart-round', 'btn-mail-round', 'btn-star-round', 'bubble-blue', 'bubble-pink', 'camera', 'dot-green', 'dot-grey',
  'dot-red', 'dot-yellow', 'folder', 'group', 'heart-grey', 'heart-outline', 'heart-small', 'heart', 'image', 'moon',
  'notif-bell', 'notif-chat',
].map((n) => `/assets/mm/${n}.png`);

const WALLPAPERS: Record<string, string> = {
  '--wp-dusk': '/assets/wallpaper-dusk.jpg',
  '--wp-night': '/assets/wallpaper-night.jpg',
};

const BANNERS = ['/assets/mm/banner-city.png', '/assets/mm/banner-sakura.png'];

function load(src: string) {
  return new Promise<HTMLImageElement | null>((res) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = () => res(null);
    img.src = src;
  });
}

function shrink(img: HTMLImageElement, w: number, palette = 0) {
  const h = Math.max(1, Math.round((img.height / img.width) * w));
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(img, 0, 0, w, h);
  if (palette) {
    const d = ctx.getImageData(0, 0, w, h);
    const q = 256 / palette;
    for (let i = 0; i < d.data.length; i += 4) {
      d.data[i] = Math.round(d.data[i] / q) * q;
      d.data[i + 1] = Math.round(d.data[i + 1] / q) * q;
      d.data[i + 2] = Math.round(d.data[i + 2] / q) * q;
    }
    ctx.putImageData(d, 0, 0);
  }
  return c.toDataURL('image/png');
}

async function one(src: string, w: number, palette = 0) {
  if (cache.has(src)) return;
  const img = await load(src);
  if (img) cache.set(src, shrink(img, w, palette));
}

let started: Promise<void> | null = null;

export function preparePixels() {
  if (started) return started;
  started = (async () => {
    await Promise.all([
      ...ICONS.map((s) => one(s, 20)),
      ...MM.map((s) => one(s, 16)),
      ...BANNERS.map((s) => one(s, 160, 12)),
      ...Object.entries(WALLPAPERS).map(async ([v, s]) => {
        await one(s, 240, 14);
        document.documentElement.style.setProperty(v, `url("${cache.get(s) ?? s}")`);
      }),
    ]);
  })();
  return started;
}

/** pixelated version of a bundled raster asset (falls back to the original until ready) */
export function px(src: string | undefined) {
  return src ? (cache.get(src) ?? src) : src;
}
