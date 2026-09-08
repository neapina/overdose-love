import { stage, type Contact, type GameState, type Post } from '../state/store';
import type { ChoiceOption, Step } from './types';

const my = (text: string): Step => ({ type: 'msg', from: 'mayu', text });
const r = (text: string): Step => ({ type: 'msg', from: 'ren', text });
const off = (c: Contact): Step => ({ type: 'status', contact: c, online: false });

// ───────────────────────── statuses ─────────────────────────

export interface StatusOption {
  key: string;
  text: string;
  /** minimum story stage to show */
  stage?: number;
  when?: (s: GameState) => boolean;
}

export const STATUSES: StatusOption[] = [
  { key: 'hi', text: 'привет ✌' },
  { key: 'music', text: 'слушаю музыку' },
  { key: 'bored', text: 'скучно' },
  { key: 'mayu', text: 'люблю маю ✌🏻' },
  { key: 'pancakes', text: 'блинчики > всё' },
  { key: 'tired', text: 'устала' },
  { key: 'sleepless', text: 'не спится', stage: 1 },
  { key: 'waiting', text: 'жду', stage: 1, when: (s) => !!s.flags.ren_known },
  { key: 'night', text: 'ночь — единственное честное время', stage: 2 },
  { key: 'die', text: 'хочу умереть', stage: 1 },
  { key: 'nobody', text: 'никого нет', stage: 2 },
  { key: 'empty', text: '…', stage: 2 },
];

export function statusOptions(s: GameState) {
  const st = stage(s);
  return STATUSES.filter((o) => (o.stage ?? 0) <= st && (!o.when || o.when(s)));
}

export function hasStatus(s: GameState, key: string) {
  const o = STATUSES.find((x) => x.key === key);
  return !!o && s.profile.status === o.text;
}

// ───────────────────────── posts ─────────────────────────

export interface PostOption {
  text: string;
  photo?: string;
  flags?: string[];
  mayu?: number;
  ren?: number;
  when?: (s: GameState) => boolean;
}

export function postOptions(s: GameState): PostOption[] {
  const st = stage(s);
  const list: PostOption[] = [];
  if (!s.flags.posted) {
    list.push(
      { text: 'привет. я тут новенькая', flags: ['posted', 'posted_hi'], mayu: 1 },
      { text: 'маю заставила меня зарегаться. вот я зарегалась', flags: ['posted', 'posted_mayu'], mayu: 2 },
      { text: 'после дождя красиво', photo: 'sky_1', flags: ['posted', 'posted_sky'], mayu: 1 },
    );
    return list;
  }
  list.push({ text: 'после дождя красиво', photo: 'sky_1', flags: ['posted_sky'], when: (x) => !x.flags.posted_sky });
  list.push({ text: 'моя комната. не смотрите на бардак', photo: 'room_1', flags: ['posted_room'], when: (x) => !x.flags.posted_room });
  list.push({ text: 'город вечером. с моста', photo: 'city_1', flags: ['posted_city'], when: (x) => !x.flags.posted_city && x.day >= 2 });
  if (s.photosTaken > 0) list.push({ text: 'я', photo: `webcam_${s.photosTaken}`, flags: ['posted_selfie'], ren: 1, when: (x) => !x.flags.posted_selfie });
  if (s.flags.photo_cafe) list.push({ text: 'блинчики были огромные. маю права', flags: ['posted_cafe'], mayu: 1, when: (x) => !x.flags.posted_cafe });
  if (st >= 1) list.push({ text: 'кто-нибудь ещё не спит?', flags: ['posted_awake'], ren: 1, when: (x) => !x.flags.posted_awake });
  if (st >= 2) list.push({ text: 'ночью интернет как будто только твой', flags: ['posted_night'], ren: 2, when: (x) => !x.flags.posted_night });
  if (st >= 2 && s.flags.ren_song) list.push({ text: 'track07. без названия. без автора. лучшее что я слышала', flags: ['posted_track07'], ren: 2, when: (x) => !x.flags.posted_track07 });
  if (st >= 3) list.push({ text: 'ахвдыьььовлдыоалыдыд', flags: ['posted_glitch'], ren: 1, when: (x) => !x.flags.posted_glitch });
  return list.filter((o) => !o.when || o.when(s));
}

// ───────────────────────── comments ─────────────────────────

export interface CommentOption {
  text: string;
  ren?: number;
  mayu?: number;
  flags?: string[];
  /** author's reply comment */
  reply?: string;
}

export function commentOptions(post: Post, s: GameState): CommentOption[] {
  if (post.author === 'nana') return [];
  if (post.comments.some((c) => c.author === 'nana')) return [];
  const st = stage(s);
  if (post.author === 'mayu') {
    if (post.photo === 'cafe_mayu') {
      return [
        { text: 'УДАЛИ ЭТО', mayu: 1, reply: 'никогда ✌🏻' },
        { text: 'ладно. крем был вкусный', mayu: 2, reply: 'вот. признала' },
        { text: '…', mayu: 0, reply: 'это «да»?' },
      ];
    }
    if (post.photo === 'cafe_alone') {
      return [
        { text: 'прости. завтра точно', mayu: 1, reply: 'посмотрим ✌🏻' },
        { text: 'блинчик выглядит грустно', mayu: -1, reply: 'он и был грустный. как и я' },
      ];
    }
    if (post.photo === 'river_nana') {
      return [
        { text: 'я не улыбаюсь. это фонарь', mayu: 1, reply: 'ЭТО УЛЫБКА' },
        { text: 'красиво получилось', mayu: 2, reply: 'это потому что ты в кадре ✌🏻' },
      ];
    }
    return [
      { text: '✌🏻', mayu: 1, reply: '✌🏻✌🏻' },
      { text: 'ахах', mayu: 1 },
      ...(st >= 2 ? [{ text: 'ок', mayu: -1, reply: '«ок». нана ты в порядке?' }] : []),
    ];
  }
  if (post.author === 'ren') {
    return [
      { text: 'я тоже так думаю', ren: 2, flags: ['commented_ren'], reply: 'знал' },
      { text: 'красиво', ren: 1, flags: ['commented_ren'], reply: 'спасибо. это для тебя' },
      { text: 'ты когда спишь?', ren: 1, flags: ['commented_ren'], reply: 'когда ты уходишь' },
    ];
  }
  // strangers
  return [
    { text: 'настройки → музыка → убрать галочку «автоплей»', mayu: 1, reply: 'СПАСИБО ты спасла мне жизнь' },
    { text: 'ахах', reply: 'ты кто ✌' },
  ];
}

/** Options for Nana replying to a comment on her own post */
export function replyOptions(post: Post, s: GameState): CommentOption[] {
  if (post.author !== 'nana') return [];
  const last = post.comments.at(-1);
  if (!last || last.author === 'nana') return [];
  if (last.author === 'REN_17') {
    if (!s.flags.ren_known) {
      return [
        { text: 'спасибо. а ты кто?', ren: 1, flags: ['ren_known', 'replied_ren'], reply: 'никто. просто тоже не сплю' },
        { text: 'ахах ок', ren: 0, flags: ['ren_known', 'replied_ren'] },
        { text: '[не отвечать]', ren: -1, flags: ['ignored_ren'] },
      ];
    }
    return [
      { text: 'ты опять не спишь?', ren: 1, flags: ['replied_ren'], reply: 'а ты?' },
      { text: '…', ren: 0, flags: ['replied_ren'] },
    ];
  }
  if (last.author === 'mayu☆') {
    return [
      { text: '✌🏻', mayu: 1 },
      { text: 'маю иди спать', mayu: 1, reply: 'САМА ИДИ' },
    ];
  }
  return [];
}

// ───────────────────────── idle chat openers ─────────────────────────

export function idleOpeners(contact: Contact, s: GameState): (ChoiceOption & { key: string })[] {
  const day = s.day;
  const used = (k: string) => !!s.flags[`idle_${contact}_${k}_d${day}`];
  const online = contact === 'ren' ? s.renOnline : s.mayuOnline;
  const st = stage(s);
  const out: (ChoiceOption & { key: string })[] = [];
  if (contact === 'mayu') {
    if (!online) return [];
    out.push(
      { key: 'hey', text: 'ты тут?', mayu: 0, then: [my('тут ✌🏻'), my('что?')] },
      { key: 'doing', text: 'что делаешь?', mayu: 1, then: [my(day % 2 ? 'ем. смотрю дораму. одновременно' : 'домашку. ну как. лежу рядом с ней')] },
      { key: 'gn', text: 'спокойной ночи', mayu: 1, then: [my('ты?? спать?? до полуночи??'), my('горжусь. спокойной ✌🏻'), off('mayu')] },
    );
    if (st >= 2) out.push({ key: 'sorry', text: 'прости за вчера', mayu: 2, then: [my('…'), my('ок'), my('только не пропадай, ладно')] });
  } else {
    if (!s.flags.ren_known || s.flags.ren_gone) return [];
    if (!online) {
      if (st >= 2) out.push({ key: 'here', text: 'ты тут?', ren: 1, then: [] });
      return out.filter((o) => !used(o.key));
    }
    out.push(
      { key: 'hi', text: 'привет', ren: 1, then: [r('привет'), r('думал ты уже спишь')] },
      { key: 'listening', text: 'слушаю ту песню', ren: 1, then: [r('какую?'), r('…а. да'), r('я тоже сейчас')] },
    );
    if (st >= 2) out.push({ key: 'gn', text: 'спокойной ночи, рэн', ren: 1, then: [r('уже?'), r('…ладно'), r('спокойной ночи, нана')] });
    if (st >= 2) out.push({ key: 'miss', text: 'я тебя ждала', ren: 2, mayu: -1, then: [r('я знаю'), r('прости'), r('я тут')] });
  }
  return out.filter((o) => !used(o.key));
}
