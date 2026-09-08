import { stage, type AppId, type GameState } from '../state/store';
import { availablePhotos, photoDef } from './photos';

export interface FsNode {
  name: string;
  kind: 'folder' | 'txt' | 'image' | 'audio' | 'app' | 'link';
  icon?: string;
  children?: FsNode[];
  content?: string;
  photo?: string;
  app?: AppId;
  props?: Record<string, unknown>;
  modified?: string;
}

const txt = (name: string, content: string, modified = ''): FsNode => ({ name, kind: 'txt', content, modified, icon: '/assets/icons/notepad.png' });
const folder = (name: string, children: FsNode[], icon = '/assets/icons/folder.png'): FsNode => ({ name, kind: 'folder', children, icon });
const img = (photo: string): FsNode => ({ name: photoDef(photo).file, kind: 'image', photo, icon: '/assets/icons/folder-pics.png' });
const audio = (name: string): FsNode => ({ name, kind: 'audio', icon: '/assets/icons/media-player.png' });
const app = (name: string, a: AppId, icon: string, props?: Record<string, unknown>): FsNode => ({ name, kind: 'app', app: a, icon, props });

export const SONGS = [
  { title: 'yoru no machi', artist: 'shiroi heya', len: 214 },
  { title: 'after the rain (demo)', artist: 'unknown', len: 187 },
  { title: 'kaeri michi', artist: 'tsukiakari', len: 243 },
  { title: 'sleepless', artist: 'aoi', len: 201 },
];

export const REN_SONG = { title: 'track07.mp3', artist: 'ren', len: 256 };

function notesFor(s: GameState): FsNode[] {
  const st = stage(s);
  const list: FsNode[] = [txt('список.txt', 'купить молоко\nшампунь\nбатарейки\nнаписать маю\nсделать задание по английскому', 'вчера')];
  if (st >= 1 && s.flags.ren_known) {
    list.push(txt('untitled.txt', 'он написал в 22:30\nя ответила сразу\n\nэто нормально?', '23:14'));
  }
  if (st >= 2) {
    list.push(txt('untitled (2).txt', s.flags.admitted_waiting ? 'я сказала что ждала\n\nэто правда' : 'почему он online и не пишет', '01:47'));
  }
  if (st >= 3) {
    list.push(txt('не открывать.txt', 'если он не напишет до 2 я лягу\n\nесли он не напишет до 3 я лягу\n\n\nя не знаю как выглядит моё лицо когда я не смотрю в монитор', '04:02'));
  }
  return list;
}

export function buildFs(s: GameState): FsNode {
  const st = stage(s);
  const photos = availablePhotos(s);
  const nanaPhotos = photos.filter((p) => photoDef(p).folder === 'photos');
  const mayuPhotos = photos.filter((p) => photoDef(p).folder === 'mayu');
  const renPhotos = photos.filter((p) => photoDef(p).folder === 'ren');
  const webcam = photos.filter((p) => photoDef(p).folder === 'webcam');

  const mayuFolder = folder('mayu', [...mayuPhotos.map(img), txt('планы.txt', 'сб — кафе у станции\nвс — море?? (маю настаивает)\nкупить плёнку для её мыльницы')], '/assets/icons/folder-star.png');

  const desktop: FsNode[] = [
    app('Компьютер', 'explorer', '/assets/icons/computer.png', { path: ['Компьютер'] }),
    app('meromero', 'meromero', '/assets/icons/meromero.png', { page: 'feed' }),
    app('M Messenger', 'messenger', '/assets/mm/bubble-pink.png'),
    folder('school', [txt('английский.txt', 'unit 7 — до пятницы\nэссе «my ordinary day» (400 слов)\n\n…my ordinary day is: wake up, school, computer, sleep')], '/assets/icons/folder-docs.png'),
    folder('music', [...SONGS.map((x) => audio(`${x.title}.mp3`)), ...(s.flags.ren_song ? [audio(REN_SONG.title)] : [])], '/assets/icons/folder-audio.png'),
    folder('photos', [...nanaPhotos.map(img), ...webcam.map(img)], '/assets/icons/folder-pics.png'),
  ];
  if (st < 3) desktop.push(mayuFolder);
  desktop.push(app('Камера', 'camera', '/assets/icons/snipping.png'), app('Paint', 'paint', '/assets/icons/paint.png'), app('Блокнот', 'notepad', '/assets/icons/notepad.png'));
  if (st >= 2) {
    desktop.push(folder('ren', [...renPhotos.map(img), txt('о нём.txt', '17 — не возраст. просто число которое ему нравится\nслушает то же что и я\nне спит\nотец\nсерая куртка (?)')], '/assets/icons/folder-blue.png'));
  }
  if (st >= 3) {
    desktop.push(folder('ren2', [], '/assets/icons/folder-blue.png'), folder('новая папка', []), folder('chat backup', [txt('backup_1.txt', s.messages.filter((m) => m.from === 'ren').slice(-12).map((m) => `REN_17: ${m.text}`).join('\n'))]));
  }
  desktop.push(...notesFor(s).filter((n) => n.name.startsWith('untitled') || n.name === 'не открывать.txt'));

  const recycle: FsNode[] = [];
  if (st >= 2 && s.flags.photo_river) recycle.push(txt('маю_река.txt', 'она сказала что я почти улыбнулась'));
  if (st >= 3) recycle.push(mayuFolder, txt('сочинение.txt', 'my ordinary day is'));
  if (s.flags.photo_river && st >= 3) recycle.push(img('river_nana'));
  desktop.push(app('Корзина', 'explorer', recycle.length ? '/assets/icons/recycle-full.png' : '/assets/icons/recycle-empty.png', { path: ['Компьютер', 'Корзина'] }));

  return folder('Компьютер', [
    folder('Рабочий стол', desktop, '/assets/icons/computer.png'),
    folder('Documents', [...notesFor(s).filter((n) => !n.name.startsWith('untitled') && n.name !== 'не открывать.txt'), folder('school', desktop.find((d) => d.name === 'school')!.children!)], '/assets/icons/folder-documents.png'),
    folder('Downloads', [...(s.flags.ren_song ? [audio(REN_SONG.title)] : []), ...renPhotos.map(img)], '/assets/icons/folder-downloads.png'),
    folder('Pictures', [...nanaPhotos.map(img), ...mayuPhotos.map(img), ...webcam.map(img)], '/assets/icons/folder-pictures.png'),
    folder('Music', SONGS.map((x) => audio(`${x.title}.mp3`)), '/assets/icons/folder-music.png'),
    folder('Temp', st >= 3 ? [txt('~tmp0041.tmp', '▒▒▒▒▒▒▒▒▒▒▒ REN_17 ▒▒▒▒▒▒▒▒▒ online ▒▒▒▒▒▒')] : [], '/assets/icons/folder-2.png'),
    folder('Корзина', recycle, recycle.length ? '/assets/icons/recycle-full.png' : '/assets/icons/recycle-empty.png'),
  ]);
}

export function resolvePath(root: FsNode, path: string[]): FsNode | null {
  let node: FsNode = root;
  for (const p of path.slice(1)) {
    const next = node.children?.find((c) => c.name === p);
    if (!next) return null;
    node = next;
  }
  return node;
}
