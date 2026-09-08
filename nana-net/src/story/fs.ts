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
  const list: FsNode[] = [
    txt('список.txt', 'купить молоко\nшампунь\nбатарейки\nнаписать маю\nсделать задание по английскому', 'вчера'),
    txt('песни.txt', 'yoru no machi — shiroi heya\nafter the rain (demo)\nkaeri michi\n\nнайти ту песню из рекламы', 'на прошлой неделе'),
  ];
  if (st >= 1) {
    list.push(txt('untitled.txt', 'он написал в 3:12\nя ответила в 3:12\n\nэто нормально?', '03:14'));
  }
  if (st >= 2) {
    list.push(
      txt('untitled (2).txt', 'почему он online и не пишет', '01:47'),
      txt('untitled (4).txt', 'маю сказала что я бледная\nя не бледная\nпросто лампа', '22:10'),
      txt('untitled (7).txt', 'сегодня опять было страшно\n\nпотом сидела на кухне и ела хлеб\nмама смотрела телевизор', '02:31'),
      txt('backup.txt', '[22:41] REN_17: ты сегодня будешь?\n[22:41] REN_17: я хотел с тобой поговорить\n[22:58] nana: я тут\n[22:58] REN_17: спасибо', '23:05'),
    );
  }
  if (st >= 3) {
    list.push(
      txt('untitled (12).txt', 'ахвдыьььовлдыоалыдыд', '03:58'),
      txt('untitled (19).txt', 'маю заметила', '00:12'),
      txt('untitled (23).txt', 'если он не напишет до 2 я лягу\n\nесли он не напишет до 3 я лягу\n\n', '03:41'),
      txt('untitled (27).txt', '', '03:21'),
      txt('не открывать.txt', 'я не знаю как выглядит моё лицо когда я не смотрю в монитор', '04:02'),
    );
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
    app('Браузер', 'browser', '/assets/icons/browser.png', { page: 'home' }),
    app('meromero.net', 'browser', '/assets/icons/meromero.png', { page: 'feed' }),
    folder('school', [txt('английский.txt', 'unit 7 — до пятницы\nэссе «my ordinary day» (400 слов)\n\n…my ordinary day is: wake up, school, computer, sleep')], '/assets/icons/folder-docs.png'),
    folder('music', [...SONGS.map((x) => audio(`${x.title}.mp3`)), ...(s.flags.ren_song ? [audio(REN_SONG.title)] : [])], '/assets/icons/folder-audio.png'),
    folder('photos', [...nanaPhotos.map(img), ...webcam.map(img)], '/assets/icons/folder-pics.png'),
  ];
  if (st < 3) desktop.push(mayuFolder);
  desktop.push(app('Камера', 'camera', '/assets/icons/snipping.png'), app('Paint', 'paint', '/assets/icons/paint.png'), app('Блокнот', 'notepad', '/assets/icons/notepad.png'));
  if (s.messengerInstalled) desktop.push(app('M Messenger', 'messenger', '/assets/icons/meromero.png'));
  if (st >= 2) {
    desktop.push(folder('ren', [...renPhotos.map(img), txt('о нём.txt', '17 — не возраст. просто число которое ему нравится\nслушает то же что и я\nне спит\nотец\nсерая куртка (?)')], '/assets/icons/folder-blue.png'));
    if (renPhotos.length) desktop.push(folder('ren photos', renPhotos.map(img), '/assets/icons/folder-pics.png'));
    desktop.push(folder('chat backup', [txt('backup_1.txt', s.messages.filter((m) => m.from === 'ren').slice(0, 12).map((m) => `REN_17: ${m.text}`).join('\n'))]));
  }
  if (st >= 3) {
    desktop.push(folder('ren2', [], '/assets/icons/folder-blue.png'), folder('новая папка', []), folder('новая папка (2)', []));
  }
  desktop.push(...notesFor(s).filter((n) => n.name.startsWith('untitled') || n.name === 'не открывать.txt'));

  const recycle: FsNode[] = [];
  if (st >= 2) recycle.push(txt('маю_река.txt', 'она сказала что я почти улыбнулась'), txt('untitled (3).txt', 'ничего'));
  if (st >= 3) recycle.push(mayuFolder, txt('сочинение.txt', 'my ordinary day is'), txt('untitled (9).txt', 'он ушёл в 4:10\nя не заметила когда'));
  if (s.flags.photo_river && st >= 3) recycle.push(img('river_nana'));
  desktop.push(app('Корзина', 'explorer', recycle.length ? '/assets/icons/recycle-full.png' : '/assets/icons/recycle-empty.png', { path: ['Компьютер', 'Корзина'] }));

  return folder('Компьютер', [
    folder('Рабочий стол', desktop, '/assets/icons/computer.png'),
    folder('Documents', [...notesFor(s).filter((n) => !n.name.startsWith('untitled') && n.name !== 'не открывать.txt'), folder('school', desktop.find((d) => d.name === 'school')!.children!)], '/assets/icons/folder-documents.png'),
    folder('Downloads', [...(s.flags.ren_song ? [audio(REN_SONG.title)] : []), ...(s.messengerInstalled ? [{ name: 'mmsetup.exe', kind: 'app', app: 'messenger', icon: '/assets/icons/meromero.png' } as FsNode] : []), ...renPhotos.map(img)], '/assets/icons/folder-downloads.png'),
    folder('Pictures', [...nanaPhotos.map(img), ...mayuPhotos.map(img), ...webcam.map(img)], '/assets/icons/folder-pictures.png'),
    folder('Music', SONGS.map((x) => audio(`${x.title}.mp3`)), '/assets/icons/folder-music.png'),
    folder('Temp', st >= 2 ? [txt('~tmp0041.tmp', '▒▒▒▒▒▒▒▒▒▒▒ REN_17 ▒▒▒▒▒▒▒▒▒ online ▒▒▒▒▒▒'), txt('log.txt', s.messages.map((m) => `[день ${m.day}] ${m.from}: ${m.text}`).join('\n'))] : [], '/assets/icons/folder-2.png'),
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
