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

export interface Song {
  title: string;
  artist: string;
  len: number;
  file: string;
}

export const SONGS: Song[] = [
  { title: 'yoru no machi', artist: 'shiroi heya', len: 96, file: '/assets/music/01_yoru_no_machi.mp3' },
  { title: 'after the rain (demo)', artist: 'unknown', len: 88, file: '/assets/music/02_after_the_rain.mp3' },
  { title: 'kaeri michi', artist: 'tsukiakari', len: 92, file: '/assets/music/03_kaeri_michi.mp3' },
  { title: 'sleepless', artist: 'aoi', len: 100, file: '/assets/music/04_sleepless.mp3' },
];

export const REN_SONG: Song = { title: 'track07.mp3', artist: 'ren', len: 104, file: '/assets/music/track07.mp3' };

function notesFor(s: GameState): FsNode[] {
  const st = stage(s);
  const list: FsNode[] = [
    txt('список.txt', 'купить молоко\nшампунь\nбатарейки\nнаписать маю\nсделать задание по английскому', 'вчера'),
    txt('пароли.txt', 'комп: sakura (любимый цветок, ну)\nпочта: тот же\nmeromero: тот же…\n\nмаю говорит так нельзя. маю права.', 'сентябрь'),
  ];
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

  const mayuFolder = folder('mayu', [...mayuPhotos.map(img), txt('планы.txt', 'сб — кафе у станции\nвс — море?? (маю настаивает)\nкупить плёнку для её мыльницы')], '/assets/icons/folder-star.png');

  const school: FsNode[] = [txt('расписание.txt', 'пн — англ, матем, история, физ-ра\nвт — лит-ра, биология, англ\nср — матем, история, музыка\nчт — англ, лит-ра, физика\nпт — контрольные (((', 'сентябрь')];
  if (s.flags.hw_d1_eng || s.day >= 2) school.push(txt('английский.txt', 'unit 7 — сделано\nэссе «my ordinary day» — до четверга'));
  if (s.flags.hw_d2_essay) school.push(txt('my_ordinary_day.txt', s.flags.essay_ren || s.flags.essay_night ? 'My ordinary day is: wake up, school, computer, sleep.\nThe best part of the day is night.' : 'My ordinary day is: wake up, school, friend, sleep.\nThe best part of the day is lunch with Mayu.'));
  if (s.flags.hw_d4_essay) school.push(txt('my_friend.txt', s.flags.essay_friend_ren ? 'My friend lives far away. We talk at night.' : 'My friend is Mayu. She laughs loud and takes pictures of everything.'));
  if (st >= 3) school.push(txt('сочинение.txt', 'my ordinary day is\nmy ordinary day is\nmy ordinary day is'));

  const desktop: FsNode[] = [
    app('Компьютер', 'explorer', '/assets/icons/computer.png', { path: ['Компьютер'] }),
    app('meromero', 'meromero', '/assets/icons/meromero.png', { page: 'feed' }),
    app('Уроки', 'homework', '/assets/mm/book.png'),
    folder('school', school, '/assets/icons/folder-docs.png'),
    folder('music', [...SONGS.map((x) => audio(`${x.title}.mp3`)), ...(s.flags.ren_song ? [audio(REN_SONG.title)] : [])], '/assets/icons/folder-audio.png'),
    folder('photos', nanaPhotos.map(img), '/assets/icons/folder-pics.png'),
  ];
  if (st < 3) desktop.push(mayuFolder);
  desktop.push(app('Paint', 'paint', '/assets/icons/paint.png'), app('Блокнот', 'notepad', '/assets/icons/notepad.png'));
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
    folder('Pictures', [...nanaPhotos.map(img), ...mayuPhotos.map(img)], '/assets/icons/folder-pictures.png'),
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
